// Shared Freedom Lab navigation behavior.
// Markup is compiled from partials/nav.html by scripts/build-site.py.

(function () {
    function initMobileMenu() {
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('navMenu');
        const mobileOverlay = document.getElementById('mobileOverlay');
        if (!hamburger || !navMenu || !mobileOverlay || hamburger.dataset.sharedNavBound) return;
        hamburger.dataset.sharedNavBound = 'true';

        let previousBodyOverflow = document.body.style.overflow;
        const setOpen = (open) => {
            const wasOpen = navMenu.classList.contains('active');
            if (open && !wasOpen) previousBodyOverflow = document.body.style.overflow;
            hamburger.classList.toggle('active', open);
            navMenu.classList.toggle('active', open);
            mobileOverlay.classList.toggle('active', open);
            hamburger.setAttribute('aria-expanded', String(open));
            hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            mobileOverlay.setAttribute('aria-hidden', String(!open));
            document.body.style.overflow = open ? 'hidden' : previousBodyOverflow;
        };

        hamburger.addEventListener('click', (event) => {
            event.preventDefault();
            setOpen(!navMenu.classList.contains('active'));
        });
        mobileOverlay.addEventListener('click', () => setOpen(false));
        navMenu.addEventListener('click', (event) => {
            if (event.target.closest('a')) setOpen(false);
        });

        const desktopQuery = window.matchMedia('(min-width: 769px)');
        const resetAtDesktop = (event) => {
            if (event.matches) setOpen(false);
        };
        if (desktopQuery.addEventListener) {
            desktopQuery.addEventListener('change', resetAtDesktop);
        } else {
            desktopQuery.addListener(resetAtDesktop);
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && navMenu.classList.contains('active')) {
                setOpen(false);
                hamburger.focus();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileMenu, { once: true });
    } else {
        initMobileMenu();
    }
}());
