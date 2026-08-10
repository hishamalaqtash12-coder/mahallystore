import nodemailer from 'nodemailer';
import { persistMessage } from './messages';

const createTransporter = () => {
  const user = process.env.SMTP_USER || "info@mahallystore.com";
  const pass = process.env.SMTP_PASS;
  if (!pass) {
    console.warn("[NotificationService] Warning: SMTP_PASS is missing in environment variables.");
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.hostinger.com",
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: process.env.SMTP_PORT === "465" || !process.env.SMTP_PORT,
    auth: {
      user: user,
      pass: pass,
    },
  });
};

/**
 * Unified Notification Service for Mahally Marketplace
 * Handles Email, Internal Messages, and WhatsApp placeholders.
 */
export const NotificationService = {
  /**
   * Send a notification to a user (Customer, Merchant, or Admin)
   */
  async notify({ userId, senderId, title, message, channel = ['internal'], type = 'info', metadata = {} }) {
    console.log(`[NotificationService] Notifying user ${userId}: ${title}`);

    const results = [];

    // 1. Internal In-App Notification (via database)
    if (channel.includes('internal')) {
      try {
        await this.sendInternal(userId, senderId, { title, message, type, metadata });
        results.push({ channel: 'internal', status: 'success' });
      } catch (err) {
        console.error('Internal notification failed:', err);
        results.push({ channel: 'internal', status: 'error', error: err.message });
      }
    }

    // 2. Email Notification (via Nodemailer)
    if (channel.includes('email')) {
      const transporter = createTransporter();
      if (transporter) {
        try {
          const userEmail = metadata.email;
          if (userEmail) {
            const smtpUser = process.env.SMTP_USER || "info@mahallystore.com";
            const emailBody = metadata.html || `<div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
              <h2 style="color: #be374f;">${title}</h2>
              <p style="color: #333; line-height: 1.6;">${message}</p>
              ${metadata.actionUrl ? `<a href="${metadata.actionUrl}" style="display: inline-block; padding: 10px 20px; background: #be374f; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">View Details</a>` : ''}
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #999;">This is an automated notification from Mahally. Please do not reply to this email.</p>
            </div>`;

            await transporter.sendMail({
              from: `"Mahally" <${smtpUser}>`,
              to: userEmail,
              subject: title,
              html: emailBody,
              attachments: metadata.attachments || [],
            });
            results.push({ channel: 'email', status: 'success' });
          }
        } catch (err) {
          console.error('Email notification failed:', err);
          results.push({ channel: 'email', status: 'error', error: err.message });
        }
      }
    }

    // 3. WhatsApp Notification (Placeholder)
    if (channel.includes('whatsapp')) {
      try {
        const phone = metadata.phone;
        if (phone) {
          console.log(`[WhatsApp] Simulation: Sending to ${phone} - "${message}"`);
          results.push({ channel: 'whatsapp', status: 'simulated' });
        }
      } catch (err) {
        results.push({ channel: 'whatsapp', status: 'error', error: err.message });
      }
    }

    return results;
  },

  /**
   * Internal Message Sender
   */
  async sendInternal(userId, senderId, { title, message, type, metadata }) {
    try {
      await persistMessage({
        fromId: senderId || '1', // Dynamic Sender ID, defaults to Admin
        toId: userId,
        text: `🔔 ${title}: ${message}`,
        metadata: { ...metadata, type, isSystem: true }
      });
    } catch (err) {
      console.error('Failed to persist internal notification:', err.message);
    }
  }
};
