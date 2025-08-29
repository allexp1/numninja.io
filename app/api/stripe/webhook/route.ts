import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyWebhookSignature, handleSuccessfulPayment } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Stripe webhook events we handle
const relevantEvents = new Set([
  'checkout.session.completed',
  'checkout.session.expired',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
]);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = verifyWebhookSignature(body, signature);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Only process events we care about
  if (!relevantEvents.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  // Create Supabase admin client for database operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    }
  );

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Extract order data from the successful payment
        const orderData = await handleSuccessfulPayment(session);
        
        // Update order status in database
        const { error: orderUpdateError } = await supabase
          .from('orders')
          .update({
            status: 'completed',
            payment_status: 'paid',
            stripe_subscription_id: orderData.subscriptionId,
          })
          .eq('stripe_session_id', session.id);

        if (orderUpdateError) {
          console.error('Failed to update order:', orderUpdateError);
        }

        // Create purchased_numbers records for each item
        if (orderData.items && Array.isArray(orderData.items)) {
          for (const item of orderData.items) {
            // Get country and area code IDs
            const { data: country } = await supabase
              .from('countries')
              .select('id')
              .eq('code', item.countryCode.toUpperCase())
              .single();

            const { data: areaCode } = await supabase
              .from('area_codes')
              .select('id')
              .eq('country_id', country?.id)
              .eq('area_code', item.areaCode)
              .single();

            if (!country?.id || !areaCode?.id) {
              console.error('Country or area code not found:', item);
              continue;
            }

            // Create purchased number record
            const { data: purchasedNumber, error: numberError } = await supabase
              .from('purchased_numbers')
              .insert({
                user_id: orderData.userId,
                country_id: country.id,
                area_code_id: areaCode.id,
                phone_number: item.number,
                display_name: `${item.countryCode.toUpperCase()} ${item.number}`,
                is_active: false, // Will be activated after provisioning
                sms_enabled: false, // Will be configured based on order
                purchase_date: new Date().toISOString(),
                stripe_subscription_id: orderData.subscriptionId,
                stripe_checkout_session_id: session.id,
                monthly_price: item.monthlyPrice,
                setup_price: item.setupPrice || 0,
                provisioning_status: 'pending',
              })
              .select()
              .single();

            if (numberError) {
              console.error('Failed to create purchased number:', numberError);
              continue;
            }

            // Add to provisioning queue
            const { error: queueError } = await supabase
              .from('provisioning_queue')
              .insert({
                purchased_number_id: purchasedNumber.id,
                action: 'provision',
                priority: 5,
                status: 'pending',
                metadata: {
                  stripe_session_id: session.id,
                  item: item,
                },
              });

            if (queueError) {
              console.error('Failed to add to provisioning queue:', queueError);
            }

            // Clear the cart item
            await supabase
              .from('cart_items')
              .delete()
              .eq('user_id', orderData.userId)
              .eq('phone_number', item.number);
          }
        }

        console.log(`Payment successful for session ${session.id}`);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Update order status to expired
        await supabase
          .from('orders')
          .update({
            status: 'expired',
            payment_status: 'expired',
          })
          .eq('stripe_session_id', session.id);

        console.log(`Checkout session expired: ${session.id}`);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Update subscription status in purchased_numbers
        await supabase
          .from('purchased_numbers')
          .update({
            is_active: subscription.status === 'active',
            provisioning_status: subscription.status === 'active' ? 'active' : 'suspended',
          })
          .eq('stripe_subscription_id', subscription.id);

        console.log(`Subscription ${event.type}: ${subscription.id}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Mark numbers as cancelled
        await supabase
          .from('purchased_numbers')
          .update({
            is_active: false,
            provisioning_status: 'cancelled',
          })
          .eq('stripe_subscription_id', subscription.id);

        // Add cancellation to provisioning queue
        const { data: numbers } = await supabase
          .from('purchased_numbers')
          .select('id')
          .eq('stripe_subscription_id', subscription.id);

        if (numbers) {
          for (const number of numbers) {
            await supabase
              .from('provisioning_queue')
              .insert({
                purchased_number_id: number.id,
                action: 'cancel',
                priority: 10, // High priority for cancellations
                status: 'pending',
              });
          }
        }

        console.log(`Subscription cancelled: ${subscription.id}`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Record successful payment
        await supabase
          .from('payments')
          .insert({
            user_id: invoice.metadata?.userId || null,
            stripe_invoice_id: invoice.id,
            stripe_subscription_id: (invoice as any).subscription as string | null,
            amount: invoice.amount_paid / 100, // Convert from cents
            currency: invoice.currency,
            status: 'paid',
            paid_at: new Date(invoice.status_transitions.paid_at! * 1000).toISOString(),
          });

        console.log(`Invoice paid: ${invoice.id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Record failed payment
        await supabase
          .from('payments')
          .insert({
            user_id: invoice.metadata?.userId || null,
            stripe_invoice_id: invoice.id,
            stripe_subscription_id: (invoice as any).subscription as string | null,
            amount: invoice.amount_due / 100,
            currency: invoice.currency,
            status: 'failed',
          });

        // Suspend numbers due to payment failure
        const subscriptionId = (invoice as any).subscription;
        if (subscriptionId) {
          await supabase
            .from('purchased_numbers')
            .update({
              is_active: false,
              provisioning_status: 'suspended',
            })
            .eq('stripe_subscription_id', subscriptionId);
        }

        console.log(`Invoice payment failed: ${invoice.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}