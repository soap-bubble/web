// Feature detects Navigation Timing API support.
if (window.performance && window.ga) {
  // Gets the number of milliseconds since page load
  // (and rounds the result since the value must be an integer).
  const timeSincePageLoad = Math.round(performance.now());

  // Sends the timing hit to Google Analytics.
  window.timing('JS Dependencies', 'load', timeSincePageLoad);
}

export default function timing(category, type, value, label) {
  if (window.ga) {
    window.ga('send', 'timing', category, type, value, label);
  }
}
