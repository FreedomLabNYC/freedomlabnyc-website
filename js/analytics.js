// Freedom Lab NYC analytics bootstrap.
// Replace FL_GA_MEASUREMENT_ID with the GA4 Measurement ID (G-5L8YH7QGBD)
// after the Google Analytics property is created.
(function () {
  var measurementId = window.FL_GA_MEASUREMENT_ID || '';
  if (!measurementId || measurementId === 'G-5L8YH7QGBD') return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(){ window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    anonymize_ip: true,
    transport_type: 'beacon'
  });

  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
  document.head.appendChild(script);
})();
