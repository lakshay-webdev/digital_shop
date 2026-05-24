// utils/sendEmail.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

const templates = {
  welcome: ({ name, verifyUrl }) => ({
    subject: "Welcome to DigiSho 🛍️",
    html: `<h2>Hi ${name}!</h2><p>Welcome to DigiSho. <a href="${verifyUrl}">Verify your email</a>.</p>`,
  }),
  orderConfirm: ({ name, order }) => ({
    subject: `Order Confirmed #${order.orderId}`,
    html: `<h2>Hi ${name},</h2><p>Your order <strong>#${order.orderId}</strong> has been placed! Total: ₹${order.totalAmount.toLocaleString("en-IN")}.</p>`,
  }),
  orderStatus: ({ name, status, orderId, trackingNumber }) => ({
    subject: `Order Update #${orderId}`,
    html: `<h2>Hi ${name},</h2><p>Your order <strong>#${orderId}</strong> is now <strong>${status.replace("_"," ")}</strong>. ${trackingNumber ? `Tracking: ${trackingNumber}` : ""}</p>`,
  }),
  reset: ({ name, resetUrl }) => ({
    subject: "Reset Your DigiSho Password",
    html: `<h2>Hi ${name},</h2><p><a href="${resetUrl}">Click here</a> to reset your password. Valid for 30 minutes.</p>`,
  }),
};

const sendEmail = async ({ to, subject, template, data, html }) => {
  const content = template && templates[template] ? templates[template](data) : { subject, html };
  await transporter.sendMail({
    from:    `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to,
    subject: content.subject || subject,
    html:    content.html    || html,
  });
};

module.exports = sendEmail;
