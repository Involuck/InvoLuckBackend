import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_MAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});


  // Define the email options
  const mailOptions = {
    from: process.env.SMTP_MAIL,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // Send the email
  await transporter.sendMail(mailOptions);
};

export default sendEmail;
