// ============================================
// SECURITY UTILITIES (XSS Protection, Input Validation)
// ============================================

/**
 * XSS input sanitization - escape dangerous characters
 */
function sanitizeInput(raw) {
    if (!raw || typeof raw !== 'string') return '';
    return raw
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\\/g, '&#092;');
}

/**
 * Check input length to prevent DoS via超长参数
 */
function checkInputLength(text, max) {
    if (!text || typeof text !== 'string') return true;
    return text.length <= max;
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate phone number (basic international format)
 */
function isValidPhone(phone) {
    return /^[+]?[\d\s-]{7,20}$/.test(phone);
}

/**
 * Block common XSS patterns in user input
 */
function hasXSSPatterns(input) {
    if (!input || typeof input !== 'string') return false;
    const dangerous = [
        /<script[^>]*>/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /eval\s*\(/i,
        /document\.write/i,
        /window\.location/i
    ];
    return dangerous.some(p => p.test(input));
}

// Apply XSS filtering to all form inputs before submission
function secureFormInputs(form) {
    const inputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
    inputs.forEach(input => {
        const original = input.value;
        if (hasXSSPatterns(original)) {
            console.warn('Security: XSS pattern detected in form input');
            input.value = sanitizeInput(original);
        }
    });
}

// ============================================
// ChinaWiFiGo - Main JavaScript
// ============================================


// ============================================
// WhatsApp QR Modal Functions
// ============================================
function openWhatsAppQR() {
    const modal = document.getElementById('whatsappQRModal');
    if (modal) {
        modal.style.display = 'block';
        void modal.offsetWidth;
        modal.classList.add('active');
        setTimeout(() => {
            document.addEventListener('click', handleWhatsAppModalOutsideClick);
        }, 10);
    }
}

function closeWhatsAppQR() {
    const modal = document.getElementById('whatsappQRModal');
    if (modal) {
        modal.classList.remove('active');
        document.removeEventListener('click', handleWhatsAppModalOutsideClick);
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

function handleWhatsAppModalOutsideClick(e) {
    const modal = document.getElementById('whatsappQRModal');
    const floatBtn = document.querySelector('.whatsapp-float-v2');
    if (!modal) return;
    const content = modal.querySelector('.qr-modal-content');
    if (content && !content.contains(e.target) && !(floatBtn && floatBtn.contains(e.target))) {
        closeWhatsAppQR();
    }
}

// Close on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeWhatsAppQR();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // ============================================
    // Loading Animation - Digital Earth · Global Connection
    // ============================================
    const loadingScreen = document.getElementById('loading-screen');
    
    if (loadingScreen) {
        document.body.style.overflow = 'hidden';
        
        // Generate random particles for starfield effect
        const particlesContainer = document.getElementById('particles');
        if (particlesContainer) {
            for (let i = 0; i < 60; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';
                particle.style.animationDelay = (Math.random() * 8) + 's';
                particle.style.animationDuration = (5 + Math.random() * 6) + 's';
                const size = 1 + Math.random() * 2.5;
                particle.style.width = size + 'px';
                particle.style.height = size + 'px';
                particle.style.opacity = 0.3 + Math.random() * 0.7;
                particlesContainer.appendChild(particle);
            }
        }
        
        // Total loading sequence: 2.8 seconds then fade out
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 800);
        }, 2800);
    } else {
        document.body.style.overflow = 'auto';
    }
    
    // ============================================
    // Scroll Reveal Animations (IntersectionObserver)
    // ============================================
    const animatedElements = document.querySelectorAll('.fade-in, .slide-in-up, .slide-in-left, .slide-in-right, .scale-in');
    if (animatedElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });
        
        animatedElements.forEach(el => observer.observe(el));
    }
    
    // ============================================
    // Navigation Scroll Effect
    // ============================================
    const nav = document.getElementById('main-nav');
    let lastScroll = 0;
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        // Add/remove scrolled class
        if (currentScroll > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
    
    // ============================================
    // Mobile Menu Toggle
    // ============================================
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    mobileMenuBtn.addEventListener('click', function() {
        mobileMenu.classList.toggle('active');
        
        // Animate hamburger to X
        const spans = mobileMenuBtn.querySelectorAll('span');
        if (mobileMenu.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });
    
    // Close mobile menu when clicking a link
    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            const spans = mobileMenuBtn.querySelectorAll('span');
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        });
    });
    
    // ============================================
    // Smooth Scroll for Anchor Links
    // ============================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = 80; // Account for fixed nav
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // ============================================
    // Back to Top Button
    // ============================================
    const backToTop = document.getElementById('back-to-top');
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });
    
    backToTop.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // ============================================
    // Scroll Animations (Intersection Observer)
    // ============================================
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements with animation classes
    document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in').forEach(el => {
        observer.observe(el);
    });
    
    // Add animation classes to sections on load
    const animateOnLoad = () => {
        document.querySelectorAll('.feature-card').forEach((card, index) => {
            card.classList.add('fade-in', `delay-${Math.min(index + 1, 5)}`);
            observer.observe(card);
        });
        
        document.querySelectorAll('.step').forEach((step, index) => {
            step.classList.add('fade-in', `delay-${Math.min(index + 1, 5)}`);
            observer.observe(step);
        });
        
        document.querySelectorAll('.pricing-card').forEach((card, index) => {
            card.classList.add('scale-in', `delay-${Math.min(index + 1, 5)}`);
            observer.observe(card);
        });
        
        document.querySelectorAll('.testimonial-card').forEach((card, index) => {
            card.classList.add('fade-in', `delay-${Math.min(index + 1, 5)}`);
            observer.observe(card);
        });
        
        document.querySelectorAll('.city-tag').forEach((tag, index) => {
            tag.classList.add('scale-in', `delay-${Math.min((index % 5) + 1, 5)}`);
            observer.observe(tag);
        });
    };
    
    // Run after loading animation completes
    setTimeout(animateOnLoad, 3500);
    
    // ============================================
    // Stats Counter Animation
    // ============================================
    const animateCounter = (element, target, suffix = '') => {
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target + suffix;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current) + suffix;
            }
        }, 30);
    };
    
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumber = entry.target.querySelector('.stat-number');
                const text = statNumber.textContent;
                
                if (text.includes('200+')) {
                    animateCounter(statNumber, 200, '+');
                } else if (text.includes('5G')) {
                    statNumber.textContent = '5G';
                } else if (text.includes('50K+')) {
                    animateCounter(statNumber, 50, 'K+');
                } else if (text.includes('24/7')) {
                    statNumber.textContent = '24/7';
                }
                
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    document.querySelectorAll('.stat-item').forEach(stat => {
        statsObserver.observe(stat);
    });
    
    // ============================================
    // Parallax Effect for Hero Orbs
    // ============================================
    const heroOrbs = document.querySelectorAll('.hero-bg .gradient-orb');
    
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        heroOrbs.forEach((orb, index) => {
            const speed = 0.1 + (index * 0.05);
            orb.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });
    
    // ============================================
    // Pricing Card Hover Effect
    // ============================================
    document.querySelectorAll('.pricing-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            if (!this.classList.contains('popular')) {
                document.querySelectorAll('.pricing-card.popular').forEach(popular => {
                    popular.style.transform = 'scale(1)';
                });
            }
        });
        
        card.addEventListener('mouseleave', function() {
            document.querySelectorAll('.pricing-card.popular').forEach(popular => {
                popular.style.transform = 'scale(1.05)';
            });
        });
    });
    
    // ============================================
    // Form Input Focus Effects (if forms exist)
    // ============================================
    document.querySelectorAll('input, textarea, select').forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
    
    // ============================================
    // Dynamic Year in Footer
    // ============================================
    const yearElements = document.querySelectorAll('.current-year');
    yearElements.forEach(el => {
        el.textContent = new Date().getFullYear();
    });
    
    // ============================================
    // Performance: Pause animations when tab is hidden
    // ============================================
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            document.body.classList.add('paused');
        } else {
            document.body.classList.remove('paused');
        }
    });
});

