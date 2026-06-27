import crypto from 'node:crypto';
import { Router } from 'express';
import * as Sentry from '@sentry/node';
import { z } from 'zod';
import zxcvbn from 'zxcvbn';
import {
  createUserToken,
  verifyAdminToken,
  verifyPassword,
  verifyUserToken,
} from '../auth';
import { config } from '../config';
import { enqueueEmail } from '../email-queue';
import { createAdminAuditLog } from '../models/audit-log.model';
import {
  createUserAccount,
  clearUserEmailVerificationOtp,
  clearUserPasswordResetOtp,
  deleteUserAccount,
  findUserById,
  findUserByEmail,
  findUserByUsername,
  findUserByUsernameOrEmail,
  markUserEmailVerified,
  setUserPasswordResetOtp,
  setUserEmailVerificationOtp,
  verifyUserPasswordResetOtp,
  verifyUserEmailOtp,
  updateUserPassword,
  updateUserProfileName,
} from '../models/user.model';
import { parseBody } from '../validation';

export const authRouter = Router();

const loginBodySchema = z.object({
  username: z.string().trim().min(1).max(160),
  password: z.string().min(1).max(200),
});

const userLoginBodySchema = z.object({
  identifier: z.string().trim().min(1).max(160),
  password: z.string().min(1).max(200),
});

const registerBodySchema = z.object({
  username: z.string().trim().min(3).max(80),
  email: z.email().trim().toLowerCase().max(160),
  password: z.string().min(8).max(200), // Updated from 6 to 8 for better security
});

const emailBodySchema = z.object({
  email: z.email().trim().toLowerCase().max(160),
});

const resetPasswordBodySchema = z
  .object({
    email: z.email().trim().toLowerCase().max(160),
    otp: z.string().trim().regex(/^\d{6}$/),
    password: z.string().min(8).max(200), // Updated from 6 to 8
    confirmPassword: z.string().min(8).max(200), // Updated from 6 to 8
  })
  .refine((body) => body.password === body.confirmPassword, {
    message: 'Konfirmasi password belum sama',
    path: ['confirmPassword'],
  });

const updateProfileBodySchema = z.object({
  username: z.string().trim().min(3).max(80).optional().or(z.literal('')),
  currentPassword: z.string().max(200).optional().or(z.literal('')),
  newPassword: z.string().max(200).optional().or(z.literal('')),
  confirmPassword: z.string().max(200).optional().or(z.literal('')),
});

const deleteAccountBodySchema = z.object({
  currentPassword: z.string().min(1).max(200),
  confirmEmail: z.email().trim().toLowerCase().max(160),
});

const verifyEmailBodySchema = z.object({
  email: z.email().trim().toLowerCase().max(160),
  otp: z.string().trim().regex(/^\d{6}$/),
});

authRouter.post('/login', async (request, response) => {
  const body = parseBody(loginBodySchema, request, response);

  if (!body) {
    return;
  }

  try {
    const admin = await findUserByUsernameOrEmail(body.username);

    if (
      !admin ||
      admin.role !== 'admin' ||
      !(await verifyPassword(body.password, admin.passwordHash))
    ) {
      await createAdminAuditLog({
        admin: null,
        action: 'login_failed',
        entityType: 'auth',
        metadata: { identifier: body.username, ip: request.ip ?? 'unknown' },
      });

      response.status(401).json({ message: 'Username atau password salah' });
      return;
    }

    await createAdminAuditLog({
      admin: {
        userId: admin.id,
        sub: admin.username,
        role: admin.role,
        exp: 0,
      },
      action: 'login',
      entityType: 'auth',
      metadata: { ip: request.ip ?? 'unknown' },
    });

    response.json({
      token: createUserToken(admin),
      admin: {
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(503).json({ message: 'Database login belum tersedia' });
  }
});

authRouter.get('/me', (request, response) => {
  const token = request.header('authorization')?.replace(/^Bearer\s+/i, '');
  const payload = token ? verifyAdminToken(token) : null;

  if (!payload) {
    response.status(401).json({ message: 'Token tidak valid' });
    return;
  }

  response.json({
    admin: {
      username: payload.sub,
      role: payload.role,
      userId: payload.userId,
    },
  });
});

authRouter.post('/user/register', async (request, response) => {
  const body = parseBody(registerBodySchema, request, response);

  if (!body) {
    return;
  }
  
  // Validate password strength (minimum score 2 = "somewhat guessable")
  const passwordStrength = zxcvbn(body.password);
  
  if (passwordStrength.score < 2) {
    const suggestions = passwordStrength.feedback.suggestions || [];
    const warning = passwordStrength.feedback.warning || '';
    
    let message = 'Password terlalu lemah untuk keamanan akun.';
    
    if (warning) {
      message += ` ${warning}`;
    }
    
    if (suggestions.length > 0) {
      message += ` Saran: ${suggestions.join('. ')}.`;
    } else {
      message += ' Gunakan kombinasi huruf besar-kecil, angka, dan simbol.';
    }
    
    response.status(400).json({ 
      message,
      passwordStrength: {
        score: passwordStrength.score,
        feedback: passwordStrength.feedback,
      },
    });
    return;
  }

  try {
    const existingUser = await findUserByUsernameOrEmail(body.username);
    const existingEmail = await findUserByUsernameOrEmail(body.email);

    if (existingUser || existingEmail) {
      response.status(409).json({ message: 'Username atau email sudah dipakai' });
      return;
    }

    const user = await createUserAccount({
      username: body.username,
      email: body.email,
      password: body.password,
    });
    const otp = generateOtpCode();
    const expiresAt = new Date(
      Date.now() + config.verification.otpTtlMinutes * 60_000,
    );
    const otpWasSaved = await setUserEmailVerificationOtp(user.id, otp, expiresAt);

    if (!otpWasSaved) {
      response.status(500).json({ message: 'Gagal menyiapkan OTP verifikasi' });
      return;
    }

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    await enqueueEmail({
      type: 'verification',
      payload: {
        email: user.email,
        username: user.username,
        otp,
      },
    });

    response.status(201).json({
      message: 'OTP verifikasi sedang dikirim ke email.',
      user: safeUser,
      verificationEmail: user.email,
      verificationUrl: buildVerificationUrl(user.email),
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: 'Gagal membuat akun user' });
  }
});

authRouter.post('/user/login', async (request, response) => {
  const body = parseBody(userLoginBodySchema, request, response);

  if (!body) {
    return;
  }

  try {
    const user = await findUserByUsernameOrEmail(body.identifier);

    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      response.status(401).json({ message: 'Akun atau password salah' });
      return;
    }

    if (!user.emailVerifiedAt) {
      response.status(403).json({
        message: 'Email belum diverifikasi',
        verificationEmail: user.email,
        verificationUrl: buildVerificationUrl(user.email),
      });
      return;
    }

    response.json({
      token: createUserToken(user),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(503).json({ message: 'Database user belum tersedia' });
  }
});

authRouter.post('/user/forgot-password', async (request, response) => {
  const body = parseBody(emailBodySchema, request, response);

  if (!body) {
    return;
  }

  try {
    const user = await findUserByEmail(body.email);

    if (!user) {
      response.json({
        message:
          'Jika email terdaftar, OTP reset password akan dikirim ke inbox.',
      });
      return;
    }

    const otp = generateOtpCode();
    const expiresAt = new Date(
      Date.now() + config.verification.passwordResetOtpTtlMinutes * 60_000,
    );
    const otpWasSaved = await setUserPasswordResetOtp(user.id, otp, expiresAt);

    if (!otpWasSaved) {
      response.status(500).json({ message: 'Gagal menyiapkan OTP reset' });
      return;
    }

    await enqueueEmail({
      type: 'password-reset',
      payload: {
        email: user.email,
        username: user.username,
        otp,
      },
    });

    response.json({
      message: 'OTP reset password sedang dikirim ke email.',
      resetEmail: user.email,
      resetUrl: buildPasswordResetUrl(user.email),
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: 'Gagal mengirim OTP reset password' });
  }
});

authRouter.post('/user/reset-password', async (request, response) => {
  const body = parseBody(resetPasswordBodySchema, request, response);

  if (!body) {
    return;
  }
  
  // Validate password strength (minimum score 2 = "somewhat guessable")
  const passwordStrength = zxcvbn(body.password);
  
  if (passwordStrength.score < 2) {
    const suggestions = passwordStrength.feedback.suggestions || [];
    const warning = passwordStrength.feedback.warning || '';
    
    let message = 'Password terlalu lemah untuk keamanan akun.';
    
    if (warning) {
      message += ` ${warning}`;
    }
    
    if (suggestions.length > 0) {
      message += ` Saran: ${suggestions.join('. ')}.`;
    } else {
      message += ' Gunakan kombinasi huruf besar-kecil, angka, dan simbol.';
    }
    
    response.status(400).json({ 
      message,
      passwordStrength: {
        score: passwordStrength.score,
        feedback: passwordStrength.feedback,
      },
    });
    return;
  }

  try {
    const user = await findUserByEmail(body.email);

    if (!user || !verifyUserPasswordResetOtp(user, body.otp)) {
      response.status(401).json({ message: 'OTP salah atau sudah kedaluwarsa' });
      return;
    }

    await updateUserPassword(user.id, body.password);
    await clearUserPasswordResetOtp(user.id);

    if (!user.emailVerifiedAt) {
      await markUserEmailVerified(user.id);
    }

    response.json({
      message: 'Password berhasil direset. Silakan login dengan password baru.',
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: 'Gagal reset password' });
  }
});

authRouter.get('/user/me', async (request, response) => {
  const token = request.header('authorization')?.replace(/^Bearer\s+/i, '');
  const payload = token ? verifyUserToken(token) : null;

  if (!payload) {
    response.status(401).json({ message: 'Token user tidak valid' });
    return;
  }

  const user = await findUserById(payload.userId);

  if (!user) {
    response.status(404).json({ message: 'Akun user tidak ditemukan' });
    return;
  }

  response.json({
    user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          emailVerifiedAt: user.emailVerifiedAt,
          emailVerificationSentAt: user.emailVerificationSentAt,
        },
  });
});

authRouter.patch('/user/me', async (request, response) => {
  const token = request.header('authorization')?.replace(/^Bearer\s+/i, '');
  const payload = token ? verifyUserToken(token) : null;
  const body = parseBody(updateProfileBodySchema, request, response);

  if (!payload) {
    response.status(401).json({ message: 'Token user tidak valid' });
    return;
  }

  if (!body) {
    return;
  }

  const nextUsername = body.username?.trim() ?? '';
  const currentPassword = body.currentPassword ?? '';
  const newPassword = body.newPassword ?? '';
  const confirmPassword = body.confirmPassword ?? '';

  try {
    const user = await findUserById(payload.userId);

    if (!user) {
      response.status(404).json({ message: 'Akun user tidak ditemukan' });
      return;
    }

    if (nextUsername && nextUsername !== user.username) {
      const existingUsername = await findUserByUsername(nextUsername);

      if (existingUsername && existingUsername.id !== user.id) {
        response.status(409).json({ message: 'Username sudah dipakai' });
        return;
      }

      await updateUserProfileName(user.id, nextUsername);
    }

    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword || newPassword.length < 6) {
        response.status(400).json({
          message:
            'Current password dan new password minimal 6 karakter wajib diisi',
        });
        return;
      }

      if (newPassword !== confirmPassword) {
        response.status(400).json({
          message: 'Konfirmasi password belum sama',
        });
        return;
      }

      if (!(await verifyPassword(currentPassword, user.passwordHash))) {
        response.status(401).json({ message: 'Current password salah' });
        return;
      }

      await updateUserPassword(user.id, newPassword);
    }

    const updatedUser = await findUserById(user.id);

    response.json({
      message: 'Profil user berhasil diperbarui',
      user: updatedUser
        ? {
            id: updatedUser.id,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role,
            emailVerifiedAt: updatedUser.emailVerifiedAt,
            emailVerificationSentAt: updatedUser.emailVerificationSentAt,
          }
        : {
            id: user.id,
            username: nextUsername || user.username,
            email: user.email,
            role: user.role,
            emailVerifiedAt: user.emailVerifiedAt,
            emailVerificationSentAt: user.emailVerificationSentAt,
          },
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: 'Gagal memperbarui profil user' });
  }
});

authRouter.delete('/user/me', async (request, response) => {
  const token = request.header('authorization')?.replace(/^Bearer\s+/i, '');
  const payload = token ? verifyUserToken(token) : null;
  const body = parseBody(deleteAccountBodySchema, request, response);

  if (!payload) {
    response.status(401).json({ message: 'Token user tidak valid' });
    return;
  }

  if (!body) {
    return;
  }

  try {
    const user = await findUserById(payload.userId);

    if (!user) {
      response.status(404).json({ message: 'Akun user tidak ditemukan' });
      return;
    }

    if (body.confirmEmail !== user.email.toLowerCase()) {
      response.status(400).json({
        message: 'Konfirmasi email tidak sesuai akun aktif',
      });
      return;
    }

    if (!(await verifyPassword(body.currentPassword, user.passwordHash))) {
      response.status(401).json({ message: 'Password aktif salah' });
      return;
    }

    const wasDeleted = await deleteUserAccount(user.id);

    if (!wasDeleted) {
      response.status(404).json({ message: 'Akun user tidak ditemukan' });
      return;
    }

    response.json({ message: 'Akun berhasil dihapus' });
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: 'Gagal menghapus akun' });
  }
});

