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
//       from: `CivicLedger <${process.env.EMAIL_USER}>`,
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



// Brevo
import SibApiV3Sdk from "sib-api-v3-sdk";

const client = SibApiV3Sdk.ApiClient.instance;

client.authentications["api-key"].apiKey =
  process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendEmail = async (options) => {
  try {

    console.log("===== BREVO EMAIL DEBUG =====");
    console.log("TO:", options.email);
    console.log("SUBJECT:", options.subject);

    const result = await apiInstance.sendTransacEmail({

      sender: {
        name: "CivicLedger",
        email: "yugshah7777@gmail.com"
      },

      to: [
        {
          email: options.email
        }
      ],

      subject: options.subject,

      htmlContent: options.html,

    });

    console.log("BREVO SUCCESS:", result);

    return result;

  } catch (error) {

    console.error("BREVO FAILURE:", error);

    throw new Error(
      error.response?.body?.message ||
      error.message ||
      "Email sending failed"
    );
  }
};

export default sendEmail;