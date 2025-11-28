import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({
  dir: './',
})

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Tell Jest to look for tests in the test directory
    testMatch: ['<rootDir>/test/**/*.(test|spec).(ts|tsx)',
      '<rootDir>/lib/**/__tests__/**/*.(test|spec).(ts|tsx)'
    ],
}

export default createJestConfig(config)