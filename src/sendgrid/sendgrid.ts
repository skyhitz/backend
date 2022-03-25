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
  sendGridService.sendEmail({to: email, from: 'alejandro@skyhitzmusic.com', subject: 'Welcome to Skyhitz', templateId: 'd-08b9dce0c7d94526aeee9ec06dc1994d'});
}

export async function sendLoginEmail(currentUser, token) {
  const msg = {
    to: currentUser.email,
    from: 'alejandro@skyhitzmusic.com',
    subject: 'Skyhitz Login Link',
    html: `<p>Hi,
        <br><p>You are receiving this email because you have requested access to your Skyhitz account.<br>
        Please click this link to complete the process:<br><br>
        <strong><a clicktracking=off href="${
          Config.APP_URL
        }/accounts/sign-in?token=${token}&uid=${encodeURIComponent(
      currentUser.id
    )}">Sign In Here</a></strong>
        <br><br>If you did not request this, please ignore this email and let us know if your account was compromised.
        <br><br>Keep making music, <br>Skyhitz Team</p>`,
  };

  await sendGridService.sendEmail(msg);
}