// ============================================
// Utility Functions
// ============================================

// Debounce function for scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ============================================
// Lazy Loading Images (if needed)
// ============================================
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img.lazy').forEach(img => {
        imageObserver.observe(img);
    });
}


// ============================================
// QR CODE MODAL
// ============================================
function openQRModal(type, title) {
    let src = '';
    switch(type) {
        case 'wechat': src = 'qr-wechat.png'; break;
        case 'whatsapp': src = 'qr-whatsapp.png'; break;
        case 'instagram': src = 'qr-instagram.png'; break;
        case 'facebook': src = 'qr-facebook.png'; break;
    }
    
    let overlay = document.createElement('div');
    overlay.className = 'qr-modal-overlay active';
    overlay.innerHTML = `
        <div class="qr-modal">
            <h3>${title}</h3>
            <img src="${src}" alt="${title} QR Code">
            <button class="qr-modal-close" onclick="closeQRModal(this)">Close</button>
        </div>
    `;
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closeQRModal(overlay.querySelector('.qr-modal-close'));
    });
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
}

function closeQRModal(btn) {
    const overlay = btn.closest('.qr-modal-overlay');
    overlay.classList.remove('active');
    setTimeout(() => {
        overlay.remove();
        document.body.style.overflow = '';
    }, 300);
}

