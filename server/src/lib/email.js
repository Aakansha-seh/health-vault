// Email — Nodemailer over Gmail SMTP (free tier, ~500 emails/day).
//
// Env:
//   GMAIL_USER          the Gmail address that sends mail (e.g. yourclinic@gmail.com)
//   GMAIL_APP_PASSWORD  a Gmail "App password" (Google Account → Security →
//                       2-Step Verification → App passwords). NOT the account password.
//   PORTAL_URL          public URL of the app, used in the invite email
//                       (default: http://localhost:3000)
//
// If the env vars are missing, emailConfigured() is false and callers should
// return a clear error instead of attempting to send.

import nodemailer from 'nodemailer';

export const emailConfigured = () =>
  !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);

let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * Email portal login credentials to a patient.
 * Contains NO medical information — login details only.
 */
export async function sendPatientInvite({ to, patientName, hospitalName, username, tempPassword }) {
  if (!emailConfigured()) {
    throw Object.assign(new Error('Email is not configured on the server (GMAIL_USER / GMAIL_APP_PASSWORD)'), { status: 503 });
  }
  const loginUrl = (process.env.PORTAL_URL || 'http://localhost:3000').replace(/\/+$/, '');

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1f2937">
    <div style="text-align:center;margin-bottom:24px">
      <div style="display:inline-block;background:#1a3c34;color:#fff;border-radius:10px;padding:10px 18px;font-size:18px;font-weight:bold">HealthVault</div>
    </div>
    <h2 style="font-size:18px;color:#1a3c34">You're invited to the ${esc(hospitalName)} patient portal</h2>
    <p style="font-size:14px;line-height:1.6">Hello ${esc(patientName)},</p>
    <p style="font-size:14px;line-height:1.6">
      ${esc(hospitalName)} has created a HealthVault patient account for you.
      You can view your visit history and appointments, and upload your previous
      medical records for your care team to see.
    </p>
    <div style="background:#f4f6f5;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:20px 0">
      <p style="font-size:13px;margin:0 0 8px"><strong>Username:</strong> <code>${esc(username)}</code></p>
      <p style="font-size:13px;margin:0"><strong>Temporary password:</strong> <code>${esc(tempPassword)}</code></p>
    </div>
    <p style="text-align:center;margin:24px 0">
      <a href="${esc(loginUrl)}" style="background:#1a3c34;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:bold;display:inline-block">
        Sign in as Patient
      </a>
    </p>
    <p style="font-size:12px;color:#6b7280;line-height:1.6">
      For your security you will be asked to set a new password the first time you sign in.
      If you did not expect this email, you can ignore it or contact ${esc(hospitalName)}.
    </p>
  </div>`;

  const text =
`Hello ${patientName},

${hospitalName} has created a HealthVault patient account for you.

Username: ${username}
Temporary password: ${tempPassword}

Sign in at: ${loginUrl} (choose "Patient" on the login page)

You will be asked to set a new password on first sign-in.
If you did not expect this email, you can ignore it or contact ${hospitalName}.`;

  await getTransporter().sendMail({
    from: `"${hospitalName} via HealthVault" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Your ${hospitalName} patient portal login`,
    text,
    html,
  });
}
