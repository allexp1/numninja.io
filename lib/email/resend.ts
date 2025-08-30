import { Resend } from 'resend';

// Initialize Resend with API key from environment variable
// Get your API key from https://resend.com/api-keys
// If no API key is provided, emails will be skipped (for development)
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface EmailOptions {
  to: string | string[];
  subject: string;
  react?: React.ReactElement;
  html?: string;
  text?: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions) {
  // Skip email sending if Resend is not configured
  if (!resend) {
    console.log('Resend API key not configured - skipping email:', options.subject);
    return { success: true, data: { id: 'skipped', from: options.from, to: options.to } };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: options.from || process.env.RESEND_FROM_EMAIL || 'NumNinja <noreply@numninja.io>',
      to: options.to,
      subject: options.subject,
      react: options.react,
      html: options.html,
      text: options.text,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error };
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error };
  }
}

// Email notification functions for different events
export async function sendWelcomeEmail(userEmail: string, userName?: string) {
  return sendEmail({
    to: userEmail,
    subject: 'Welcome to NumNinja!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to NumNinja!</h1>
        <p>Hi ${userName || 'there'},</p>
        <p>Thank you for signing up! We're excited to have you on board.</p>
        <p>With NumNinja, you can:</p>
        <ul>
          <li>Purchase phone numbers from multiple countries</li>
          <li>Configure call forwarding and voicemail</li>
          <li>Track usage and manage your numbers</li>
        </ul>
        <p>Get started by <a href="${process.env.NEXT_PUBLIC_BASE_URL}/numbers" style="color: #2563eb;">browsing available numbers</a>.</p>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>The NumNinja Team</p>
      </div>
    `,
    text: `Welcome to NumNinja! Thank you for signing up. Get started by browsing available numbers at ${process.env.NEXT_PUBLIC_BASE_URL}/numbers`
  });
}

export async function sendPurchaseConfirmation(
  userEmail: string,
  phoneNumber: string,
  price: number,
  billingCycle: string
) {
  return sendEmail({
    to: userEmail,
    subject: `Purchase Confirmation: ${phoneNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Purchase Confirmation</h1>
        <p>Your phone number purchase has been confirmed!</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Order Details</h2>
          <p><strong>Phone Number:</strong> ${phoneNumber}</p>
          <p><strong>Price:</strong> $${price.toFixed(2)} / ${billingCycle}</p>
          <p><strong>Status:</strong> Provisioning in progress</p>
        </div>
        <p>Your number is being provisioned and will be ready shortly. You'll receive another email once it's active.</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/my-numbers" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Your Numbers</a></p>
        <p>Thank you for your purchase!</p>
        <p>Best regards,<br>The NumNinja Team</p>
      </div>
    `,
    text: `Purchase confirmed! Phone number: ${phoneNumber}, Price: $${price.toFixed(2)}/${billingCycle}. Your number is being provisioned.`
  });
}

export async function sendProvisioningComplete(
  userEmail: string,
  phoneNumber: string,
  didId: string
) {
  return sendEmail({
    to: userEmail,
    subject: `Your number ${phoneNumber} is now active!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a;">Your Number is Active!</h1>
        <p>Great news! Your phone number has been successfully provisioned and is now ready to use.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Number Details</h2>
          <p><strong>Phone Number:</strong> ${phoneNumber}</p>
          <p><strong>Status:</strong> <span style="color: #16a34a;">Active</span></p>
          <p><strong>DID ID:</strong> ${didId}</p>
        </div>
        <h3>Next Steps:</h3>
        <ol>
          <li>Configure call forwarding to your preferred number</li>
          <li>Set up voicemail notifications</li>
          <li>Enable SMS forwarding if supported</li>
        </ol>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/my-numbers" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Configure Your Number</a></p>
        <p>Best regards,<br>The NumNinja Team</p>
      </div>
    `,
    text: `Your number ${phoneNumber} is now active! DID ID: ${didId}. Configure it at ${process.env.NEXT_PUBLIC_BASE_URL}/my-numbers`
  });
}

export async function sendProvisioningFailed(
  userEmail: string,
  phoneNumber: string,
  error: string
) {
  return sendEmail({
    to: userEmail,
    subject: `Issue with provisioning ${phoneNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626;">Provisioning Issue</h1>
        <p>We encountered an issue while provisioning your phone number.</p>
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h2 style="margin-top: 0;">Details</h2>
          <p><strong>Phone Number:</strong> ${phoneNumber}</p>
          <p><strong>Error:</strong> ${error}</p>
        </div>
        <p>Our team has been notified and is working to resolve this issue. We'll retry the provisioning automatically.</p>
        <p>If you continue to experience issues, please contact our support team.</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/support" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Contact Support</a></p>
        <p>We apologize for the inconvenience.</p>
        <p>Best regards,<br>The NumNinja Team</p>
      </div>
    `,
    text: `Issue provisioning ${phoneNumber}. Error: ${error}. Our team is working on it.`
  });
}

export async function sendPaymentSuccessful(
  userEmail: string,
  amount: number,
  description: string,
  invoiceUrl?: string
) {
  return sendEmail({
    to: userEmail,
    subject: 'Payment Successful - NumNinja',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a;">Payment Successful!</h1>
        <p>Your payment has been processed successfully.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Payment Details</h2>
          <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
          <p><strong>Description:</strong> ${description}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        ${invoiceUrl ? `<p><a href="${invoiceUrl}" style="color: #2563eb;">View Invoice</a></p>` : ''}
        <p>Thank you for your payment!</p>
        <p>Best regards,<br>The NumNinja Team</p>
      </div>
    `,
    text: `Payment successful! Amount: $${amount.toFixed(2)}, Description: ${description}`
  });
}

export async function sendSubscriptionRenewal(
  userEmail: string,
  phoneNumber: string,
  amount: number,
  nextBillingDate: Date
) {
  return sendEmail({
    to: userEmail,
    subject: `Subscription Renewed: ${phoneNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Subscription Renewed</h1>
        <p>Your phone number subscription has been renewed successfully.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Renewal Details</h2>
          <p><strong>Phone Number:</strong> ${phoneNumber}</p>
          <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
          <p><strong>Next Billing Date:</strong> ${nextBillingDate.toLocaleDateString()}</p>
        </div>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/my-numbers" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Manage Your Numbers</a></p>
        <p>Thank you for continuing with NumNinja!</p>
        <p>Best regards,<br>The NumNinja Team</p>
      </div>
    `,
    text: `Subscription renewed for ${phoneNumber}. Amount: $${amount.toFixed(2)}. Next billing: ${nextBillingDate.toLocaleDateString()}`
  });
}