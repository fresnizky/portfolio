import { describe, it, expect, afterAll, beforeAll } from 'vitest'
import { existsSync } from 'fs'
import { join } from 'path'
import { prisma } from './database'

describe('Database', () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('Prisma Client Generation', () => {
    it('should have Prisma client generated in node_modules', () => {
      // Verify Prisma client types exist after generation
      const prismaClientPath = join(__dirname, '../../node_modules/@prisma/client')
      expect(existsSync(prismaClientPath)).toBe(true)
    })
  })

  describe('Database Connection', () => {
    it('should connect to PostgreSQL', async () => {
      await expect(prisma.$connect()).resolves.not.toThrow()
    })

    it('should execute raw query successfully', async () => {
      const result = await prisma.$queryRaw`SELECT 1 as test`
      expect(result).toBeDefined()
    })
  })

  describe('User Model', () => {
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
      const count = await prisma.user.count()
      expect(typeof count).toBe('number')
    })

    it('should verify User table exists with correct structure', async () => {
      // Query the actual database to verify table structure
      const tableInfo = await prisma.$queryRaw<Array<{ column_name: string; data_type: string }>>`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        ORDER BY ordinal_position
      `
      
      const columns = tableInfo.map(col => col.column_name)
      
      expect(columns).toContain('id')
      expect(columns).toContain('email')
      expect(columns).toContain('passwordHash')
      expect(columns).toContain('createdAt')
      expect(columns).toContain('updatedAt')
    })

    it('should have unique constraint on email', async () => {
      const indexInfo = await prisma.$queryRaw<Array<{ indexname: string }>>`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'User' AND indexname LIKE '%email%'
      `
      
      expect(indexInfo.length).toBeGreaterThan(0)
      expect(indexInfo.some(idx => idx.indexname.includes('email'))).toBe(true)
    })

    it('should be able to create and delete a test user', async () => {
      const testEmail = `test-${Date.now()}@example.com`
      
      // Create test user
      const createdUser = await prisma.user.create({
        data: {
          email: testEmail,
          passwordHash: 'test-hash-not-real',
        },
      })
      
      expect(createdUser.id).toBeDefined()
      expect(createdUser.email).toBe(testEmail)
      expect(createdUser.createdAt).toBeInstanceOf(Date)
      expect(createdUser.updatedAt).toBeInstanceOf(Date)
      
      // Clean up - delete the test user
      await prisma.user.delete({
        where: { id: createdUser.id },
      })
      
      // Verify deletion
      const deletedUser = await prisma.user.findUnique({
        where: { id: createdUser.id },
      })
      expect(deletedUser).toBeNull()
    })
  })
})
