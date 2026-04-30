const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((error) => {
  if (error) {
    console.warn('⚠️  Mailer config error:', error.message);
  } else {
    console.log('✅ Mailer ready');
  }
});

module.exports = transporter;
