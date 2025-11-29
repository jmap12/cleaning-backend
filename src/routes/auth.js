const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../db/pool'); // your PostgreSQL pool connection

const router = express.Router();

// ------------------ REGISTER ------------------
router.post('/register', async (req, res) => {
  try {
    const { first_name, last_name, email, password, phone, user_type } = req.body;

    const checkUser = await pool.query(
      'SELECT * FROM users WHERE email=$1 OR phone=$2',
      [email, phone]
    );

    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email or phone already in use' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const insert = await pool.query(
      `INSERT INTO users (first_name, last_name, email, phone, user_type, password)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING user_id, user_type`,
      [first_name, last_name, email, phone, user_type, hashed]
    );

    res.json({
      success: true,
      message: 'Registration successful. You must subscribe to continue.',
      user_id: insert.rows[0].user_id,
      user_type: insert.rows[0].user_type
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: 'Registration error' });
  }
});


// ------------------ LOGIN ------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const userQuery = await pool.query(
      'SELECT * FROM users WHERE email=$1',
      [email]
    );

    if (userQuery.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = userQuery.rows[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user.user_id, userType: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      token,
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        user_type: user.user_type,
        subscribed: user.subscribed
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: 'Login error' });
  }
});


module.exports = router;
older