export interface SmsNotificationData {
  from: string
  to: string
  message: string
  receivedAt: Date
  numberDisplayName?: string
}

export function generateSmsNotificationHtml(data: SmsNotificationData): string {
  const formattedDate = data.receivedAt.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  })

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New SMS Message</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .header p {
            margin: 5px 0 0;
            opacity: 0.9;
            font-size: 14px;
        }
        .content {
            padding: 30px;
        }
        .info-row {
            display: flex;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #e5e5e5;
        }
        .info-row:last-of-type {
            border-bottom: none;
        }
        .info-label {
            font-weight: 600;
            color: #666;
            width: 100px;
            flex-shrink: 0;
        }
        .info-value {
            color: #333;
            word-break: break-word;
        }
        .message-box {
            background-color: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .message-content {
            white-space: pre-wrap;
            word-wrap: break-word;
            margin: 0;
            color: #2c3e50;
            font-size: 15px;
            line-height: 1.6;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #e5e5e5;
        }
        .footer a {
            color: #667eea;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        .reply-note {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 4px;
            padding: 12px;
            margin: 20px 0;
            font-size: 13px;
            color: #856404;
        }
        .reply-note strong {
            display: block;
            margin-bottom: 5px;
        }
        @media (max-width: 600px) {
            body {
                padding: 0;
            }
            .container {
                border-radius: 0;
            }
            .header {
                padding: 20px;
            }
            .content {
                padding: 20px;
            }
            .info-row {
                flex-direction: column;
            }
            .info-label {
                margin-bottom: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📱 New SMS Message</h1>
            <p>Forwarded from NumNinja</p>
        </div>
        <div class="content">
            <div class="info-row">
                <div class="info-label">From:</div>
                <div class="info-value">${escapeHtml(data.from)}</div>
            </div>
            <div class="info-row">
                <div class="info-label">To:</div>
                <div class="info-value">
                    ${escapeHtml(data.to)}
                    ${data.numberDisplayName ? `<br><small style="color: #666;">${escapeHtml(data.numberDisplayName)}</small>` : ''}
                </div>
            </div>
            <div class="info-row">
                <div class="info-label">Received:</div>
                <div class="info-value">${formattedDate}</div>
            </div>
            
            <div class="message-box">
                <pre class="message-content">${escapeHtml(data.message)}</pre>
            </div>
            
            <div class="reply-note">
                <strong>⚠️ Do not reply to this email</strong>
                To respond to this SMS, please send a text message directly to ${escapeHtml(data.from)} from your phone.
            </div>
        </div>
        <div class="footer">
            <p>
                This message was automatically forwarded by NumNinja SMS Forwarding Service.<br>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/my-numbers/${encodeURIComponent(data.to)}/sms-history">View SMS History</a> |
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/my-numbers/${encodeURIComponent(data.to)}/sms-settings">Manage Settings</a>
            </p>
            <p style="margin-top: 15px; font-size: 11px; color: #999;">
                NumNinja • Virtual Phone Numbers & SMS Forwarding<br>
                © ${new Date().getFullYear()} All rights reserved
            </p>
        </div>
    </div>
</body>
</html>
  `
}

export function generateSmsNotificationText(data: SmsNotificationData): string {
  const formattedDate = data.receivedAt.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  })

  return `
NEW SMS MESSAGE
===============

From: ${data.from}
To: ${data.to}${data.numberDisplayName ? ` (${data.numberDisplayName})` : ''}
Received: ${formattedDate}

Message:
--------
${data.message}

--------

IMPORTANT: Do not reply to this email. To respond to this SMS, please send a text message directly to ${data.from} from your phone.

--
This message was automatically forwarded by NumNinja SMS Forwarding Service.

View SMS History: ${process.env.NEXT_PUBLIC_APP_URL}/my-numbers/${encodeURIComponent(data.to)}/sms-history
Manage Settings: ${process.env.NEXT_PUBLIC_APP_URL}/my-numbers/${encodeURIComponent(data.to)}/sms-settings

NumNinja • Virtual Phone Numbers & SMS Forwarding
© ${new Date().getFullYear()} All rights reserved
  `.trim()
}

// Helper function to escape HTML
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

// Generate email subject
export function generateSmsNotificationSubject(data: SmsNotificationData): string {
  // Truncate message for subject if too long
  const truncatedMessage = data.message.length > 50 
    ? data.message.substring(0, 47) + '...'
    : data.message
  
  return `SMS from ${data.from}: ${truncatedMessage}`
}

// Main function to generate complete email data
export function generateSmsNotificationEmail(data: SmsNotificationData) {
  return {
    subject: generateSmsNotificationSubject(data),
    html: generateSmsNotificationHtml(data),
    text: generateSmsNotificationText(data)
  }
}