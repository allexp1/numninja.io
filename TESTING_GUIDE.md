# NumNinja Testing Guide - Step by Step

## 🧪 Local Testing Setup

### Step 1: Start the Development Environment

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Open browser
open http://localhost:3000
```

### Step 2: Test User Registration & Authentication

1. **Create Test User**
   - Navigate to `/auth/signup`
   - Register with email: `test@example.com`
   - Password: `TestPass123!`
   - Verify email confirmation

2. **Test Sign In/Out**
   - Sign out from dashboard
   - Sign in at `/auth/signin`
   - Test "Forgot Password" flow

3. **Admin Access**
   - Sign in with `admin@test.com` (password: `admin123`)
   - Navigate to `/admin-bypass` for admin dashboard
   - Check system statistics

### Step 3: Test Number Browsing & Cart

1. **Browse Numbers**
   - Go to `/numbers`
   - Select country: United States
   - Choose area code: 213 (Los Angeles)
   - View available numbers

2. **Cart Operations**
   - Add 2-3 numbers to cart
   - Go to `/cart`
   - Verify cart displays correctly
   - Remove one item
   - Update quantities

### Step 4: Test Checkout Flow (Stripe Test Mode)

1. **Initiate Checkout**
   - Click "Proceed to Checkout" in cart
   - You'll be redirected to Stripe

2. **Test Payment**
   Use Stripe test cards:
   ```
   Success: 4242 4242 4242 4242
   Decline: 4000 0000 0000 0002
   3D Secure: 4000 0025 0000 3155
   
   Expiry: Any future date
   CVC: Any 3 digits
   ZIP: Any 5 digits
   ```

3. **Verify Success**
   - After payment, redirected to `/checkout/success`
   - Check email for confirmation (if Resend configured)
   - Verify order in database

### Step 5: Test Provisioning Queue

1. **Monitor Queue Processing**
   ```bash
   # In a new terminal, watch the provisioning queue
   npm run dev
   # Check console logs for provisioning messages
   ```

2. **Verify Number Status**
   - Go to `/my-numbers`
   - Check provisioning status changes from "pending" → "active"
   - Note the DIDWW ID assigned

### Step 6: Test Number Management

1. **Configure Number**
   - In `/my-numbers`, select a number
   - Click "Edit" configuration
   - Set forwarding type: Mobile
   - Enter forwarding number: +1234567890
   - Enable voicemail
   - Save configuration

2. **View Statistics**
   - Check usage statistics (mock data)
   - Review call logs
   - Verify data displays correctly

### Step 7: Test API Endpoints

```bash
# Test provisioning status
curl -X POST http://localhost:3000/api/provisioning/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Test configuration update
curl -X POST http://localhost:3000/api/provisioning/configure \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "purchasedNumberId": "YOUR_NUMBER_ID",
    "config": {
      "forwardingType": "mobile",
      "forwardingNumber": "+1234567890"
    }
  }'
```

### Step 8: Test Webhook Processing

1. **Stripe Webhook Testing**
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe
   
   # Login to Stripe
   stripe login
   
   # Forward webhooks to local
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   
   # Trigger test events
   stripe trigger checkout.session.completed
   ```

2. **Monitor Webhook Logs**
   - Check console for webhook processing
   - Verify database updates

## 🚀 Production Testing Checklist

### Pre-Deployment Tests

- [ ] All environment variables set correctly
- [ ] Database migrations run successfully
- [ ] RLS policies enabled and tested
- [ ] Email service configured and tested
- [ ] Stripe production keys configured
- [ ] DIDWW credentials validated

### Post-Deployment Tests

- [ ] User registration with real email
- [ ] Complete purchase with real card
- [ ] Number provisioning completes
- [ ] Email notifications received
- [ ] Admin panel accessible
- [ ] Webhooks receiving events
- [ ] Error tracking working

## 🔍 Testing Scenarios

### Scenario 1: New User Journey
1. Register new account
2. Browse and select number
3. Complete purchase
4. Configure number
5. View dashboard

### Scenario 2: Subscription Management
1. Purchase multiple numbers
2. Cancel one subscription
3. Verify billing updates
4. Check number deactivation

### Scenario 3: Error Handling
1. Test with expired card
2. Test provisioning failure
3. Test network timeouts
4. Verify error messages

### Scenario 4: Performance Testing
1. Load test with multiple users
2. Test with slow network
3. Verify page load times
4. Check API response times

## 📊 Next Steps & Enhancements

### Immediate Priorities

1. **Mobile App Development**
   - React Native app for iOS/Android
   - Push notifications
   - Biometric authentication

2. **Advanced Features**
   - Virtual PBX functionality
   - IVR menu builder
   - Call recording storage
   - SMS automation workflows
   - Number porting service

3. **Analytics Dashboard**
   - Detailed call analytics
   - Cost analysis reports
   - Usage trends
   - Revenue tracking

### Business Expansion

1. **B2B Features**
   - Team accounts
   - Role-based permissions
   - Bulk number purchases
   - API access for integration
   - White-label options

2. **Geographic Expansion**
   - Add more countries
   - Local payment methods
   - Multi-language support
   - Regional compliance

3. **Integration Ecosystem**
   - CRM integrations (Salesforce, HubSpot)
   - Zapier integration
   - Slack/Teams notifications
   - Google Workspace addon

### Technical Improvements

1. **Performance Optimization**
   ```javascript
   // Implement caching
   - Redis for session management
   - CDN for static assets
   - Database query optimization
   - API response caching
   ```

2. **Security Enhancements**
   ```javascript
   // Additional security layers
   - 2FA implementation
   - IP whitelisting
   - Rate limiting
   - DDoS protection
   - Security audit logging
   ```

3. **Monitoring & Observability**
   ```javascript
   // Production monitoring
   - APM with DataDog/New Relic
   - Log aggregation (ELK stack)
   - Uptime monitoring
   - Custom alerting rules
   ```

### Revenue Optimization

1. **Pricing Strategies**
   - Volume discounts
   - Annual plans
   - Premium features tier
   - Pay-as-you-go options

2. **Upsell Opportunities**
   - Premium number selection
   - Advanced analytics
   - Priority support
   - Custom integrations

3. **Marketing Features**
   - Referral program
   - Affiliate system
   - Promotional codes
   - Loyalty rewards

## 🛠️ Development Workflow

### Continuous Integration

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm ci
      - run: npm test
      - run: npm run build
```

### Staging Environment

1. Create staging branch
2. Deploy to staging.numninja.io
3. Run integration tests
4. User acceptance testing
5. Deploy to production

## 📝 Testing Commands Reference

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Check TypeScript
npm run type-check

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Start production server
npm start
```

## 🚨 Troubleshooting Common Issues

### Authentication Issues
- Clear browser cookies
- Check Supabase session
- Verify JWT tokens
- Review RLS policies

### Payment Issues
- Verify Stripe keys
- Check webhook secrets
- Review payment logs
- Test with different cards

### Provisioning Issues
- Check DIDWW credentials
- Verify API connectivity
- Review queue status
- Check error logs

### Email Issues
- Verify Resend API key
- Check spam folders
- Review email templates
- Test SMTP settings

## 📞 Support Resources

- **Documentation**: `/docs`
- **API Reference**: `/api-docs`
- **Status Page**: `status.numninja.io`
- **Support Email**: `support@numninja.io`
- **Developer Discord**: `discord.gg/numninja`