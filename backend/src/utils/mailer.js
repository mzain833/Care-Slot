import nodemailer from 'nodemailer';

let transporter; // undefined = not created yet, null = email disabled

function getTransporter() {
  if (transporter !== undefined) return transporter;
  transporter = process.env.SMTP_HOST
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })
    : null;
  return transporter;
}

/** Sends an email, or just logs it when SMTP is not configured (handy in development). */
export async function sendMail({ to, subject, text }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[email disabled] To: ${to}\nSubject: ${subject}\n${text}\n`);
    return;
  }
  await t.sendMail({
    from: process.env.MAIL_FROM || 'CareSlot <no-reply@careslot.local>',
    to,
    subject,
    text,
  });
}
