const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
require("dotenv").config();

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3000;

// ==========================================
// Environment Variable Validation
// ==========================================
const REQUIRED_ENVS = [
  "BREVO_API_KEY",
  "SENDER_EMAIL",
  "SENDER_NAME",
  "TO_EMAIL",
];

REQUIRED_ENVS.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

// ==========================================
// CORS Configuration
// ==========================================
app.use(
  cors({
    origin: [
      "https://karlin-pharmaceuticals.netlify.app",
      "https://karlinpharmaceuticals.com",
      "https://www.karlinpharmaceuticals.com",
      "http://localhost:3000",
      "http://localhost:5500",
      "http://127.0.0.1:5500",
    ],
    methods: ["POST", "GET"],
    allowedHeaders: ["Content-Type"],
  }),
);

// ==========================================
// Body Parsing Middleware
// ==========================================
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ==========================================
// Rate Limiter Configuration
// ==========================================
const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Increased from 5 to 10 for better UX
  message: {
    success: false,
    message:
      "Too many requests from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==========================================
// Brevo HTTP API Configuration
// ==========================================
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

// ==========================================
// API Endpoints
// ==========================================

// Email sending endpoint (Protected by Rate Limiter and Validator)
app.post(
  "/api/send-email",
  // 1. Apply Rate Limiter
  emailLimiter,

  // 2. Apply Security Validation & Sanitization rules
  [
    body("name").trim().notEmpty().withMessage("Name is required").escape(),
    body("email")
      .isEmail()
      .withMessage("Invalid email format")
      .normalizeEmail(),
    body("company").trim().escape(),
    body("country")
      .trim()
      .notEmpty()
      .withMessage("Country is required")
      .escape(),
    body("message")
      .trim()
      .notEmpty()
      .withMessage("Message is required")
      .escape(),
  ],

  // 3. Process the Request
  async (req, res) => {
    try {
      // ===== HONEYPOT CHECK (Bot Prevention) =====
      if (req.body.website) {
        console.log("🤖 Bot detected via honeypot field");
        return res.status(200).json({
          success: true,
          message: "Email sent successfully",
        });
      }

      // Check for Validation Errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: errors.array()[0].msg,
        });
      }

      // Extract sanitized data from request body
      const { name, email, company, country, message } = req.body;

      // Configure Email Payload for Brevo API
      const payload = {
        sender: {
          name: process.env.SENDER_NAME,
          email: process.env.SENDER_EMAIL,
        },
        to: [
          {
            email: process.env.TO_EMAIL,
            name: "Karlin Admin",
          },
        ],
        replyTo: {
          email: email,
          name: name,
        },
        subject: `New Enquiry from ${name}`,
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                  color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .field { margin-bottom: 20px; }
        .label { font-weight: bold; color: #667eea; display: block; margin-bottom: 5px; }
        .value { background: white; padding: 10px; border-left: 3px solid #667eea; }
        .message-box { background: white; padding: 15px; border: 1px solid #ddd; 
                       border-radius: 5px; margin-top: 10px; white-space: pre-wrap; }
        .footer { text-align: center; margin-top: 20px; padding: 20px; 
                  color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="margin: 0;">New Website Enquiry</h2>
            <p style="margin: 10px 0 0 0;">Karlin Pharmaceuticals</p>
        </div>
        
        <div class="content">
            <div class="field">
                <span class="label">Name:</span>
                <div class="value">${name}</div>
            </div>
            
            <div class="field">
                <span class="label">Email:</span>
                <div class="value"><a href="mailto:${email}">${email}</a></div>
            </div>
            
            <div class="field">
                <span class="label">Company:</span>
                <div class="value">${company || "Not provided"}</div>
            </div>
            
            <div class="field">
                <span class="label">Country:</span>
                <div class="value">${country}</div>
            </div>
            
            <div class="field">
                <span class="label">Message:</span>
                <div class="message-box">${message.replace(/\n/g, "<br>")}</div>
            </div>
            
            <div class="footer">
                <p>Submitted on: ${new Date().toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  dateStyle: "full",
                  timeStyle: "long",
                })}</p>
                <p>This enquiry was sent from karlinpharmaceuticals.com</p>
            </div>
        </div>
    </div>
</body>
</html>
        `,
      };

      // Send email via Brevo HTTP API with timeout protection
      const response = await axios.post(BREVO_API_URL, payload, {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 seconds timeout
      });

      console.log(`✅ Email sent successfully from ${email}`);
      console.log(`   Message ID: ${response.data.messageId}`);

      res.json({
        success: true,
        message: "Email sent successfully",
        messageId: response.data.messageId,
      });
    } catch (error) {
      console.error(
        "❌ Brevo API Error:",
        error.response?.data || error.message,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to send email. Please try again or contact us directly.",
        error:
          process.env.NODE_ENV === "development"
            ? error.response?.data || error.message
            : undefined,
      });
    }
  },
);

// ==========================================
// Health Check Endpoint
// ==========================================
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Karlin Email Server is running",
    timestamp: new Date().toISOString(),
    emailService: {
      provider: "Brevo HTTP API",
      apiKey: process.env.BREVO_API_KEY ? "✓ Configured" : "✗ Missing",
      senderEmail: process.env.SENDER_EMAIL || "Not configured",
      recipientEmail: process.env.TO_EMAIL || "Not configured",
    },
  });
});

// ==========================================
// Root Endpoint
// ==========================================
app.get("/", (req, res) => {
  res.json({
    message: "Karlin Pharmaceuticals Email API",
    version: "2.1.0",
    emailProvider: "Brevo HTTP API (No SMTP)",
    endpoints: {
      health: "GET /health",
      sendEmail: "POST /api/send-email",
    },
  });
});

// ==========================================
// 404 Handler
// ==========================================
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    availableEndpoints: ["/", "/health", "/api/send-email"],
  });
});

// ==========================================
// Start the Server
// ==========================================
app.listen(PORT, () => {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 KARLIN PHARMACEUTICALS EMAIL SERVER v2.1.0");
  console.log("=".repeat(60));
  console.log(`📧 Server running on: http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(
    `📮 Email endpoint: POST http://localhost:${PORT}/api/send-email`,
  );
  console.log(`🛡️  Rate Limiter: Enabled (10 requests / 15 mins)`);
  console.log(`🔒 Security: Express Validator + Honeypot Active`);
  console.log(`📬 Email Provider: Brevo HTTP API (No SMTP)`);
  console.log(
    `📬 Sending emails to: ${process.env.TO_EMAIL || "NOT CONFIGURED"}`,
  );
  console.log("=".repeat(60) + "\n");
});
