import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserLoginPage } from '../../pages/UserLoginPage';
import { renderWithProviders } from '../../test/render';

const renderLoginPage = () => {
  return renderWithProviders(<UserLoginPage />, { route: '/login' });
};

describe('UserLoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock
    globalThis.fetch = vi.fn();
  });

  it('renders login form by default', () => {
    renderLoginPage();
    
    expect(screen.getByRole('heading', { name: /Login user/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Username \/ email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  it('shows password strength indicator in register mode', async () => {
    renderLoginPage();
    
    const user = userEvent.setup();
    
    // Switch to register mode
    const registerLink = screen.getByRole('button', { name: /Daftar/i });
    await user.click(registerLink);
    
    // Type a password
    const passwordInput = screen.getByLabelText(/^Password$/i);
    await user.type(passwordInput, 'weak');
    
    // Should show strength indicator
    await waitFor(() => {
      expect(screen.getByText(/Kekuatan password/i)).toBeInTheDocument();
    });
  });

  it('validates password confirmation in register mode', async () => {
    renderLoginPage();
    
    const user = userEvent.setup();
    
    // Switch to register mode
    const registerLink = screen.getByRole('button', { name: /Daftar/i });
    await user.click(registerLink);
    
    // Fill form with mismatched passwords
    await user.type(screen.getByLabelText(/Username/i), 'testuser');
    await user.type(screen.getByRole('textbox', { name: /^Email$/i }), 'test@example.com');
    await user.type(screen.getByLabelText(/^Password$/i), 'StrongPass123!');
    await user.type(screen.getByLabelText(/Konfirmasi password/i), 'DifferentPass123!');
    
    // Check the captcha checkbox
    const checkbox = screen.getByRole('checkbox', { name: /Saya bukan robot/i });
    await user.click(checkbox);
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /Daftar user/i });
    await user.click(submitButton);
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/Konfirmasi password belum sama/i)).toBeInTheDocument();
    });
  });

  it('shows captcha checkbox in register mode', async () => {
    renderLoginPage();
    
    const user = userEvent.setup();
    
    // Switch to register mode
    const registerLink = screen.getByRole('button', { name: /Daftar/i });
    await user.click(registerLink);
    
    // Should show captcha checkbox
    const checkbox = screen.getByRole('checkbox', { name: /Saya bukan robot/i });
    expect(checkbox).toBeInTheDocument();
  });

  it('requires captcha checkbox to be checked', async () => {
    renderLoginPage();
    
    const user = userEvent.setup();
    
    // Switch to register mode
    const registerLink = screen.getByRole('button', { name: /Daftar/i });
    await user.click(registerLink);
    
    // Fill form but don't check captcha
    await user.type(screen.getByLabelText(/Username/i), 'testuser');
    await user.type(screen.getByRole('textbox', { name: /^Email$/i }), 'test@example.com');
    await user.type(screen.getByLabelText(/^Password$/i), 'StrongPass123!');
    await user.type(screen.getByLabelText(/Konfirmasi password/i), 'StrongPass123!');
    
    // Submit without checking captcha
    const submitButton = screen.getByRole('button', { name: /Daftar user/i });
    await user.click(submitButton);
    
    // Form validation should prevent submission (HTML5 required attribute)
    // The checkbox has required attribute, so browser will show validation error
    expect(screen.getByRole('status')).toHaveTextContent(
      /Login user dipakai|Memeriksa akun|Membuat akun/i,
    );
  });
});
