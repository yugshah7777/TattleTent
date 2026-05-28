/**
 * Email branding constants for CivicLedger Notification System.
 *
 * Centralizes all email brand-related values so they can be updated
 * without hunting through multiple files.
 */

export const EMAIL_BRAND_NAME = "CivicLedger";
export const EMAIL_SENDER_NAME = "CivicLedger Notifications";
export const EMAIL_FOOTER_NAME = "CivicLedger Team";

/**
 * Base URL of the frontend application.
 * Must be set via environment variable or defaults to localhost.
 */
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * Standard email footer used in all transactional emails.
 */
export const getEmailFooter = () =>
  `<p style="font-size: 12px; color: #888888; border-top: 1px solid #dddddd; padding-top: 10px; margin-top: 20px;">
    —<br/>
    ${EMAIL_FOOTER_NAME}
  </p>`;