const express = require('express')

describe('Backend Setup', () => {
  it('should have express available', () => {
    expect(express).toBeDefined()
  })

  it('should be able to create an express app', () => {
    const app = express()
    expect(app).toBeDefined()
    expect(typeof app.listen).toBe('function')
  })
})

describe('Basic Math', () => {
  it('should add numbers correctly', () => {
    expect(2 + 2).toBe(4)
  })

  it('should multiply numbers correctly', () => {
    expect(3 * 4).toBe(12)
  })
}) 