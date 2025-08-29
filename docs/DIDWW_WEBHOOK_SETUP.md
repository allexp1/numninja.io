# DIDWW Webhook Configuration Guide for Production

## Overview
This guide will help you configure DIDWW webhooks to handle real-time events for your NumNinja virtual number marketplace.

## Webhook Endpoint
Your production webhook endpoint is:
```
https://numninja-io.vercel.app/api/webhooks/didww
```

## Events Handled
The webhook endpoint handles the following DIDWW events:
- **did.provisioned** - When a number is successfully provisioned
- **did.released** - When a number is released/cancelled
- **did.suspended** - When a number is suspended
- **did.activated** - When a suspended number is reactivated
- **cdr.created** - Call Detail Records (incoming/outgoing calls)
- **sms.received** - Incoming SMS messages
- **voicemail.received** - Voicemail notifications

## Step-by-Step Configuration

### 1. Log into DIDWW Dashboard
1. Go to https://www.didww.com
2. Log in with your DIDWW account credentials
3. Navigate to the API section or Webhooks configuration

### 2. Create Webhook Configuration
1. Click on "Webhooks" or "API Webhooks" in the dashboard
2. Click "Add New Webhook" or "Configure Webhook"
3. Enter the following details:
   - **Webhook URL**: `https://numninja-io.vercel.app/api/webhooks/didww`
   - **Method**: POST
   - **Content Type**: application/json
   - **Events**: Select all events you want to receive (recommended: all events listed above)

### 3. Configure Webhook Secret
1. Generate a secure webhook secret (DIDWW may provide one or you can generate your own)
2. Copy the webhook secret
3. Add it to your Vercel environment variables:
   ```
   DIDWW_WEBHOOK_SECRET=your-webhook-secret-here
   ```

### 4. Add Environment Variables in Vercel
1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your NumNinja project
3. Go to Settings → Environment Variables
4. Add the following variables for Production:
   ```
   DIDWW_WEBHOOK_SECRET=your-webhook-secret-from-didww
   ```
5. Redeploy your application for the changes to take effect

### 5. Configure Webhook Headers (if required by DIDWW)
If DIDWW requires specific headers:
- **Signature Header**: `x-didww-signature`
- **Content-Type**: `application/json`

### 6. Test Webhook Configuration
1. In DIDWW dashboard, look for a "Test Webhook" button
2. Send a test event to verify the connection
3. Check your Vercel function logs to confirm receipt

## Webhook Security
The webhook endpoint implements the following security measures:
- **Signature Verification**: Validates HMAC-SHA256 signature in production
- **Timing-Safe Comparison**: Prevents timing attacks
- **Environment Check**: Only enforces signature verification in production

## Testing Webhooks Locally

### Using ngrok (Recommended for Development)
```bash
# Install ngrok
npm install -g ngrok

# Run your Next.js app
npm run dev

# In another terminal, expose your local server
ngrok http 3000

# Use the ngrok URL for webhook testing
# Example: https://abc123.ngrok.io/api/webhooks/didww
```

### Sample Webhook Payload
```json
{
  "type": "did.provisioned",
  "data": {
    "did_id": "12345",
    "phone_number": "+1234567890",
    "status": "active",
    "country": "US",
    "city": "New York"
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Monitoring and Debugging

### Check Webhook Logs in Vercel
1. Go to your Vercel dashboard
2. Navigate to Functions → Logs
3. Filter for `/api/webhooks/didww`
4. Monitor incoming webhook requests and responses

### Common Issues and Solutions

#### Issue: 401 Unauthorized
**Solution**: Verify that `DIDWW_WEBHOOK_SECRET` is correctly set in Vercel environment variables

#### Issue: Webhook not receiving events
**Solution**: 
- Verify the webhook URL is correct
- Check if DIDWW requires IP whitelisting
- Ensure your endpoint returns 200 status code

#### Issue: Database updates not working
**Solution**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in environment variables

## Database Tables Updated by Webhooks

The webhook handler updates the following Supabase tables:
- **purchased_numbers** - Updates provisioning status and active state
- **call_detail_records** - Stores call history
- **sms_records** - Stores SMS messages
- **number_usage_stats** - Tracks usage statistics

## Email Notifications (Future Enhancement)
The webhook handler includes placeholder code for email notifications:
- SMS forwarding to configured email
- Voicemail notifications

To enable email notifications, integrate with an email service like:
- SendGrid
- Resend
- AWS SES
- Postmark

## Additional DIDWW API Configuration

### Required DIDWW API Settings
Ensure these are configured in your DIDWW account:
1. **API Access**: Enable API access for your account
2. **Voice Configuration**: Set up voice endpoints if using call forwarding
3. **SMS Configuration**: Enable SMS if offering SMS services
4. **Coverage**: Configure available countries and regions

### DIDWW API Credentials in Production
Make sure these are set in Vercel:
```
DIDWW_API_KEY=your-production-api-key
DIDWW_API_URL=https://api.didww.com/v3
```

## Support and Resources

### DIDWW Documentation
- API Docs: https://doc.didww.com/api
- Webhook Events: https://doc.didww.com/api/webhooks
- Support: support@didww.com

### NumNinja Support
- Check logs in Vercel Functions
- Review webhook endpoint code: `/app/api/webhooks/didww/route.ts`
- Monitor Supabase database for updates

## Next Steps
1. Configure webhook in DIDWW dashboard
2. Add webhook secret to Vercel environment variables
3. Test with a sample event
4. Monitor production logs
5. Set up email notifications (optional)