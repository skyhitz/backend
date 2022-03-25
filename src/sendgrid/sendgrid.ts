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

export function sendWelcomeEmail(email) {
  sendGridService.sendEmail({
    to: email,
    from: 'alejandro@skyhitzmusic.com',
    subject: 'Welcome to Skyhitz',
    templateId: 'd-08b9dce0c7d94526aeee9ec06dc1994d',
  });
}

export async function sendLoginEmail(currentUser, token) {
  await sendGridService.sendEmail({
    to: currentUser.email,
    from: 'alejandro@skyhitzmusic.com',
    subject: 'Log In To Your Skyhitz Account',
    templateId: 'd-906d105dea7e43d79d8df30c739137a1',
    personalizations: [
      {
        to: [{ email: currentUser.email }],
        dynamicTemplateData: {
          login_link: `${
            Config.APP_URL
          }/accounts/sign-in?token=${token}&uid=${encodeURIComponent(
            currentUser.id
          )}`,
        },
      },
    ],
  });
}
