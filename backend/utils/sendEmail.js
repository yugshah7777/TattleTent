import nodemailer from "nodemailer";
import dns from "node:dns";

// Prefer IPv4 first; this helps on hosts where Gmail IPv6 routes fail.
dns.setDefaultResultOrder("ipv4first");

const SMTP_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.EMAIL_PORT || 587);
const SMTP_SECURE = process.env.EMAIL_SECURE === "true" || SMTP_PORT === 465;
const SMTP_SERVERNAME = process.env.EMAIL_SERVERNAME || SMTP_HOST;
const SMTP_USER = process.env.EMAIL_USER;
const SMTP_PASS = process.env.EMAIL_PASS;
const DEFAULT_FROM = process.env.EMAIL_FROM || SMTP_USER;
const MAX_ATTEMPTS = Number(process.env.EMAIL_RETRY_ATTEMPTS || 3);

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      requireTLS: !SMTP_SECURE,

      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },

      // Force IPv4 and make connection behavior more predictable in production.
      family: 4,

      // Timeouts
      connectionTimeout: Number(process.env.EMAIL_CONNECTION_TIMEOUT || 20000),
      greetingTimeout: Number(process.env.EMAIL_GREETING_TIMEOUT || 20000),
      socketTimeout: Number(process.env.EMAIL_SOCKET_TIMEOUT || 30000),

      // TLS tuning for hosted environments
      tls: {
        servername: SMTP_SERVERNAME,
        rejectUnauthorized: false,
      },

      // Keep it simple and stable
      pool: true,
      maxConnections: 1,
      maxMessages: 100,
    });
  }

  return transporter;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientMailError(error) {
  const code = error?.code || "";
  const message = String(error?.message || "").toLowerCase();

  return (
    [
      "ETIMEDOUT",
      "ESOCKET",
      "ECONNRESET",
      "EAI_AGAIN",
      "ENETUNREACH",
      "ECONNREFUSED",
    ].includes(code) ||
    message.includes("timeout") ||
    message.includes("connect") ||
    message.includes("network") ||
    message.includes("socket")
  );
}

async function sendWithRetry(mailOptions) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const info = await getTransporter().sendMail(mailOptions);
      return info;
    } catch (error) {
      lastError = error;

      console.error(
        `Email send attempt ${attempt} failed:`,
        error?.message || error
      );

      const canRetry = attempt < MAX_ATTEMPTS && isTransientMailError(error);

      if (!canRetry) {
        break;
      }

      // Small exponential backoff
      await sleep(500 * attempt * attempt);
    }
  }

  throw lastError || new Error("Email could not be sent.");
}

const sendEmail = async (options) => {
  if (!options?.email) {
    throw new Error("Recipient email is required.");
  }

  if (!options?.subject) {
    throw new Error("Email subject is required.");
  }

  if (!options?.html && !options?.text) {
    throw new Error("Email content is required.");
  }

  if (!SMTP_USER || !SMTP_PASS) {
    throw new Error("Email credentials are not configured.");
  }

  const mailOptions = {
    from: options.from || DEFAULT_FROM,
    to: options.email,
    subject: options.subject,
    html: options.html,
    text: options.text,
  };

  try {
    console.log("EMAIL DEBUG");
    console.log("HOST:", SMTP_HOST);
    console.log("PORT:", SMTP_PORT);
    console.log("USER:", SMTP_USER);
    console.log("TO:", options.email);

    const info = await sendWithRetry(mailOptions);

    console.log("EMAIL SENT:", info.messageId);
    return info;
  } catch (error) {
    console.error("FULL SMTP ERROR:", error);
    throw new Error(error?.message || "Email could not be sent.");
  }
};

export default sendEmail;