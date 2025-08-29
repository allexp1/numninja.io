#!/usr/bin/env node

/**
 * Test Stripe webhook endpoint
 * Usage: node scripts/test-stripe-webhook.js [environment]
 * 
 * IMPORTANT: Set STRIPE_WEBHOOK_SECRET in your environment variables
 * Do not hardcode secrets in the code!
 */

const crypto = require('crypto');
const https = require('https');
const http = require('http');

const CONFIG = {
  local: {
    url: 'http://localhost:3000/api/checkout/webhook',
    secret: process.env.STRIPE_WEBHOOK_SECRET_LOCAL || process.env.STRIPE_WEBHOOK_SECRET
  },
  production: {
    url: 'https://numninja-io.vercel.app/api/checkout/webhook',
    secret: process.env.STRIPE_WEBHOOK_SECRET
  }
};

const environment = process.argv[2] || 'local';
const config = CONFIG[environment];

if (!config) {
  console.error('Invalid environment. Use "local" or "production"');
  process.exit(1);
}

if (!config.secret) {
  console.error('Error: STRIPE_WEBHOOK_SECRET environment variable is not set');
  console.error('Please set it in your environment or .env.local file');
  process.exit(1);
}

// Create a test webhook payload
const payload = JSON.stringify({
  id: 'evt_test_' + Date.now(),
  object: 'event',
  api_version: '2023-10-16',
  created: Math.floor(Date.now() / 1000),
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_test_' + Date.now(),
      object: 'checkout.session',
      amount_total: 2900,
      currency: 'usd',
      customer: 'cus_test123',
      customer_email: 'test@example.com',
      metadata: {
        userId: 'test-user-123',
        numbers: JSON.stringify([
          {
            id: 'num_123',
            phoneNumber: '+14155551234',
            countryCode: 'US',
            price: 29.00
          }
        ])
      },
      payment_status: 'paid',
      status: 'complete'
    }
  }
});

// Generate Stripe signature
const timestamp = Math.floor(Date.now() / 1000);
const signedPayload = `${timestamp}.${payload}`;
const signature = crypto
  .createHmac('sha256', config.secret)
  .update(signedPayload)
  .digest('hex');

const stripeSignature = `t=${timestamp},v1=${signature}`;

// Parse URL
const url = new URL(config.url);
const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'stripe-signature': stripeSignature
  }
};

console.log(`Testing ${environment} webhook at ${config.url}`);
console.log('Payload:', JSON.parse(payload));
console.log('Signature:', stripeSignature);

const protocol = url.protocol === 'https:' ? https : http;
const req = protocol.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\nResponse Status:', res.statusCode);
    console.log('Response Headers:', res.headers);
    if (data) {
      try {
        console.log('Response Body:', JSON.parse(data));
      } catch {
        console.log('Response Body:', data);
      }
    }
  });
});

req.on('error', (error) => {
  console.error('Request Error:', error);
});

req.write(payload);
req.end();