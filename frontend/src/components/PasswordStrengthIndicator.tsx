import { AlertTriangle } from 'lucide-react';
import zxcvbn from 'zxcvbn';

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

  const result = zxcvbn(password);
  
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
  
  // Extract feedback messages
  const feedback: string[] = [];
  
  if (result.feedback.warning) {
    feedback.push(result.feedback.warning);
  }
  
  if (result.feedback.suggestions && result.feedback.suggestions.length > 0) {
    feedback.push(...result.feedback.suggestions);
  }
  
  // Add helpful suggestions if score is low
  if (result.score < 2 && feedback.length === 0) {
    feedback.push('Coba tambahkan angka, simbol, atau kombinasi huruf besar-kecil');
  }
  
  return {
    score: result.score,
    label: labels[result.score],
    color: colors[result.score],
    feedback,
  };
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
  const result = zxcvbn(password);
  return result.score >= 2; // Minimum "Cukup" (somewhat guessable)
}
