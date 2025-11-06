/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Calendar from '@/components/Calendar';

describe('Calendar Component', () => {
  beforeEach(() => {
    // Mock current date to ensure consistent tests
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-11-06'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render calendar component', () => {
      render(<Calendar />);
      expect(screen.getByText('November')).toBeInTheDocument();
      expect(screen.getByText('2025')).toBeInTheDocument();
    });

    it('should render all days of week headers', () => {
      render(<Calendar />);
      const daysOfWeek = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

      daysOfWeek.forEach(day => {
        expect(screen.getByText(day)).toBeInTheDocument();
      });
    });

    it('should render 42 day cells (6 weeks)', () => {
      const { container } = render(<Calendar />);
      const dayCells = container.querySelectorAll('.grid-cols-7.grid-rows-6 > div');
      expect(dayCells.length).toBe(42);
    });

    it('should render Today button', () => {
      render(<Calendar />);
      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('should render Add Event button', () => {
      render(<Calendar />);
      expect(screen.getByText('+ Add Event')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to previous month when clicking prev button', () => {
      render(<Calendar />);

      const prevButton = screen.getByLabelText('Bulan sebelumnya');
      fireEvent.click(prevButton);

      expect(screen.getByText('Oktober')).toBeInTheDocument();
      expect(screen.getByText('2025')).toBeInTheDocument();
    });

    it('should navigate to next month when clicking next button', () => {
      render(<Calendar />);

      const nextButton = screen.getByLabelText('Bulan berikutnya');
      fireEvent.click(nextButton);

      expect(screen.getByText('Desember')).toBeInTheDocument();
      expect(screen.getByText('2025')).toBeInTheDocument();
    });

    it('should handle year change when navigating from December to January', () => {
      render(<Calendar />);

      // Navigate to December 2025
      const nextButton = screen.getByLabelText('Bulan berikutnya');
      fireEvent.click(nextButton); // December 2025

      expect(screen.getByText('Desember')).toBeInTheDocument();
      expect(screen.getByText('2025')).toBeInTheDocument();

      // Navigate to January 2026
      fireEvent.click(nextButton);
      expect(screen.getByText('Januari')).toBeInTheDocument();
      expect(screen.getByText('2026')).toBeInTheDocument();
    });

    it('should handle year change when navigating from January to December', () => {
      // Set to January 2026
      jest.setSystemTime(new Date('2026-01-15'));
      render(<Calendar />);

      const prevButton = screen.getByLabelText('Bulan sebelumnya');
      fireEvent.click(prevButton);

      expect(screen.getByText('Desember')).toBeInTheDocument();
      expect(screen.getByText('2025')).toBeInTheDocument();
    });

    it('should return to current month when clicking Today button', () => {
      render(<Calendar />);

      // Navigate away from current month
      const nextButton = screen.getByLabelText('Bulan berikutnya');
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      expect(screen.getByText('Januari')).toBeInTheDocument();

      // Click Today button
      const todayButton = screen.getByText('Today');
      fireEvent.click(todayButton);

      // Should return to November 2025
      expect(screen.getByText('November')).toBeInTheDocument();
      expect(screen.getByText('2025')).toBeInTheDocument();
    });
  });

  describe('Events Display', () => {
    it('should display mock events on correct dates', () => {
      render(<Calendar />);

      // Check for specific mock events
      expect(screen.getByText(/Marty/)).toBeInTheDocument();
      expect(screen.getByText(/King Julien/)).toBeInTheDocument();
      expect(screen.getByText(/Kowalski/)).toBeInTheDocument();
    });

    it('should render events with icons', () => {
      render(<Calendar />);

      // Events should have emojis
      expect(screen.getByText(/🦓 Marty/)).toBeInTheDocument();
      expect(screen.getByText(/👑 King Julien/)).toBeInTheDocument();
      expect(screen.getByText(/🐧 Kowalski/)).toBeInTheDocument();
    });

    it('should apply correct color classes to events', () => {
      const { container } = render(<Calendar />);

      // Check for event color classes
      const greenEvent = container.querySelector('.bg-green-100.text-green-800');
      const blueEvent = container.querySelector('.bg-blue-100.text-blue-800');
      const yellowEvent = container.querySelector('.bg-yellow-100.text-yellow-800');

      expect(greenEvent).toBeInTheDocument();
      expect(blueEvent).toBeInTheDocument();
      expect(yellowEvent).toBeInTheDocument();
    });

    it('should handle multiple events on the same day', () => {
      const { container } = render(<Calendar />);

      // November 9th has two events: King Julien and Kowalski
      expect(screen.getByText(/King Julien/)).toBeInTheDocument();
      expect(screen.getByText(/Kowalski/)).toBeInTheDocument();
    });
  });

  describe('Current Day Highlighting', () => {
    it('should highlight current day with yellow background', () => {
      const { container } = render(<Calendar />);

      // Find the element with today's highlight (November 6, 2025)
      const todayElement = container.querySelector('.bg-saintara-yellow');
      expect(todayElement).toBeInTheDocument();
      expect(todayElement?.textContent).toBe('6');
    });

    it('should not highlight current day when viewing different month', () => {
      const { container } = render(<Calendar />);

      // Navigate to different month
      const nextButton = screen.getByLabelText('Bulan berikutnya');
      fireEvent.click(nextButton);

      // Current day should not be highlighted in December
      const todayHighlight = container.querySelector('.bg-saintara-yellow');
      expect(todayHighlight).not.toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply Poppins font class', () => {
      const { container } = render(<Calendar />);
      const calendarWrapper = container.querySelector('.font-poppins');
      expect(calendarWrapper).toBeInTheDocument();
    });

    it('should apply shadow-lg class', () => {
      const { container } = render(<Calendar />);
      const calendarWrapper = container.querySelector('.shadow-lg');
      expect(calendarWrapper).toBeInTheDocument();
    });

    it('should apply rounded corners', () => {
      const { container } = render(<Calendar />);
      const calendarWrapper = container.querySelector('.rounded-xl');
      expect(calendarWrapper).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-labels for navigation buttons', () => {
      render(<Calendar />);

      expect(screen.getByLabelText('Bulan sebelumnya')).toBeInTheDocument();
      expect(screen.getByLabelText('Bulan berikutnya')).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      render(<Calendar />);

      const todayButton = screen.getByText('Today');
      todayButton.focus();
      expect(todayButton).toHaveFocus();
    });
  });

  describe('Date Formatting', () => {
    it('should display month names in Indonesian', () => {
      render(<Calendar />);

      expect(screen.getByText('November')).toBeInTheDocument();

      const prevButton = screen.getByLabelText('Bulan sebelumnya');
      fireEvent.click(prevButton);
      expect(screen.getByText('Oktober')).toBeInTheDocument();
    });

    it('should display day names in Indonesian', () => {
      render(<Calendar />);

      const indonesianDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      indonesianDays.forEach(day => {
        expect(screen.getByText(day)).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle February in leap year', () => {
      jest.setSystemTime(new Date('2024-02-15'));
      const { container } = render(<Calendar />);

      expect(screen.getByText('Februari')).toBeInTheDocument();
      expect(screen.getByText('2024')).toBeInTheDocument();

      // February 2024 has 29 days (leap year)
      const dayCells = container.querySelectorAll('.grid-cols-7.grid-rows-6 > div');
      expect(dayCells.length).toBe(42); // Always 42 cells
    });

    it('should handle February in non-leap year', () => {
      jest.setSystemTime(new Date('2025-02-15'));
      const { container } = render(<Calendar />);

      expect(screen.getByText('Februari')).toBeInTheDocument();
      expect(screen.getByText('2025')).toBeInTheDocument();
    });

    it('should handle rapid navigation clicks', () => {
      render(<Calendar />);

      const nextButton = screen.getByLabelText('Bulan berikutnya');

      // Click multiple times rapidly
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      // Should be at February 2026
      expect(screen.getByText('Februari')).toBeInTheDocument();
      expect(screen.getByText('2026')).toBeInTheDocument();
    });
  });

  describe('Previous/Next Month Days', () => {
    it('should display previous month days with grayed out style', () => {
      const { container } = render(<Calendar />);

      // Find cells with previous month styling
      const prevMonthCells = container.querySelectorAll('.bg-gray-50');
      expect(prevMonthCells.length).toBeGreaterThan(0);
    });

    it('should display current month days with white background', () => {
      const { container } = render(<Calendar />);

      // Current month days should have white/hover background
      const currentMonthCells = container.querySelectorAll('.bg-white');
      expect(currentMonthCells.length).toBeGreaterThan(0);
    });
  });
});
