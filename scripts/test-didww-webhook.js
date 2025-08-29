#!/usr/bin/env node

/**
 * Test script for DIDWW webhook endpoint
 * Usage: node scripts/test-didww-webhook.js [local|production]
 */

const crypto = require('crypto');
const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  local: {
    url: 'http://localhost:3000/api/webhooks/didww',
    secret: 'test-secret-for-local-development'
  },
  production: {
    url: 'https://numninja-io.vercel.app/api/webhooks/didww',
    secret: process.env.DIDWW_WEBHOOK_SECRET || 'your-production-webhook-secret'
  }
};

// Test events
const TEST_EVENTS = {
  provisioned: {
    type: 'did.provisioned',
    data: {
      did_id: 'test-did-12345',
      phone_number: '+1234567890',
      status: 'active',
      country: 'US',
      city: 'New York'
    },
    timestamp: new Date().toISOString()
  },
  cdr: {
    type: 'cdr.created',
    data: {
      cdr_id: 'test-cdr-12345',
      did_id: 'test-did-12345',
      direction: 'inbound',
      from_number: '+19876543210',
      to_number: '+1234567890',
      duration: 120,
      answered: true,
      start_time: new Date(Date.now() - 120000).toISOString(),
      end_time: new Date().toISOString(),
      cost: 0.02,
      currency: 'USD'
    },
    timestamp: new Date().toISOString()
  },
  sms: {
    type: 'sms.received',
    data: {
      sms_id: 'test-sms-12345',
      did_id: 'test-did-12345',
      from_number: '+19876543210',
      to_number: '+1234567890',
      message: 'Test SMS message from DIDWW webhook test',
      received_at: new Date().toISOString(),
      cost: 0.01,
      currency: 'USD'
    },
    timestamp: new Date().toISOString()
  },
  voicemail: {
    type: 'voicemail.received',
    data: {
      voicemail_id: 'test-vm-12345',
      did_id: 'test-did-12345',
      from_number: '+19876543210',
      duration: 30,
      recording_url: 'https://example.com/voicemail.mp3',
      received_at: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  },
  released: {
    type: 'did.released',
    data: {
      did_id: 'test-did-12345',
      phone_number: '+1234567890',
      reason: 'Customer requested cancellation'
    },
    timestamp: new Date().toISOString()
  },
  suspended: {
    type: 'did.suspended',
    data: {
      did_id: 'test-did-12345',
      phone_number: '+1234567890',
      reason: 'Payment failure'
    },
    timestamp: new Date().toISOString()
  },
  activated: {
    type: 'did.activated',
    data: {
      did_id: 'test-did-12345',
      phone_number: '+1234567890'
    },
    timestamp: new Date().toISOString()
  }
};

// Generate webhook signature
function generateSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

// Send webhook request
function sendWebhook(url, payload, signature, callback) {
  const isHttps = url.startsWith('https');
  const urlObj = new URL(url);
  
  const options = {
    hostname: urlObj.hostname,
    port: urlObj.port || (isHttps ? 443 : 80),
    path: urlObj.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'x-didww-signature': signature
    }
  };

  const protocol = isHttps ? https : http;
  
  const req = protocol.request(options, (res) => {
    let responseBody = '';
    
    res.on('data', (chunk) => {
      responseBody += chunk;
    });
    
    res.on('end', () => {
      callback(null, {
        statusCode: res.statusCode,
        headers: res.headers,
        body: responseBody
      });
    });
  });
  
  req.on('error', (error) => {
    callback(error);
  });
  
  req.write(payload);
  req.end();
}

// Test a single event
function testEvent(env, eventName) {
  const config = CONFIG[env];
  const event = TEST_EVENTS[eventName];
  
  if (!event) {
    console.error(`Unknown event: ${eventName}`);
    console.log('Available events:', Object.keys(TEST_EVENTS).join(', '));
    return;
  }
  
  const payload = JSON.stringify(event);
  const signature = generateSignature(payload, config.secret);
  
  console.log(`\n🚀 Testing ${eventName} event to ${env} environment`);
  console.log(`URL: ${config.url}`);
  console.log(`Event Type: ${event.type}`);
  console.log(`Payload:`, JSON.stringify(event, null, 2));
  console.log(`Signature: ${signature}`);
  
  sendWebhook(config.url, payload, signature, (error, response) => {
    if (error) {
      console.error('\n❌ Error sending webhook:', error.message);
      return;
    }
    
    console.log(`\n✅ Response received:`);
    console.log(`Status Code: ${response.statusCode}`);
    console.log(`Response Body:`, response.body);
    
    if (response.statusCode === 200) {
      console.log('\n🎉 Webhook test successful!');
    } else {
      console.log('\n⚠️ Webhook returned non-200 status');
    }
  });
}

// Test all events
function testAllEvents(env) {
  const events = Object.keys(TEST_EVENTS);
  let index = 0;
  
  function testNext() {
    if (index >= events.length) {
      console.log('\n✅ All tests completed!');
      return;
    }
    
    testEvent(env, events[index]);
    index++;
    
    // Wait 2 seconds between tests
    setTimeout(testNext, 2000);
  }
  
  testNext();
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const env = args[0] || 'local';
  const eventName = args[1];
  
  if (!CONFIG[env]) {
    console.error(`Unknown environment: ${env}`);
    console.log('Usage: node test-didww-webhook.js [local|production] [event]');
    console.log('Available events:', Object.keys(TEST_EVENTS).join(', '));
    return;
  }
  
  console.log('🔧 DIDWW Webhook Test Tool');
  console.log('==========================');
  
  if (eventName) {
    testEvent(env, eventName);
  } else {
    console.log('Testing all events...');
    testAllEvents(env);
  }
}

// Run the script
main();