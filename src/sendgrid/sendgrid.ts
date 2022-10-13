import { MailDataRequired } from '@sendgrid/helpers/classes/mail';
import sgMail from '@sendgrid/mail';
import { Config } from '../config';
sgMail.setApiKey(Config.SENDGRID_API_KEY);

class SendGridService {
  constructor() {}

  sendEmail(message: MailDataRequired) {
    return sgMail.send(message);
  }
}

export const sendGridService = new SendGridService();

export function sendNftSoldEmail(email) {
  return sendGridService.sendEmail({
    to: email,
    from: { email: 'hello@skyhitz.io', name: 'Skyhitz' },
    subject: '¡You just sold a music NFT!',
    templateId: 'd-6687be08e2934811b986c23132b548c1',
  });
}

export function sendNftBoughtEmail(email) {
  return sendGridService.sendEmail({
    to: email,
    from: { email: 'hello@skyhitz.io', name: 'Skyhitz' },
    subject: '¡Now you own a music NFT!',
    templateId: 'd-0d6857da22a54950b1350666181393da',
  });
}

export function sendWelcomeEmail(email) {
  return sendGridService.sendEmail({
    to: email,
    from: { email: 'hello@skyhitz.io', name: 'Skyhitz' },
    subject: 'Welcome to Skyhitz',
    templateId: 'd-08b9dce0c7d94526aeee9ec06dc1994d',
  });
}

export async function sendLoginEmail(currentUser, token) {
  return await sendGridService.sendEmail({
    to: currentUser.email,
    from: { email: 'hello@skyhitz.io', name: 'Skyhitz' },
    subject: 'Log In To Your Skyhitz Account',
    templateId: 'd-906d105dea7e43d79d8df30c739137a1',
    personalizations: [
      {
        to: [{ email: currentUser.email }],
        dynamicTemplateData: {
          login_link: `${
            Config.APP_URL
          }/sign-in?token=${token}&uid=${encodeURIComponent(currentUser.id)}`,
        },
      },
    ],
  });
}
