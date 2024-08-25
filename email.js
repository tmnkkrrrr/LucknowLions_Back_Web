const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "6f57845a997555",
    pass: "068733e2b5b897"
  }
});

const mailOptions = {
  from: 'tmnkakr@gmail.com', // Sender address
  to: 'tmnkkr@gmail.com', // List of recipients
  subject: 'Test Email', // Subject line
  text: 'This is a test email from Nodemailer.' // Plain text body
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('Error occurred:', error.message);
    return;
  }
  console.log('Email sent successfully!');
  console.log('Message ID:', info.messageId);
});
