const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter;

const setupTransporter = async () => {
  // If SMTP configs exist and are not defaults
  const hasConfig = 
    process.env.EMAIL_USER && 
    process.env.EMAIL_USER !== 'mock_user@ethereal.email';

  if (hasConfig) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: parseInt(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    // Ethereal local test account fallback
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`✉️ Nodemailer Ethereal Account configured. User: ${testAccount.user}`);
    } catch (err) {
      // Direct console logger fallback
      console.warn('⚠️ Could not set up Nodemailer Ethereal. Emails will be logged to terminal only.');
      transporter = null;
    }
  }
};

setupTransporter();

/**
 * Sends an email
 * @param {Object} options - Email parameters: { email, subject, message, html }
 */
const sendEmail = async (options) => {
  console.log('\x1b[36m%s\x1b[0m', `╔═════════════════ MAIL SIMULATOR ═════════════════`);
  console.log(`║ To:      ${options.email}`);
  console.log(`║ Subject: ${options.subject}`);
  console.log(`║ Message: ${options.message}`);
  console.log('\x1b[36m%s\x1b[0m', `╚══════════════════════════════════════════════════`);

  if (!transporter) {
    return { success: true, logged: true };
  }

  try {
    const mailOptions = {
      from: `"Indigo Aurora Task Board" <${process.env.EMAIL_USER || 'noreply@taskboard.com'}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || `<p>${options.message}</p>`
    };

    const info = await transporter.sendMail(mailOptions);
    const testUrl = nodemailer.getTestMessageUrl(info);
    if (testUrl) {
      console.log(`✉️ Test Email URL: ${testUrl}`);
    }
    return info;
  } catch (error) {
    console.error('Nodemailer failed to dispatch mail:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;
