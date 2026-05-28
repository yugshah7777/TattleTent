import nodemailer from "nodemailer";

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
    family: 4
  }

});

const sendEmail = async (options) => {

  try {

    console.log("============== EMAIL DEBUG ==============");

    console.log(
      "EMAIL_USER:",
      process.env.EMAIL_USER
    );

    console.log(
      "EMAIL_PASS EXISTS:",
      !!process.env.EMAIL_PASS
    );

    console.log(
      "TO:",
      options.email
    );

    console.log(
      "SUBJECT:",
      options.subject
    );

    const info =
      await transporter.sendMail({

        from:
          `CivicLedger <${process.env.EMAIL_USER}>`,

        to: options.email,

        subject: options.subject,

        html: options.html,

      });

    console.log(
      "EMAIL SENT SUCCESSFULLY:"
    );

    console.log(
      info.messageId
    );

    return info;

  }

  catch(error){

    console.error(
      "FULL SMTP ERROR:"
    );

    console.error(error);

    throw error;
  }
};

export default sendEmail;