const express = require('express');
const router = express.Router();

module.exports = (db, otps, twilioClient, TWILIO_PHONE, transporter) => {
  function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  function sendOTPBySMS(phone, otp) {
    twilioClient.messages.create({
      body: `Your QueueWise OTP is: ${otp}`,
      from: TWILIO_PHONE,
      to: phone
    })
    .then(msg => console.log('✅ SMS sent:', msg.sid))
    .catch(err => console.error('❌ SMS failed:', err.message));
  }

  function sendOTPByEmail(email, otp) {
  transporter.sendMail({
    from: `"QueueWise Support" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Your QueueWise OTP Code',
    text: `Your OTP code is: ${otp}`
  })
  .then(info => console.log('✅ Email sent:', info.response))
  .catch(err => console.error('❌ Email failed:', err)); // log full error
}

  router.post('/request-otp', (req, res) => {
    const { id_number, method } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id_number = ?').get(id_number);

    if (!user) return res.status(404).json({ error: 'User not found' });

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    otps.set(id_number, { otp, expiresAt });

    method === 'sms' ? sendOTPBySMS(user.phone, otp) : sendOTPByEmail(user.email, otp);
    res.status(200).json({ message: 'OTP sent via ' + method });
  });

  router.post('/verify-otp', (req, res) => {
    const { id_number, otp } = req.body;
    const record = otps.get(id_number);

    if (!record) return res.status(400).json({ error: 'No OTP found' });
    if (Date.now() > record.expiresAt) return res.status(410).json({ error: 'OTP expired' });
    if (record.otp !== otp) return res.status(401).json({ error: 'Incorrect OTP' });

    otps.delete(id_number);

    const user = db.prepare('SELECT * FROM users WHERE id_number = ?').get(id_number);
    res.status(200).json({ message: 'OTP verified', role: user.role });
  });

  return router;
};
