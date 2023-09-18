const nodemailer = require('nodemailer');
const smtpConfig = require('../app.config.json').smtp;

module.exports = sendEmail;

async function sendEmail({to, subject, html, from = smtpConfig.emailFrom}) {
    const transporter = nodemailer.createTransport(smtpConfig.server);
    await transporter.sendMail({from, to, subject, html});
}
