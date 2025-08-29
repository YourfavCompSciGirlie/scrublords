// server/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

module.exports = (db) => {
  router.post('/register', async (req, res) => {
    const { full_name, id_number, email, phone, password } = req.body;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      db.prepare(`
        INSERT INTO users (full_name, id_number, email, phone, hashedPassword)
        VALUES (?, ?, ?, ?, ?)
      `).run(full_name, id_number, email, phone, hashedPassword);

      res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        res.status(400).json({ error: 'Email or ID number already registered' });
      } else {
        console.error(err);
        res.status(500).json({ error: 'Registration failed' });
      }
    }
  });

  router.post('/login', async (req, res) => {
    const { id_number, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id_number = ?').get(id_number);

    if (!user) return res.status(404).json({ error: 'User not found' });

    const passwordMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!passwordMatch) return res.status(401).json({ error: 'Incorrect password' });

    res.status(200).json({
      message: 'Login successful',
      role: user.role,
      full_name: user.full_name
    });
  });

  return router;
};