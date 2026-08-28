// Universal Freedom Lab navigation.
// Every ordinary site page renders this component through #nav-placeholder.

(function () {
    const NAV_LINKS = [
        { key: 'classes-events', href: '/classes-events/', label: 'Classes & Events' },
        { key: 'resources', href: '/resources/', label: 'Resources' },
        { key: 'contact', href: '/contact/', label: 'Contact' },
        { key: 'donate', href: '/donate/', label: 'Donate' },
        { key: 'join', href: '/join/', label: 'Join', button: true },
    ];

    function currentSection() {
        const path = window.location.pathname;
        if (path === '/' || path === '/index.html') return '';
        if (path.startsWith('/events/') || path.startsWith('/classes-events/')) return 'classes-events';
        return NAV_LINKS.find(({ href }) => path.startsWith(href))?.key || '';
    }

    function navMarkup(activePage) {
        const links = NAV_LINKS.map(({ key, href, label, button }) => {
            const active = key === activePage ? ' active' : '';
            const className = `${button ? 'nav-btn' : 'nav-link'}${active}`;
            const current = active ? ' aria-current="page"' : '';
            return `<a href="${href}" class="${className}"${current}>${label}</a>`;
        }).join('');

        return `
        <div class="mobile-overlay" id="mobileOverlay" aria-hidden="true"></div>
        <header class="site-nav-header" data-shared-navigation>
            <a href="/" class="logo" aria-label="Freedom Lab NYC home">
                <picture>
                    <source srcset="/static/img/FLNYC 2LINE+LOGO.webp" type="image/webp">
                    <img src="/static/img/FLNYC 2LINE+LOGO.png" alt="Freedom Lab NYC" class="logo-wide" width="869" height="494">
                </picture>
            </a>
            <nav class="nav-menu" id="navMenu" aria-label="Primary">${links}</nav>
            <button type="button" class="hamburger" id="hamburger" aria-label="Open menu" aria-controls="navMenu" aria-expanded="false">
                <span></span><span></span><span></span>
            </button>
        </header>`;
    }

    function initMobileMenu() {
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('navMenu');
        const mobileOverlay = document.getElementById('mobileOverlay');
        if (!hamburger || !navMenu || !mobileOverlay || hamburger.dataset.sharedNavBound) return;
        hamburger.dataset.sharedNavBound = 'true';

        const setOpen = (open) => {
            hamburger.classList.toggle('active', open);
            navMenu.classList.toggle('active', open);
            mobileOverlay.classList.toggle('active', open);
            hamburger.setAttribute('aria-expanded', String(open));
            hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            mobileOverlay.setAttribute('aria-hidden', String(!open));
            document.body.style.overflow = open ? 'hidden' : '';
        };

        hamburger.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            setOpen(!navMenu.classList.contains('active'));
        }, true);

        mobileOverlay.addEventListener('click', (event) => {
            event.stopImmediatePropagation();
            setOpen(false);
        }, true);

        navMenu.addEventListener('click', (event) => {
            if (event.target.closest('a')) setOpen(false);
        }, true);

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && navMenu.classList.contains('active')) {
                setOpen(false);
                hamburger.focus();
            }
        });
    }

    window.renderNav = function renderNav(activePage = currentSection()) {
        const placeholder = document.getElementById('nav-placeholder');
        if (!placeholder) return;
        placeholder.outerHTML = navMarkup(activePage);
        initMobileMenu();
    };

    if (document.getElementById('nav-placeholder')) {
        window.renderNav();
    } else if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.renderNav(), { once: true });
    }
}());
