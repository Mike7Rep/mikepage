(() => {
  if (window.__siteMetrics) return;
  window.__siteMetrics = true;
  const send = (event) => fetch('/api/site-stats', {
    method: 'POST', credentials: 'same-origin', keepalive: true,
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event }),
  }).catch(() => {});
  send(location.pathname === '/cv' || location.pathname.startsWith('/cv/') ? 'cv' : 'visit');
  document.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a') : null;
    if (link && (link.getAttribute('href')?.startsWith('mailto:') || link.dataset.cta === 'true')) send('cta');
  }, { capture: true });
})();
