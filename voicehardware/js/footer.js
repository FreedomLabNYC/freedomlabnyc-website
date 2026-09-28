// Shared Freedom Lab footer behavior.
// Markup is compiled from partials/footer.html by scripts/build-site.py.

(function () {
    function loadAnalyticsEvents() {
        if (document.querySelector('script[data-fl-analytics-events]')) return;
        const script = document.createElement('script');
        script.src = '/js/analytics-events.js?v=join-conversion-events';
        script.defer = true;
        script.dataset.flAnalyticsEvents = 'true';
        document.head.appendChild(script);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAnalyticsEvents, { once: true });
    } else {
        loadAnalyticsEvents();
    }
}());
