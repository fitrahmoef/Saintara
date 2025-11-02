import { render, screen } from '@testing-library/react'
import Navbar from '@/components/Navbar'
import { AuthProvider } from '@/contexts/AuthContext'

// Mock the AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: null,
    logout: jest.fn(),
    login: jest.fn(),
  }),
}))

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

describe('Navbar Component', () => {
  it('renders the Saintara brand name', () => {
    render(<Navbar />)
    expect(screen.getByText('Saintara')).toBeInTheDocument()
  })

  it('renders navigation links when user is not logged in', () => {
    render(<Navbar />)
    // The navbar should render without errors
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })
})