authRouter.post('/user/verify-email', async (request, response) => {
  const body = parseBody(verifyEmailBodySchema, request, response);

  if (!body) {
    return;
  }

  try {
    const user = await findUserByEmail(body.email);

    if (!user) {
      response.status(404).json({ message: 'Akun user tidak ditemukan' });
      return;
    }

    if (user.emailVerifiedAt) {
      response.json({
        message: 'Email sudah terverifikasi',
        token: createUserToken(user),
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
      return;
    }

    if (!verifyUserEmailOtp(user, body.otp)) {
      response.status(401).json({
        message: 'OTP salah atau sudah kedaluwarsa',
        verificationEmail: user.email,
        verificationUrl: buildVerificationUrl(user.email),
      });
      return;
    }

    const wasUpdated = await markUserEmailVerified(user.id);

    if (!wasUpdated) {
      response.status(404).json({ message: 'Akun tidak ditemukan' });
      return;
    }

    await clearUserEmailVerificationOtp(user.id);

    const verifiedUser = await findUserByUsernameOrEmail(user.email);

    if (!verifiedUser) {
      response.status(500).json({ message: 'Gagal memverifikasi email' });
      return;
    }

    response.json({
      message: 'Email berhasil diverifikasi',
      token: createUserToken(verifiedUser),
      user: {
        id: verifiedUser.id,
        username: verifiedUser.username,
        email: verifiedUser.email,
        role: verifiedUser.role,
      },
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: 'Gagal memverifikasi email' });
  }
});

authRouter.post('/user/resend-otp', async (request, response) => {
  const body = parseBody(emailBodySchema, request, response);

  if (!body) {
    return;
  }

  try {
    const user = await findUserByEmail(body.email);

    if (!user) {
      response.status(404).json({ message: 'Akun user tidak ditemukan' });
      return;
    }

    if (user.emailVerifiedAt) {
      response.status(409).json({ message: 'Email sudah terverifikasi' });
      return;
    }

    const otp = generateOtpCode();
    const expiresAt = new Date(
      Date.now() + config.verification.otpTtlMinutes * 60_000,
    );
    const otpWasSaved = await setUserEmailVerificationOtp(user.id, otp, expiresAt);

    if (!otpWasSaved) {
      response.status(500).json({ message: 'Gagal menyiapkan OTP verifikasi' });
      return;
    }

    await enqueueEmail({
      type: 'verification',
      payload: {
        email: user.email,
        username: user.username,
        otp,
      },
    });

    response.json({
      message: 'OTP verifikasi sedang dikirim ulang',
      verificationEmail: user.email,
      verificationUrl: buildVerificationUrl(user.email),
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: 'Gagal mengirim OTP verifikasi' });
  }
});

function buildVerificationUrl(email: string) {
  return `/verify-email?email=${encodeURIComponent(email)}`;
}

function buildPasswordResetUrl(email: string) {
  return `/forgot-password?email=${encodeURIComponent(email)}`;
}

function generateOtpCode() {
  return String(crypto.randomInt(100000, 1000000));
}
