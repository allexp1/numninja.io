#!/usr/bin/env node

/**
 * Test script for localStorage authentication system
 * This tests the full authentication flow including:
 * - Sign in with credentials
 * - Store tokens in localStorage simulation
 * - Make authenticated API calls
 * - Verify token handling
 */

const https = require('https');
const http = require('http');

// Test configuration
const CONFIG = {
  local: {
    baseUrl: 'http://localhost:3000',
    testUser: {
      email: 'test@test.com',  // Use the test user we just created
      password: 'test123456'
    }
  },
  production: {
    baseUrl: 'https://numninja-io.vercel.app',
    testUser: {
      email: 'test@test.com',
      password: 'test123456'
    }
  }
};

// Make HTTP request
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = url.startsWith('https');
    const protocol = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    console.log(`\n→ ${requestOptions.method} ${url}`);
    if (options.body) {
      requestOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
    }

    const req = protocol.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data ? JSON.parse(data) : null
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Test 1: Sign In
async function testSignIn(env) {
  console.log('\n🔐 TEST 1: Sign In');
  console.log('═══════════════════');
  
  const config = CONFIG[env];
  const url = `${config.baseUrl}/api/auth/signin`;
  
  try {
    const response = await makeRequest(url, {
      method: 'POST',
      body: JSON.stringify(config.testUser)
    });
    
    console.log(`✓ Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ Sign in successful!');
      console.log('📦 Response:', {
        hasAccessToken: !!response.data?.access_token,
        hasRefreshToken: !!response.data?.refresh_token,
        hasUser: !!response.data?.user,
        userEmail: response.data?.user?.email
      });
      
      return {
        success: true,
        accessToken: response.data?.access_token,
        refreshToken: response.data?.refresh_token,
        user: response.data?.user
      };
    } else {
      console.log('❌ Sign in failed');
      console.log('Error:', response.data);
      return { success: false };
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return { success: false };
  }
}

// Test 2: Protected API Call
async function testProtectedAPI(env, accessToken) {
  console.log('\n🔒 TEST 2: Protected API Call');
  console.log('══════════════════════════════');
  
  const config = CONFIG[env];
  const url = `${config.baseUrl}/api/provisioning/status`;
  
  try {
    const response = await makeRequest(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log(`✓ Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ API call successful!');
      console.log('📦 Response:', {
        success: response.data?.success,
        dataCount: response.data?.data?.length || 0
      });
      return { success: true, data: response.data };
    } else {
      console.log('❌ API call failed');
      console.log('Error:', response.data);
      return { success: false };
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return { success: false };
  }
}

// Test 3: Invalid Token
async function testInvalidToken(env) {
  console.log('\n🚫 TEST 3: Invalid Token');
  console.log('═════════════════════════');
  
  const config = CONFIG[env];
  const url = `${config.baseUrl}/api/provisioning/status`;
  
  try {
    const response = await makeRequest(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid_token_12345'
      }
    });
    
    console.log(`✓ Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('✅ Correctly rejected invalid token');
      return { success: true };
    } else {
      console.log('❌ Should have rejected invalid token');
      return { success: false };
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return { success: false };
  }
}

// Test 4: No Token
async function testNoToken(env) {
  console.log('\n🚷 TEST 4: No Token');
  console.log('═══════════════════');
  
  const config = CONFIG[env];
  const url = `${config.baseUrl}/api/provisioning/status`;
  
  try {
    const response = await makeRequest(url, {
      method: 'POST'
    });
    
    console.log(`✓ Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('✅ Correctly rejected request without token');
      return { success: true };
    } else {
      console.log('❌ Should have rejected request without token');
      return { success: false };
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return { success: false };
  }
}

// Run all tests
async function runTests(env) {
  console.log('\n🧪 localStorage Authentication System Test');
  console.log('══════════════════════════════════════════');
  console.log(`Environment: ${env}`);
  console.log(`Base URL: ${CONFIG[env].baseUrl}`);
  console.log(`Test User: ${CONFIG[env].testUser.email}`);
  
  const results = {
    signIn: false,
    protectedAPI: false,
    invalidToken: false,
    noToken: false
  };
  
  // Test 1: Sign In
  const signInResult = await testSignIn(env);
  results.signIn = signInResult.success;
  
  if (signInResult.success && signInResult.accessToken) {
    // Test 2: Protected API with valid token
    const apiResult = await testProtectedAPI(env, signInResult.accessToken);
    results.protectedAPI = apiResult.success;
  }
  
  // Test 3: Invalid token
  const invalidResult = await testInvalidToken(env);
  results.invalidToken = invalidResult.success;
  
  // Test 4: No token
  const noTokenResult = await testNoToken(env);
  results.noToken = noTokenResult.success;
  
  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('═══════════════');
  console.log(`✓ Sign In: ${results.signIn ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`✓ Protected API: ${results.protectedAPI ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`✓ Invalid Token: ${results.invalidToken ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`✓ No Token: ${results.noToken ? '✅ PASSED' : '❌ FAILED'}`);
  
  const passedTests = Object.values(results).filter(r => r).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🏆 Final Score: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Authentication system is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Please check the authentication implementation.');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const env = args[0] || 'local';
  
  if (!CONFIG[env]) {
    console.error(`Unknown environment: ${env}`);
    console.log('Usage: node test-auth-system.js [local|production]');
    return;
  }
  
  await runTests(env);
}

// Run the tests
main();