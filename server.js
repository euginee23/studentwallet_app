const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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
        `+63${contactNumber}`,
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
      from: `"Inventory System" <${process.env.SMTP_USER}>`,
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
      'SELECT * FROM verification_codes WHERE user_id = ? AND verification_code = ? AND verification_type = \'register\'',
      [userId, code],
    );
    if (codeRows.length === 0) {
      return res.status(400).json({error: 'Invalid verification code.'});
    }

    await connection.query(
      'UPDATE users SET is_verified = TRUE WHERE user_id = ?',
      [userId],
    );

    await connection.query(
      'DELETE FROM verification_codes WHERE user_id = ? AND verification_type = \'register\'',
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
    if (connection) {connection.release();}
  }
});

// START SERVER
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
