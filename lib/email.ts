import { Resend } from "resend";
import { env } from "./env";

let client: Resend | null = null;

function getClient(): Resend {
  if (!client) client = new Resend(env().RESEND_API_KEY);
  return client;
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
}

async function send({ to, subject, html, text }: SendArgs) {
  const { error } = await getClient().emails.send({
    from: env().EMAIL_FROM,
    to,
    subject,
    html,
    text,
  });
  if (error) throw new Error(`Resend send failed: ${error.message}`);
}

const baseStyle = `font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; color: #0B0B0F; line-height: 1.55;`;

function shell(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#FAFAF7"><table role="presentation" style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:32px;${baseStyle}"><tr><td><h1 style="margin:0 0 16px;font-size:20px;letter-spacing:-0.01em">${title}</h1>${body}<p style="margin-top:32px;color:#888;font-size:12px">— WeSchedule</p></td></tr></table></body></html>`;
}

export async function sendVerifyEmail(args: { to: string; name: string; token: string }) {
  const url = `${env().APP_URL}/verify?token=${encodeURIComponent(args.token)}`;
  const body = `<p>Hi ${args.name || "there"},</p><p>Confirm your email to activate your WeSchedule account:</p><p style="margin:24px 0"><a href="${url}" style="background:#3B82F6;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:500">Verify email</a></p><p style="font-size:13px;color:#666">Or paste this link in your browser:<br><span style="word-break:break-all">${url}</span></p><p style="font-size:13px;color:#666">This link expires in 24 hours.</p>`;
  await send({
    to: args.to,
    subject: "Verify your WeSchedule email",
    html: shell("Verify your email", body),
    text: `Verify your email: ${url}`,
  });
}

export async function sendPasswordReset(args: { to: string; name: string; token: string }) {
  const url = `${env().APP_URL}/reset?token=${encodeURIComponent(args.token)}`;
  const body = `<p>Hi ${args.name || "there"},</p><p>You asked to reset your WeSchedule password.</p><p style="margin:24px 0"><a href="${url}" style="background:#3B82F6;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:500">Reset password</a></p><p style="font-size:13px;color:#666">If you didn't ask, ignore this email. The link expires in 1 hour.</p>`;
  await send({
    to: args.to,
    subject: "Reset your WeSchedule password",
    html: shell("Reset your password", body),
    text: `Reset your password: ${url}`,
  });
}

export async function sendBookingConfirmedToGuest(args: {
  to: string;
  guestName: string;
  hostName: string;
  eventTitle: string;
  startUtc: Date;
  manageUrl: string;
  meetLink?: string | null;
}) {
  const when = args.startUtc.toUTCString();
  const meet = args.meetLink
    ? `<p>Meet link: <a href="${args.meetLink}">${args.meetLink}</a></p>`
    : "";
  const body = `<p>Hi ${args.guestName},</p><p>Your booking with ${args.hostName} is confirmed.</p><p><strong>${args.eventTitle}</strong><br>${when}</p>${meet}<p>Need to change plans? <a href="${args.manageUrl}">Reschedule or cancel</a>.</p>`;
  await send({
    to: args.to,
    subject: `Booking confirmed: ${args.eventTitle}`,
    html: shell("Your booking is confirmed", body),
    text: `Your booking with ${args.hostName} is confirmed: ${args.eventTitle} at ${when}. Manage: ${args.manageUrl}`,
  });
}

export async function sendBookingNotificationToHost(args: {
  to: string;
  hostName: string;
  guestName: string;
  guestEmail: string;
  eventTitle: string;
  startUtc: Date;
}) {
  const when = args.startUtc.toUTCString();
  const body = `<p>Hi ${args.hostName},</p><p>New booking on your calendar.</p><p><strong>${args.eventTitle}</strong><br>${when}<br>${args.guestName} &lt;${args.guestEmail}&gt;</p>`;
  await send({
    to: args.to,
    subject: `New booking: ${args.guestName} — ${args.eventTitle}`,
    html: shell("New booking", body),
    text: `New booking: ${args.guestName} <${args.guestEmail}> — ${args.eventTitle} at ${when}`,
  });
}

export async function sendBookingCancelled(args: {
  to: string;
  recipientName: string;
  eventTitle: string;
  startUtc: Date;
  reason?: string;
}) {
  const when = args.startUtc.toUTCString();
  const body = `<p>Hi ${args.recipientName},</p><p>The booking <strong>${args.eventTitle}</strong> at ${when} has been cancelled.</p>${args.reason ? `<p style="color:#666">${args.reason}</p>` : ""}`;
  await send({
    to: args.to,
    subject: `Booking cancelled: ${args.eventTitle}`,
    html: shell("Booking cancelled", body),
    text: `Booking cancelled: ${args.eventTitle} at ${when}.`,
  });
}
