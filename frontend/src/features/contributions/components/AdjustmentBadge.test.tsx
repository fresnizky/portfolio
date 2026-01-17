import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdjustmentBadge } from './AdjustmentBadge'

describe('AdjustmentBadge', () => {
  it('should render balanced badge when no adjustment reason', () => {
    render(
      <AdjustmentBadge
        adjustmentReason={null}
        baseAllocation="600.00"
        adjustedAllocation="600.00"
      />
    )

    expect(screen.getByText('Balanceado')).toBeInTheDocument()
  })

  it('should render underweight badge with positive difference', () => {
    render(
      <AdjustmentBadge
        adjustmentReason="underweight"
        baseAllocation="600.00"
        adjustedAllocation="650.00"
      />
    )

    expect(screen.getByText('+$50.00')).toBeInTheDocument()
  })

  it('should render overweight badge with negative difference', () => {
    render(
      <AdjustmentBadge
        adjustmentReason="overweight"
        baseAllocation="400.00"
        adjustedAllocation="350.00"
      />
    )

    expect(screen.getByText('-$50.00')).toBeInTheDocument()
  })

  it('should have blue styling for underweight', () => {
    render(
      <AdjustmentBadge
        adjustmentReason="underweight"
        baseAllocation="600.00"
        adjustedAllocation="650.00"
      />
    )

    const badge = screen.getByText('+$50.00')
    expect(badge.className).toContain('bg-blue-50')
    expect(badge.className).toContain('text-blue-700')
  })

  it('should have orange styling for overweight', () => {
    render(
      <AdjustmentBadge
        adjustmentReason="overweight"
        baseAllocation="400.00"
        adjustedAllocation="350.00"
      />
    )

    const badge = screen.getByText('-$50.00')
    expect(badge.className).toContain('bg-orange-50')
    expect(badge.className).toContain('text-orange-700')
  })

  it('should have green styling for balanced', () => {
    render(
      <AdjustmentBadge
        adjustmentReason={null}
        baseAllocation="200.00"
        adjustedAllocation="200.00"
      />
    )

    const badge = screen.getByText('Balanceado')
    expect(badge.className).toContain('bg-green-50')
    expect(badge.className).toContain('text-green-700')
  })
})
