# NumNinja Development Plan

## Current Status ✅
- Authentication system: Working with session persistence
- UI/UX: Complete for browsing, cart, pricing, support
- Database schema: Designed and ready for migration
- API integrations: DIDWW and Stripe libraries prepared
- Provisioning system: Built with queue and retry logic

## Development Phases

### Phase 1: Database Setup & Migration (2-3 days)
**Goal**: Get the database structure in place and seed initial data

#### Tasks:
1. **Run Supabase Migrations**
   - Apply `001_initial_schema.sql` to create all tables
   - Verify RLS policies are working correctly
   - Test user isolation (users can only see their own data)

2. **Create Additional Migration for Missing Tables**
   ```sql
   -- 002_additional_tables.sql
   -- Orders table for tracking purchases
   CREATE TABLE orders (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     user_id UUID NOT NULL REFERENCES auth.users(id),
     stripe_session_id TEXT UNIQUE,
     stripe_payment_intent_id TEXT,
     amount_total DECIMAL(10, 2),
     currency VARCHAR(3) DEFAULT 'usd',
     status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
     metadata JSONB,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Provisioning queue table
   CREATE TABLE provisioning_queue (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     purchased_number_id UUID NOT NULL REFERENCES purchased_numbers(id),
     action VARCHAR(50) NOT NULL,
     status VARCHAR(20) DEFAULT 'pending',
     priority INTEGER DEFAULT 5,
     attempts INTEGER DEFAULT 0,
     max_attempts INTEGER DEFAULT 3,
     scheduled_for TIMESTAMPTZ DEFAULT NOW(),
     processed_at TIMESTAMPTZ,
     error_message TEXT,
     metadata JSONB,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

3. **Seed Initial Data**
   - Import countries that don't require documents
   - Import area codes with pricing
   - Create test phone numbers for development

4. **Create Admin Tools**
   - Script to import country/area code data from DIDWW
   - Admin page to manage pricing markups
   - Tool to sync available numbers

### Phase 2: Complete Payment Flow (3-4 days)
**Goal**: Enable users to purchase phone numbers through Stripe

#### Tasks:
1. **Environment Configuration**
   ```env
   # .env.local
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

2. **Checkout Implementation**
   - Connect `/app/checkout/page.tsx` to Stripe
   - Create checkout session with cart items
   - Handle success/cancel redirects
   - Store order details in database

3. **Webhook Handler**
   - Implement `/api/checkout/webhook`
   - Handle `checkout.session.completed` event
   - Create purchased_numbers records
   - Add to provisioning queue
   - Send confirmation email

4. **Payment Testing**
   - Test with Stripe test cards
   - Verify order creation
   - Check provisioning queue entries
   - Test error scenarios

### Phase 3: Number Provisioning Implementation (4-5 days)
**Goal**: Automatically provision numbers after payment

#### Tasks:
1. **DIDWW Integration Setup**
   ```env
   DIDWW_API_KEY=your_api_key
   DIDWW_API_URL=https://api.didww.com/v3
   USE_MOCK_DIDWW=false  # Switch to real API
   ```

2. **Provisioning Queue Processor**
   - Create background job runner
   - Process provisioning queue
   - Handle retries with exponential backoff
   - Update number status in real-time

3. **Number Configuration API**
   - Implement forwarding configuration
   - SMS email forwarding setup
   - Voicemail configuration
   - Business hours routing

4. **Error Handling**
   - Handle DIDWW API failures
   - Implement manual retry mechanism
   - Admin notification for failures
   - User notification system

### Phase 4: Number Management Features (3-4 days)
**Goal**: Let users manage their purchased numbers

#### Tasks:
1. **My Numbers Dashboard**
   - List all user's numbers
   - Show provisioning status
   - Display configuration options
   - Usage statistics

2. **Configuration Pages**
   - Call forwarding settings
   - SMS forwarding settings
   - Voicemail settings
   - Business hours configuration

3. **Call Detail Records**
   - Fetch CDRs from DIDWW
   - Display call history
   - Export functionality
   - Basic analytics

4. **SMS History**
   - Store incoming SMS
   - Display SMS history
   - Search and filter
   - Export functionality

### Phase 5: Production Readiness (2-3 days)
**Goal**: Prepare for production launch

#### Tasks:
1. **Security Hardening**
   - API rate limiting
   - Input validation
   - CORS configuration
   - Security headers

2. **Performance Optimization**
   - Database indexes
   - API response caching
   - Image optimization
   - Code splitting

3. **Monitoring & Logging**
   - Error tracking (Sentry)
   - Performance monitoring
   - Uptime monitoring
   - User analytics

4. **Documentation**
   - API documentation
   - User guide
   - Terms of Service
   - Privacy Policy

## Implementation Order

### Week 1
- Day 1-2: Database setup and migrations
- Day 3-4: Stripe checkout flow
- Day 5: Webhook implementation

### Week 2
- Day 1-2: DIDWW real integration
- Day 3-4: Provisioning queue processor
- Day 5: Number configuration APIs

### Week 3
- Day 1-2: User dashboard improvements
- Day 3: CDR and SMS features
- Day 4-5: Testing and bug fixes

## Key Decisions Needed

1. **Pricing Strategy**
   - Markup percentage over DIDWW costs?
   - Setup fees vs monthly only?
   - Volume discounts?

2. **Feature Scope**
   - Start with US/Canada only?
   - SMS support from day 1?
   - Call recording features?

3. **Technical Choices**
   - Background job processing (Vercel Cron, external service)?
   - Real-time updates (WebSockets, polling)?
   - Admin panel (custom, third-party)?

## Risk Mitigation

1. **DIDWW API Issues**
   - Keep mock mode as fallback
   - Implement circuit breaker pattern
   - Cache available numbers

2. **Payment Failures**
   - Clear error messages
   - Manual provisioning option
   - Refund process

3. **Scaling Concerns**
   - Database connection pooling
   - API rate limiting
   - CDN for static assets

## Success Metrics

- User can purchase a number in < 3 minutes
- 99% provisioning success rate
- < 5 minute provisioning time
- 95% user satisfaction score

## Next Steps

1. Review and approve this plan
2. Set up development environment
3. Start with Phase 1: Database Setup
4. Daily progress updates
5. Weekly demos