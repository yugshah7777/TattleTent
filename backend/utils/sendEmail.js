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


// using Resend email instead of SMTP of Gmail
import { Resend } from "resend";

const resend = new Resend(
  process.env.RESEND_API_KEY
);

const sendEmail = async (options) => {

  try {

    if (!options?.email) {
      throw new Error(
        "Recipient email required"
      );
    }

    const response =
      await resend.emails.send({

        from:
          process.env.EMAIL_FROM ||
          "onboarding@resend.dev",

        to: options.email,

        subject: options.subject,

        html: options.html,

      });

    console.log(
      "EMAIL SENT:",
      response
    );

    return response;

  }
  catch(error){

    console.error(
      "EMAIL ERROR:",
      error
    );

    throw new Error(
      error.message ||
      "Email send failed"
    );
  }
};

export default sendEmail;