import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, // e.g., smtp.gmail.com
    port: process.env.SMTP_PORT, // e.g., 587
    service: process.env.SMTP_SERVICE, // e.g., "gmail"
    auth: {
      user: process.env.SMTP_MAIL, // your email
      pass: process.env.SMTP_PASSWORD, // your email password or app password
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
