// SES v2 client singleton + a sendEmail helper (/backend/notifications, /infrastructure/ses). The BFF
// sends via the SES API with its exec-role creds (ses:SendEmail scoped to the env's domain identity) —
// no SMTP credential. From address = SES_FROM_ADDRESS (set by IaC). SES is sandboxed until production
// access is granted: in sandbox, sends to UNVERIFIED recipients fail (caught fail-open by callers).
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

export const ses = new SESv2Client({}); // region + creds from the Lambda runtime

const from = (): string => process.env.SES_FROM_ADDRESS ?? '';

export interface Email {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(email: Email): Promise<void> {
  await ses.send(
    new SendEmailCommand({
      FromEmailAddress: from(),
      Destination: { ToAddresses: [email.to] },
      Content: {
        Simple: {
          Subject: { Data: email.subject, Charset: 'UTF-8' },
          Body: {
            Html: { Data: email.html, Charset: 'UTF-8' },
            Text: { Data: email.text, Charset: 'UTF-8' },
          },
        },
      },
    }),
  );
}
