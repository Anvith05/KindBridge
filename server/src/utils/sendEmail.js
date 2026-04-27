const nodemailer = require('nodemailer');

/**
 * Create a reusable transporter.
 * In development we fall back to Ethereal (a free test email service)
 * so OTP emails always work without needing real SMTP credentials.
 */
let _transporter = null;

async function getTransporter() {
    if (_transporter) return _transporter;

    // If real SMTP creds are set, use them
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        _transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Verify the connection so we catch bad credentials early
        try {
            await _transporter.verify();
            console.log('✅ SMTP connection verified — emails will be sent via', process.env.SMTP_HOST);
        } catch (verifyErr) {
            console.error('❌ SMTP connection FAILED:', verifyErr.message);
            console.error('   Check SMTP_HOST / SMTP_USER / SMTP_PASS in your .env');
            _transporter = null; // reset so next request retries
            throw verifyErr;
        }

        return _transporter;
    }

    // Fallback: create an Ethereal test account automatically
    console.warn('⚠️  No SMTP_HOST/SMTP_USER/SMTP_PASS found in .env — falling back to Ethereal (emails will NOT reach real inboxes)');
    const testAccount = await nodemailer.createTestAccount();
    _transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });
    console.log('📧 Ethereal test account created:', testAccount.user);
    console.log('   View sent emails at https://ethereal.email');
    return _transporter;
}

/**
 * Send an email with the given OTP code.
 * Returns { success, previewUrl } — previewUrl is only set for Ethereal test emails.
 */
async function sendOTPEmail(to, otp, purpose = 'register') {
    const transporter = await getTransporter();

    const subjects = {
        register: '🔐 KindBridge — Verify Your Email',
        login: '🔐 KindBridge — Login Verification Code',
        reset: '🔐 KindBridge — Password Reset Code',
    };

    const htmlBody = `
    <div style="font-family:'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#ffffff;border-radius:16px;border:1px solid #f0f0f0;">
        <div style="text-align:center;margin-bottom:28px;">
            <div style="display:inline-flex;align-items:center;gap:8px;">
                <div style="width:40px;height:40px;background:linear-gradient(135deg,#FF6B35,#e55a2b);border-radius:12px;display:flex;align-items:center;justify-content:center;">
                    <span style="color:white;font-size:20px;">♥</span>
                </div>
                <span style="font-size:22px;font-weight:800;color:#1a1a2e;">KindBridge</span>
            </div>
        </div>
        <h2 style="text-align:center;color:#1a1a2e;margin-bottom:8px;font-size:20px;">Your Verification Code</h2>
        <p style="text-align:center;color:#6b7280;margin-bottom:24px;font-size:14px;">
            Enter this code to ${purpose === 'register' ? 'complete your registration' : purpose === 'login' ? 'log in to your account' : 'reset your password'}.
        </p>
        <div style="text-align:center;margin:24px 0;">
            <div style="display:inline-block;background:linear-gradient(135deg,#fff7ed,#fef3c7);border:2px dashed #FF6B35;border-radius:12px;padding:16px 40px;">
                <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#FF6B35;">${otp}</span>
            </div>
        </div>
        <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:24px;">
            This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
        </p>
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;" />
        <p style="text-align:center;color:#d1d5db;font-size:11px;">
            If you didn't request this code, you can safely ignore this email.
        </p>
    </div>
    `;

    const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"KindBridge" <noreply@kindbridge.app>',
        to,
        subject: subjects[purpose] || subjects.register,
        html: htmlBody,
    });

    // For Ethereal, generate a preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
        console.log(`📧 OTP email preview → ${previewUrl}`);
    }

    return { success: true, messageId: info.messageId, previewUrl: previewUrl || null };
}

module.exports = { sendOTPEmail };
