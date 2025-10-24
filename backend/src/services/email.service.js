import nodemailer from 'nodemailer';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { EmailError } from '../utils/errors.js';

class EmailService {
  constructor() {
    // Check if email configuration is available
    if (!config.email || !config.email.smtp || !config.email.smtp.host) {
      logger.warn(
        'Email configuration not found. Email service will be disabled.'
      );
      this.enabled = false;
      return;
    }

    try {
      logger.info('Initializing email service with config:', {
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.secure,
      });

      this.transporter = nodemailer.createTransport({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.secure,
        auth: {
          user: config.email.smtp.auth.user,
          pass: config.email.smtp.auth.pass,
        },
        // Add TLS options to handle self-signed certificates in development
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production',
        },
      });

      this.enabled = true;

      // Test SMTP connection only in production
      if (process.env.NODE_ENV === 'production') {
        this.transporter.verify((error, success) => {
          if (error) {
            logger.error('SMTP Connection Error:', error);
            this.enabled = false;
          } else {
            logger.info('SMTP Server is ready to take messages');
          }
        });
      }
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      this.enabled = false;
    }
  }

  /**
   * Check if email service is enabled
   */
  isEnabled() {
    return this.enabled === true;
  }

  /**
   * Send verification email
   * @param {string} email - User's email address
   * @param {string} token - Verification token
   */
  async sendVerificationEmail(email, token) {
    if (!this.isEnabled()) {
      logger.warn('Email service is disabled. Cannot send verification email.');
      return;
    }

    try {
      // Use CLIENT_URL from environment, fallback to production URL if not set
      const clientUrl = config.clientUrl || (process.env.NODE_ENV === 'production' ? 'https://pawfectfriends.xyz' : 'http://localhost:3000');
      const verificationUrl = `${clientUrl}/verify-email?token=${encodeURIComponent(token)}`;
      
      // Debug logging for verification URL
      logger.info('Email verification URL generated:', {
        clientUrl: config.clientUrl,
        fallbackClientUrl: clientUrl,
        verificationUrl,
        environment: process.env.NODE_ENV,
        hasClientUrlEnv: !!process.env.CLIENT_URL
      });

      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: 'Verify Your Email - Pawfect Friends',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a5568;">Welcome to Pawfect Friends!</h2>
            <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email
              </a>
            </div>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <hr style="border: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="color: #718096; font-size: 12px;">
              If the button above doesn't work, copy and paste this link into your browser:<br>
              ${verificationUrl}
            </p>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Verification email sent successfully', {
        email,
        messageId: info.messageId,
      });
    } catch (error) {
      logger.error('Failed to send verification email:', error);
      if (error.code === 'ESOCKET' || error.code === 'ECONNECTION') {
        throw EmailError.connection('Failed to connect to email server');
      }
      throw EmailError.send('Failed to send verification email');
    }
  }

  /**
   * Send password reset email
   * @param {string} email - User's email address
   * @param {string} token - Password reset token
   */
  async sendPasswordResetEmail(email, token) {
    if (!this.isEnabled()) {
      logger.warn(
        'Email service is disabled. Cannot send password reset email.'
      );
      return;
    }

    try {
      // Use CLIENT_URL from environment, fallback to production URL if not set
      const clientUrl = config.clientUrl || (process.env.NODE_ENV === 'production' ? 'https://pawfectfriends.xyz' : 'http://localhost:3000');
      const resetUrl = `${clientUrl}/reset-password?token=${token}`;

      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: 'Reset Your Password - Pawfect Friends',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a5568;">Reset Your Password</h2>
            <p>You requested to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
            <hr style="border: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="color: #718096; font-size: 12px;">
              If the button above doesn't work, copy and paste this link into your browser:<br>
              ${resetUrl}
            </p>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Password reset email sent successfully', {
        email,
        messageId: info.messageId,
      });
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      if (error.code === 'ESOCKET' || error.code === 'ECONNECTION') {
        throw EmailError.connection('Failed to connect to email server');
      }
      throw EmailError.send('Failed to send password reset email');
    }
  }

  /**
   * Send adoption approval email
   * @param {string} userEmail - User's email address
   * @param {string} petName - Name of the pet
   */
  async sendAdoptionApprovalEmail(userEmail, petName) {
    if (!this.isEnabled()) {
      logger.warn(
        'Email service is disabled. Cannot send adoption approval email.'
      );
      return;
    }

    try {
      const mailOptions = {
        from: config.email.from,
        to: userEmail,
        subject: 'Adoption Request Approved! 🎉',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">Congratulations! 🎉</h2>
            <p>Your adoption request for <strong>${petName}</strong> has been approved!</p>
            <p>Next steps:</p>
            <ol>
              <li>Review the adoption conditions in your dashboard</li>
              <li>Schedule a meet and greet with the shelter</li>
              <li>Complete the adoption paperwork</li>
            </ol>
            <p>You can view all the details in your adoption dashboard.</p>
            <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
              <p style="margin: 0;">Need help? Contact us at support@pawfectfriends.com</p>
            </div>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Adoption approval email sent successfully', {
        email: userEmail,
        messageId: info.messageId,
      });
    } catch (error) {
      logger.error('Failed to send adoption approval email:', error);
      throw new Error('Failed to send adoption approval email');
    }
  }

  /**
   * Send adoption rejection email
   * @param {string} userEmail - User's email address
   * @param {string} petName - Name of the pet
   * @param {string} reason - Reason for rejection
   */
  async sendAdoptionRejectionEmail(userEmail, petName, reason) {
    if (!this.isEnabled()) {
      logger.warn(
        'Email service is disabled. Cannot send adoption rejection email.'
      );
      return;
    }

    try {
      const mailOptions = {
        from: config.email.from,
        to: userEmail,
        subject: 'Adoption Request Update',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f44336;">Adoption Request Update</h2>
            <p>We regret to inform you that your adoption request for <strong>${petName}</strong> has not been approved at this time.</p>
            <p>Reason: ${reason}</p>
            <p>Don't worry! There are many other wonderful pets waiting for their forever homes.</p>
            <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
              <p style="margin: 0;">Need help? Contact us at support@pawfectfriends.com</p>
            </div>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Adoption rejection email sent successfully', {
        email: userEmail,
        messageId: info.messageId,
      });
    } catch (error) {
      logger.error('Failed to send adoption rejection email:', error);
      throw new Error('Failed to send adoption rejection email');
    }
  }

  /**
   * Send a generic email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.text - Email text content
   * @param {string} [options.html] - Email HTML content
   */
  async sendEmail({ to, subject, text, html }) {
    if (!this.isEnabled()) {
      logger.warn('Email service is disabled. Cannot send generic email.');
      return;
    }

    try {
      const mailOptions = {
        from: config.email.from,
        to,
        subject,
        text,
        html: html || text,
      };

      logger.info('Attempting to send email:', { to, subject });
      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully:', { messageId: info.messageId });
      return info;
    } catch (error) {
      logger.error('Error sending email:', error);
      if (error.code === 'ESOCKET' || error.code === 'ECONNECTION') {
        throw EmailError.connection('Failed to connect to email server');
      }
      throw EmailError.send('Failed to send email');
    }
  }
}

const emailService = new EmailService();
export const sendEmail = emailService.sendEmail.bind(emailService);
export { emailService };
