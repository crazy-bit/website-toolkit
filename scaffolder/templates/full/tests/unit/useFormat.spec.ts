import { describe, it, expect } from 'vitest'
import { clamp, formatNumber, calcHealthLevel } from '~/composables/useFormat'

describe('useFormat', () => {
  it('clamp 限制区间', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(99, 0, 10)).toBe(10)
  })

  it('formatNumber 千分位', () => {
    expect(formatNumber(1234567)).toBe('1,234,567')
  })

  it('calcHealthLevel 健康度分级', () => {
    expect(calcHealthLevel(0.9)).toBe('healthy')
    expect(calcHealthLevel(0.5)).toBe('normal')
    expect(calcHealthLevel(0.2)).toBe('risk')
  })
})
