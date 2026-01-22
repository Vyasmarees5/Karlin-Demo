const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bodyParser = require("body-parser");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator"); // Import Security Library
require("dotenv").config();

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: [
      "https://karlinpharmaceuticals.com",
      "https://karlin-pharmaceuticals.netlify.app",
      "http://localhost:3000",
      "http://localhost:5500",
      "http://127.0.0.1:5500",
    ],
    methods: ["POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  }),
);

// Body Parsing Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rate Limiter Configuration
// This prevents spam by limiting repeated requests from the same IP
const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message:
      "Too many requests from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// ==========================================
// SMTP Configuration (Brevo)
// ==========================================

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Verify SMTP connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.log("❌ SMTP connection error:", error);
  } else {
    console.log("✅ SMTP server is ready to send emails");
  }
});

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
    body("name").trim().notEmpty().withMessage("Name is required").escape(), // Removes dangerous HTML tags
    body("email")
      .isEmail()
      .withMessage("Invalid email format")
      .normalizeEmail(), // Standardizes email format
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
      // Check for Validation Errors from express-validator
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // If errors exist, return the first error message to the user
        return res.status(400).json({
          success: false,
          message: errors.array()[0].msg,
        });
      }

      // Extract sanitized data from request body
      const { name, email, company, country, message } = req.body;

      // Configure Email Content (Text and HTML versions)
      const mailOptions = {
        from: `"Karlin Website" <${process.env.SMTP_USER}>`,
        to: process.env.TO_EMAIL,
        replyTo: email,
        subject: `New Enquiry from ${name}`,
        text: `
════════════════════════════════════════
KARLIN PHARMACEUTICALS - WEBSITE ENQUIRY
════════════════════════════════════════

CONTACT DETAILS
────────────────────────────────────────
Name:        ${name}
Email:       ${email}
Company:     ${company || "Not provided"}
Country:     ${country}
────────────────────────────────────────

MESSAGE:
────────────────────────────────────────
${message}
────────────────────────────────────────

Submitted on: ${new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          dateStyle: "full",
          timeStyle: "long",
        })}
                `.trim(),
        html: `
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
                       border-radius: 5px; margin-top: 10px; }
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

      // Send the email via Nodemailer
      const info = await transporter.sendMail(mailOptions);

      console.log(`✅ Email sent successfully from ${email}`);
      console.log(`   Message ID: ${info.messageId}`);

      res.json({
        success: true,
        message: "Email sent successfully",
        messageId: info.messageId,
      });
    } catch (error) {
      console.error("❌ Error sending email:", error);

      res.status(500).json({
        success: false,
        message:
          "Failed to send email. Please try again or contact us directly.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
);

// Health check endpoint (Not rate limited)
// Used by monitoring services (like Render or UptimeRobot) to check if server is alive
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Karlin Email Server is running",
    timestamp: new Date().toISOString(),
    smtp: {
      host: "smtp-relay.brevo.com",
      port: 587,
      user: process.env.SMTP_USER ? "✓ Configured" : "✗ Missing",
    },
  });
});

// Root endpoint
// Provides basic API information
app.get("/", (req, res) => {
  res.json({
    message: "Karlin Pharmaceuticals Email API",
    version: "1.0.0",
    endpoints: {
      health: "GET /health",
      sendEmail: "POST /api/send-email",
    },
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    availableEndpoints: ["/", "/health", "/api/send-email"],
  });
});

// Start the Server
app.listen(PORT, () => {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 KARLIN PHARMACEUTICALS EMAIL SERVER");
  console.log("=".repeat(60));
  console.log(`📧 Server running on: http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(
    `📮 Email endpoint: POST http://localhost:${PORT}/api/send-email`,
  );
  console.log(`🛡️  Rate Limiter: Enabled (5 requests / 15 mins)`);
  console.log(`🔒 Security: Express Validator Active`);
  console.log(
    `📬 Sending emails to: ${process.env.TO_EMAIL || "NOT CONFIGURED"}`,
  );
  console.log("=".repeat(60) + "\n");
});
