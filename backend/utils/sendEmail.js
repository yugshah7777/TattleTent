import nodemailer from "nodemailer";
import dns from "node:dns/promises";

const SMTP_HOSTNAME = process.env.EMAIL_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.EMAIL_PORT || 587);
const SMTP_USER = process.env.EMAIL_USER;
const SMTP_PASS = process.env.EMAIL_PASS;
const SMTP_FROM = process.env.EMAIL_FROM || SMTP_USER;

const CONNECTION_TIMEOUT = Number(process.env.EMAIL_CONNECTION_TIMEOUT || 30000);
const GREETING_TIMEOUT = Number(process.env.EMAIL_GREETING_TIMEOUT || 30000);
const SOCKET_TIMEOUT = Number(process.env.EMAIL_SOCKET_TIMEOUT || 30000);
const MAX_ATTEMPTS = Number(process.env.EMAIL_RETRY_ATTEMPTS || 3);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientError(error) {
  const code = String(error?.code || "");
  const message = String(error?.message || "").toLowerCase();

  return (
    ["ETIMEDOUT", "ESOCKET", "ECONNRESET", "EAI_AGAIN", "ENETUNREACH", "ECONNREFUSED"].includes(code) ||
    message.includes("timeout") ||
    message.includes("socket") ||
    message.includes("connect") ||
    message.includes("network")
  );
}

async function resolveIpv4Hosts(hostname) {
  try {
    const ips = await dns.resolve4(hostname);
    return [...new Set(ips)];
  } catch (error) {
    console.warn(`IPv4 DNS resolution failed for ${hostname}:`, error?.message || error);
    return [];
  }
}

function createTransport(host) {
  return nodemailer.createTransport({
    host,
    port: SMTP_PORT,
    secure: false,
    requireTLS: true,
    family: 4,

    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },

    tls: {
      servername: SMTP_HOSTNAME,
      rejectUnauthorized: false,
    },

    authMethod: "LOGIN",

    connectionTimeout: CONNECTION_TIMEOUT,
    greetingTimeout: GREETING_TIMEOUT,
    socketTimeout: SOCKET_TIMEOUT,

    pool: false,
  });
}

async function sendThroughHost(host, mailOptions) {
  const transporter = createTransport(host);
  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } finally {
    if (typeof transporter.close === "function") {
      transporter.close();
    }
  }
}

async function sendWithRetry(mailOptions) {
  const ipv4Hosts = await resolveIpv4Hosts(SMTP_HOSTNAME);
  const candidateHosts = ipv4Hosts.length > 0 ? ipv4Hosts : [SMTP_HOSTNAME];

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    for (const host of candidateHosts) {
      try {
        console.log(`SMTP attempt ${attempt}/${MAX_ATTEMPTS} via ${host}:${SMTP_PORT}`);

        const info = await sendThroughHost(host, mailOptions);
        return info;
      } catch (error) {
        lastError = error;
        console.error(`SMTP failure via ${host}:`, error?.message || error);

        if (!isTransientError(error)) {
          throw error;
        }
      }
    }

    if (attempt < MAX_ATTEMPTS) {
      await sleep(500 * attempt * attempt);
    }
  }

  throw lastError || new Error("Email could not be sent.");
}

const sendEmail = async (options) => {
  if (!SMTP_USER || !SMTP_PASS) {
    throw new Error("Email credentials are not configured.");
  }

  if (!options?.email) {
    throw new Error("Recipient email is required.");
  }

  if (!options?.subject) {
    throw new Error("Email subject is required.");
  }

  if (!options?.html && !options?.text) {
    throw new Error("Email content is required.");
  }

  const mailOptions = {
    from: options.from || `Government of India Public Grievance Portal <${SMTP_FROM}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
    text: options.text,
  };

  try {
    console.log("EMAIL DEBUG");
    console.log("SMTP HOST:", SMTP_HOSTNAME);
    console.log("SMTP PORT:", SMTP_PORT);
    console.log("EMAIL USER:", SMTP_USER);
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