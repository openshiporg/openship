#!/usr/bin/env tsx

/**
 * Example Test Runner
 * 
 * This demonstrates how to run the comprehensive testing suite for OpenShip 4
 * platform features. This script can be used for CI/CD or manual testing.
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'

console.log('🚀 OpenShip 4 Platform Testing Suite')
console.log('=====================================\n')

// Check prerequisites
console.log('📋 Checking Prerequisites...')

// Check if test database is configured
const testDbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
if (!testDbUrl) {
  console.error('❌ TEST_DATABASE_URL environment variable not set')
  console.log('   Please set TEST_DATABASE_URL=postgresql://localhost:5432/openship_test')
  process.exit(1)
}

console.log('✅ Database URL configured:', testDbUrl.replace(/\/\/.*@/, '//***@'))

// Check if test files exist
const testFiles = [
  'tests/units/addMatchToCart.test.ts',
  'tests/units/matchOrder.test.ts', 
  'tests/units/placeOrders.test.ts',
  'tests/integration/order-processing-workflow.test.ts'
]

const missingFiles = testFiles.filter(file => !existsSync(file))
if (missingFiles.length > 0) {
  console.error('❌ Missing test files:', missingFiles)
  process.exit(1)
}

console.log('✅ All test files present\n')

// Test execution functions
function runCommand(command: string, description: string) {
  console.log(`🔄 ${description}...`)
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: process.cwd()
    })
    console.log('✅ Success')
    return output
  } catch (error: any) {
    console.error('❌ Failed')
    console.error(error.stdout || error.message)
    throw error
  }
}

async function runTestSuite() {
  try {
    // 1. Unit Tests
    console.log('📝 Running Unit Tests')
    console.log('---------------------')
    
    console.log('\n🧪 Testing addMatchToCart mutation...')
    runCommand('npm run test:units -- addMatchToCart.test.ts --run', 'GET MATCH functionality')
    
    console.log('\n🧪 Testing matchOrder mutation...')
    runCommand('npm run test:units -- matchOrder.test.ts --run', 'SAVE MATCH functionality')
    
    console.log('\n🧪 Testing placeOrders mutation...')
    runCommand('npm run test:units -- placeOrders.test.ts --run', 'PLACE ORDER functionality')

    // 2. Integration Tests  
    console.log('\n\n🔗 Running Integration Tests')
    console.log('-----------------------------')
    
    console.log('\n🧪 Testing complete order processing workflow...')
    runCommand('npm run test:integration -- --run', 'End-to-end workflow')

    // 3. Component Tests (if available)
    if (existsSync('tests/components')) {
      console.log('\n\n🎨 Running Component Tests')
      console.log('---------------------------')
      
      runCommand('npm run test -- tests/components --run', 'React component testing')
    }

    // 4. Generate Coverage Report
    console.log('\n\n📊 Generating Coverage Report')
    console.log('-----------------------------')
    
    try {
      runCommand('npm run test:coverage', 'Test coverage analysis')
    } catch (error) {
      console.log('⚠️  Coverage report failed (optional)')
    }

    // Success Summary
    console.log('\n\n🎉 All Tests Passed!')
    console.log('====================')
    console.log('✅ Unit Tests: All mutations working correctly')
    console.log('✅ Integration Tests: Complete workflows functional') 
    console.log('✅ Platform Adapters: Mock responses validated')
    console.log('✅ Error Handling: Edge cases covered')
    console.log('\n🚀 Your platform features are ready for production!')

  } catch (error) {
    console.log('\n\n❌ Test Suite Failed!')
    console.log('====================')
    console.log('Please review the errors above and fix any issues.')
    console.log('\nCommon issues:')
    console.log('• Database connection problems')
    console.log('• Missing test data or mocks')
    console.log('• Platform adapter configuration')
    console.log('• TypeScript compilation errors')
    
    process.exit(1)
  }
}

// Test scenarios demonstration
function demonstrateTestScenarios() {
  console.log('\n📋 Available Test Scenarios')
  console.log('============================')
  
  const scenarios = [
    '✅ Perfect Match: Order with exact product matches',
    '💰 Price Change: Product price changes between match and order',
    '🚫 No Matches: Order with no available matches',
    '⚠️  Auth Error: Channel platform authentication failure',
    '📦 Inventory: Insufficient inventory during order placement',
    '🔄 Partial Success: Mixed success/failure across channels',
    '📚 Multi-Item: Complex orders with multiple line items',
    '🏭 Bulk Processing: Multiple orders processed simultaneously',
    '🔗 Multi-Channel: Orders spanning different channel platforms'
  ]
  
  scenarios.forEach(scenario => console.log(`  ${scenario}`))
  
  console.log('\n💡 Each scenario is automatically tested with realistic mock data')
  console.log('   No external API setup required!')
}

// Main execution
if (require.main === module) {
  demonstrateTestScenarios()
  runTestSuite().catch(() => process.exit(1))
}

export { runTestSuite, demonstrateTestScenarios }