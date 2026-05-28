// working in localhost but not working after deployment
// import nodemailer from 'nodemailer';

// const sendEmail = async (options) => {
//   try {
//     // Transporter
//     const transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });

//     const mailOptions = {
//       from: `Government of India Public Grievance Portal <${process.env.EMAIL_USER}>`,
//       to: options.email,
//       subject: options.subject,
//       html: options.html,
//     };

//     const info = await transporter.sendMail(mailOptions);
//     console.log('Message sent: %s', info.messageId);

//   } catch (error) {
//     console.error('Error sending email:', error);
//     throw new Error('Email could not be sent.');
//   }
// };

// export default sendEmail;


// using PostMark
import postmark from "postmark";

const client = new postmark.ServerClient(
  process.env.POSTMARK_SERVER_TOKEN
);

const sendEmail = async (options) => {

  try {

    console.log("========== POSTMARK DEBUG ==========");

    console.log("TO:", options.email);

    console.log("SUBJECT:", options.subject);

    const response = await client.sendEmail({

      From:
        "CivicLedger Notifications <shah.20243255@mnnit.ac.in>",

      To:
        options.email,

      Subject:
        options.subject,

      HtmlBody:
        options.html,

      TextBody:
        options.text ||
        "Open this email in HTML mode.",

      MessageStream:
        "outbound"

    });

    console.log(
      "POSTMARK SUCCESS:",
      response
    );

    return response;

  } catch (error) {

    console.error(
      "POSTMARK FAILURE:"
    );

    console.error(error);

    throw new Error(
      error.message ||
      "Email sending failed"
    );
  }
};

export default sendEmail;