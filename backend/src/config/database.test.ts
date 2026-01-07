import { describe, it, expect, afterAll } from 'vitest'
import { prisma } from './database'

describe('Database', () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('should connect to PostgreSQL', async () => {
    await expect(prisma.$connect()).resolves.not.toThrow()
  })

  it('should have User model with correct fields', () => {
    // Type check - this compiles = types are correct
    const userFields = prisma.user.fields
    expect(userFields).toHaveProperty('id')
    expect(userFields).toHaveProperty('email')
    expect(userFields).toHaveProperty('passwordHash')
    expect(userFields).toHaveProperty('createdAt')
    expect(userFields).toHaveProperty('updatedAt')
  })

  it('should be able to perform type-safe queries', async () => {
    // This test verifies TypeScript types work correctly
    // We're just checking the query compiles, not the result
    const count = await prisma.user.count()
    expect(typeof count).toBe('number')
  })
})
