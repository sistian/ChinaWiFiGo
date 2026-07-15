/**
 * ChinaWiFiGo Security Module - Comprehensive Frontend Protection
 * Version: 2.0
 * Features: XSS Filtering, Input Validation, Rate Limiting, Honeypot, CSRF Protection
 */

// ============================================
// CORE SECURITY CONFIGURATION
// ============================================
const SECURITY_CONFIG = {
    MAX_INPUT_LENGTH: 500,
    MAX_EMAIL_LENGTH: 100,
    MAX_PHONE_LENGTH: 30,
    FORM_SUBMIT_COOLDOWN: 30000, // 30 seconds between submissions
    MAX_SUBMISSIONS_PER_MINUTE: 3,
    HONEYPOT_FIELD_NAME: 'website_address', // Bot-attractive field name
};

// ============================================
// XSS & INPUT SANITIZATION
// ============================================

/**
 * XSS input sanitization - escape dangerous characters
 * Enhanced version with additional protection
 */
function sanitizeInput(raw) {
    if (!raw || typeof raw !== 'string') return '';
    return raw
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\\/g, '&#092;')
        .replace(/\`/g, '&#096;')
        .replace(/\$/g, '&#036;');
}

/**
 * Deep sanitize - for HTML content that allows basic formatting
 */
function sanitizeHtml(raw) {
    if (!raw || typeof raw !== 'string') return '';
    // Allow only safe HTML tags
    const allowed = ['b', 'i', 'em', 'strong', 'p', 'br'];
    let sanitized = raw
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    // Restore allowed tags
    allowed.forEach(tag => {
        const openRegex = new RegExp(`&lt;(${tag})&gt;`, 'gi');
        const closeRegex = new RegExp(`&lt;/(${tag})&gt;`, 'gi');
        sanitized = sanitized
            .replace(openRegex, '<$1>')
            .replace(closeRegex, '</$1>');
    });
    
    return sanitized;
}

/**
 * Check input length to prevent DoS via超长参数
 */
function checkInputLength(text, max) {
    if (!text || typeof text !== 'string') return true;
    return text.length <= max;
}

/**
 * Validate email format with stricter rules
 */
function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    if (email.length > SECURITY_CONFIG.MAX_EMAIL_LENGTH) return false;
    // Stricter regex - no consecutive dots, proper domain
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email) && !email.includes('..') && email.split('@')[1]?.includes('.');
}

/**
 * Validate phone number (international format)
 */
function isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') return false;
    if (phone.length > SECURITY_CONFIG.MAX_PHONE_LENGTH) return false;
    // Allow +, spaces, dashes, parentheses
    return /^[\+]?[\d\s\-\(\)]{7,20}$/.test(phone) && phone.replace(/\D/g, '').length >= 7;
}

/**
 * Block common XSS patterns in user input
 * Enhanced with more patterns
 */
function hasXSSPatterns(input) {
    if (!input || typeof input !== 'string') return false;
    const dangerous = [
        /<script[^>]*>/i,
        /<\/script>/i,
        /javascript:/i,
        /on\w+\s*=/i,      // onclick, onerror, etc.
        /eval\s*\(/i,
        /expression\s*\(/i,
        /url\s*\(/i,
        /data:\s*text\/html/i,
        /<iframe/i,
        /<object/i,
        /<embed/i,
        /<form/i,
        /document\.cookie/i,
        /document\.location/i,
        /window\.location/i,
        /localStorage/i,
        /sessionStorage/i,
        /<\s*img[^>]+onerror/i,
        /<\s*svg[^>]+onload/i,
        /fromCharCode/i,
        /\+\+/i,  // SQL injection attempt
        /union\s+select/i,
        /insert\s+into/i,
        /delete\s+from/i,
        /drop\s+table/i,
    ];
    return dangerous.some(pattern => pattern.test(input));
}

/**
 * Validate URL to prevent open redirects
 */
function isValidUrl(url) {
    if (!url || typeof url !== 'string') return false;
    try {
        const parsed = new URL(url);
        // Only allow http/https
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
        return false;
    }
}

// ============================================
// RATE LIMITING & SUBMISSION CONTROL
// ============================================

/**
 * Rate limiter for form submissions
 * Prevents spam and brute force
 */
const FormRateLimiter = {
    submissions: {},
    
    canSubmit(formId) {
        const now = Date.now();
        const key = `${formId}_${this.getClientId()}`;
        
        if (!this.submissions[key]) {
            this.submissions[key] = [];
        }
        
        // Clean old submissions (older than 1 minute)
        this.submissions[key] = this.submissions[key].filter(
            time => now - time < 60000
        );
        
        // Check if exceeded max submissions per minute
        if (this.submissions[key].length >= SECURITY_CONFIG.MAX_SUBMISSIONS_PER_MINUTE) {
            return {
                allowed: false,
                reason: 'Too many submissions. Please wait a moment.',
                retryAfter: 60000 - (now - this.submissions[key][0])
            };
        }
        
        // Check cooldown between submissions
        const lastSubmission = this.submissions[key][this.submissions[key].length - 1];
        if (lastSubmission && (now - lastSubmission) < SECURITY_CONFIG.FORM_SUBMIT_COOLDOWN) {
            return {
                allowed: false,
                reason: `Please wait ${Math.ceil((SECURITY_CONFIG.FORM_SUBMIT_COOLDOWN - (now - lastSubmission)) / 1000)} seconds before submitting again.`,
                retryAfter: SECURITY_CONFIG.FORM_SUBMIT_COOLDOWN - (now - lastSubmission)
            };
        }
        
        return { allowed: true };
    },
    
    recordSubmission(formId) {
        const key = `${formId}_${this.getClientId()}`;
        if (!this.submissions[key]) {
            this.submissions[key] = [];
        }
        this.submissions[key].push(Date.now());
    },
    
    getClientId() {
        // Simple client fingerprint (not unique but good enough for rate limiting)
        return btoa(navigator.userAgent).slice(0, 20);
    }
};

// ============================================
// HONEYPOT ANTI-BOT PROTECTION
// ============================================

/**
 * Create and inject honeypot field into form
 * Bots will fill this, humans won't see it
 */
function injectHoneypot(form) {
    const honeypot = document.createElement('div');
    honeypot.style.cssText = 'position:absolute;left:-9999px;opacity:0;pointer-events:none;';
    honeypot.innerHTML = `
        <label for="${SECURITY_CONFIG.HONEYPOT_FIELD_NAME}">Website</label>
        <input type="text" 
               id="${SECURITY_CONFIG.HONEYPOT_FIELD_NAME}" 
               name="${SECURITY_CONFIG.HONEYPOT_FIELD_NAME}" 
               tabindex="-1" 
               autocomplete="off">
    `;
    form.insertBefore(honeypot, form.firstChild);
}

/**
 * Check if honeypot was filled (indicates bot)
 */
function isHoneypotFilled(form) {
    const honeypot = form.querySelector(`[name="${SECURITY_CONFIG.HONEYPOT_FIELD_NAME}"]`);
    if (honeypot && honeypot.value && honeypot.value.trim() !== '') {
        console.warn('Security: Honeypot triggered - possible bot submission');
        return true;
    }
    return false;
}

// ============================================
// CSRF PROTECTION
// ============================================

/**
 * Generate CSRF token
 * Simple implementation for static sites
 */
function generateCsrfToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, array));
}

/**
 * Store CSRF token in sessionStorage
 */
function storeCsrfToken(token) {
    try {
        sessionStorage.setItem('_csrf_token', token);
    } catch (e) {
        // sessionStorage not available (private mode, etc.)
    }
}

/**
 * Get stored CSRF token
 */
function getCsrfToken() {
    try {
        return sessionStorage.getItem('_csrf_token');
    } catch (e) {
        return null;
    }
}

/**
 * Validate CSRF token from form submission
 */
function validateCsrfToken(formToken) {
    const storedToken = getCsrfToken();
    if (!storedToken || !formToken || storedToken !== formToken) {
        return false;
    }
    return true;
}

/**
 * Add CSRF token to form
 */
function addCsrfToken(form) {
    let token = getCsrfToken();
    if (!token) {
        token = generateCsrfToken();
        storeCsrfToken(token);
    }
    
    let input = form.querySelector('input[name="_csrf"]');
    if (!input) {
        input = document.createElement('input');
        input.type = 'hidden';
        input.name = '_csrf';
        form.appendChild(input);
    }
    input.value = token;
}

// ============================================
// FORM SECURITY WRAPPER
// ============================================

/**
 * Secure all forms on the page
 * Applies all security measures
 */
function secureAllForms() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        // Inject honeypot
        injectHoneypot(form);
        
        // Add CSRF token
        addCsrfToken(form);
        
        // Wrap submit handler
        const originalSubmit = form.onsubmit;
        form.onsubmit = function(event) {
            // Check honeypot
            if (isHoneypotFilled(form)) {
                event.preventDefault();
                console.warn('Security: Submission blocked - honeypot triggered');
                alert('Submission blocked for security reasons.');
                return false;
            }
            
            // Check rate limit
            const formId = form.id || form.action || 'default';
            const rateCheck = FormRateLimiter.canSubmit(formId);
            if (!rateCheck.allowed) {
                event.preventDefault();
                alert(rateCheck.reason);
                return false;
            }
            
            // Validate and sanitize all inputs
            const inputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
            for (const input of inputs) {
                if (input.type === 'hidden') continue;
                
                // Check length
                if (!checkInputLength(input.value, SECURITY_CONFIG.MAX_INPUT_LENGTH)) {
                    event.preventDefault();
                    alert(`Input too long. Maximum ${SECURITY_CONFIG.MAX_INPUT_LENGTH} characters allowed.`);
                    input.focus();
                    return false;
                }
                
                // Check XSS patterns
                if (hasXSSPatterns(input.value)) {
                    event.preventDefault();
                    alert('Potentially dangerous content detected. Please remove special characters.');
                    input.focus();
                    return false;
                }
                
                // Sanitize
                input.value = sanitizeInput(input.value);
            }
            
            // Record submission
            FormRateLimiter.recordSubmission(formId);
            
            // Call original handler if exists
            if (typeof originalSubmit === 'function') {
                return originalSubmit.call(this, event);
            }
            
            return true;
        };
    });
}

/**
 * Secure form inputs with real-time validation
 */
function secureFormInputs(form) {
    const inputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
    inputs.forEach(input => {
        // Store original value for comparison
        input.dataset.originalValue = '';
        
        input.addEventListener('input', function() {
            // Check XSS patterns in real-time
            if (hasXSSPatterns(this.value)) {
                this.style.borderColor = '#ef4444';
                this.style.backgroundColor = '#fef2f2';
            } else {
                this.style.borderColor = '';
                this.style.backgroundColor = '';
            }
        });
        
        input.addEventListener('blur', function() {
            // Sanitize on blur
            const sanitized = sanitizeInput(this.value);
            if (sanitized !== this.value) {
                this.value = sanitized;
                this.style.borderColor = '#f59e0b';
                setTimeout(() => { this.style.borderColor = ''; }, 1000);
            }
        });
    });
}

// ============================================
// EMAIL OBFUSCATION
// ============================================

/**
 * Obfuscate email to prevent scraping
 * Displays normally but hard to scrape
 */
function obfuscateEmail(element, email) {
    if (!element || !email) return;
    
    const parts = email.split('@');
    if (parts.length !== 2) return;
    
    const user = parts[0];
    const domain = parts[1];
    
    // Create with DOM methods instead of innerHTML
    const span = document.createElement('span');
    span.style.display = 'inline-flex';
    span.style.alignItems = 'center';
    span.style.gap = '0.25rem';
    
    const userPart = document.createElement('span');
    userPart.textContent = user;
    
    const atPart = document.createElement('span');
    atPart.textContent = '@';
    
    const domainPart = document.createElement('span');
    domainPart.textContent = domain;
    
    span.appendChild(userPart);
    span.appendChild(atPart);
    span.appendChild(domainPart);
    
    // Add click-to-copy functionality
    span.style.cursor = 'pointer';
    span.title = 'Click to copy email';
    span.addEventListener('click', function() {
        navigator.clipboard.writeText(email).then(() => {
            const original = span.textContent;
            span.textContent = 'Copied!';
            setTimeout(() => {
                span.innerHTML = '';
                span.appendChild(userPart);
                span.appendChild(atPart);
                span.appendChild(domainPart);
            }, 1500);
        });
    });
    
    element.innerHTML = '';
    element.appendChild(span);
}

/**
 * Protect all email addresses on page
 */
function protectEmails() {
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    const nodesToReplace = [];
    let node;
    while (node = walker.nextNode()) {
        if (node.parentElement.tagName === 'SCRIPT') continue;
        if (node.parentElement.tagName === 'STYLE') continue;
        if (emailPattern.test(node.textContent)) {
            nodesToReplace.push(node);
        }
    }
    
    nodesToReplace.forEach(node => {
        const text = node.textContent;
        const parts = text.split(emailPattern);
        const emails = text.match(emailPattern);
        
        if (!emails) return;
        
        const fragment = document.createDocumentFragment();
        parts.forEach((part, i) => {
            fragment.appendChild(document.createTextNode(part));
            if (emails[i]) {
                const span = document.createElement('span');
                span.className = 'protected-email';
                obfuscateEmail(span, emails[i]);
                fragment.appendChild(span);
            }
        });
        
        node.parentNode.replaceChild(fragment, node);
    });
}

// ============================================
// ANTI-DEBUGGING & CONSOLE PROTECTION
// ============================================

/**
 * Prevent casual debugging
 * Note: This is easily bypassed by determined attackers
 */
function initAntiDebugging() {
    // Detect dev tools opening (basic)
    let devtoolsOpen = false;
    const threshold = 160;
    
    setInterval(() => {
        if (window.outerHeight - window.innerHeight > threshold ||
            window.outerWidth - window.innerWidth > threshold) {
            if (!devtoolsOpen) {
                devtoolsOpen = true;
                console.clear();
                console.log('%c⚠️ Security Notice', 'color: #ef4444; font-size: 20px; font-weight: bold;');
                console.log('%cThis is a browser feature intended for developers.', 'color: #666;');
            }
        } else {
            devtoolsOpen = false;
        }
    }, 1000);
    
    // Prevent right-click context menu on sensitive elements
    document.addEventListener('contextmenu', function(e) {
        if (e.target.closest('.protected-email, .license-img, .qr-code')) {
            e.preventDefault();
        }
    });
}

/**
 * Clean up console in production
 */
function initConsoleProtection() {
    if (window.location.hostname === 'www.chinawifigo.com' || 
        window.location.hostname === 'chinawifigo.com') {
        // Production: limit console output
        const originalLog = console.log;
        console.log = function(...args) {
            // Only allow logs from our own code
            const stack = new Error().stack || '';
            if (stack.includes('script.js') || stack.includes('security.js')) {
                originalLog.apply(console, args);
            }
        };
    }
}

// ============================================
// EXTERNAL RESOURCE INTEGRITY CHECK
// ============================================

/**
 * Verify external resources haven't been tampered with
 * Basic check - for production, use proper SRI hashes
 */
function verifyExternalResources() {
    const expectedHashes = {
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css': 'sha384-', // SRI hash would go here
    };
    
    // Log warning if external resources fail to load
    document.querySelectorAll('link[href*="cdn"], script[src*="cdn"]').forEach(el => {
        el.addEventListener('error', function() {
            console.warn('Security: External resource failed to load:', this.href || this.src);
        });
    });
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Secure all forms
    secureAllForms();
    
    // Secure form inputs
    document.querySelectorAll('form').forEach(form => {
        secureFormInputs(form);
    });
    
    // Protect emails
    protectEmails();
    
    // Initialize anti-debugging
    initAntiDebugging();
    
    // Console protection
    initConsoleProtection();
    
    // Verify external resources
    verifyExternalResources();
    
    console.log('🔒 ChinaWiFiGo Security Module v2.0 loaded');
});

// Export functions for use in other scripts
window.ChinaWiFiGoSecurity = {
    sanitizeInput,
    sanitizeHtml,
    isValidEmail,
    isValidPhone,
    hasXSSPatterns,
    checkInputLength,
    isValidUrl,
    FormRateLimiter,
    injectHoneypot,
    isHoneypotFilled,
    generateCsrfToken,
    validateCsrfToken,
    addCsrfToken,
    secureAllForms,
    secureFormInputs,
    obfuscateEmail,
    protectEmails,
};
