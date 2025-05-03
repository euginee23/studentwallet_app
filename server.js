const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const moment = require('moment-timezone');

const app = express();
const PORT = process.env.PORT || 5000;

// MIDDLEWARE
app.use(express.json());
app.use(cors());

// CONNECTION POOL
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
});

// DATABASE CONNECTION STARTUP
db.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
  } else {
    console.log('Successfully connected to the database.');
    connection.release();
  }
});

// REGISTER
app.post('/api/register', async (req, res) => {
  const {
    firstName,
    middleName,
    lastName,
    email,
    contactNumber,
    username,
    password,
  } = req.body;

  let connection;
  try {
    connection = await db.promise().getConnection();

    const [existing] = await connection.query(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [email, username],
    );

    if (existing.length > 0) {
      return res.status(400).json({error: 'Email or username already exists.'});
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [userResult] = await connection.query(
      `INSERT INTO users (first_name, middle_name, last_name, email, contact_number, username, password) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        firstName,
        middleName,
        lastName,
        email,
        `0${contactNumber}`,
        username,
        hashedPassword,
      ],
    );

    const userId = userResult.insertId;

    const verificationCode = crypto
      .randomBytes(3)
      .toString('hex')
      .toUpperCase();

    await connection.query(
      `INSERT INTO verification_codes (user_id, verification_code, verification_type) 
       VALUES (?, ?, ?)`,
      [userId, verificationCode, 'register'],
    );

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Student Wallet App" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Verification Code',
      html: `<p>Hello ${firstName},</p><p>Your verification code is:</p><h2>${verificationCode}</h2>`,
    });

    res.json({
      success: true,
      message: 'Registered successfully. Verification code sent.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({error: 'Registration failed. Try again later.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// CHECK EXISTING USERS OR UPDATE UNVERIFIED
app.post('/api/check-user', async (req, res) => {
  const {
    email,
    contactNumber,
    firstName,
    middleName,
    lastName,
    username,
    password,
  } = req.body;

  let connection;
  try {
    connection = await db.promise().getConnection();

    const [results] = await connection.query(
      `SELECT user_id, first_name, last_name, email, contact_number, username, is_verified
       FROM users
       WHERE email = ? OR contact_number = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [email, `+63${contactNumber}`],
    );

    if (results.length === 0) {
      return res.json({exists: false});
    }

    const user = results[0];

    if (user.is_verified) {
      return res.json({exists: true, users: [user]});
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);

      await connection.query(
        'UPDATE users SET first_name = ?, middle_name = ?, last_name = ?, username = ?, password = ? WHERE user_id = ?',
        [
          firstName,
          middleName,
          lastName,
          username,
          hashedPassword,
          user.user_id,
        ],
      );

      const verificationCode = crypto
        .randomBytes(3)
        .toString('hex')
        .toUpperCase();

      await connection.query(
        `INSERT INTO verification_codes (user_id, verification_code, verification_type) 
         VALUES (?, ?, ?)`,
        [user.user_id, verificationCode, 'register'],
      );

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Student Wallet App" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Your New Verification Code',
        html: `<p>Hello ${firstName},</p><p>Your new verification code is:</p><h2>${verificationCode}</h2>`,
      });

      return res.json({updated: true});
    }
  } catch (error) {
    console.error('Check user error:', error);
    res.status(500).json({error: 'Server error checking user.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// VERIFICATION
app.post('/api/verify', async (req, res) => {
  const {email, code} = req.body;

  let connection;
  try {
    connection = await db.promise().getConnection();

    const [userRows] = await connection.query(
      'SELECT user_id FROM users WHERE email = ?',
      [email],
    );
    if (userRows.length === 0) {
      return res.status(400).json({error: 'User not found.'});
    }
    const userId = userRows[0].user_id;

    const [codeRows] = await connection.query(
      `SELECT * FROM verification_codes 
       WHERE user_id = ? AND verification_type = 'register' 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId],
    );

    if (codeRows.length === 0) {
      return res.status(400).json({error: 'No verification code found.'});
    }

    const latestCode = codeRows[0].verification_code;
    if (code.trim().toUpperCase() !== latestCode.toUpperCase()) {
      return res.status(400).json({error: 'Invalid verification code.'});
    }

    await connection.query(
      'UPDATE users SET is_verified = TRUE WHERE user_id = ?',
      [userId],
    );

    res.json({
      success: true,
      message: 'Verification successful. You can now log in.',
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({error: 'Verification failed.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  const {username, password} = req.body;

  let connection;
  try {
    connection = await db.promise().getConnection();

    const [users] = await connection.query(
      'SELECT * FROM users WHERE username = ?',
      [username],
    );

    if (users.length === 0) {
      return res.status(400).json({error: 'Invalid username or password.'});
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({error: 'Invalid username or password.'});
    }

    if (!user.is_verified) {
      return res.status(403).json({error: 'Account is not verified.'});
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        contact_number: user.contact_number,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      process.env.JWT_SECRET,
      {expiresIn: '7d'},
    );

    res.json({
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        user_type: user.user_type,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({error: 'Login failed.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// SAVE ALLOWANCE
app.post('/api/allowances', async (req, res) => {
  const {user_id, amount, spending_limit, start_date, end_date} = req.body;

  if (!user_id || !amount || !spending_limit || !start_date || !end_date) {
    return res.status(400).json({error: 'Missing required fields.'});
  }

  const createdAt = moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss');

  let connection;
  try {
    connection = await db.promise().getConnection();

    const [result] = await connection.query(
      `INSERT INTO allowances (user_id, amount, spending_limit, start_date, end_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, amount, spending_limit, start_date, end_date, createdAt],
    );

    const allowanceId = result.insertId;

    await connection.query(
      `INSERT INTO balance_history (user_id, allowance_id, balance_type, category, description, amount, created_at)
       VALUES (?, ?, 'Income', 'Allowance', 'Set Allowance', ?, ?)`,
      [user_id, allowanceId, amount, createdAt],
    );

    res.json({success: true, message: 'Allowance and balance history saved.'});
  } catch (error) {
    console.error('Insert allowance error:', error);
    res.status(500).json({error: 'Failed to save allowance.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// FETCH ALL PAST ALLOWANCES FOR A USER (INCLUDING EXPIRED ONES)
app.get('/api/allowances-history/:userId', async (req, res) => {
  const {userId} = req.params;

  let connection;
  try {
    connection = await db.promise().getConnection();

    const [allowances] = await connection.query(
      `SELECT * FROM allowances 
       WHERE user_id = ? 
       ORDER BY start_date DESC`,
      [userId],
    );

    if (allowances.length === 0) {
      return res.json({history: []});
    }

    const allowanceIds = allowances.map(a => a.allowance_id);
    const [balanceHistory] = await connection.query(
      `SELECT * FROM balance_history 
       WHERE user_id = ? AND allowance_id IN (?) 
       ORDER BY created_at ASC`,
      [userId, allowanceIds],
    );

    const grouped = allowances.map(allowance => {
      const transactions = balanceHistory.filter(
        entry => entry.allowance_id === allowance.allowance_id,
      );
      return {
        ...allowance,
        transactions,
      };
    });

    res.json({history: grouped});
  } catch (err) {
    console.error('Fetch allowance history error:', err);
    res.status(500).json({error: 'Failed to fetch allowance history.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// ADD ALLOWANCE AMOUNT | UPDATE LIMIT | ADD TO BALANCE HISTORY
app.put('/api/allowances/:allowanceId/add', async (req, res) => {
  const {allowanceId} = req.params;
  const {amount, new_limit} = req.body;

  if (isNaN(amount) || isNaN(new_limit)) {
    return res.status(400).json({error: 'Invalid amount or new limit.'});
  }

  const createdAt = moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss');

  let connection;
  try {
    connection = await db.promise().getConnection();

    const [allowanceRows] = await connection.query(
      'SELECT user_id FROM allowances WHERE allowance_id = ?',
      [allowanceId],
    );

    const userId = allowanceRows[0]?.user_id;
    if (!userId) {
      return res.status(404).json({error: 'Allowance not found.'});
    }

    await connection.query(
      'UPDATE allowances SET amount = amount + ?, spending_limit = ? WHERE allowance_id = ?',
      [amount, new_limit, allowanceId],
    );

    await connection.query(
      `INSERT INTO balance_history (user_id, allowance_id, balance_type, category, description, amount, created_at)
       VALUES (?, ?, 'Income', 'Allowance', 'Allowance Added', ?, ?)`,
      [userId, allowanceId, amount, createdAt],
    );

    res.json({message: 'Allowance and balance history updated successfully.'});
  } catch (err) {
    console.error('Failed to add to allowance:', err);
    res.status(500).json({error: 'Server error while updating allowance.'});
  } finally {
    if (connection) {connection.release();}
  }
});

// FETCH ACTIVE ALLOWANCE FOR A USER
app.get('/api/allowances/:userId', async (req, res) => {
  const {userId} = req.params;

  let connection;
  try {
    connection = await db.promise().getConnection();

    const [rows] = await connection.query(
      `SELECT * FROM allowances 
       WHERE user_id = ? 
         AND CURDATE() BETWEEN start_date AND end_date
       ORDER BY start_date DESC`,
      [userId],
    );

    res.json({allowances: rows});
  } catch (error) {
    console.error('Fetch allowances error:', error);
    res.status(500).json({error: 'Failed to fetch allowances.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// FETCH EXPENSE CATEGORIES (default + user-specific)
app.get('/api/expense-categories/:userId', async (req, res) => {
  const {userId} = req.params;

  let connection;
  try {
    connection = await db.promise().getConnection();

    const [rows] = await connection.query(
      `
      SELECT category_id, category_name
      FROM expense_categories
      WHERE (is_default = 1 AND user_id IS NULL)
         OR user_id = ?
      ORDER BY created_at ASC
      `,
      [userId],
    );

    res.json({categories: rows});
  } catch (err) {
    console.error('Fetch categories error:', err);
    res.status(500).json({error: 'Failed to fetch expense categories.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// ADD CUSTOM EXPENSE CATEGORY
app.post('/api/expense-categories', async (req, res) => {
  const {category_name, user_id} = req.body;

  if (!category_name || !user_id) {
    return res.status(400).json({error: 'Missing fields.'});
  }

  let connection;
  try {
    connection = await db.promise().getConnection();

    await connection.query(
      `INSERT INTO expense_categories (category_name, user_id, is_default)
       VALUES (?, ?, 0)`,
      [category_name, user_id],
    );

    res.json({success: true, message: 'Category saved.'});
  } catch (err) {
    console.error('Insert category error:', err);
    res.status(500).json({error: 'Failed to save category.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// DELETE EXPENSE CATEGORY
app.delete('/api/expense-categories', async (req, res) => {
  const {user_id, category_name} = req.body;
  let connection;
  try {
    connection = await db.promise().getConnection();
    await connection.query(
      'DELETE FROM expense_categories WHERE user_id = ? AND category_name = ?',
      [user_id, category_name],
    );
    res.json({success: true});
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({error: 'Failed to delete category.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// ADD EXPENSE
app.post('/api/balance-history', async (req, res) => {
  const {user_id, balance_type, description, amount, category, allowance_id} =
    req.body;

  if (!user_id || !balance_type || !amount || !category) {
    return res
      .status(400)
      .json({success: false, error: 'Missing required fields.'});
  }

  const createdAt = moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss');

  let connection;
  try {
    connection = await db.promise().getConnection();

    await connection.query(
      `INSERT INTO balance_history (user_id, balance_type, category, description, amount, allowance_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        balance_type,
        category,
        description,
        amount,
        allowance_id,
        createdAt,
      ],
    );

    res.json({success: true});
  } catch (err) {
    console.error('Insert balance history error:', err);
    res.status(500).json({success: false, error: 'Failed to record expense.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// FETCH BALANCE HISTORY
app.get('/api/balance-history/:userId', async (req, res) => {
  const {userId} = req.params;
  const {allowance_id} = req.query;

  let connection;
  try {
    connection = await db.promise().getConnection();

    let query = 'SELECT * FROM balance_history WHERE user_id = ?';
    let params = [userId];

    if (allowance_id) {
      query += ' AND allowance_id = ?';
      params.push(allowance_id);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await connection.query(query, params);
    res.json({history: rows});
  } catch (err) {
    console.error('Fetch balance history error:', err);
    res.status(500).json({error: 'Failed to fetch balance history.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// START SERVER
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
