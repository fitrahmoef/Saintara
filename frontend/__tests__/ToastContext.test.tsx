/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ToastProvider, useToast } from '@/contexts/ToastContext';

// Test component that uses the toast hook
const TestComponent = () => {
  const { showToast, success, error, info, warning, toasts } = useToast();

  return (
    <div>
      <div data-testid="toast-count">{toasts.length}</div>
      <button onClick={() => showToast('Test message')}>Show Toast</button>
      <button onClick={() => success('Success message')}>Show Success</button>
      <button onClick={() => error('Error message')}>Show Error</button>
      <button onClick={() => info('Info message')}>Show Info</button>
      <button onClick={() => warning('Warning message')}>Show Warning</button>
      <button onClick={() => showToast('Custom duration', 'info', 1000)}>
        Custom Duration
      </button>
      <button onClick={() => showToast('No timeout', 'info', 0)}>No Timeout</button>
    </div>
  );
};

describe('ToastContext', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Provider Setup', () => {
    it('should render children correctly', () => {
      render(
        <ToastProvider>
          <div>Test Content</div>
        </ToastProvider>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should throw error when useToast is used outside provider', () => {
      // Suppress console error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const Component = () => {
        useToast();
        return <div>Test</div>;
      };

      expect(() => render(<Component />)).toThrow(
        'useToast must be used within a ToastProvider'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Toast Display', () => {
    it('should show toast when showToast is called', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Show Toast');
      fireEvent.click(button);

      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('should display success toast with correct styling', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Show Success');
      fireEvent.click(button);

      const toast = screen.getByText('Success message');
      expect(toast).toBeInTheDocument();

      // Check parent div has success styling
      const toastContainer = toast.closest('[role="alert"]');
      expect(toastContainer).toHaveClass('bg-green-500', 'text-white');
    });

    it('should display error toast with correct styling', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Show Error');
      fireEvent.click(button);

      const toast = screen.getByText('Error message');
      expect(toast).toBeInTheDocument();

      const toastContainer = toast.closest('[role="alert"]');
      expect(toastContainer).toHaveClass('bg-red-500', 'text-white');
    });

    it('should display info toast with correct styling', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Show Info');
      fireEvent.click(button);

      const toast = screen.getByText('Info message');
      expect(toast).toBeInTheDocument();

      const toastContainer = toast.closest('[role="alert"]');
      expect(toastContainer).toHaveClass('bg-blue-500', 'text-white');
    });

    it('should display warning toast with correct styling', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Show Warning');
      fireEvent.click(button);

      const toast = screen.getByText('Warning message');
      expect(toast).toBeInTheDocument();

      const toastContainer = toast.closest('[role="alert"]');
      expect(toastContainer).toHaveClass('bg-yellow-500', 'text-black');
    });
  });

  describe('Toast Icons', () => {
    it('should display icon for success toast', () => {
      const { container } = render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Show Success');
      fireEvent.click(button);

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should display icon for error toast', () => {
      const { container } = render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Show Error');
      fireEvent.click(button);

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should display icon for warning toast', () => {
      const { container } = render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Show Warning');
      fireEvent.click(button);

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should display icon for info toast', () => {
      const { container } = render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Show Info');
      fireEvent.click(button);

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Toast Auto-Dismiss', () => {
    it('should auto-dismiss toast after default duration (5000ms)', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Show Toast');
      fireEvent.click(button);

      expect(screen.getByText('Test message')).toBeInTheDocument();

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(screen.queryByText('Test message')).not.toBeInTheDocument();
      });
    });

    it('should auto-dismiss toast after custom duration', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Custom Duration');
      fireEvent.click(button);

      expect(screen.getByText('Custom duration')).toBeInTheDocument();

      // Fast-forward 1000ms
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.queryByText('Custom duration')).not.toBeInTheDocument();
      });
    });

    it('should not auto-dismiss when duration is 0', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText('No Timeout');
      fireEvent.click(button);

      expect(screen.getByText('No timeout')).toBeInTheDocument();

      // Fast-forward a lot
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // Toast should still be there
      expect(screen.getByText('No timeout')).toBeInTheDocument();
    });
  });

  describe('Toast Manual Dismiss', () => {
    it('should dismiss toast when close button is clicked', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Show Toast');
      fireEvent.click(button);

      expect(screen.getByText('Test message')).toBeInTheDocument();

      // Find and click close button
      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Test message')).not.toBeInTheDocument();
      });
    });
  });

  describe('Multiple Toasts', () => {
    it('should display multiple toasts simultaneously', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Show Success'));
      fireEvent.click(screen.getByText('Show Error'));
      fireEvent.click(screen.getByText('Show Warning'));

      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByText('Warning message')).toBeInTheDocument();

      const toastCount = screen.getByTestId('toast-count');
      expect(toastCount).toHaveTextContent('3');
    });

    it('should dismiss toasts independently', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Show Success'));
      fireEvent.click(screen.getByText('Show Error'));

      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();

      // Click close button on error toast
      const closeButtons = screen.getAllByLabelText('Close');
      fireEvent.click(closeButtons[1]);

      await waitFor(() => {
        expect(screen.queryByText('Error message')).not.toBeInTheDocument();
      });

      // Success toast should still be visible
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });
  });

  describe('Toast Container', () => {
    it('should not render container when no toasts', () => {
      const { container } = render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const toastContainer = container.querySelector('.fixed.top-4.right-4');
      expect(toastContainer).not.toBeInTheDocument();
    });

    it('should render container when toasts exist', () => {
      const { container } = render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Show Toast'));

      const toastContainer = container.querySelector('.fixed.top-4.right-4');
      expect(toastContainer).toBeInTheDocument();
    });

    it('should apply correct positioning classes', () => {
      const { container } = render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Show Toast'));

      const toastContainer = container.querySelector('.fixed.top-4.right-4.z-50');
      expect(toastContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role="alert" for toasts', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Show Toast'));

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should have aria-label on close button', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Show Toast'));

      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Toast IDs', () => {
    it('should generate unique IDs for each toast', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Show Toast'));
      fireEvent.click(screen.getByText('Show Toast'));
      fireEvent.click(screen.getByText('Show Toast'));

      const toastCount = screen.getByTestId('toast-count');
      expect(toastCount).toHaveTextContent('3');

      const alerts = screen.getAllByRole('alert');
      expect(alerts).toHaveLength(3);
    });
  });

  describe('Helper Methods', () => {
    it('should call success helper correctly', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Show Success'));

      expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    it('should call error helper correctly', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Show Error'));

      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('should call info helper correctly', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Show Info'));

      expect(screen.getByText('Info message')).toBeInTheDocument();
    });

    it('should call warning helper correctly', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Show Warning'));

      expect(screen.getByText('Warning message')).toBeInTheDocument();
    });
  });

  describe('Animation Classes', () => {
    it('should apply animation class to toast', () => {
      const { container } = render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Show Toast'));

      const toast = container.querySelector('.animate-slide-in-right');
      expect(toast).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message', () => {
      const EmptyComponent = () => {
        const { showToast } = useToast();
        return <button onClick={() => showToast('')}>Empty</button>;
      };

      render(
        <ToastProvider>
          <EmptyComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Empty'));

      // Toast should still render even with empty message
      const alert = screen.queryByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should handle very long message', () => {
      const LongComponent = () => {
        const { showToast } = useToast();
        const longMessage = 'A'.repeat(1000);
        return <button onClick={() => showToast(longMessage)}>Long</button>;
      };

      render(
        <ToastProvider>
          <LongComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Long'));

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });
  });
});
