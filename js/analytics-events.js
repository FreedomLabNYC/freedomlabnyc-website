(function () {
  function hasGtag() {
    return typeof window.gtag === 'function';
  }

  function sendEvent(name, params) {
    if (!hasGtag()) return;
    window.gtag('event', name, Object.assign({
      page_path: window.location.pathname
    }, params || {}));
  }

  function linkLabel(link) {
    return (link.getAttribute('aria-label') || link.textContent || link.href || '').trim().slice(0, 120);
  }

  function classifyLink(link) {
    var href = link.getAttribute('href') || '';
    var url;
    try {
      url = new URL(href, window.location.href);
    } catch (e) {
      return null;
    }

    if (url.hostname === 'luma.com') return 'luma_click';
    if (url.hostname.includes('btcpay')) return 'donate_click';
    if (url.pathname.startsWith('/donate/')) return 'donate_click';
    if (url.pathname.startsWith('/join/')) return 'join_click';
    if (url.pathname.startsWith('/contact/') || href.startsWith('mailto:')) return 'contact_click';
    if (url.hostname && url.hostname !== window.location.hostname) return 'outbound_click';
    return 'internal_click';
  }

  function addUtm(link) {
    var href = link.getAttribute('href') || '';
    if (!href || href[0] === '#' || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    var url;
    try {
      url = new URL(href, window.location.href);
    } catch (e) {
      return;
    }
    if (url.hostname === window.location.hostname) return;
    if (!['luma.com', 't.me', 'x.com', 'twitter.com', 'primal.net', 'www.linkedin.com'].includes(url.hostname)) return;
    if (!url.searchParams.has('utm_source')) url.searchParams.set('utm_source', 'freedomlab.nyc');
    if (!url.searchParams.has('utm_medium')) url.searchParams.set('utm_medium', 'website');
    if (!url.searchParams.has('utm_campaign')) url.searchParams.set('utm_campaign', 'site_navigation');
    link.href = url.toString();
  }

  function handleClick(event) {
    var link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    addUtm(link);
    var eventName = classifyLink(link);
    if (!eventName || eventName === 'internal_click') return;
    sendEvent(eventName, {
      event_category: 'engagement',
      event_label: linkLabel(link),
      link_url: link.href
    });
  }

  function init() {
    document.addEventListener('click', handleClick, true);
    document.querySelectorAll('a[href]').forEach(addUtm);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
