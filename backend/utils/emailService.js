import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

// Check if SMTP is configured
const isSmtpConfigured = process.env.SMTP_HOST && 
                         process.env.SMTP_USER && 
                         process.env.SMTP_PASS;

// Create SMTP transporter only if configured
let transporter = null;
if (isSmtpConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log('✅ SMTP email service configured');
} else {
  console.log('⚠️  SMTP not configured - email notifications disabled');
}

/**
 * Send email notification
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @returns {Promise<boolean>} Success status
 */
export async function sendEmail({ to, subject, html }) {
  if (!isSmtpConfigured || !transporter) {
    console.log('📧 Email would be sent to:', to, '- Subject:', subject);
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Enzonic Music" <noreply@enzonic.me>',
      to,
      subject,
      html,
    });

    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send song approval notification
 * @param {string} email - User email
 * @param {string} artistName - Artist name
 * @param {string} songTitle - Song title
 * @returns {Promise<boolean>} Success status
 */
export async function sendSongApprovedEmail(email, artistName, songTitle) {
  const subject = '🎉 Your song has been approved!';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎵 Song Approved!</h1>
        </div>
        <div class="content">
          <h2>Great news, ${artistName}!</h2>
          <p>Your song "<strong>${songTitle}</strong>" has been approved and is now live on Enzonic Music! 🎉</p>
          <p>Your fans can now discover and enjoy your music. Share it with the world!</p>
          <a href="${process.env.VITE_APP_URL || 'https://enzonic.me'}/music" class="button">View Your Song</a>
          <p style="margin-top: 30px; color: #666;">Keep creating amazing music!</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Enzonic Music. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to: email, subject, html });
}

/**
 * Send song rejection notification
 * @param {string} email - User email
 * @param {string} artistName - Artist name
 * @param {string} songTitle - Song title
 * @param {string} reason - Rejection reason
 * @returns {Promise<boolean>} Success status
 */
export async function sendSongRejectedEmail(email, artistName, songTitle, reason) {
  const subject = 'Update on your song submission';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px; }
        .reason-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎵 Song Submission Update</h1>
        </div>
        <div class="content">
          <h2>Hello ${artistName},</h2>
          <p>Thank you for submitting "<strong>${songTitle}</strong>" to Enzonic Music.</p>
          <p>After careful review, we're unable to approve this song at this time.</p>
          <div class="reason-box">
            <strong>Reason:</strong><br>
            ${reason}
          </div>
          <p>We encourage you to review our content guidelines and resubmit. We're here to support your musical journey!</p>
          <a href="${process.env.VITE_APP_URL || 'https://enzonic.me'}/music" class="button">Upload Another Song</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Enzonic Music. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to: email, subject, html });
}

/**
 * Send song pending review notification
 * @param {string} email - User email
 * @param {string} artistName - Artist name
 * @param {string} songTitle - Song title
 * @returns {Promise<boolean>} Success status
 */
export async function sendSongPendingEmail(email, artistName, songTitle) {
  const subject = 'Your song is under review';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎵 Song Submitted Successfully!</h1>
        </div>
        <div class="content">
          <h2>Thank you, ${artistName}!</h2>
          <p>We've received your song "<strong>${songTitle}</strong>" and it's now under review.</p>
          <div class="info-box">
            <strong>What happens next?</strong><br>
            Our team will review your submission within 24-48 hours. You'll receive an email once your song is approved or if we need any changes.
          </div>
          <p>We're excited to hear your music! 🎶</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Enzonic Music. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to: email, subject, html });
}

export default { sendEmail, sendSongApprovedEmail, sendSongRejectedEmail, sendSongPendingEmail };
