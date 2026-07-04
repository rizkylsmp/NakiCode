/**
 * Anti-bot captcha with checkbox, honeypot, and timing validation
 * 
 * This provides basic bot protection without requiring external services.
 * 
 * Components:
 * 1. Checkbox - User must check "I'm not a robot"
 * 2. Honeypot - Hidden field that bots might fill but humans won't see
 * 3. Timestamp - Form must be open for minimum time before submission
 */

export type CaptchaState = {
  timestamp: number; // When form was opened
  isChecked: boolean; // Checkbox state
  honeypot: string; // Honeypot field value (should stay empty)
};

/**
 * Initialize captcha state when form opens
 */
export function initializeCaptcha(): CaptchaState {
  return {
    timestamp: Date.now(),
    isChecked: false,
    honeypot: '',
  };
}

/**
 * Validate captcha submission
 * 
 * @param state - Current captcha state
 * @param minTimeSeconds - Minimum time form must be open (default 2 seconds)
 * @returns Object with validation result and error message
 */
export function validateCaptcha(
  state: CaptchaState,
  minTimeSeconds: number = 2
): { valid: boolean; error?: string } {
  // Check 1: Checkbox must be checked
  if (!state.isChecked) {
    return {
      valid: false,
      error: 'Silakan centang "Saya bukan robot" untuk melanjutkan.',
    };
  }

  // Check 2: Honeypot must be empty (bot detection)
  if (state.honeypot && state.honeypot.trim() !== '') {
    return {
      valid: false,
      error: 'Validasi keamanan gagal. Silakan coba lagi.',
    };
  }

  // Check 3: Minimum time elapsed (prevent instant bot submissions)
  const elapsedSeconds = (Date.now() - state.timestamp) / 1000;
  
  if (elapsedSeconds < minTimeSeconds) {
    return {
      valid: false,
      error: `Mohon tunggu ${Math.ceil(minTimeSeconds - elapsedSeconds)} detik sebelum mengirim form.`,
    };
  }

  return { valid: true };
}

/**
 * Check if user can submit (for UI feedback)
 */
export function canSubmitCaptcha(state: CaptchaState): boolean {
  return state.isChecked;
}
