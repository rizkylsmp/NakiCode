import nodemailer from 'nodemailer';
import { config } from './config';

// Brand colors matching email templates
const COLORS = {
  primary: '#1a1a2e',
  secondary: '#0f3460',
  accent: '#16213e',
  frost: '#f8f9fa',
  steel: '#e9ecef',
  smoke: '#6c757d',
  success: '#28a745',
  white: '#ffffff',
};

type SendVerificationOtpEmailInput = {
  email: string;
  username: string;
  otp: string;
};

let transporter: ReturnType<typeof createTransporter> | null = null;

export async function sendClientOrderInvitation(input: { email: string; name: string; projectTitle: string; url: string; existingAccount: boolean; language: "id" | "en" }) {
  const from = formatFromAddress();
  if (!from) throw new Error('SMTP sender is not configured');
  const en = input.language === "en";
  const title = en ? "Your Naki Code order" : "Pesanan Naki Code untukmu";
  const message = input.existingAccount
    ? (en ? "Sign in to your existing account to view this order. Your password has not changed." : "Login ke akun yang sudah terdaftar untuk melihat pesanan ini. Password tidak berubah.")
    : (en ? "Set a password to create your account and track this order. This private, single-use invitation expires in 72 hours. Do not share it." : "Buat password untuk membuat akun dan melacak pesanan ini. Undangan pribadi ini berlaku 72 jam dan hanya bisa digunakan sekali. Jangan bagikan tautannya.");
  const action = en ? "View order" : "Lihat pesanan";
  await getTransporter().sendMail({ from, to: input.email, subject: `${title} — ${input.projectTitle}`,
    text: `${input.name}\n\n${input.projectTitle}\n\n${message}\n\n${input.url}`,
    html: `<html lang="${input.language}"><body style="font-family:Arial,sans-serif;color:#172033"><main style="max-width:600px;margin:auto;padding:24px"><h1>${title}</h1><p>${escapeHtml(input.name)},</p><h2>${escapeHtml(input.projectTitle)}</h2><p>${message}</p><a href="${escapeHtml(input.url)}">${action}</a></main></body></html>` });
}

export async function sendOrderEmail(input: {
  email: string; subject: string; customerName: string; title: string;
  details: string; message: string; url: string;
  attachment?: { filename: string; content: Buffer };
}) {
  const from = formatFromAddress();
  if (!from) throw new Error('SMTP sender is not configured');
  await getTransporter().sendMail({
    from, to: input.email, subject: input.subject,
    text: [`Halo ${input.customerName},`, input.title, input.details, input.message, `Lihat pesanan: ${input.url}`].join('\n\n'),
    html: `<html lang="id"><body style="margin:0;background:${COLORS.frost};font-family:Arial,sans-serif;color:${COLORS.primary}"><div style="max-width:600px;margin:0 auto;background:${COLORS.white}"><div style="padding:24px;background:${COLORS.primary};color:${COLORS.white};font-size:24px;font-weight:bold">NAKI CODE</div><div style="padding:28px 24px"><h1 style="font-size:22px">${escapeHtml(input.title)}</h1><p>Halo ${escapeHtml(input.customerName)},</p><div style="padding:16px;background:${COLORS.frost};line-height:1.7">${escapeHtml(input.details).replace(/\n/g, '<br>')}</div><p style="line-height:1.7">${escapeHtml(input.message)}</p><a href="${escapeHtml(input.url)}" style="display:inline-block;padding:14px 20px;background:${COLORS.secondary};color:${COLORS.white};border-radius:8px;text-decoration:none">Lihat pesanan</a><p style="font-size:12px;color:${COLORS.smoke};margin-top:24px">${input.attachment ? 'Invoice PDF terlampir. ' : ''}Pembayaran hanya dilakukan dari akun Naki Code milikmu.</p></div></div></body></html>`,
    attachments: input.attachment ? [{ ...input.attachment, contentType: 'application/pdf' }] : [],
  });
}

export async function sendVerificationOtpEmail({
  email,
  username,
  otp,
}: SendVerificationOtpEmailInput) {
  const fromAddress = formatFromAddress();

  if (!fromAddress) {
    throw new Error('SMTP sender is not configured');
  }

  await getTransporter().sendMail({
    from: fromAddress,
    to: email,
    subject: 'OTP verifikasi email Naki Code',
    text: buildVerificationText(username, otp),
    html: buildVerificationHtml(username, otp),
  });
}

export async function sendPasswordResetOtpEmail({
  email,
  username,
  otp,
}: SendVerificationOtpEmailInput) {
  const fromAddress = formatFromAddress();

  if (!fromAddress) {
    throw new Error('SMTP sender is not configured');
  }

  await getTransporter().sendMail({
    from: fromAddress,
    to: email,
    subject: 'OTP reset password Naki Code',
    text: buildPasswordResetText(username, otp),
    html: buildPasswordResetHtml(username, otp),
  });
}

