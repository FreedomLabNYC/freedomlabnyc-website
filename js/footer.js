// Universal Footer Component
// Update this file to change the footer across all pages

function renderFooter() {
    const footerHTML = `
    <footer class="site-footer">
        <div class="footer-social">
            <a href="/contact/" class="footer-social-link" aria-label="Email">
                <svg viewBox="0 0 24 24" fill="currentColor" class="footer-social-svg">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
            </a>
            <a href="https://primal.net/p/nprofile1qqsrzwgcg39ck26lc3e2yfjhntgcecnlgy9evsuxrfsxx6p46r5s3pgzdvhyj" target="_blank" class="footer-social-link" aria-label="Nostr">
                <img src="${getBasePath()}static/img/nostr_logo.png" alt="Nostr" class="footer-social-icon">
            </a>
            <a href="https://x.com/freedomlabnyc" target="_blank" class="footer-social-link" aria-label="X">
                <svg viewBox="0 0 24 24" fill="currentColor" class="footer-social-svg">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
            </a>
            <a href="https://www.linkedin.com/company/freedom-lab-nyc/" target="_blank" class="footer-social-link" aria-label="LinkedIn">
                <svg viewBox="0 0 24 24" fill="currentColor" class="footer-social-svg">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
            </a>
            <a href="/onion/" class="footer-social-link" aria-label="Onion Site">
                <img src="${getBasePath()}static/img/tor_logo.png" alt="Tor" class="footer-social-icon">
            </a>
        </div>
    </footer>`;

    // Find the footer placeholder and insert the footer
    const placeholder = document.getElementById('footer-placeholder');
    if (placeholder) {
        placeholder.outerHTML = footerHTML;
    }
}

// Calculate the base path for assets based on page depth
function getBasePath() {
    const path = window.location.pathname;
    const depth = (path.match(/\//g) || []).length - 1;
    
    // Handle root level
    if (depth <= 0 || path === '/' || path.endsWith('/index.html') && depth === 1) {
        return '';
    }
    
    // Handle nested paths (e.g., /resources/, /join/, /resources/lesson-name/)
    let basePath = '';
    for (let i = 0; i < depth; i++) {
        basePath += '../';
    }
    return basePath;
}

// Initialize footer when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderFooter);
} else {
    renderFooter();
}

