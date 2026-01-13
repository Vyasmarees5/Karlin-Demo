<?php
// send_email.php - Email sending using PHPMailer with Brevo SMTP

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/Exception.php';
require 'PHPMailer/PHPMailer.php';
require 'PHPMailer/SMTP.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] != "POST") {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

// BREVO SMTP CONFIGURATION
$smtp_host = "smtp-relay.brevo.com";
$smtp_port = 587;
$smtp_username = "9fccdf001@smtp-brevo.com";
$smtp_password = "xsmtpsib-6e760ecf0825a1078b20b59471e95df019ad29e6c8155f305c29b6f7771058f1-eWISt8dfCyW0AQ0i";
$from_email = "noreply@karlinpharmaceuticals.com";
$from_name = "Karlin Pharmaceuticals Website";
$to_email = "info@karlinpharmaceuticals.com";

// Get and sanitize form data
$name = isset($_POST['name']) ? htmlspecialchars(strip_tags(trim($_POST['name']))) : '';
$email = isset($_POST['email']) ? filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL) : '';
$company = isset($_POST['company']) ? htmlspecialchars(strip_tags(trim($_POST['company']))) : 'Not provided';
$country = isset($_POST['country']) ? htmlspecialchars(strip_tags(trim($_POST['country']))) : '';
$message = isset($_POST['message']) ? htmlspecialchars(strip_tags(trim($_POST['message']))) : '';

// Validate required fields
if (empty($name) || empty($email) || empty($country) || empty($message)) {
    echo json_encode(['success' => false, 'message' => 'All required fields must be filled.']);
    exit;
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email format.']);
    exit;
}

// Create PHPMailer instance
$mail = new PHPMailer(true);

try {
    // SMTP configuration
    $mail->isSMTP();
    $mail->Host       = $smtp_host;
    $mail->SMTPAuth   = true;
    $mail->Username   = $smtp_username;
    $mail->Password   = $smtp_password;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = $smtp_port;
    
    // Disable SSL verification
    $mail->SMTPOptions = array(
        'ssl' => array(
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true
        )
    );
    
    // Email settings
    $mail->setFrom($from_email, $from_name);
    $mail->addAddress($to_email);
    $mail->addReplyTo($email, $name);
    
    // Content
    $mail->isHTML(false);
    $mail->Subject = 'Website Contact Enquiry - Karlin Pharmaceuticals';
    
    $email_body = "New enquiry from Karlin Pharmaceuticals website\n\n";
    $email_body .= "========================================\n";
    $email_body .= "CONTACT DETAILS\n";
    $email_body .= "========================================\n";
    $email_body .= "Name:        $name\n";
    $email_body .= "Email:       $email\n";
    $email_body .= "Company:     $company\n";
    $email_body .= "Country:     $country\n";
    $email_body .= "========================================\n\n";
    $email_body .= "MESSAGE:\n";
    $email_body .= "----------------------------------------\n";
    $email_body .= "$message\n";
    $email_body .= "----------------------------------------\n\n";
    $email_body .= "Submitted: " . date('d/m/Y H:i:s') . "\n";
    $email_body .= "IP: " . $_SERVER['REMOTE_ADDR'] . "\n";
    
    $mail->Body = $email_body;
    
    // Send email
    $mail->send();
    
    echo json_encode(['success' => true, 'message' => 'Email sent successfully!']);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Mailer Error: ' . $mail->ErrorInfo]);
}
?>