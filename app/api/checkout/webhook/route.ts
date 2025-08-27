import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyWebhookSignature, handleSuccessfulPayment } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { provisioningService } from '@/lib/provisioning';
import Stripe from 'stripe';

// Disable body parsing, we need the raw body for webhook signature verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = verifyWebhookSignature(body, signature);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Create Supabase service client for database operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Handle successful payment
        const paymentData = await handleSuccessfulPayment(session);
        
        // Create order record in database
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: paymentData.userId,
            stripe_session_id: paymentData.sessionId,
            stripe_subscription_id: paymentData.subscriptionId,
            total_amount: paymentData.amountTotal,
            currency: paymentData.currency,
            status: 'completed',
            payment_status: paymentData.paymentStatus,
            metadata: {
              items: paymentData.items,
              email: paymentData.email
            }
          })
          .select()
          .single();

        if (orderError) {
          console.error('Error creating order:', orderError);
          throw orderError;
        }

        // Create purchased_numbers records for each item and trigger provisioning
        const provisioningPromises = [];
        
        for (const item of paymentData.items) {
          // Get country and area code IDs from the item metadata
          // These should be passed from the checkout session
          const countryId = item.countryId || item.metadata?.countryId;
          const areaCodeId = item.areaCodeId || item.metadata?.areaCodeId;
          
          // If we don't have the IDs, try to find them
          let finalCountryId = countryId;
          let finalAreaCodeId = areaCodeId;
          
          if (!finalCountryId && item.countryCode) {
            const { data: country } = await supabase
              .from('countries')
              .select('id')
              .eq('code', item.countryCode)
              .single();
            finalCountryId = country?.id;
          }
          
          if (!finalAreaCodeId && finalCountryId && item.areaCode) {
            const { data: areaCode } = await supabase
              .from('area_codes')
              .select('id')
              .eq('country_id', finalCountryId)
              .eq('area_code', item.areaCode)
              .single();
            finalAreaCodeId = areaCode?.id;
          }

          // Create the purchased number record
          const { data: purchasedNumber, error: numberError } = await supabase
            .from('purchased_numbers')
            .insert({
              user_id: paymentData.userId,
              phone_number: item.number || item.phoneNumber,
              country_id: finalCountryId,
              area_code_id: finalAreaCodeId,
              display_name: item.displayName || null,
              is_active: false, // Will be activated after provisioning
              sms_enabled: item.smsEnabled || false,
              provisioning_status: 'pending',
              provisioning_attempts: 0,
              stripe_subscription_id: paymentData.subscriptionId,
              stripe_session_id: paymentData.sessionId,
              monthly_price: item.monthlyPrice,
              setup_price: item.setupPrice,
              purchase_date: new Date().toISOString(),
              expiry_date: item.expiryDate || null
            })
            .select()
            .single();

          if (numberError) {
            console.error('Error creating purchased number record:', numberError);
            continue; // Continue processing other numbers even if one fails
          }

          if (purchasedNumber) {
            // Add default configuration
            const { error: configError } = await supabase
              .from('number_configurations')
              .insert({
                purchased_number_id: purchasedNumber.id,
                forwarding_type: 'none',
                voicemail_enabled: true,
                call_recording_enabled: false,
                business_hours_enabled: false,
                business_hours_timezone: 'UTC',
                weekend_handling: 'forward'
              });

            if (configError) {
              console.error('Error creating number configuration:', configError);
            }

            // Queue provisioning job
            await provisioningService.queueProvisioning(
              purchasedNumber.id,
              'provision',
              10, // High priority for new purchases
              {
                userId: paymentData.userId,
                orderId: order?.id,
                sessionId: paymentData.sessionId
              }
            );

            // Start provisioning asynchronously
            provisioningPromises.push(
              provisioningService.provisionNumber(purchasedNumber.id)
                .then(result => {
                  if (result.success) {
                    console.log(`Successfully provisioned number ${purchasedNumber.phone_number}`);
                  } else {
                    console.error(`Failed to provision number ${purchasedNumber.phone_number}:`, result.error);
                  }
                })
                .catch(error => {
                  console.error(`Error provisioning number ${purchasedNumber.phone_number}:`, error);
                })
            );
          }
        }

        // Clear the user's cart
        const { error: cartError } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', paymentData.userId);

        if (cartError) {
          console.error('Error clearing cart:', cartError);
        }

        // Wait for all provisioning to start (but don't block the webhook response)
        Promise.all(provisioningPromises).catch(error => {
          console.error('Error in provisioning batch:', error);
        });

        console.log('Payment successful for session:', session.id);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment intent succeeded:', paymentIntent.id);
        
        // Update order status if needed
        if (paymentIntent.metadata?.userId) {
          await supabase
            .from('orders')
            .update({ payment_status: 'paid' })
            .eq('stripe_session_id', paymentIntent.metadata.sessionId);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error('Payment failed:', paymentIntent.id);
        
        // Update order status
        if (paymentIntent.metadata?.userId) {
          await supabase
            .from('orders')
            .update({ 
              payment_status: 'failed',
              status: 'failed'
            })
            .eq('stripe_session_id', paymentIntent.metadata.sessionId);
        }
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription created:', subscription.id);
        
        // Update purchased numbers with subscription details
        if (subscription.metadata?.userId) {
          await supabase
            .from('purchased_numbers')
            .update({
              stripe_subscription_id: subscription.id
            })
            .eq('user_id', subscription.metadata.userId)
            .is('stripe_subscription_id', null);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription updated:', subscription.id);
        
        // Handle subscription status changes
        if (subscription.metadata?.userId) {
          const newStatus = subscription.status === 'active' 
            ? 'active' 
            : subscription.status === 'past_due'
            ? 'suspended'
            : 'cancelled';

          // Get all numbers for this subscription
          const { data: numbers } = await supabase
            .from('purchased_numbers')
            .select('id')
            .eq('stripe_subscription_id', subscription.id);

          if (numbers && numbers.length > 0) {
            for (const number of numbers) {
              if (newStatus === 'suspended') {
                // Queue suspension job
                await provisioningService.queueProvisioning(
                  number.id,
                  'suspend',
                  5
                );
              } else if (newStatus === 'active' && subscription.status === 'active') {
                // If reactivating, queue reactivation job
                const { data: currentNumber } = await supabase
                  .from('purchased_numbers')
                  .select('provisioning_status')
                  .eq('id', number.id)
                  .single();
                
                if (currentNumber?.provisioning_status === 'suspended') {
                  await provisioningService.queueProvisioning(
                    number.id,
                    'reactivate',
                    5
                  );
                }
              }
            }
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription cancelled:', subscription.id);
        
        // Cancel all numbers for this subscription
        if (subscription.metadata?.userId) {
          const { data: numbers } = await supabase
            .from('purchased_numbers')
            .select('id')
            .eq('stripe_subscription_id', subscription.id);

          if (numbers && numbers.length > 0) {
            for (const number of numbers) {
              // Queue cancellation job
              await provisioningService.queueProvisioning(
                number.id,
                'cancel',
                5
              );
              
              // Start cancellation asynchronously
              provisioningService.cancelNumber(number.id).catch(error => {
                console.error(`Error cancelling number ${number.id}:`, error);
              });
            }
          }

          // Update numbers status
          await supabase
            .from('purchased_numbers')
            .update({
              provisioning_status: 'cancelled',
              is_active: false
            })
            .eq('stripe_subscription_id', subscription.id);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice payment succeeded:', invoice.id);
        
        // Record successful payment in database
        // Cast to any to access subscription property
        const invoiceData = invoice as any;
        const subscriptionId = typeof invoiceData.subscription === 'string'
          ? invoiceData.subscription
          : invoiceData.subscription?.id;
          
        if (subscriptionId && invoice.customer_email) {
          // Get user by email using auth.users table
          const { data: users } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', invoice.customer_email)
            .limit(1);

          if (users && users.length > 0) {
            await supabase
              .from('payments')
              .insert({
                user_id: users[0].id,
                stripe_invoice_id: invoice.id,
                stripe_subscription_id: subscriptionId,
                amount: invoice.amount_paid / 100,
                currency: invoice.currency,
                status: 'succeeded',
                paid_at: new Date(invoice.created * 1000).toISOString()
              });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.error('Invoice payment failed:', invoice.id);
        
        // Handle failed recurring payment
        // Cast to any to access subscription property
        const invoiceData = invoice as any;
        const failedSubscriptionId = typeof invoiceData.subscription === 'string'
          ? invoiceData.subscription
          : invoiceData.subscription?.id;
          
        if (failedSubscriptionId) {
          // Get all numbers for this subscription
          const { data: numbers } = await supabase
            .from('purchased_numbers')
            .select('id')
            .eq('stripe_subscription_id', failedSubscriptionId);

          if (numbers && numbers.length > 0) {
            for (const number of numbers) {
              // Queue suspension job for payment failure
              await provisioningService.queueProvisioning(
                number.id,
                'suspend',
                8, // Higher priority for payment failures
                { reason: 'payment_failed' }
              );
            }
          }

          // Update numbers status
          await supabase
            .from('purchased_numbers')
            .update({
              provisioning_status: 'suspended',
              is_active: false,
              last_provision_error: 'Payment failed'
            })
            .eq('stripe_subscription_id', failedSubscriptionId);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}