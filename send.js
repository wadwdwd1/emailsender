const nodemailer = require('nodemailer');
const dns = require('dns').promises;
const readline = require('readline');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt user for email
rl.question('Enter the recipient email address: ', async (toEmail) => {
  rl.close();

  if (!/^[^@]+@[^@]+\.[^@]+$/.test(toEmail)) {
    console.error('Invalid email format.');
    process.exit(1);
  }

  const domain = toEmail.split('@')[1];

  // Get MX record for the recipient's domain
  async function getMX(domain) {
    try {
      const records = await dns.resolveMx(domain);
      records.sort((a, b) => a.priority - b.priority);
      return records[0].exchange;
    } catch (err) {
      console.error(`Failed to get MX record for ${domain}:`, err);
      process.exit(1);
    }
  }

  // Send the email
  async function sendEmailDirect() {
    const mxHost = await getMX(domain);

    const transporter = nodemailer.createTransport({
      host: mxHost,
      port: 25,
      secure: false,
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: 'main@gmail.com',
      to: toEmail,
      subject: 'Direct Email Test',
      text: 'Hello! This email was sent directly to your mail server without using a third-party SMTP.',
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info.response);
    } catch (err) {
      console.error('Send failed:', err);
    }
  }

  await sendEmailDirect();
});
