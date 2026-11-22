import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ready',
      provider: 'Vercel Serverless Gmail Gateway',
      smtpUserConfigured: !!(process.env.SMTP_USER || process.env.VITE_ADMIN_EMAIL),
      smtpPassConfigured: !!(process.env.SMTP_PASS)
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, htmlContent } = req.body || {};

    if (!to || !subject || !htmlContent) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, htmlContent' });
    }

    const smtpUser = process.env.SMTP_USER || process.env.VITE_ADMIN_EMAIL || 'maduraimadasamyidlipodi@gmail.com';
    const smtpPass = (process.env.SMTP_PASS || 'tiab ryqi znuf okmv').replace(/\s+/g, '').replace(/[\x22\x27]/g, '').trim();

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    });

    const info = await transporter.sendMail({
      from: `"Madurai Madasamy Idlypodi" <${smtpUser}>`,
      to,
      subject,
      html: htmlContent
    });

    console.log(`[Vercel Gateway] Email sent to ${to}. Message ID: ${info.messageId}`);
    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('[Vercel Gateway] Email sending failed:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}