export async function sendGoogleAccountLinkedEmail({
  email,
  username,
}: Omit<SendVerificationOtpEmailInput, 'otp'>) {
  const fromAddress = formatFromAddress();

  if (!fromAddress) {
    throw new Error('SMTP sender is not configured');
  }

  const linkedAt = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date());
  const safeUsername = escapeHtml(username);

  await getTransporter().sendMail({
    from: fromAddress,
    to: email,
    subject: 'Akun Google terhubung ke Naki Code',
    text: [
      `Halo ${username},`,
      '',
      'Akun Google berhasil dihubungkan ke akun Naki Code kamu.',
      `Waktu: ${linkedAt} WIB`,
      '',
      'Jika kamu tidak melakukan ini, segera reset password dan hubungi Naki Code.',
    ].join('\n'),
    html: `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Akun Google Terhubung</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:${COLORS.frost};color:${COLORS.primary}">
  <div style="max-width:600px;margin:0 auto;background:${COLORS.white}">
    <div style="background:${COLORS.primary};padding:32px 24px;text-align:center"><h1 style="font-size:28px;color:${COLORS.white};margin:0">NAKI CODE</h1></div>
    <div style="padding:40px 24px">
      <h2 style="font-size:24px;margin:0 0 16px">Akun Google berhasil terhubung</h2>
      <p style="font-size:16px;line-height:1.6">Halo <strong>${safeUsername}</strong>, akun Google baru saja dihubungkan ke akun Naki Code kamu.</p>
      <div style="background:${COLORS.frost};border-left:4px solid ${COLORS.secondary};padding:16px;margin:24px 0;border-radius:4px"><strong>Waktu:</strong> ${linkedAt} WIB</div>
      <p style="font-size:16px;line-height:1.6">Jika kamu tidak melakukan ini, segera reset password dan hubungi Naki Code.</p>
    </div>
  </div>
</body>
</html>`.trim(),
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    };

    return entities[character] ?? character;
  });
}

function createTransporter() {
  if (!config.smtp.host || !config.smtp.user || !config.smtp.password) {
    throw new Error('SMTP configuration is incomplete');
  }

  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.password,
    },
  });
}

function getTransporter() {
  if (!transporter) {
    transporter = createTransporter();
  }

  return transporter;
}

function formatFromAddress() {
  if (!config.smtp.fromEmail) {
    return '';
  }

  return config.smtp.fromName
    ? `${config.smtp.fromName} <${config.smtp.fromEmail}>`
    : config.smtp.fromEmail;
}

function buildVerificationText(username: string, otp: string) {
  return [
    `Halo ${username},`,
    '',
    'OTP verifikasi email Naki Code kamu adalah:',
    otp,
    '',
    `Kode ini berlaku selama ${config.verification.otpTtlMinutes} menit.`,
    'Jika kamu tidak meminta ini, abaikan pesan ini.',
  ].join('\n');
}

