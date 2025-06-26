const nodemailer = require('nodemailer');
const pug = require('pug');
const htmltoText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.from = `Zay Minkhant <${process.env.EMAIL_FROM}>`;
    this.url = url;
  }

  newTransporter() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        host: process.env.BRAVO_HOST,
        port: process.env.BROVO_PORT,
        auth: {
          user: process.env.BROVO_USERNAME,
          pass: process.env.BROVO_PASSWORD
        }
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async send(template, subject) {
    // 1 Render HTML from puh template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject
      }
    );

    // 2 Define Mail Option
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmltoText.convert(html)
    };

    await this.newTransporter().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendResetPassword() {
    await this.send(
      'passwordReset',
      'Your Password Reset Token (valid for 10 minutes)'
    );
  }
};
