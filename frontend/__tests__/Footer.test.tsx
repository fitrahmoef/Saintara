import { render, screen } from '@testing-library/react'
import Footer from '@/components/Footer'

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

describe('Footer Component', () => {
  it('renders the Saintara brand name in footer', () => {
    render(<Footer />)
    const brandElements = screen.getAllByText(/Saintara/i)
    expect(brandElements.length).toBeGreaterThan(0)
  })

  it('renders footer element', () => {
    const { container } = render(<Footer />)
    const footer = container.querySelector('footer')
    expect(footer).toBeInTheDocument()
  })
})
