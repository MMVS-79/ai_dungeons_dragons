// jest.config.ts

import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({
  dir: './',
})

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^lib/(.*)$': '<rootDir>/lib/$1', 
  },
  
  transformIgnorePatterns: [
    '/node_modules/(?!(.*@(google/genai)|.*lib.*)/)',
  ],
  
  testMatch: [
    '<rootDir>/test/**/*.(test|spec).(ts|tsx)',
    '<rootDir>/lib/**/__tests__/**/*.(test|spec).(ts|tsx)'
  ],
}

export default createJestConfig(config)