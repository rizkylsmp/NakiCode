import { AlertTriangle } from 'lucide-react';

type PasswordStrength = {
  score: number; // 0-4
  label: string;
  color: string;
  feedback: string[];
};

function calculateStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      label: 'Terlalu lemah',
      color: 'bg-gray-300',
      feedback: ['Password minimal 8 karakter'],
    };
  }

  const score = getPasswordScore(password);

  const labels = [
    'Terlalu lemah',
    'Lemah',
    'Cukup',
    'Kuat',
    'Sangat kuat',
  ];
  
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-green-500',
    'bg-green-600',
  ];
  
  return {
    score,
    label: labels[score],
    color: colors[score],
    feedback: getPasswordFeedback(password, score),
  };
}

function getPasswordScore(password: string): number {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (/(.)\1{2,}/.test(password)) score -= 1;
  if (/password|qwerty|admin|123456|naki/i.test(password)) score -= 1;

  return Math.max(0, Math.min(4, score));
}

function getPasswordFeedback(password: string, score: number): string[] {
  const feedback: string[] = [];

  if (password.length < 8) {
    feedback.push('Gunakan minimal 8 karakter.');
  }

  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    feedback.push('Campur huruf besar dan kecil.');
  }

  if (!/\d/.test(password)) {
    feedback.push('Tambahkan angka.');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    feedback.push('Tambahkan simbol untuk memperkuat password.');
  }

  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Hindari karakter berulang terlalu banyak.');
  }

  if (/password|qwerty|admin|123456|naki/i.test(password)) {
    feedback.push('Hindari kata umum atau nama brand.');
  }

  return score < 3 ? feedback.slice(0, 3) : [];
}

type PasswordStrengthIndicatorProps = {
  password: string;
};

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const strength = calculateStrength(password);
  
  if (!password) {
    return null;
  }
  
  return (
    <div className="grid gap-2">
      {/* Strength bar */}
      <div className="grid gap-1.5">
        <div className="flex items-center justify-between text-xs font-bold">
          <span>Kekuatan password:</span>
          <span className={strength.score < 2 ? 'text-red-600' : 'text-green-600'}>
            {strength.label}
          </span>
        </div>
        
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`h-1 flex-1 rounded-full transition-colors ${
                level <= strength.score ? strength.color : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
      
      {/* Feedback messages */}
      {strength.feedback.length > 0 && (
        <div className="rounded-lg bg-naki-frost p-2 text-xs font-semibold text-naki-smoke">
          <ul className="list-inside list-disc space-y-0.5">
            {strength.feedback.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Warning for weak passwords */}
      {strength.score < 2 && (
        <p className="flex items-center gap-1.5 text-xs font-bold text-red-600">
          <AlertTriangle size={14} />
          Password terlalu lemah. Pilih password yang lebih kuat untuk keamanan akun.
        </p>
      )}
    </div>
  );
}

/**
 * Check if password meets minimum strength requirement
 */
export function isPasswordStrong(password: string): boolean {
  return getPasswordScore(password) >= 2;
}