document.addEventListener('DOMContentLoaded', function() {
    // Footer social links
    document.querySelectorAll('.social-link[data-qr]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const type = this.dataset.qr;
            const title = this.dataset.title || type.charAt(0).toUpperCase() + type.slice(1);
            openQRModal(type, title);
        });
    });
});

// ============================================
// LANGUAGE SWITCHER
// ============================================
function switchLanguage(lang) {
    const currentPage = window.location.pathname;
    let targetPage = '';
    
    if (currentPage.includes('index-zh-tw')) {
        if (lang === 'en') targetPage = 'index.html';
        else if (lang === 'zh') targetPage = 'index-zh.html';
    } else if (currentPage.includes('index-zh')) {
        if (lang === 'en') targetPage = 'index.html';
        else if (lang === 'zh-tw') targetPage = 'index-zh-tw.html';
    } else {
        if (lang === 'zh') targetPage = 'index-zh.html';
        else if (lang === 'zh-tw') targetPage = 'index-zh-tw.html';
    }
    
    if (targetPage) {
        window.location.href = targetPage;
    }
}

// ============================================
// BOOKING PAGE NAVIGATION
// ============================================
function goToBooking() {
    window.location.href = 'booking.html';
}

// ============================================
// LOADING ANIMATION - EARTH TO CHINA TO WIFI
// ============================================
(function() {
    const loadingScreen = document.getElementById('loading-screen');
    const wifiAnimation = document.getElementById('wifi-animation');
    const chinaHighlight = document.getElementById('china-highlight');
    
    if (loadingScreen && wifiAnimation) {
        // Step 1: Show Earth animation for 3 seconds
        setTimeout(() => {
            // Step 2: Highlight China region on Earth
            if (chinaHighlight) chinaHighlight.classList.add('active');
            
            // Step 3: After 1.5s showing China, fade to WiFi
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                wifiAnimation.classList.add('active');
                
                // Step 4: Show WiFi animation for 2.5 seconds
                setTimeout(() => {
                    wifiAnimation.classList.add('fade-out');
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                        wifiAnimation.style.display = 'none';
                        document.body.style.overflow = 'auto';
                    }, 500);
                }, 2500);
            }, 1500);
        }, 3000);
        
        document.body.style.overflow = 'hidden';
    }
})();
