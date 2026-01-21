// Universal Navigation Component
// Update this file to change the navigation across all pages that use it

function renderNav(activePage = '') {
    const navHTML = `
    <!-- Mobile Overlay -->
    <div class="mobile-overlay" id="mobileOverlay"></div>
    
    <!-- Header -->
    <header class="header">
        <a href="/" class="logo">
            <img src="${getNavBasePath()}static/img/FLNYC 2LINE+LOGO.png" alt="Freedom Lab NYC" class="logo-wide">
        </a>
        <nav class="nav-menu" id="navMenu">
            <a href="/classes-events/" class="nav-link${activePage === 'classes-events' ? ' active' : ''}">Classes & Events</a>
            <a href="/resources/" class="nav-link${activePage === 'resources' ? ' active' : ''}">Resources</a>
            <a href="/contact/" class="nav-link${activePage === 'contact' ? ' active' : ''}">Contact</a>
            <a href="/join/" class="nav-btn${activePage === 'join' ? ' active' : ''}">Join</a>
        </nav>
        <div class="hamburger" id="hamburger">
            <span></span>
            <span></span>
            <span></span>
        </div>
    </header>`;

    // Find the nav placeholder and insert the nav
    const placeholder = document.getElementById('nav-placeholder');
    if (placeholder) {
        placeholder.outerHTML = navHTML;
        
        // Initialize mobile menu after nav is rendered
        initMobileMenu();
    }
}

// Calculate the base path for assets based on page depth
function getNavBasePath() {
    const path = window.location.pathname;
    const depth = (path.match(/\//g) || []).length - 1;
    
    // Handle root level
    if (depth <= 0 || path === '/' || path.endsWith('/index.html') && depth === 1) {
        return '';
    }
    
    // Handle nested paths
    let basePath = '';
    for (let i = 0; i < depth; i++) {
        basePath += '../';
    }
    return basePath;
}

// Initialize mobile menu functionality
function initMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const mobileOverlay = document.getElementById('mobileOverlay');

    if (hamburger && navMenu && mobileOverlay) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            mobileOverlay.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });

        mobileOverlay.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            mobileOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });

        document.querySelectorAll('.nav-link, .nav-btn').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                mobileOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }
}

