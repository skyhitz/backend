import sgMail from '@sendgrid/mail';
import { Config } from '../config';
sgMail.setApiKey(Config.SENDGRID_API_KEY);

type SendGridMessage = {
  to: string;
  from: string;
  subject: string;
  html: string;
};

class SendGridService {
  constructor() {}

  sendEmail(message: SendGridMessage) {
    return sgMail.send(message);
  }
}

export const sendGridService = new SendGridService();

export function sendWelcomeEmail(email) {
  const msg = {
    to: email,
    from: 'alejandro@skyhitzmusic.com',
    subject: 'Welcome to Skyhitz',
    html: `<p>Hi,
        <br><p>Thanks for joining Skyhitz, we are on a mission to encourage music creation and production around the world.<br>
        <br>
        <br><br>If you did not sign up for an account, please send us an email.
        <br>
        <br><br>Keep making music, <br>Skyhitz Team</p>`,
  };
  sendGridService.sendEmail(msg);
}
