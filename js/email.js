// =============================================================================
// EMAIL.JS - Email Sending Handler for Contact Form
// =============================================================================
// Karlin Pharmaceuticals - Contact Form Email Configuration
// =============================================================================

// EmailJS Configuration - CREDENTIALS CONFIGURED
const EMAILJS_CONFIG = {
    PUBLIC_KEY: 'Q6qaxE1DpDthCmkIe',           // Public Key from EmailJS
    SERVICE_ID: 'service_ehs0y85',             // Gmail Service ID
    TEMPLATE_ID: 'template_0i9zxxm'            // Contact Us Template ID
};

// Initialize EmailJS
(function() {
    emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
    console.log('EmailJS initialized successfully');
})();

// Toggle email options dropdown
function toggleEmailOptions(event) {
    event.preventDefault();
    const dropdown = event.target.closest('.email-dropdown');
    dropdown.classList.toggle('show');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.closest('.email-dropdown')) {
        document.querySelectorAll('.email-dropdown').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    }
});

// Copy email to clipboard
function copyEmailSimple() {
    const email = 'info@karlinpharmaceuticals.com';
    
    // Create temporary input element
    const tempInput = document.createElement('input');
    tempInput.value = email;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    
    // Show success notification
    alert('Email address copied to clipboard: ' + email);
}

// Form submission handler
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form elements
            const submitBtn = document.getElementById('submitBtn');
            const btnText = document.getElementById('btnText');
            const spinner = document.getElementById('loadingSpinner');
            const successAlert = document.getElementById('alertSuccess');
            const errorAlert = document.getElementById('alertError');
            
            // Hide any previous alerts
            successAlert.style.display = 'none';
            errorAlert.style.display = 'none';
            
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.classList.add('btn-disabled');
            btnText.style.display = 'none';
            spinner.style.display = 'inline-block';
            
            // Get form values
            const formData = {
                from_name: document.getElementById('name').value,
                from_email: document.getElementById('email').value,
                company: document.getElementById('company').value || 'Not provided',
                country: document.getElementById('country').value,
                message: document.getElementById('message').value,
                to_email: 'info@karlinpharmaceuticals.com'
            };
            
            console.log('Sending email with data:', formData);
            
            // Send email using EmailJS
            emailjs.send(
                EMAILJS_CONFIG.SERVICE_ID, 
                EMAILJS_CONFIG.TEMPLATE_ID, 
                formData
            )
            .then(function(response) {
                // Success response
                console.log('✅ Email sent successfully!', response.status, response.text);
                
                // Hide loading state
                submitBtn.disabled = false;
                submitBtn.classList.remove('btn-disabled');
                btnText.style.display = 'inline';
                spinner.style.display = 'none';
                
                // Show success message
                successAlert.style.display = 'block';
                
                // Reset form
                contactForm.reset();
                
                // Scroll to success message smoothly
                successAlert.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
                
                // Auto-hide success message after 10 seconds
                setTimeout(function() {
                    successAlert.style.display = 'none';
                }, 10000);
                
            }, function(error) {
                // Error response
                console.error('❌ Email sending failed:', error);
                
                // Hide loading state
                submitBtn.disabled = false;
                submitBtn.classList.remove('btn-disabled');
                btnText.style.display = 'inline';
                spinner.style.display = 'none';
                
                // Show error message
                errorAlert.style.display = 'block';
                
                // Scroll to error message smoothly
                errorAlert.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
                
                // Auto-hide error message after 10 seconds
                setTimeout(function() {
                    errorAlert.style.display = 'none';
                }, 10000);
            });
        });
    }
});

// =============================================================================
// EMAILJS TEMPLATE CONFIGURATION
// =============================================================================
// Your template "Contact Us" (template_0i9zxxm) should contain:
//
// Subject: Website Contact Enquiry - Karlin Pharmaceuticals
//
// Template Body:
// ---
// You have received a new enquiry from the Karlin Pharmaceuticals website.
//
// Contact Details:
// ----------------
// Name: {{from_name}}
// Email: {{from_email}}
// Company: {{company}}
// Country: {{country}}
//
// Message:
// --------
// {{message}}
//
// ---
// This enquiry was automatically sent from karlinpharmaceuticals.com
// Reply to: {{from_email}}
// =============================================================================