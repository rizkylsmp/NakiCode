import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { Header } from '../layout/Header';
import { renderWithProviders } from '../../test/render';

vi.mock('../../services/api-client', async () => {
  const actual = await vi.importActual<typeof import('../../services/api-client')>(
    '../../services/api-client',
  );

  return {
    ...actual,
    apiGet: vi.fn(async (path: string) =>
      path === '/api/designs'
        ? { templates: [] }
        : { notifications: [] },
    ),
    apiPatch: vi.fn(async () => ({ notifications: [] })),
  };
});

// Helper to render with router
const renderHeader = (auth?: {
  token: string;
  username: string;
  role: 'user' | 'admin';
}) => {
  return renderWithProviders(<Header />, { auth, route: '/' });
};

describe('Header Component', () => {
  it('renders the Naki Code logo', () => {
    renderHeader();
    
    const logo = screen.getByRole('link', { name: /NakiCode home/i });
    expect(logo).toBeInTheDocument();
  });

  it('shows login link when user is not authenticated', () => {
    renderHeader();
    
    const loginLink = screen.getByRole('link', { name: /Login/i });
    expect(loginLink).toBeInTheDocument();
  });

  it('shows user menu when authenticated as user', () => {
    renderHeader({
      token: 'fake-token',
      username: 'testuser',
      role: 'user',
    });
    
    const username = screen.getByText(/testuser/i);
    expect(username).toBeInTheDocument();
  });

  it('shows admin links when authenticated as admin', () => {
    renderHeader({
      token: 'fake-admin-token',
      username: 'admin',
      role: 'admin',
    });

    fireEvent.click(screen.getByRole('button', { name: /admin/i }));

    expect(screen.getByRole('menuitem', { name: /dashboard admin/i })).toHaveAttribute('href', '/admin/dashboard');
    expect(screen.getByRole('menuitem', { name: /kelola design/i })).toHaveAttribute('href', '/admin/design');
  });

  it('renders navigation links', () => {
    renderHeader();
    
    // Check for main navigation links
    const homeLink = screen.getByRole('link', { name: /NakiCode home/i });
    expect(homeLink).toBeInTheDocument();
  });

  it('opens the design search dialog', () => {
    renderHeader();

    fireEvent.click(screen.getAllByRole('button', { name: /cari design/i })[0]);

    expect(screen.getByRole('dialog', { name: /cari design/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/company profile/i)).toHaveFocus();
  });
});
