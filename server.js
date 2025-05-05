const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const moment = require('moment-timezone');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({storage});

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

// START TEST ENDPOINT
app.get('/', async (req, res) => {
  let connection;
  try {
    connection = await db.promise().getConnection();
    await connection.ping();
    res.send('Student Wallet Node.js is running and database is connected.');
  } catch (error) {
    console.error('DB check failed at / endpoint:', error.message);
    res.status(500).send('Server is up but failed to connect to the database.');
  } finally {
    if (connection) {connection.release();}
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

// SAVE / UPDATE PROFILE IMAGE
app.post(
  '/api/profile-image/:userId',
  upload.single('image'),
  async (req, res) => {
    const {userId} = req.params;
    const imageBuffer = req.file?.buffer;
    const mimeType = req.file?.mimetype;

    if (!imageBuffer || !mimeType) {
      return res
        .status(400)
        .json({error: 'No image uploaded or missing MIME type.'});
    }

    let connection;
    try {
      connection = await db.promise().getConnection();

      const [existing] = await connection.query(
        'SELECT image_id FROM profile_images WHERE user_id = ?',
        [userId],
      );

      if (existing.length > 0) {
        await connection.query(
          'UPDATE profile_images SET image_data = ?, mime_type = ? WHERE user_id = ?',
          [imageBuffer, mimeType, userId],
        );
      } else {
        await connection.query(
          'INSERT INTO profile_images (user_id, image_data, mime_type) VALUES (?, ?, ?)',
          [userId, imageBuffer, mimeType],
        );
      }

      res.json({success: true, message: 'Profile image saved.'});
    } catch (err) {
      console.error('Image upload error:', err);
      res.status(500).json({error: 'Failed to save profile image.'});
    } finally {
      if (connection) {
        connection.release();
      }
    }
  },
);

// GET FULL PROFILE INFO + IMAGE
app.get('/api/profile/:userId', async (req, res) => {
  const {userId} = req.params;
  let connection;

  try {
    connection = await db.promise().getConnection();

    const [userRows] = await connection.query(
      `SELECT user_id, first_name, middle_name, last_name, email, contact_number, username 
       FROM users 
       WHERE user_id = ?`,
      [userId],
    );

    if (userRows.length === 0) {
      return res.status(404).json({error: 'User not found.'});
    }

    const user = userRows[0];

    const [imageRows] = await connection.query(
      `SELECT image_data, mime_type 
       FROM profile_images 
       WHERE user_id = ?`,
      [userId],
    );

    let imageBase64 = null;
    let mimeType = null;

    if (imageRows.length > 0) {
      imageBase64 = imageRows[0].image_data.toString('base64');
      mimeType = imageRows[0].mime_type;
    }

    res.json({
      user,
      image: imageBase64 ? `data:${mimeType};base64,${imageBase64}` : null,
    });
  } catch (err) {
    console.error('Fetch profile data error:', err);
    res.status(500).json({error: 'Failed to fetch profile data.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// UPDATE PROFILE
app.put('/api/profile/:userId', async (req, res) => {
  const {userId} = req.params;
  const {
    first_name,
    middle_name,
    last_name,
    email,
    contact_number,
    username,
    password,
  } = req.body;

  let connection;
  try {
    connection = await db.promise().getConnection();

    const [users] = await connection.query(
      'SELECT * FROM users WHERE user_id = ?',
      [userId],
    );
    if (users.length === 0) {
      return res.status(404).json({error: 'User not found.'});
    }

    const current = users[0];

    const updatedFields = {
      first_name: first_name ?? current.first_name,
      middle_name: middle_name ?? current.middle_name,
      last_name: last_name ?? current.last_name,
      email: email ?? current.email,
      contact_number: contact_number ?? current.contact_number,
      username: username ?? current.username,
    };

    const [conflict] = await connection.query(
      `SELECT user_id FROM users 
       WHERE (email = ? OR username = ?) 
       AND user_id != ?`,
      [updatedFields.email, updatedFields.username, userId],
    );
    if (conflict.length > 0) {
      return res.status(400).json({error: 'Email or username already taken.'});
    }

    let updateQuery = `
      UPDATE users SET 
        first_name = ?, 
        middle_name = ?, 
        last_name = ?, 
        email = ?, 
        contact_number = ?, 
        username = ?
    `;
    const params = [
      updatedFields.first_name,
      updatedFields.middle_name,
      updatedFields.last_name,
      updatedFields.email,
      updatedFields.contact_number,
      updatedFields.username,
    ];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ', password = ?';
      params.push(hashedPassword);
    }

    updateQuery += ' WHERE user_id = ?';
    params.push(userId);

    await connection.query(updateQuery, params);

    res.json({success: true, message: 'Profile updated successfully.'});
  } catch (error) {
    console.error('Partial update error:', error);
    res.status(500).json({error: 'Failed to update profile.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// SEND CODE UPDATE
app.post('/api/send-update-code', async (req, res) => {
  const {email, user_id} = req.body;

  if (!user_id) {
    return res.status(400).json({error: 'User ID is required.'});
  }

  let connection;
  try {
    connection = await db.promise().getConnection();

    const [users] = await connection.query(
      'SELECT user_id, first_name, email FROM users WHERE user_id = ?',
      [user_id],
    );

    if (users.length === 0) {
      return res.status(404).json({error: 'User not found.'});
    }

    const user = users[0];
    const code = crypto.randomBytes(3).toString('hex').toUpperCase();

    await connection.query(
      `INSERT INTO verification_codes (user_id, verification_code, verification_type)
       VALUES (?, ?, 'update')`,
      [user.user_id, code],
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

    await transporter
      .sendMail({
        from: `"Student Wallet App" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'Verification Code for Update',
        html: `<p>Hello ${user.first_name},</p><p>Your update verification code is:</p><h2>${code}</h2>`,
      })
      .then(() => {
        console.log('Verification email sent to:', user.email);
      })
      .catch(err => {
        console.error('Email send error:', err);
      });

    res.json({success: true, message: 'Verification code sent.'});
  } catch (err) {
    console.error('Send update code error:', err);
    res.status(500).json({error: 'Failed to send verification code.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// VERIFICATION UPDATE
app.post('/api/verify-update', async (req, res) => {
  const {user_id, code} = req.body;

  if (!user_id || !code) {
    return res.status(400).json({error: 'User ID and code are required.'});
  }

  let connection;
  try {
    connection = await db.promise().getConnection();

    const [users] = await connection.query(
      'SELECT user_id FROM users WHERE user_id = ?',
      [user_id],
    );

    if (users.length === 0) {
      return res.status(404).json({error: 'User not found.'});
    }

    const [codes] = await connection.query(
      `SELECT verification_code FROM verification_codes 
       WHERE user_id = ? AND verification_type = 'update' 
       ORDER BY created_at DESC LIMIT 1`,
      [user_id],
    );

    if (codes.length === 0) {
      return res.status(400).json({error: 'No verification code found.'});
    }

    const latestCode = codes[0].verification_code;

    if (latestCode !== code.trim().toUpperCase()) {
      return res.status(400).json({error: 'Invalid verification code.'});
    }

    res.json({success: true, message: 'Code verified.'});
  } catch (err) {
    console.error('Verify update code error:', err);
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

// CHANGE PASSWORD
app.put('/api/profile/change-password/:user_id', async (req, res) => {
  const {user_id} = req.params;
  const {password} = req.body;

  if (!password) {
    return res.status(400).json({error: 'Password is required.'});
  }

  let connection;
  try {
    connection = await db.promise().getConnection();

    const hashedPassword = await bcrypt.hash(password, 10);
    await connection.query('UPDATE users SET password = ? WHERE user_id = ?', [
      hashedPassword,
      user_id,
    ]);

    res.json({success: true, message: 'Password updated successfully.'});
  } catch (err) {
    console.error('Password update error:', err);
    res.status(500).json({error: 'Failed to update password.'});
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
    if (connection) {
      connection.release();
    }
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

// ADD NEW GOAL
app.post('/api/goals', async (req, res) => {
  const {user_id, title, target_amount} = req.body;

  if (!user_id || !title || !target_amount) {
    return res.status(400).json({error: 'Missing required fields.'});
  }

  const createdAt = moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss');

  let connection;
  try {
    connection = await db.promise().getConnection();
    await connection.query(
      `INSERT INTO savings_goals 
       (user_id, title, goal_amount, current_amount, created_at)
       VALUES (?, ?, ?, 0, ?)`,
      [user_id, title, target_amount, createdAt],
    );
    res.json({success: true});
  } catch (err) {
    console.error('Add goal error:', err);
    res.status(500).json({error: 'Failed to add goal.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// FETCH GOALS
app.get('/api/goals/:userId', async (req, res) => {
  const {userId} = req.params;

  let connection;
  try {
    connection = await db.promise().getConnection();
    const [rows] = await connection.query(
      'SELECT * FROM savings_goals WHERE user_id = ? ORDER BY created_at ASC',
      [userId],
    );
    res.json({goals: rows});
  } catch (err) {
    console.error('Fetch goals error:', err);
    res.status(500).json({error: 'Failed to fetch goals.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// ADD AMOUNT TO GOAL AND LOG TO BALANCE_HISTORY
app.put('/api/goals/:goalId/add', async (req, res) => {
  const {goalId} = req.params;
  const {amount, user_id, allowance_id, balance_type} = req.body;

  if (!amount || isNaN(amount)) {
    return res.status(400).json({error: 'Invalid amount.'});
  }

  if (!user_id || !allowance_id || !balance_type) {
    return res
      .status(400)
      .json({error: 'Missing user_id, allowance_id, or balance_type.'});
  }

  const createdAt = moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss');

  let connection;
  try {
    connection = await db.promise().getConnection();

    await connection.query(
      `UPDATE savings_goals 
       SET current_amount = current_amount + ? 
       WHERE goal_id = ?`,
      [amount, goalId],
    );

    const description =
      balance_type === 'Allowance Savings'
        ? 'Savings Goal - Allowance Balance'
        : 'Savings Goal - Allocation';

    await connection.query(
      `INSERT INTO balance_history 
       (user_id, balance_type, category, description, amount, allowance_id, goal_id, created_at)
       VALUES (?, ?, 'Savings', ?, ?, ?, ?, ?)`,
      [
        user_id,
        balance_type,
        description,
        amount,
        allowance_id,
        goalId,
        createdAt,
      ],
    );

    res.json({success: true});
  } catch (err) {
    console.error('Add to goal error:', err);
    res
      .status(500)
      .json({error: 'Failed to update goal and log balance history.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// FETCH ALLOWANCE SUMMARY FOR SETTING GOALS
app.get('/api/allowances-summary/:userId', async (req, res) => {
  const {userId} = req.params;

  let connection;
  try {
    connection = await db.promise().getConnection();

    const [allowances] = await connection.query(
      'SELECT * FROM allowances WHERE user_id = ? ORDER BY start_date DESC',
      [userId],
    );

    if (allowances.length === 0) {
      return res.json({summaries: []});
    }

    const allowanceIds = allowances.map(a => a.allowance_id);
    const [transactions] = await connection.query(
      `SELECT * FROM balance_history 
       WHERE user_id = ? AND allowance_id IN (?)`,
      [userId, allowanceIds],
    );

    const today = new Date();

    const summaries = allowances.map(allowance => {
      const relevant = transactions.filter(
        t => t.allowance_id === allowance.allowance_id,
      );

      const totalExpenses = relevant
        .filter(t => t.balance_type === 'Expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const allowanceSavings = relevant
        .filter(t => t.balance_type === 'Allowance Savings')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const allocationSavings = relevant
        .filter(t => t.balance_type === 'Allocation Savings')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const overspending = Math.max(
        totalExpenses - allowance.spending_limit,
        0,
      );

      const remainingBalance =
        allowance.amount - totalExpenses - allowanceSavings;

      const remainingAllocation = Math.max(
        allowance.amount -
          allowance.spending_limit -
          allocationSavings -
          overspending,
        0,
      );

      const remainingLimit = Math.max(
        allowance.spending_limit - totalExpenses - allowanceSavings,
        0,
      );

      const isActive =
        today >= new Date(allowance.start_date) &&
        today <= new Date(allowance.end_date);

      return {
        allowance_id: allowance.allowance_id,
        amount: allowance.amount,
        start_date: allowance.start_date,
        end_date: allowance.end_date,
        label: `${isActive ? 'Active' : 'Allowance'} (${
          allowance.start_date
        } - ${allowance.end_date})`,
        isActive,
        totalExpenses,
        allowanceSavings,
        allocationSavings,
        spending_limit: allowance.spending_limit,
        overspending,
        remainingBalance: Math.max(remainingBalance, 0),
        remainingLimit,
        remainingAllocation,
      };
    });

    res.json({summaries});
  } catch (err) {
    console.error('Fetch allowance summary error:', err);
    res.status(500).json({error: 'Failed to generate summary.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// FETCH GOAL SAVING HISTORY
app.get('/api/goal-history/:goalId', async (req, res) => {
  const {goalId} = req.params;
  let connection;

  try {
    connection = await db.promise().getConnection();

    const [goalRows] = await connection.query(
      'SELECT * FROM savings_goals WHERE goal_id = ?',
      [goalId],
    );

    if (goalRows.length === 0) {
      return res.status(404).json({error: 'Goal not found.'});
    }

    const goal = goalRows[0];

    const [historyRows] = await connection.query(
      `SELECT bh.created_at, bh.amount, bh.balance_type, a.start_date, a.end_date
       FROM balance_history bh
       JOIN allowances a ON bh.allowance_id = a.allowance_id
       WHERE bh.user_id = ? 
         AND bh.goal_id = ?
         AND (bh.balance_type = 'Allowance Savings' OR bh.balance_type = 'Allocation Savings')
       ORDER BY bh.created_at DESC`,
      [goal.user_id, goal.goal_id],
    );

    const history = historyRows.map(row => ({
      date: row.created_at,
      amount: row.amount,
      source:
        row.balance_type === 'Allowance Savings' ? 'Balance' : 'Allocation',
      allowanceRange: `${new Date(
        row.start_date,
      ).toLocaleDateString()} - ${new Date(row.end_date).toLocaleDateString()}`,
    }));

    res.json({history});
  } catch (err) {
    console.error('Goal history fetch failed:', err);
    res.status(500).json({error: 'Server error fetching goal history.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// DELETE A GOAL
app.delete('/api/goals/:goalId', async (req, res) => {
  const {goalId} = req.params;
  const {user_id} = req.body;

  if (!user_id) {
    return res.status(400).json({error: 'Missing user ID.'});
  }

  let connection;
  try {
    connection = await db.promise().getConnection();

    await connection.query(
      'DELETE FROM balance_history WHERE user_id = ? AND goal_id = ?',
      [user_id, goalId],
    );

    await connection.query(
      'DELETE FROM savings_goals WHERE goal_id = ? AND user_id = ?',
      [goalId, user_id],
    );

    res.json({success: true, message: 'Goal deleted.'});
  } catch (err) {
    console.error('Delete goal error:', err);
    res.status(500).json({error: 'Failed to delete goal.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// REPORTS DATA (WEEKLY/MONTHLY SUMMARY)
app.get('/api/summary-report/:userId', async (req, res) => {
  const {userId} = req.params;
  const {range, month, week} = req.query;

  const now = new Date();
  const year = now.getFullYear();
  let startDate, endDate;

  const monthIndex = month
    ? new Date(`${month} 1, ${year}`).getMonth()
    : now.getMonth();

  if (range === 'monthly') {
    startDate = new Date(year, monthIndex, 1);
    endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59);
  } else if (range === 'weekly' && week) {
    const weekNumber = parseInt(week.split(' ')[1]);

    if (isNaN(weekNumber) || week.toLowerCase() === 'all weeks') {
      startDate = new Date(year, monthIndex, 1);
      endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59);
    } else {
      const daysOffset = (weekNumber - 1) * 7;
      startDate = new Date(year, monthIndex, 1 + daysOffset);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59);
    }
  } else {
    startDate = new Date();
    startDate.setDate(now.getDate() - 7);
    endDate = now;
  }

  let connection;
  try {
    connection = await db.promise().getConnection();

    const [rows] = await connection.query(
      `SELECT balance_type, SUM(amount) as total
       FROM balance_history
       WHERE user_id = ? AND created_at BETWEEN ? AND ?
       GROUP BY balance_type`,
      [userId, startDate, endDate],
    );

    let income = 0,
      expenses = 0,
      savings = 0;

    rows.forEach(row => {
      switch (row.balance_type) {
        case 'Income':
          income = Number(row.total);
          break;
        case 'Expense':
          expenses = Number(row.total);
          break;
        case 'Allowance Savings':
        case 'Allocation Savings':
          savings += Number(row.total);
          break;
      }
    });

    res.json({
      income,
      expenses,
      savings,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    });
  } catch (err) {
    console.error('Summary report error:', err);
    res.status(500).json({error: 'Failed to generate summary report.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// DASHBOARD FUND SUMMARY
app.get('/api/dashboard-summary/:userId', async (req, res) => {
  const {userId} = req.params;

  let connection;
  try {
    connection = await db.promise().getConnection();

    // 1. Total Allowance (sum of all allowances.amount)
    const [allowanceRows] = await connection.query(
      'SELECT SUM(amount) as totalAllowance FROM allowances WHERE user_id = ?',
      [userId],
    );
    const totalAllowance = Number(allowanceRows[0].totalAllowance || 0);

    // 2. Total Expenses + Savings from balance_history
    const [balanceRows] = await connection.query(
      `SELECT balance_type, SUM(amount) AS total
       FROM balance_history
       WHERE user_id = ?
       GROUP BY balance_type`,
      [userId],
    );

    let totalExpenses = 0;
    let totalSavings = 0;

    balanceRows.forEach(row => {
      const amt = Number(row.total);
      if (row.balance_type === 'Expense') {
        totalExpenses += amt;
      } else if (
        row.balance_type === 'Allowance Savings' ||
        row.balance_type === 'Allocation Savings'
      ) {
        totalSavings += amt;
      }
    });

    const remainingBalance = totalAllowance - totalExpenses - totalSavings;

    res.json({
      totalAllowance,
      totalExpenses,
      totalSavings,
      remainingBalance: Math.max(remainingBalance, 0),
    });
  } catch (err) {
    console.error('Dashboard summary error:', err);
    res.status(500).json({error: 'Failed to fetch dashboard summary.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// FETCH ALLOWANCE INCOME HISTORY FOR DASHBOARD MODAL
app.get('/api/allowance-income-history/:userId', async (req, res) => {
  const {userId} = req.params;

  let connection;
  try {
    connection = await db.promise().getConnection();

    const [rows] = await connection.query(
      `SELECT bh.amount, bh.created_at, bh.description, a.start_date, a.end_date
       FROM balance_history bh
       LEFT JOIN allowances a ON bh.allowance_id = a.allowance_id
       WHERE bh.user_id = ?
         AND bh.balance_type = 'Income'
         AND (bh.description = 'Set Allowance' OR bh.description = 'Allowance Added')
       ORDER BY bh.created_at DESC`,
      [userId],
    );

    const history = rows.map(row => ({
      amount: Number(row.amount),
      start_date: row.start_date,
      end_date: row.end_date,
      description:
        row.description === 'Set Allowance'
          ? 'Allowance Set'
          : 'Allowance Added',
    }));

    res.json(history);
  } catch (error) {
    console.error('Fetch allowance income history error:', error);
    res.status(500).json({error: 'Failed to fetch allowance income history.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// FETCH EXPENSE & SAVINGS HISTORY FOR DASHBOARD MODAL
app.get('/api/expense-savings-history/:userId', async (req, res) => {
  const {userId} = req.params;

  let connection;
  try {
    connection = await db.promise().getConnection();

    const [rows] = await connection.query(
      `SELECT bh.amount, bh.created_at, bh.balance_type, bh.description
       FROM balance_history bh
       WHERE bh.user_id = ?
         AND (bh.balance_type = 'Expense' OR bh.balance_type = 'Allocation Savings' OR bh.balance_type = 'Allowance Savings')
       ORDER BY bh.created_at DESC`,
      [userId],
    );

    const history = rows.map(row => ({
      amount: Number(row.amount),
      balance_type: row.balance_type,
      description: row.description,
      created_at: row.created_at,
    }));

    res.json(history);
  } catch (error) {
    console.error('Fetch expense/savings history error:', error);
    res.status(500).json({error: 'Failed to fetch expense/savings history.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// FETCH TOTAL EXPENSES DASHBOARD MODAL
app.get('/api/expenses-history/:userId', async (req, res) => {
  const {userId} = req.params;
  let connection;
  try {
    connection = await db.promise().getConnection();
    const [rows] = await connection.query(
      `SELECT amount, created_at, description
       FROM balance_history
       WHERE user_id = ? AND balance_type = 'Expense'
       ORDER BY created_at DESC`,
      [userId],
    );
    res.json(rows);
  } catch (error) {
    console.error('Fetch expenses history error:', error);
    res.status(500).json({error: 'Failed to fetch expenses history.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// FETCH TOTAL SAVINGS DASHBARD MODAL
app.get('/api/savings-history/:userId', async (req, res) => {
  const {userId} = req.params;
  let connection;
  try {
    connection = await db.promise().getConnection();
    const [rows] = await connection.query(
      `SELECT amount, created_at, description
       FROM balance_history
       WHERE user_id = ? AND (balance_type = 'Allowance Savings' OR balance_type = 'Allocation Savings')
       ORDER BY created_at DESC`,
      [userId],
    );

    const history = rows.map(row => ({
      amount: Number(row.amount),
      description: row.description,
      created_at: row.created_at,
    }));

    res.json(history);
  } catch (error) {
    console.error('Fetch savings history error:', error);
    res.status(500).json({error: 'Failed to fetch savings history.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// FETCH SPENDING BREAKDOWN DASHBOARD DATA - PIECHART
app.get('/api/spending-breakdown/:userId', async (req, res) => {
  const {userId} = req.params;
  let connection;

  try {
    connection = await db.promise().getConnection();

    const [rows] = await connection.query(
      `SELECT category, SUM(amount) AS total
       FROM balance_history
       WHERE user_id = ? AND balance_type = 'Expense'
       GROUP BY category
       ORDER BY total DESC`,
      [userId],
    );

    const data = rows.map(row => ({
      name: row.category,
      amount: Number(row.total),
    }));

    res.json(data);
  } catch (error) {
    console.error('Failed to fetch spending breakdown:', error);
    res.status(500).json({error: 'Error fetching spending breakdown.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// CREATE NOTIFICATION
app.post('/api/notifications', async (req, res) => {
  const {user_id, title, message} = req.body;

  if (!user_id || !title || !message) {
    return res.status(400).json({error: 'Missing required fields.'});
  }

  const createdAt = moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss');

  let connection;
  try {
    connection = await db.promise().getConnection();
    const [result] = await connection.query(
      `INSERT INTO notifications (user_id, title, message, is_read, created_at)
       VALUES (?, ?, ?, 0, ?)`,
      [user_id, title, message, createdAt],
    );

    res.json({success: true, notification_id: result.insertId});
  } catch (err) {
    console.error('Create notification error:', err);
    res.status(500).json({error: 'Failed to create notification.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// FETCH NOTIFICATION FOR A USER
app.get('/api/notifications/:userId', async (req, res) => {
  const {userId} = req.params;

  let connection;
  try {
    connection = await db.promise().getConnection();
    const [rows] = await connection.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId],
    );
    res.json({notifications: rows});
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({error: 'Failed to fetch notifications.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// MARK NOTIFICATION AS READ FOR A USER
app.put('/api/notifications/:id/read', async (req, res) => {
  const {id} = req.params;

  let connection;
  try {
    connection = await db.promise().getConnection();
    await connection.query(
      'UPDATE notifications SET is_read = 1 WHERE notification_id = ?',
      [id],
    );
    res.json({success: true});
  } catch (err) {
    console.error('Mark as read error:', err);
    res.status(500).json({error: 'Failed to update read status.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// MARK ALL NOTIFICATION AS READ FOR A USER
app.put('/api/notifications/:userId/mark-all-read', async (req, res) => {
  const {userId} = req.params;

  let connection;
  try {
    connection = await db.promise().getConnection();
    await connection.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [userId],
    );
    res.json({success: true});
  } catch (err) {
    console.error('Mark all as read error:', err);
    res.status(500).json({error: 'Failed to mark all as read.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// DELETE NOTIFICATION BY ID AND USER_ID
app.delete('/api/notifications/:notificationId/:userId', async (req, res) => {
  const {notificationId, userId} = req.params;

  let connection;
  try {
    connection = await db.promise().getConnection();

    const [result] = await connection.query(
      'DELETE FROM notifications WHERE notification_id = ? AND user_id = ?',
      [notificationId, userId],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({error: 'Notification not found or not authorized.'});
    }

    res.json({success: true, message: 'Notification deleted.'});
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({error: 'Failed to delete notification.'});
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// DELETE ALL NOTIFICATIONS FOR A USER
app.delete('/api/notifications/:userId', async (req, res) => {
  const {userId} = req.params;

  let connection;
  try {
    connection = await db.promise().getConnection();

    const [result] = await connection.query(
      'DELETE FROM notifications WHERE user_id = ?',
      [userId],
    );

    res.json({
      success: true,
      message: `${result.affectedRows} notifications deleted.`,
    });
  } catch (err) {
    console.error('Delete all notifications error:', err);
    res.status(500).json({error: 'Failed to delete all notifications.'});
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
