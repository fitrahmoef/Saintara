/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock Auth Context
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockPush = jest.fn();

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when isLoading is true', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        isLoading: true,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Memuat...')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should display spinner animation during loading', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        isLoading: true,
      });

      const { container } = render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Unauthenticated User', () => {
    it('should redirect to login when user is not authenticated', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        isLoading: false,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('should not render children when user is not authenticated', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        isLoading: false,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated Regular User', () => {
    it('should render children when user is authenticated', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 1, email: 'user@test.com', role: 'user' },
        isLoading: false,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should not redirect when user is authenticated', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 1, email: 'user@test.com', role: 'user' },
        isLoading: false,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Admin-Only Routes', () => {
    it('should allow superadmin to access admin routes', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 1, email: 'admin@test.com', role: 'superadmin' },
        isLoading: false,
      });

      render(
        <ProtectedRoute requireAdmin={true}>
          <div>Admin Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Admin Content')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should allow institution_admin to access admin routes', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 2, email: 'inst-admin@test.com', role: 'institution_admin' },
        isLoading: false,
      });

      render(
        <ProtectedRoute requireAdmin={true}>
          <div>Admin Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Admin Content')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should allow admin to access admin routes', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 3, email: 'admin@test.com', role: 'admin' },
        isLoading: false,
      });

      render(
        <ProtectedRoute requireAdmin={true}>
          <div>Admin Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Admin Content')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should redirect regular user to dashboard when accessing admin route', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 4, email: 'user@test.com', role: 'user' },
        isLoading: false,
      });

      render(
        <ProtectedRoute requireAdmin={true}>
          <div>Admin Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should not render admin content for regular user', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 4, email: 'user@test.com', role: 'user' },
        isLoading: false,
      });

      render(
        <ProtectedRoute requireAdmin={true}>
          <div>Admin Content</div>
        </ProtectedRoute>
      );

      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });
  });

  describe('Role Verification', () => {
    it('should accept all valid admin roles', () => {
      const adminRoles = ['superadmin', 'institution_admin', 'admin'];

      adminRoles.forEach(role => {
        (useAuth as jest.Mock).mockReturnValue({
          user: { id: 1, email: 'admin@test.com', role },
          isLoading: false,
        });

        const { unmount } = render(
          <ProtectedRoute requireAdmin={true}>
            <div>Admin Content</div>
          </ProtectedRoute>
        );

        expect(screen.getByText('Admin Content')).toBeInTheDocument();
        unmount();
      });
    });

    it('should reject non-admin roles', () => {
      const nonAdminRoles = ['user', 'guest', 'moderator', 'viewer'];

      nonAdminRoles.forEach(role => {
        mockPush.mockClear();
        (useAuth as jest.Mock).mockReturnValue({
          user: { id: 1, email: 'user@test.com', role },
          isLoading: false,
        });

        const { unmount } = render(
          <ProtectedRoute requireAdmin={true}>
            <div>Admin Content</div>
          </ProtectedRoute>
        );

        expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Optional Admin Requirement', () => {
    it('should allow any authenticated user when requireAdmin is false', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 1, email: 'user@test.com', role: 'user' },
        isLoading: false,
      });

      render(
        <ProtectedRoute requireAdmin={false}>
          <div>User Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('User Content')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should use default requireAdmin value (false) when not specified', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 1, email: 'user@test.com', role: 'user' },
        isLoading: false,
      });

      render(
        <ProtectedRoute>
          <div>User Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('User Content')).toBeInTheDocument();
    });
  });

  describe('Loading Styles', () => {
    it('should apply correct styling classes to loading screen', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        isLoading: true,
      });

      const { container } = render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
      expect(container.querySelector('.bg-gray-50')).toBeInTheDocument();
    });

    it('should use saintara-yellow color for spinner', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        isLoading: true,
      });

      const { container } = render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      const spinner = container.querySelector('.border-saintara-yellow');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null user object correctly', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        isLoading: false,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('should handle undefined user role', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 1, email: 'user@test.com' }, // no role
        isLoading: false,
      });

      render(
        <ProtectedRoute requireAdmin={true}>
          <div>Admin Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should handle transition from loading to authenticated', async () => {
      const { rerender } = render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      // Initially loading
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        isLoading: true,
      });

      expect(screen.getByText('Memuat...')).toBeInTheDocument();

      // Then authenticated
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 1, email: 'user@test.com', role: 'user' },
        isLoading: false,
      });

      rerender(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });
  });

  describe('Multiple Children', () => {
    it('should render all children when authenticated', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 1, email: 'user@test.com', role: 'user' },
        isLoading: false,
      });

      render(
        <ProtectedRoute>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });
  });
});
