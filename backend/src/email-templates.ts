/**
 * Professional email templates for Naki Code
 * Uses inline CSS for maximum email client compatibility
 */

// Brand colors (matching frontend theme)
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

/**
 * Base email HTML wrapper
 * Provides consistent structure for all email templates
 */
function baseEmailTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Naki Code</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: ${COLORS.frost};
      color: ${COLORS.primary};
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: ${COLORS.white};
    }
    .email-header {
      background-color: ${COLORS.primary};
      padding: 32px 24px;
      text-align: center;
    }
    .email-logo {
      font-size: 28px;
      font-weight: 800;
      color: ${COLORS.white};
      margin: 0;
      letter-spacing: -0.5px;
    }
    .email-body {
      padding: 40px 24px;
    }
    .email-title {
      font-size: 24px;
      font-weight: 700;
      color: ${COLORS.primary};
      margin: 0 0 16px 0;
    }
    .email-text {
      font-size: 16px;
      line-height: 1.6;
      color: ${COLORS.primary};
      margin: 0 0 16px 0;
    }
    .email-button {
      display: inline-block;
      padding: 14px 28px;
      background-color: ${COLORS.secondary};
      color: ${COLORS.white};
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 16px 0;
    }
    .email-footer {
      background-color: ${COLORS.frost};
      padding: 24px;
      text-align: center;
      border-top: 1px solid ${COLORS.steel};
    }
    .email-footer-text {
      font-size: 14px;
      color: ${COLORS.smoke};
      margin: 8px 0;
    }
    .email-divider {
      height: 1px;
      background-color: ${COLORS.steel};
      margin: 24px 0;
    }
    .highlight-box {
      background-color: ${COLORS.frost};
      border-left: 4px solid ${COLORS.secondary};
      padding: 16px;
      margin: 16px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1 class="email-logo">NAKI CODE</h1>
    </div>
    ${content}
    <div class="email-footer">
      <p class="email-footer-text">Â© ${new Date().getFullYear()} Naki Code. Toko template coding & jasa custom website.</p>
      <p class="email-footer-text">Email ini dikirim secara otomatis. Jangan balas email ini.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Welcome email template
 * Sent when a new user successfully registers
 */
export interface WelcomeEmailData {
  username: string;
  email: string;
  verificationUrl?: string;
}

export function generateWelcomeEmail(data: WelcomeEmailData): string {
  const content = `
    <div class="email-body">
      <h2 class="email-title">Selamat Datang di Naki Code! ðŸŽ‰</h2>
      
      <p class="email-text">
        Halo <strong>${data.username}</strong>,
      </p>
      
      <p class="email-text">
        Terima kasih sudah bergabung dengan Naki Code! Kami senang kamu menjadi bagian dari komunitas developer kami.
      </p>
      
      <div class="highlight-box">
        <p class="email-text" style="margin: 0;">
          <strong>Username:</strong> ${data.username}<br>
          <strong>Email:</strong> ${data.email}
        </p>
      </div>
      
      ${data.verificationUrl ? `
        <p class="email-text">
          Untuk mengaktifkan akun kamu, silakan klik tombol verifikasi di bawah ini:
        </p>
        
        <div style="text-align: center; margin: 24px 0;">
          <a href="${data.verificationUrl}" class="email-button">
            Verifikasi Email
          </a>
        </div>
        
        <p class="email-text" style="font-size: 14px; color: ${COLORS.smoke};">
          Atau copy-paste link ini ke browser:<br>
          <a href="${data.verificationUrl}" style="color: ${COLORS.secondary};">${data.verificationUrl}</a>
        </p>
      ` : `
        <p class="email-text">
          Akun kamu sudah aktif dan siap digunakan! ðŸš€
        </p>
      `}
      
      <div class="email-divider"></div>
      
      <p class="email-text">
        <strong>Apa yang bisa kamu lakukan di Naki Code?</strong>
      </p>
      
      <ul style="font-size: 16px; line-height: 1.8; color: ${COLORS.primary};">
        <li>Jelajahi template siap pakai untuk berbagai kebutuhan</li>
        <li>Beli template berkualitas dengan harga terjangkau</li>
        <li>Pesan jasa custom website sesuai kebutuhan</li>
        <li>Akses dokumentasi dan tutorial coding</li>
      </ul>
      
      <p class="email-text">
        Kalau ada pertanyaan, jangan ragu untuk menghubungi kami!
      </p>
      
      <p class="email-text">
        Salam,<br>
        <strong>Tim Naki Code</strong>
      </p>
    </div>
  `;
  
  return baseEmailTemplate(content);
}

/**
 * Password reset email template
 * Sent when user requests password reset
 */
export interface PasswordResetEmailData {
  username: string;
  resetUrl: string;
  expiresInMinutes?: number;
}

export function generatePasswordResetEmail(data: PasswordResetEmailData): string {
  const expiryText = data.expiresInMinutes 
    ? `Link ini valid selama ${data.expiresInMinutes} menit.` 
    : 'Link ini valid untuk satu kali penggunaan.';
  
  const content = `
    <div class="email-body">
      <h2 class="email-title">Reset Password Akun Anda</h2>
      
      <p class="email-text">
        Halo <strong>${data.username}</strong>,
      </p>
      
      <p class="email-text">
        Kami menerima permintaan untuk mereset password akun Naki Code Anda. Jika Anda yang melakukan permintaan ini, silakan klik tombol di bawah untuk membuat password baru.
      </p>
      
      <div style="text-align: center; margin: 24px 0;">
        <a href="${data.resetUrl}" class="email-button">
          Reset Password
        </a>
      </div>
      
      <p class="email-text" style="font-size: 14px; color: ${COLORS.smoke};">
        Atau copy-paste link ini ke browser:<br>
        <a href="${data.resetUrl}" style="color: ${COLORS.secondary};">${data.resetUrl}</a>
      </p>
      
      <div class="highlight-box">
        <p class="email-text" style="margin: 0; font-size: 14px;">
          ?? <strong>Penting:</strong> ${expiryText}
        </p>
      </div>
      
      <p class="email-text" style="margin-top: 24px;">
        Jika Anda tidak meminta reset password, abaikan email ini. Password Anda tidak akan berubah.
      </p>
      
      <div class="email-divider"></div>
      
      <p class="email-text" style="font-size: 14px; color: ${COLORS.smoke};">
        <strong>Tips Keamanan:</strong><br>
        • Gunakan password yang kuat (minimal 8 karakter)<br>
        • Kombinasikan huruf besar, huruf kecil, angka, dan simbol<br>
        • Jangan gunakan password yang sama dengan akun lain
      </p>
      
      <p class="email-text">
        Salam,<br>
        <strong>Tim Naki Code</strong>
      </p>
    </div>
  `;
  
  return baseEmailTemplate(content);
}

/**
 * Order confirmation email template
 * Sent when customer places an order for a template
 */
export interface OrderConfirmationEmailData {
  orderNumber: string;
  customerName: string;
  templateName: string;
  templatePrice: string;
  orderDate: string;
  paymentStatus: 'pending' | 'paid' | 'confirmed';
  paymentMethod?: string;
  downloadUrl?: string;
  orderUrl: string;
}

export function generateOrderConfirmationEmail(data: OrderConfirmationEmailData): string {
  const isPaid = data.paymentStatus === 'paid' || data.paymentStatus === 'confirmed';
  const statusColor = isPaid ? COLORS.success : COLORS.secondary;
  const statusText = isPaid ? '? Pembayaran Berhasil' : '? Menunggu Pembayaran';
  
  const content = `
    <div class="email-body">
      <h2 class="email-title">Terima Kasih atas Pesanan Anda!</h2>
      
      <p class="email-text">
        Halo <strong>${data.customerName}</strong>,
      </p>
      
      <p class="email-text">
        Pesanan Anda telah kami terima. Berikut adalah detail pesanan Anda:
      </p>
      
      <div class="highlight-box">
        <p class="email-text" style="margin: 0;">
          <strong>No. Pesanan:</strong> ${data.orderNumber}<br>
          <strong>Tanggal:</strong> ${data.orderDate}<br>
          <strong>Template:</strong> ${data.templateName}<br>
          <strong>Harga:</strong> ${data.templatePrice}
          ${data.paymentMethod ? `<br><strong>Metode Pembayaran:</strong> ${data.paymentMethod}` : ''}
        </p>
      </div>
      
      <div style="text-align: center; margin: 24px 0;">
        <div style="display: inline-block; padding: 12px 24px; background-color: ${statusColor}; color: ${COLORS.white}; border-radius: 6px; font-weight: 600; font-size: 16px;">
          ${statusText}
        </div>
      </div>
      
      ${isPaid && data.downloadUrl ? `
        <p class="email-text">
          Template Anda sudah siap diunduh! Klik tombol di bawah untuk mengunduh file template:
        </p>
        
        <div style="text-align: center; margin: 24px 0;">
          <a href="${data.downloadUrl}" class="email-button">
            ?? Download Template
          </a>
        </div>
      ` : `
        <p class="email-text">
          Silakan lanjutkan pembayaran untuk mengakses template Anda. Setelah pembayaran dikonfirmasi, link download akan dikirimkan ke email Anda.
        </p>
        
        <div style="text-align: center; margin: 24px 0;">
          <a href="${data.orderUrl}" class="email-button">
            ?? Bayar Sekarang
          </a>
        </div>
      `}
      
      <div class="email-divider"></div>
      
      <p class="email-text">
        <strong>Lihat Detail Pesanan:</strong>
      </p>
      
      <p class="email-text">
        Anda dapat melihat status pesanan dan mengunduh template kapan saja melalui halaman "Pesanan Saya" di akun Anda.
      </p>
      
      <div style="text-align: center; margin: 16px 0;">
        <a href="${data.orderUrl}" style="color: ${COLORS.secondary}; text-decoration: underline; font-weight: 600;">
          Lihat Pesanan ?
        </a>
      </div>
      
      <div class="email-divider"></div>
      
      <p class="email-text" style="font-size: 14px; color: ${COLORS.smoke};">
        <strong>Butuh bantuan?</strong><br>
        Jika Anda mengalami kendala atau memiliki pertanyaan, jangan ragu untuk menghubungi kami. Kami siap membantu!
      </p>
      
      <p class="email-text">
        Terima kasih telah berbelanja di Naki Code!<br><br>
        Salam,<br>
        <strong>Tim Naki Code</strong>
      </p>
    </div>
  `;
  
  return baseEmailTemplate(content);
}
