#!/usr/bin/env node

/**
 * Test script for Stripe webhook endpoint
 * Usage: node scripts/test-stripe-webhook.js [local|production]
 */

const crypto = require('crypto');
const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  local: {
    url: 'http://localhost:3000/api/checkout/webhook',
    secret: 'whsec_test123456789012345678901234567890123456789012345678901234567890' // Match the secret in .env.local
  },
  production: {
    url: 'https://numninja-io.vercel.app/api/checkout/webhook',
    secret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_production_secret'
  }
};

// Test events
const TEST_EVENTS = {
  checkout_completed: {
    id: 'evt_test_' + Date.now(),
    type: 'checkout.session.completed',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'cs_test_' + Date.now(),
        object: 'checkout.session',
        amount_total: 5000,
        currency: 'usd',
        customer: 'cus_test_123',
        customer_email: 'test@example.com',
        metadata: {
          userId: 'test-user-123'
        },
        payment_status: 'paid',
        status: 'complete',
        success_url: 'https://example.com/success',
        line_items: {
          data: [
            {
              description: 'Virtual Phone Number',
              price: {
                unit_amount: 5000,
                product: {
                  name: '+1 234-567-8900',
                  metadata: {
                    countryCode: 'US',
                    areaCode: '234',
                    city: 'New York',
                    phoneNumber: '+12345678900'
                  }
                }
              },
              quantity: 1
            }
          ]
        }
      }
    }
  },
  payment_succeeded: {
    id: 'evt_test_' + Date.now() + '_payment',
    type: 'payment_intent.succeeded',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'pi_test_' + Date.now(),
        object: 'payment_intent',
        amount: 5000,
        currency: 'usd',
        status: 'succeeded',
        metadata: {
          userId: 'test-user-123',
          sessionId: 'cs_test_123'
        }
      }
    }
  },
  subscription_created: {
    id: 'evt_test_' + Date.now() + '_sub',
    type: 'customer.subscription.created',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'sub_test_' + Date.now(),
        object: 'subscription',
        customer: 'cus_test_123',
        status: 'active',
        metadata: {
          userId: 'test-user-123'
        },
        items: {
          data: [
            {
              price: {
                id: 'price_test_123',
                recurring: {
                  interval: 'month'
                }
              }
            }
          ]
        }
      }
    }
  },
  invoice_succeeded: {
    id: 'evt_test_' + Date.now() + '_invoice',
    type: 'invoice.payment_succeeded',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'in_test_' + Date.now(),
        object: 'invoice',
        amount_paid: 5000,
        currency: 'usd',
        customer_email: 'test@example.com',
        subscription: 'sub_test_123',
        created: Math.floor(Date.now() / 1000)
      }
    }
  }
};

// Generate Stripe webhook signature
function generateStripeSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
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
      'stripe-signature': signature
    }
  };

  const protocol = isHttps ? https : http;
  
  console.log('\n📤 Sending webhook to:', url);
  console.log('Headers:', options.headers);
  
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
  const signature = generateStripeSignature(payload, config.secret);
  
  console.log(`\n🚀 Testing ${eventName} event to ${env} environment`);
  console.log(`Event Type: ${event.type}`);
  console.log(`Event ID: ${event.id}`);
  console.log(`Payload size: ${Buffer.byteLength(payload)} bytes`);
  
  sendWebhook(config.url, payload, signature, (error, response) => {
    if (error) {
      console.error('\n❌ Error sending webhook:', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.log('💡 Make sure your local server is running on port 3000');
      }
      return;
    }
    
    console.log(`\n📥 Response received:`);
    console.log(`Status Code: ${response.statusCode}`);
    console.log(`Response Body:`, response.body);
    
    if (response.statusCode === 200) {
      console.log('\n✅ Webhook test successful!');
    } else if (response.statusCode === 400) {
      console.log('\n⚠️ Bad Request - Check webhook secret configuration');
      console.log('Make sure STRIPE_WEBHOOK_SECRET is set correctly');
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
      console.log('\n🎉 All tests completed!');
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
    console.log('Usage: node test-stripe-webhook.js [local|production] [event]');
    console.log('Available events:', Object.keys(TEST_EVENTS).join(', '));
    return;
  }
  
  console.log('🔧 Stripe Webhook Test Tool');
  console.log('===========================');
  console.log(`Environment: ${env}`);
  console.log(`URL: ${CONFIG[env].url}`);
  
  if (env === 'production' && !process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn('\n⚠️ Warning: STRIPE_WEBHOOK_SECRET not set');
    console.log('Set it with: export STRIPE_WEBHOOK_SECRET="whsec_..."');
  }
  
  if (eventName) {
    testEvent(env, eventName);
  } else {
    console.log('Testing all events...');
    testAllEvents(env);
  }
}

// Run the script
main();