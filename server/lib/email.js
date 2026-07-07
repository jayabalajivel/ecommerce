import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function sendReceiptEmail(order, customerEmail) {
  const emailToUse = customerEmail || order.email || '';
  if (!emailToUse) {
    console.log(`[Email Service] No email provided for order ${order.id}. Skipping receipt email.`);
    return;
  }

  const itemsHtml = Array.isArray(order.items) 
    ? order.items.map(item => `
      <tr>
        <td style="padding: 12px 10px; border-bottom: 1px solid #eeeeee; text-align: left;">
          <div style="font-weight: 600; color: #1a1a1a;">${item.name}</div>
          <div style="font-size: 12px; color: #666666;">${item.weight || '100g'}</div>
        </td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #eeeeee; text-align: center; color: #4a4a4a;">
          ${item.qty}
        </td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #eeeeee; text-align: right; font-weight: 600; color: #1a1a1a;">
          ₹${item.subtotal}
        </td>
      </tr>
    `).join('')
    : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation - ${order.id}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f6f6; margin: 0; padding: 20px; -webkit-font-smoothing: antialiased;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e8e8e8;">
          
          <!-- Banner / Header -->
          <div style="background: linear-gradient(135deg, #8b0000 0%, #a30000 100%); padding: 35px 30px; text-align: center; color: #ffffff;">
            <div style="font-size: 26px; font-weight: 800; letter-spacing: 1px; margin-bottom: 5px; text-transform: uppercase;">
              MADURAI MADASAMY IDLYPODI
            </div>
            <div style="font-size: 14px; opacity: 0.9; text-transform: uppercase; tracking-spacing: 2px;">
              Order Successful
            </div>
          </div>

          <!-- Main Info -->
          <div style="padding: 30px;">
            <p style="margin-top: 0; font-size: 16px; line-height: 1.5; color: #4a4a4a;">
              Dear <strong>${order.customer_name}</strong>,
            </p>
            <p style="font-size: 15px; line-height: 1.5; color: #4a4a4a;">
              Thank you for ordering from Madurai Madasamy Idlypodi. We have received your order and payment verification is pending. Here is your receipt details:
            </p>

            <!-- Order Details Box -->
            <div style="background-color: #f9f9f9; border-radius: 12px; padding: 20px; margin: 25px 0; border: 1px solid #eeeeee;">
              <div style="display: flex; justify-content: space-between; flex-wrap: wrap; font-size: 14px; color: #555555; line-height: 1.6;">
                <div style="flex: 1; min-width: 200px; margin-bottom: 10px;">
                  <strong style="color: #1a1a1a;">Order Details:</strong><br>
                  ID: <span style="font-family: monospace; font-weight: bold; color: #1a1a1a;">${order.id}</span><br>
                  Date: ${new Date(order.created_at || new Date()).toLocaleString('en-IN')}<br>
                  UPI Txn ID: <span style="font-weight: bold;">${order.payment_ref}</span>
                </div>
                <div style="flex: 1; min-width: 200px; margin-bottom: 10px;">
                  <strong style="color: #1a1a1a;">Deliver To:</strong><br>
                  +91 ${order.user_phone}<br>
                  ${order.address ? order.address.replace(/\n/g, '<br>') : 'N/A'}
                </div>
              </div>
            </div>

            <!-- Items Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
              <thead>
                <tr style="font-size: 12px; text-transform: uppercase; color: #888888; border-bottom: 2px solid #eeeeee;">
                  <th style="padding: 10px 5px; text-align: left; font-weight: 500;">Product</th>
                  <th style="padding: 10px 5px; text-align: center; font-weight: 500; width: 60px;">Qty</th>
                  <th style="padding: 10px 5px; text-align: right; font-weight: 500; width: 80px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Pricing Summary -->
            <div style="margin-left: auto; max-width: 300px; font-size: 14px; line-height: 1.8; color: #4a4a4a;">
              <div style="display: flex; justify-content: space-between;">
                <span>Subtotal:</span>
                <span>₹${order.subtotal}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>CGST (2.5%):</span>
                <span>₹${(order.subtotal * 0.025).toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>SGST (2.5%):</span>
                <span>₹${(order.subtotal * 0.025).toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Delivery Fee:</span>
                <span>${order.delivery_fee === 0 ? 'FREE' : `₹${order.delivery_fee}`}</span>
              </div>
              <div style="font-size: 11px; color: #888888; text-align: right; margin-top: 2px; font-style: italic; font-weight: 500;">
                *delivery expected 3-7 working days
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #8b0000; border-top: 1.5px solid #dddddd; padding-top: 10px; margin-top: 10px;">
                <span>Total Amount:</span>
                <span>₹${order.total}</span>
              </div>
            </div>
            
            <div style="margin-top: 40px; text-align: center; font-size: 13px; color: #888888; border-top: 1px solid #eeeeee; padding-top: 20px;">
              <strong>Thank you for choosing Madurai Madasamy Idlypodi!</strong><br>
              We'll notify you once your order is processed and shipped.
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const { 
    RESEND_HOST, RESEND_PORT, RESEND_USER, RESEND_PASS, RESEND_FROM,
    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM 
  } = process.env;

  async function trySendMail({ host, port, user, pass, from }) {
    if (!host || !user || !pass) return false;
    try {
      const isGmail = host.toLowerCase().includes('gmail');
      const passToUse = isGmail ? pass.replace(/\s+/g, '') : pass;
      
      const transportConfig = isGmail ? {
        service: 'gmail',
        auth: {
          user: user,
          pass: passToUse,
        }
      } : {
        host: host,
        port: parseInt(port || '587'),
        secure: parseInt(port || '587') === 465,
        auth: {
          user: user,
          pass: passToUse,
        },
        tls: {
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2'
        },
        lookup: (hostname, options, callback) => {
          dns.lookup(hostname, { family: 4 }, callback);
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
      };

      const transporter = nodemailer.createTransport(transportConfig);

      const mailOptions = {
        from: from || `"Madurai Madasamy Idlypodi" <${user}>`,
        to: emailToUse,
        subject: `Your Receipt for Order ${order.id} - Madurai Madasamy Idlypodi`,
        html: htmlContent,
      };

      console.log(`[Email Service] Attempting to send email via ${host}:${port} using user ${user}...`);
      const info = await transporter.sendMail(mailOptions);
      console.log(`[Email Service] Receipt email sent successfully to ${emailToUse}. Message ID: ${info.messageId}`);
      return true;
    } catch (err) {
      console.error(`[Email Service] Failed to send email via ${host}:`, err);
      return false;
    }
  }

  // 1. Try Gmail SMTP first (using official Google servers for gmail.com senders to satisfy DMARC/SPF policies)
  let sent = false;
  if (SMTP_HOST) {
    console.log(`[Email Service] Attempting SMTP (Gmail) first...`);
    sent = await trySendMail({
      host: SMTP_HOST,
      port: SMTP_PORT,
      user: SMTP_USER,
      pass: SMTP_PASS,
      from: SMTP_FROM
    });
  }

  // 2. Try Resend/Mailjet as fallback if Gmail fails
  if (!sent && RESEND_HOST) {
    console.log(`[Email Service] Fallback to Resend/Mailjet...`);
    sent = await trySendMail({
      host: RESEND_HOST,
      port: RESEND_PORT,
      user: RESEND_USER,
      pass: RESEND_PASS,
      from: RESEND_FROM
    });
  }

  if (sent) return;

  // Fallback: Write HTML file locally and log to console
  try {
    const logsDir = path.join(__dirname, '../receipt-logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const logPath = path.join(logsDir, `${order.id}.html`);
    fs.writeFileSync(logPath, htmlContent, 'utf-8');
    
    console.log(`\n======================================================`);
    console.log(`📬 [MOCK EMAIL SENT TO ${emailToUse.toUpperCase()}]`);
    console.log(`Receipt saved locally to: ${logPath}`);
    console.log(`======================================================\n`);
  } catch (logErr) {
    console.error('[Email Service] Failed to write mock email receipt locally:', logErr);
  }
}
