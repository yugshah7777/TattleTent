import nodemailer from "nodemailer";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");

const transporter = nodemailer.createTransport({

  host: "smtp.gmail.com",

  port: 587,

  secure: false,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  connectionTimeout: 60000,
  greetingTimeout: 60000,
  socketTimeout: 60000,

  tls: {
    rejectUnauthorized: false,
  },

});

const sendEmail = async (options) => {

  try {

    console.log("EMAIL DEBUG");

    const info = await transporter.sendMail({

      from:
        `CivicLedger <${process.env.EMAIL_USER}>`,

      to: options.email,

      subject: options.subject,

      html: options.html,

    });

    console.log(
      "EMAIL SENT:",
      info.messageId
    );

    return info;

  }
  catch(error){

    console.error(
      "FULL SMTP ERROR:",
      error
    );

    throw error;
  }
};

export default sendEmail;