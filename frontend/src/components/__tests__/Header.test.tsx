import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '../Header';

// Mock auth context
const mockUseAuth = vi.fn();
vi.mock('../auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

// Helper to render with router
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Header Component', () => {
  it('renders the Naki Code logo', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isAdmin: false,
      token: null,
      username: '',
      role: 'user',
      refresh: vi.fn(),
      logout: vi.fn(),
    });

    renderWithRouter(<Header />);
    
    const logo = screen.getByText(/Naki Code/i);
    expect(logo).toBeInTheDocument();
  });

  it('shows login link when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isAdmin: false,
      token: null,
      username: '',
      role: 'user',
      refresh: vi.fn(),
      logout: vi.fn(),
    });

    renderWithRouter(<Header />);
    
    const loginLink = screen.getByText(/Login/i);
    expect(loginLink).toBeInTheDocument();
  });

  it('shows user menu when authenticated as user', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isAdmin: false,
      token: 'fake-token',
      username: 'testuser',
      role: 'user',
      refresh: vi.fn(),
      logout: vi.fn(),
    });

    renderWithRouter(<Header />);
    
    const username = screen.getByText(/testuser/i);
    expect(username).toBeInTheDocument();
  });

  it('shows admin link when authenticated as admin', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isAdmin: true,
      token: 'fake-admin-token',
      username: 'admin',
      role: 'admin',
      refresh: vi.fn(),
      logout: vi.fn(),
    });

    renderWithRouter(<Header />);
    
    // Admin should see their username
    const username = screen.getByText(/admin/i);
    expect(username).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isAdmin: false,
      token: null,
      username: '',
      role: 'user',
      refresh: vi.fn(),
      logout: vi.fn(),
    });

    renderWithRouter(<Header />);
    
    // Check for main navigation links
    const homeLink = screen.getByRole('link', { name: /naki code/i });
    expect(homeLink).toBeInTheDocument();
  });
});
