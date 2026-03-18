const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendVerificationEmail(to, code) {
  await transporter.sendMail({
    from: `"إيجي وورك" <${process.env.SMTP_USER}>`,
    to,
    subject: 'كود تأكيد البريد الإلكتروني - إيجي وورك',
    html: `
      <div dir="rtl" style="font-family:Arial;max-width:500px;margin:auto;padding:20px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#16a34a;text-align:center">🇪🇬 إيجي وورك</h2>
        <p>مرحباً، كود تأكيد بريدك الإلكتروني هو:</p>
        <div style="background:#f0fdf4;border:2px solid #16a34a;border-radius:8px;padding:20px;text-align:center;font-size:36px;font-weight:bold;letter-spacing:8px;color:#16a34a">
          ${code}
        </div>
        <p style="color:#6b7280;font-size:14px;margin-top:16px">الكود صالح لمدة 10 دقائق فقط. لا تشاركه مع أحد.</p>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail };
