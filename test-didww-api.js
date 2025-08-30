const { DIDWWService } = require('./lib/didww');
require('dotenv').config({ path: '.env.local' });

async function testDIDWWAPI() {
  console.log('Testing DIDWW API Connection\n');
  console.log('=============================\n');
  
  const apiKey = process.env.DIDWW_API_KEY;
  const apiUrl = process.env.DIDWW_API_URL;
  const environment = process.env.DIDWW_ENVIRONMENT;
  
  console.log('Configuration:');
  console.log(`  API URL: ${apiUrl}`);
  console.log(`  Environment: ${environment}`);
  console.log(`  API Key: ${apiKey ? '✓ Present' : '✗ Missing'}`);
  console.log('');
  
  if (!apiKey) {
    console.error('❌ DIDWW_API_KEY is not set!');
    process.exit(1);
  }
  
  try {
    const didwwService = new DIDWWService(apiKey, apiUrl);
    
    // Test 1: Get countries that don't require documents
    console.log('Test 1: Fetching countries without document requirements...');
    const countries = await didwwService.getCountriesWithoutDocuments();
    
    if (countries && countries.length > 0) {
      console.log(`✅ Successfully retrieved ${countries.length} countries`);
      console.log('Sample countries:');
      countries.slice(0, 5).forEach(country => {
        console.log(`  - ${country.name} (${country.iso})`);
      });
    } else {
      console.log('⚠️  No countries found or empty response');
    }
    console.log('');
    
    // Test 2: Get area codes for US
    console.log('Test 2: Fetching US area codes...');
    const usAreaCodes = await didwwService.getAreaCodesForCountry('US');
    
    if (usAreaCodes && usAreaCodes.length > 0) {
      console.log(`✅ Successfully retrieved ${usAreaCodes.length} US area codes`);
      console.log('Sample area codes:');
      usAreaCodes.slice(0, 5).forEach(area => {
        console.log(`  - ${area.code}: ${area.name}`);
      });
    } else {
      console.log('⚠️  No US area codes found');
    }
    console.log('');
    
    // Test 3: Search for available numbers in US
    console.log('Test 3: Searching for available US phone numbers...');
    const availableNumbers = await didwwService.getAvailableNumbers('US', '212');
    
    if (availableNumbers && availableNumbers.length > 0) {
      console.log(`✅ Successfully found ${availableNumbers.length} available numbers`);
      console.log('Sample available numbers:');
      availableNumbers.slice(0, 3).forEach(num => {
        console.log(`  - ${num.number}`);
        console.log(`    Setup: $${num.setup_price}, Monthly: $${num.monthly_price}`);
      });
    } else {
      console.log('⚠️  No available numbers found for US area code 212');
    }
    console.log('');
    
    // Summary
    console.log('=============================');
    console.log('API CONNECTION TEST SUMMARY\n');
    
    if (countries && countries.length > 0) {
      console.log('✅ DIDWW API connection successful!');
      console.log('✅ Authentication working correctly');
      console.log('✅ API endpoints responding');
      console.log('\n🎉 Ready for production use!');
    } else {
      console.log('⚠️  API connection established but no data returned');
      console.log('Check if the API key has proper permissions');
    }
    
  } catch (error) {
    console.error('\n❌ DIDWW API Test Failed!\n');
    console.error('Error details:', error.message);
    
    if (error.message.includes('401')) {
      console.error('\n🔑 Authentication Error: Check your API key');
    } else if (error.message.includes('network')) {
      console.error('\n🌐 Network Error: Check internet connection and API URL');
    } else {
      console.error('\n⚠️  Unexpected error - see details above');
    }
    
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the test
testDIDWWAPI();