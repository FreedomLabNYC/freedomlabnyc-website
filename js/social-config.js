/**
 * Social Media Configuration
 * 
 * Update links here to change them across the entire site.
 * All pages automatically use these values.
 */
const SOCIAL_LINKS = {
    email: '/contact/',
    nostr: 'https://primal.net/p/nprofile1qqsrzwgcg39ck26lc3e2yfjhntgcecnlgy9evsuxrfsxx6p46r5s3pgzdvhyj',
    x: 'https://x.com/freedomlabnyc',
    linkedin: 'https://www.linkedin.com/company/freedom-lab-nyc/'
};

// Apply social links when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Update footer social links
    document.querySelectorAll('.footer-social-link[aria-label="X"]').forEach(link => {
        link.href = SOCIAL_LINKS.x;
    });
    
    document.querySelectorAll('.footer-social-link[aria-label="LinkedIn"]').forEach(link => {
        link.href = SOCIAL_LINKS.linkedin;
    });
    
    document.querySelectorAll('.footer-social-link[aria-label="Nostr"]').forEach(link => {
        link.href = SOCIAL_LINKS.nostr;
    });
    
    document.querySelectorAll('.footer-social-link[aria-label="Email"]').forEach(link => {
        link.href = SOCIAL_LINKS.email;
    });
    
    // Update contact page social buttons (if present)
    document.querySelectorAll('.social-btn[title="X (Twitter)"]').forEach(link => {
        link.href = SOCIAL_LINKS.x;
    });
    
    document.querySelectorAll('.social-btn[title="LinkedIn"]').forEach(link => {
        link.href = SOCIAL_LINKS.linkedin;
    });
    
    document.querySelectorAll('.social-btn[title="Nostr"]').forEach(link => {
        link.href = SOCIAL_LINKS.nostr;
    });
});
