// server.js - Node.js Email Server for Karlin Pharmaceuticals

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Create Nodemailer transporter with Brevo SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify transporter configuration
transporter.verify((error, success) => {
    if (error) {
        console.log('❌ SMTP connection error:', error);
    } else {
        console.log('✅ SMTP server is ready to send emails');
    }
});

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
    try {
        const { name, email, company, country, message } = req.body;

        // Validate required fields
        if (!name || !email || !country || !message) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be filled'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Email options - FROM is the user's email
        const mailOptions = {
            from: `"${name}" <${email}>`,  // User's email as sender
            to: process.env.TO_EMAIL,       // Company email (info@karlinpharmaceuticals.com)
            replyTo: email,                 // Reply goes to user
            subject: 'Website Contact Enquiry - Karlin Pharmaceuticals',
            text: `
New enquiry from Karlin Pharmaceuticals website

========================================
CONTACT DETAILS
========================================
Name:        ${name}
Email:       ${email}
Company:     ${company || 'Not provided'}
Country:     ${country}
========================================

MESSAGE:
----------------------------------------
${message}
----------------------------------------

Submitted: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
            `.trim()
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);

        console.log('✅ Email sent successfully:', info.messageId);
        console.log(`   From: ${name} <${email}>`);
        console.log(`   To: ${process.env.TO_EMAIL}`);

        res.json({
            success: true,
            message: 'Email sent successfully',
            messageId: info.messageId
        });

    } catch (error) {
        console.error('❌ Error sending email:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to send email',
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Karlin Email Server is running',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Karlin Pharmaceuticals Email API',
        endpoints: {
            health: '/health',
            sendEmail: 'POST /api/send-email'
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🚀 Karlin Email Server Started');
    console.log('='.repeat(50));
    console.log(`📧 Server running on: http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
    console.log(`📮 Email endpoint: http://localhost:${PORT}/api/send-email`);
    console.log(`📬 Sending emails to: ${process.env.TO_EMAIL}`);
    console.log('='.repeat(50));
});