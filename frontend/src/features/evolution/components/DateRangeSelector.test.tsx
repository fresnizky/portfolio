import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateRangeSelector } from './DateRangeSelector'

describe('DateRangeSelector', () => {
  it('should render all period options', () => {
    const onChange = vi.fn()
    render(<DateRangeSelector value="ALL" onChange={onChange} />)

    expect(screen.getByText('1M')).toBeInTheDocument()
    expect(screen.getByText('3M')).toBeInTheDocument()
    expect(screen.getByText('6M')).toBeInTheDocument()
    expect(screen.getByText('1Y')).toBeInTheDocument()
    expect(screen.getByText('Todo')).toBeInTheDocument()
  })

  it('should highlight active period', () => {
    const onChange = vi.fn()
    render(<DateRangeSelector value="3M" onChange={onChange} />)

    const activeButton = screen.getByText('3M')
    expect(activeButton).toHaveClass('bg-blue-500')
    expect(activeButton).toHaveClass('text-white')
  })

  it('should call onChange with selected period', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<DateRangeSelector value="ALL" onChange={onChange} />)

    await user.click(screen.getByText('1M'))
    expect(onChange).toHaveBeenCalledWith('1M')

    await user.click(screen.getByText('6M'))
    expect(onChange).toHaveBeenCalledWith('6M')
  })

  it('should apply hover styles to non-active buttons', () => {
    const onChange = vi.fn()
    render(<DateRangeSelector value="1M" onChange={onChange} />)

    const nonActiveButton = screen.getByText('3M')
    expect(nonActiveButton).toHaveClass('hover:bg-gray-100')
    expect(nonActiveButton).not.toHaveClass('bg-blue-500')
  })
})