function buildVerificationHtml(username: string, otp: string) {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifikasi Email - Naki Code</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:${COLORS.frost};color:${COLORS.primary}">
  <div style="max-width:600px;margin:0 auto;background-color:${COLORS.white}">
    <div style="background-color:${COLORS.primary};padding:32px 24px;text-align:center">
      <h1 style="font-size:28px;font-weight:800;color:${COLORS.white};margin:0;letter-spacing:-0.5px">NAKI CODE</h1>
    </div>
    <div style="padding:40px 24px">
      <h2 style="font-size:24px;font-weight:700;color:${COLORS.primary};margin:0 0 16px 0">Verifikasi Email Anda</h2>
      <p style="font-size:16px;line-height:1.6;color:${COLORS.primary};margin:0 0 16px 0">
        Halo <strong>${username}</strong>,
      </p>
      <p style="font-size:16px;line-height:1.6;color:${COLORS.primary};margin:0 0 16px 0">
        Terima kasih sudah mendaftar di Naki Code! Masukkan kode OTP di bawah ini untuk memverifikasi email Anda:
      </p>
      <div style="text-align:center;margin:32px 0">
        <div style="display:inline-block;padding:20px 32px;border-radius:12px;background-color:${COLORS.frost};border:2px solid ${COLORS.steel}">
          <div style="font-size:36px;font-weight:800;letter-spacing:8px;color:${COLORS.primary}">${otp}</div>
        </div>
      </div>
      <div style="background-color:${COLORS.frost};border-left:4px solid ${COLORS.secondary};padding:16px;margin:16px 0;border-radius:4px">
        <p style="font-size:14px;line-height:1.6;color:${COLORS.primary};margin:0">
          ⏱️ <strong>Penting:</strong> Kode ini berlaku selama <strong>${config.verification.otpTtlMinutes} menit</strong>.
        </p>
      </div>
      <p style="font-size:16px;line-height:1.6;color:${COLORS.primary};margin:24px 0 16px 0">
        Jika Anda tidak meminta kode ini, abaikan email ini. Akun Anda tetap aman.
      </p>
      <div style="height:1px;background-color:${COLORS.steel};margin:24px 0"></div>
      <p style="font-size:14px;color:${COLORS.smoke};margin:8px 0">
        <strong>Tips Keamanan:</strong><br>
        • Jangan bagikan kode OTP kepada siapa pun<br>
        • Naki Code tidak akan pernah meminta OTP melalui telepon atau chat<br>
        • Waspada terhadap upaya phishing
      </p>
      <p style="font-size:16px;line-height:1.6;color:${COLORS.primary};margin:24px 0 0 0">
        Salam,<br>
        <strong>Tim Naki Code</strong>
      </p>
    </div>
    <div style="background-color:${COLORS.frost};padding:24px;text-align:center;border-top:1px solid ${COLORS.steel}">
      <p style="font-size:14px;color:${COLORS.smoke};margin:8px 0">&copy; ${new Date().getFullYear()} Naki Code. Jasa pembuatan website & source code design.</p>
      <p style="font-size:14px;color:${COLORS.smoke};margin:8px 0">Email ini dikirim secara otomatis. Jangan balas email ini.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function buildPasswordResetText(username: string, otp: string) {
  return [
    `Halo ${username},`,
    '',
    'OTP reset password Naki Code kamu adalah:',
    otp,
    '',
    `Kode ini berlaku selama ${config.verification.passwordResetOtpTtlMinutes} menit.`,
    'Jika kamu tidak meminta reset password, abaikan pesan ini.',
  ].join('\n');
}

function buildPasswordResetHtml(username: string, otp: string) {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password - Naki Code</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:${COLORS.frost};color:${COLORS.primary}">
  <div style="max-width:600px;margin:0 auto;background-color:${COLORS.white}">
    <div style="background-color:${COLORS.primary};padding:32px 24px;text-align:center">
      <h1 style="font-size:28px;font-weight:800;color:${COLORS.white};margin:0;letter-spacing:-0.5px">NAKI CODE</h1>
    </div>
    <div style="padding:40px 24px">
      <h2 style="font-size:24px;font-weight:700;color:${COLORS.primary};margin:0 0 16px 0">Reset Password Anda</h2>
      <p style="font-size:16px;line-height:1.6;color:${COLORS.primary};margin:0 0 16px 0">
        Halo <strong>${username}</strong>,
      </p>
      <p style="font-size:16px;line-height:1.6;color:${COLORS.primary};margin:0 0 16px 0">
        Kami menerima permintaan untuk mereset password akun Naki Code Anda. Masukkan kode OTP di bawah ini untuk melanjutkan:
      </p>
      <div style="text-align:center;margin:32px 0">
        <div style="display:inline-block;padding:20px 32px;border-radius:12px;background-color:${COLORS.frost};border:2px solid ${COLORS.steel}">
          <div style="font-size:36px;font-weight:800;letter-spacing:8px;color:${COLORS.primary}">${otp}</div>
        </div>
      </div>
      <div style="background-color:${COLORS.frost};border-left:4px solid ${COLORS.secondary};padding:16px;margin:16px 0;border-radius:4px">
        <p style="font-size:14px;line-height:1.6;color:${COLORS.primary};margin:0">
          ⏱️ <strong>Penting:</strong> Kode ini berlaku selama <strong>${config.verification.passwordResetOtpTtlMinutes} menit</strong>.
        </p>
      </div>
      <p style="font-size:16px;line-height:1.6;color:${COLORS.primary};margin:24px 0 16px 0">
        Jika Anda tidak meminta reset password, abaikan email ini. Password Anda tidak akan berubah.
      </p>
      <div style="height:1px;background-color:${COLORS.steel};margin:24px 0"></div>
      <p style="font-size:14px;color:${COLORS.smoke};margin:8px 0">
        <strong>Tips Keamanan:</strong><br>
        • Gunakan password yang kuat (minimal 8 karakter)<br>
        • Kombinasikan huruf besar, huruf kecil, angka, dan simbol<br>
        • Jangan gunakan password yang sama dengan akun lain<br>
        • Jangan bagikan kode OTP kepada siapa pun
      </p>
      <p style="font-size:16px;line-height:1.6;color:${COLORS.primary};margin:24px 0 0 0">
        Salam,<br>
        <strong>Tim Naki Code</strong>
      </p>
    </div>
    <div style="background-color:${COLORS.frost};padding:24px;text-align:center;border-top:1px solid ${COLORS.steel}">
      <p style="font-size:14px;color:${COLORS.smoke};margin:8px 0">&copy; ${new Date().getFullYear()} Naki Code. Jasa pembuatan website & source code design.</p>
      <p style="font-size:14px;color:${COLORS.smoke};margin:8px 0">Email ini dikirim secara otomatis. Jangan balas email ini.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
