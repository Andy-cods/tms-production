import { cn, formatDate, formatFileSize } from '../utils'

describe('cn', () => {
  it('merges multiple classnames', () => {
    const result = cn('foo', 'bar')
    expect(result).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    const result = cn('foo', false && 'bar')
    expect(result).toBe('foo')
  })

  it('removes duplicate Tailwind classes', () => {
    const result = cn('p-4 p-2')
    expect(result).toBe('p-2')
  })

  it('handles empty input', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('handles undefined and null values', () => {
    const result = cn('foo', null, undefined, 'bar')
    expect(result).toBe('foo bar')
  })
})

describe('formatDate', () => {
  it('formats Date object with default format', () => {
    const date = new Date('2025-01-15T10:30:00Z')
    const result = formatDate(date)
    expect(result).toMatch(/15\/01\/2025/)
  })

  it('formats ISO string with custom format', () => {
    const dateString = '2025-01-15T10:30:00Z'
    const result = formatDate(dateString, 'yyyy-MM-dd')
    expect(result).toBe('2025-01-15')
  })

  it('returns empty string for null input', () => {
    const result = formatDate(null)
    expect(result).toBe('')
  })

  it('returns empty string for undefined input', () => {
    const result = formatDate(undefined)
    expect(result).toBe('')
  })

  it('returns Invalid Date for invalid date string', () => {
    const result = formatDate('invalid-date')
    expect(result).toBe('Invalid Date')
  })

  it('formats future date correctly', () => {
    const futureDate = new Date('2030-12-25T15:45:30Z')
    const result = formatDate(futureDate, 'dd/MM/yyyy')
    expect(result).toBe('25/12/2030')
  })
})

describe('formatFileSize', () => {
  it('handles zero bytes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes')
  })

  it('formats bytes correctly', () => {
    expect(formatFileSize(500)).toBe('500 Bytes')
  })

  it('formats kilobytes correctly', () => {
    expect(formatFileSize(1024)).toBe('1.00 KB')
  })

  it('formats kilobytes with decimals', () => {
    expect(formatFileSize(1536)).toBe('1.50 KB')
  })

  it('formats megabytes correctly', () => {
    expect(formatFileSize(1048576)).toBe('1.00 MB')
  })

  it('formats gigabytes correctly', () => {
    expect(formatFileSize(1073741824)).toBe('1.00 GB')
  })

  it('handles null input', () => {
    expect(formatFileSize(null)).toBe('0 Bytes')
  })

  it('handles negative values', () => {
    expect(formatFileSize(-100)).toBe('0 Bytes')
  })
})
