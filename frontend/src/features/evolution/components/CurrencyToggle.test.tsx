import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CurrencyToggle } from './CurrencyToggle'

describe('CurrencyToggle', () => {
  it('should render USD and ARS options', () => {
    const onChange = vi.fn()
    render(<CurrencyToggle value="USD" onChange={onChange} />)

    expect(screen.getByText('USD')).toBeInTheDocument()
    expect(screen.getByText('ARS')).toBeInTheDocument()
  })

  it('should highlight selected currency', () => {
    const onChange = vi.fn()
    render(<CurrencyToggle value="USD" onChange={onChange} />)

    const activeButton = screen.getByText('USD')
    expect(activeButton).toHaveClass('bg-blue-500')
    expect(activeButton).toHaveClass('text-white')

    const inactiveButton = screen.getByText('ARS')
    expect(inactiveButton).not.toHaveClass('bg-blue-500')
    expect(inactiveButton).toHaveClass('hover:bg-gray-100')
  })

  it('should call onChange when clicking different currency', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CurrencyToggle value="USD" onChange={onChange} />)

    await user.click(screen.getByText('ARS'))
    expect(onChange).toHaveBeenCalledWith('ARS')
  })

  it('should call onChange when clicking already selected currency', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CurrencyToggle value="USD" onChange={onChange} />)

    await user.click(screen.getByText('USD'))
    expect(onChange).toHaveBeenCalledWith('USD')
  })

  it('should highlight ARS when selected', () => {
    const onChange = vi.fn()
    render(<CurrencyToggle value="ARS" onChange={onChange} />)

    const activeButton = screen.getByText('ARS')
    expect(activeButton).toHaveClass('bg-blue-500')
    expect(activeButton).toHaveClass('text-white')

    const inactiveButton = screen.getByText('USD')
    expect(inactiveButton).not.toHaveClass('bg-blue-500')
  })
})
