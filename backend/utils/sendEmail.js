import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 30000,
});

// transporter.verify((err, success) => {
//   if (err) {
//     console.error('SMTP VERIFY ERROR:', err);
//   } else {
//     console.log('SMTP READY');
//   }
// });

const sendEmail = async (options) => {
  try {

    const mailOptions = {
      from: `Government of India Public Grievance Portal <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('EMAIL SENT:', info.messageId);

    return info;

  } catch (error) {

    console.error('FULL EMAIL ERROR:', error);

    throw error;
  }
};

export default sendEmail;