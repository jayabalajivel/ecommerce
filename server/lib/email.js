import dns from 'dns';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

import 'dotenv/config';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function sendEmail({ to, subject, htmlContent, orderId }) {
  const { 
    RESEND_API_KEY, RESEND_FROM,
    BREVO_API_KEY,
    BREVO_SMTP_HOST, BREVO_SMTP_PORT, BREVO_SMTP_USER, BREVO_SMTP_PASS,
    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM,
    VERCEL_EMAIL_BRIDGE_URL
  } = process.env;

  const isRender = process.env.RENDER === 'true';

  // ── Provider 1: Resend HTTP API (Port 443 HTTPS - Works 100% on Render/Cloud) ──
  async function trySendResendHttp(apiKey) {
    if (!apiKey) return false;
    try {
      console.log(`[Email Service] Attempting Resend HTTP API (Port 443) to ${to}...`);
      const fromAddress = RESEND_FROM || 'Madurai Madasamy Idlypodi <onboarding@resend.dev>';
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [to],
          subject: subject,
          html: htmlContent
        }),
        signal: AbortSignal.timeout(8000)
      });

      const resData = await response.json();
      if (response.ok && resData.id) {
        console.log(`[Email Service] Resend HTTP send success! ID:`, resData.id);
        return true;
      } else {
        console.error(`[Email Service] Resend HTTP failed:`, JSON.stringify(resData));
        return false;
      }
    } catch (err) {
      console.error(`[Email Service] Resend HTTP error:`, err.message);
      return false;
    }
  }

  // ── Provider 2: Brevo HTTP API (Port 443 HTTPS) ──
  async function trySendBrevoHttp(apiKey) {
    if (!apiKey) return false;
    try {
      console.log(`[Email Service] Attempting Brevo HTTP API to ${to}...`);
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': apiKey.trim(),
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { 
            name: "Madurai Madasamy Idlypodi", 
            email: SMTP_USER || "maduraimadasamyidlipodi@gmail.com" 
          },
          to: [{ email: to }],
          subject: subject,
          htmlContent: htmlContent
        }),
        signal: AbortSignal.timeout(8000)
      });

      const resData = await response.json();
      if (response.ok) {
        console.log(`[Email Service] Brevo HTTP send success! Message ID:`, resData.messageId);
        return true;
      } else {
        console.error(`[Email Service] Brevo HTTP send failed:`, JSON.stringify(resData));
        return false;
      }
    } catch (err) {
      console.error(`[Email Service] Brevo HTTP error:`, err.message);
      return false;
    }
  }

  // ── Provider 3: Vercel Serverless Gateway (Port 443 HTTPS -> Gmail SMTP on Vercel) ──
  async function trySendVercelGateway() {
    const gatewayUrl = VERCEL_EMAIL_BRIDGE_URL || 'https://maduraimadasamyidlipodi.com/api/send-email';
    try {
      console.log(`[Email Service] Attempting Vercel Serverless Gateway (${gatewayUrl}) to ${to}...`);
      const response = await fetch(gatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to,
          subject,
          htmlContent
        }),
        signal: AbortSignal.timeout(10000)
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        console.log(`[Email Service] Vercel Serverless Gateway send success! ID:`, resData.messageId);
        return true;
      } else {
        console.error(`[Email Service] Vercel Serverless Gateway failed:`, JSON.stringify(resData));
        return false;
      }
    } catch (err) {
      console.error(`[Email Service] Vercel Serverless Gateway error:`, err.message);
      return false;
    }
  }

  // ── Provider 4: Direct Gmail SMTP (Ports 465 / 587) ──
  async function trySendGmailDirect({ user, pass, from }) {
    if (!user || !pass) return false;
    const passClean = pass.replace(/\s+/g, '').replace(/[\x22\x27]/g, '').trim();
    const timeoutMs = isRender ? 3500 : 10000;
    
    // Method 1: direct SSL port 465
    try {
      console.log(`[Email Service] Attempting Gmail direct SSL (smtp.gmail.com:465) to ${to}...`);
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: user,
          pass: passClean,
        },
        connectionTimeout: timeoutMs,
        greetingTimeout: timeoutMs,
        socketTimeout: timeoutMs + 2000
      });

      const info = await transporter.sendMail({
        from: from || `"Madurai Madasamy Idlypodi" <${user}>`,
        to: to,
        subject: subject,
        html: htmlContent,
      });
      console.log(`[Email Service] Gmail SSL sent successfully to ${to}. Message ID: ${info.messageId}`);
      return true;
    } catch (err) {
      console.error(`[Email Service] Gmail direct SSL failed:`, err.message);
    }

    // Method 2: TLS port 587
    try {
      console.log(`[Email Service] Attempting Gmail TLS (smtp.gmail.com:587) to ${to}...`);
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: user,
          pass: passClean,
        },
        connectionTimeout: timeoutMs,
        greetingTimeout: timeoutMs,
        socketTimeout: timeoutMs + 2000
      });

      const info = await transporter.sendMail({
        from: from || `"Madurai Madasamy Idlypodi" <${user}>`,
        to: to,
        subject: subject,
        html: htmlContent,
      });
      console.log(`[Email Service] Gmail TLS sent successfully to ${to}. Message ID: ${info.messageId}`);
      return true;
    } catch (err) {
      console.error(`[Email Service] Gmail TLS failed:`, err.message);
    }

    // Method 3: service 'gmail' fallback
    if (!isRender) {
      try {
        console.log(`[Email Service] Attempting Gmail service transport to ${to}...`);
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: user,
            pass: passClean,
          },
          connectionTimeout: timeoutMs,
          greetingTimeout: timeoutMs,
          socketTimeout: timeoutMs + 2000
        });

        const info = await transporter.sendMail({
          from: from || `"Madurai Madasamy Idlypodi" <${user}>`,
          to: to,
          subject: subject,
          html: htmlContent,
        });
        console.log(`[Email Service] Gmail service sent successfully to ${to}. Message ID: ${info.messageId}`);
        return true;
      } catch (err) {
        console.error(`[Email Service] Gmail service failed:`, err.message);
      }
    }

    return false;
  }

  // ── Provider 5: Generic SMTP ──
  async function trySendGenericSmtp({ host, port, user, pass, from }) {
    if (!host || !user || !pass) return false;
    try {
      console.log(`[Email Service] Attempting generic SMTP via ${host}:${port}...`);
      const transporter = nodemailer.createTransport({
        host: host,
        port: parseInt(port || '587'),
        secure: parseInt(port || '587') === 465,
        auth: {
          user: user,
          pass: pass.replace(/\s+/g, '').replace(/[\x22\x27]/g, '').trim(),
        },
        tls: {
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2'
        },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 10000
      });

      const info = await transporter.sendMail({
        from: from || `"Madurai Madasamy Idlypodi" <${user}>`,
        to: to,
        subject: subject,
        html: htmlContent,
      });
      console.log(`[Email Service] Generic SMTP sent successfully to ${to}. Message ID: ${info.messageId}`);
      return true;
    } catch (err) {
      console.error(`[Email Service] Generic SMTP failed (${host}):`, err.message);
      return false;
    }
  }

  let sent = false;

  // 1. Resend HTTP API (Port 443 - zero firewall blocks on Render)
  if (RESEND_API_KEY) {
    sent = await trySendResendHttp(RESEND_API_KEY);
  }

  // 2. Brevo HTTP API (Port 443)
  if (!sent && BREVO_API_KEY) {
    sent = await trySendBrevoHttp(BREVO_API_KEY);
  }

  // 3. On Render cloud: prioritize Vercel Gateway (Port 443) because Render blocks direct SMTP ports 465/587
  if (!sent && isRender) {
    sent = await trySendVercelGateway();
  }

  // 4. Direct Gmail SMTP (Primary for localhost, fallback for cloud)
  if (!sent && SMTP_USER && SMTP_PASS) {
    sent = await trySendGmailDirect({
      user: SMTP_USER,
      pass: SMTP_PASS,
      from: SMTP_FROM
    });
  }

  // 5. If direct Gmail failed on cloud, try Vercel Gateway if not already attempted
  if (!sent && !isRender) {
    sent = await trySendVercelGateway();
  }

  // 6. Generic Brevo SMTP fallback
  if (!sent && BREVO_SMTP_HOST && BREVO_SMTP_USER && BREVO_SMTP_PASS) {
    sent = await trySendGenericSmtp({
      host: BREVO_SMTP_HOST,
      port: BREVO_SMTP_PORT,
      user: BREVO_SMTP_USER,
      pass: BREVO_SMTP_PASS,
      from: SMTP_FROM || `Madurai Madasamy Idlypodi <${SMTP_USER || 'maduraimadasamyidlipodi@gmail.com'}>`
    });
  }

  // 7. Custom SMTP fallback
  if (!sent && SMTP_HOST && !SMTP_HOST.includes('gmail')) {
    sent = await trySendGenericSmtp({
      host: SMTP_HOST,
      port: SMTP_PORT,
      user: SMTP_USER,
      pass: SMTP_PASS,
      from: SMTP_FROM
    });
  }

  if (sent) return true;

  // Final fallback: log locally so nothing is ever lost
  try {
    const logsDir = path.join(__dirname, '../receipt-logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const logPath = path.join(logsDir, `${orderId || 'email'}_${Date.now()}.html`);
    fs.writeFileSync(logPath, htmlContent, 'utf-8');
    
    console.log(`\n======================================================`);
    console.log(`[Email Service Warning] No real-time email delivery succeeded.`);
    console.log(`Archived email locally to: ${logPath}`);
    console.log(`Recipient: ${to} | Subject: ${subject}`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error(`[Email Service] Error saving fallback email log:`, err.message);
  }

  return false;
}

export async function sendReceiptEmail(order, customerEmail) {
  let emailToUse = (customerEmail || order.email || '').trim();
  
  if (!emailToUse && order.notes) {
    const emailMatch = order.notes.match(/\[Email:\s*([^\]]+)\]/i);
    if (emailMatch) {
      emailToUse = emailMatch[1].trim();
    }
  }

  if (!emailToUse && order.user_phone && order.user_phone.includes('@')) {
    emailToUse = order.user_phone.trim();
  }

  if (!emailToUse) {
    console.log(`[Email Service] No customer email found for order ${order.id}. Skipping customer receipt.`);
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
        <title>Order Receipt - ${order.id}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f6f6; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e8e8e8;">
          <div style="background-color: #1b5e20; color: #ffffff; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">Order Confirmed!</h1>
            <p style="margin: 8px 0 0 0; font-size: 15px; opacity: 0.9;">Order ID: #${order.id}</p>
          </div>
          
          <div style="padding: 30px 25px;">
            <p style="font-size: 16px; color: #333333; margin-top: 0;">
              Hi <strong>${order.customer_name}</strong>,
            </p>
            <p style="font-size: 15px; color: #555555; line-height: 1.5;">
              Thank you for ordering with <strong>Madurai Madasamy Idlypodi</strong>! We have received your order and payment details. We will process and ship your freshly prepared items soon.
            </p>
            
            <div style="margin: 25px 0; background-color: #fafafa; border-radius: 12px; padding: 15px 20px; border: 1px solid #eeeeee;">
              <h3 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #777777; letter-spacing: 0.5px;">Delivery Details</h3>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #333333;">
                <strong>${order.customer_name}</strong><br>
                ${order.address ? order.address.replace(/\n/g, '<br>') : 'Address provided at checkout'}
              </p>
            </div>

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

            <div style="margin-left: auto; max-width: 250px; font-size: 14px; line-height: 1.8; color: #4a4a4a;">
              <div style="display: flex; justify-content: space-between;">
                <span>Subtotal:</span>
                <span>₹${order.subtotal}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Delivery:</span>
                <span>₹${order.delivery_fee}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; color: #1b5e20; border-top: 1px solid #eeeeee; padding-top: 8px; margin-top: 8px;">
                <span>Total Paid:</span>
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

  await sendEmail({
    to: emailToUse,
    subject: `Your Receipt for Order #${order.id} - Madurai Madasamy Idlypodi`,
    htmlContent,
    orderId: order.id
  });
}

export async function sendAdminNotificationEmail(order, customerEmail) {
  const adminEmail = (process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'maduraimadasamyidlipodi@gmail.com').trim().toLowerCase();

  let email = order.email || customerEmail || '';
  let phone = '';
  const notes = order.notes || '';
  
  if (!email) {
    const emailMatch = notes.match(/\[Email:\s*([^\]]+)\]/i);
    if (emailMatch) {
      email = emailMatch[1].trim();
    }
  }
  const phoneMatch = notes.match(/Phone:\s*([+\d\s-]+)/i);
  if (phoneMatch) {
    phone = phoneMatch[1].trim();
  }
  if (!phone && order.user_phone && !order.user_phone.includes('@')) {
    phone = order.user_phone;
  }
  if (!email && order.user_phone && order.user_phone.includes('@')) {
    email = order.user_phone;
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
        <title>New Order Alert - ${order.id}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f6f6; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e8e8e8;">
          <div style="background-color: #c62828; color: #ffffff; padding: 25px 20px; text-align: center;">
            <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">ADMIN NOTIFICATION</span>
            <h1 style="margin: 10px 0 0 0; font-size: 24px; font-weight: 700;">New Order Placed: #${order.id}</h1>
          </div>
          
          <div style="padding: 30px 25px;">
            <div style="background-color: #f9f9f9; border-left: 4px solid #c62828; padding: 15px; margin-bottom: 25px; border-radius: 0 8px 8px 0; font-size: 14px; line-height: 1.6;">
              <strong>Customer Information:</strong><br>
              Name: <strong>${order.customer_name}</strong><br>
              Email: ${email || 'N/A'}<br>
              Phone: ${phone ? '+91 ' + phone : 'N/A'}<br>
              Delivery Address:<br>
              ${order.address ? order.address.replace(/\n/g, '<br>') : 'N/A'}
            </div>

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

            <div style="margin-left: auto; max-width: 300px; font-size: 14px; line-height: 1.8; color: #4a4a4a;">
              <div style="display: flex; justify-content: space-between;">
                <span>Subtotal:</span>
                <span>₹${order.subtotal}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Delivery Fee:</span>
                <span>₹${order.delivery_fee}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #1b5e20; border-top: 1.5px solid #dddddd; padding-top: 10px; margin-top: 10px;">
                <span>Total Amount:</span>
                <span>₹${order.total}</span>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: adminEmail,
    subject: `⚠️ [NEW ORDER] #${order.id} - ₹${order.total} from ${order.customer_name}`,
    htmlContent,
    orderId: `admin_alert_${order.id}`
  });
}
