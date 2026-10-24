// This public asset library otherwise opens as a shrunken desktop page.
// Adjust only its local viewport; never inspect forms, cookies, or page data.
// Check the document host because the original LG HVAC link redirects here.
export const lgMediaViewportScript = `
(function () {
  if (window.location.protocol !== 'https:' || window.location.hostname !== 'media.us.lg.com') return;
  function applyViewport() {
    if (!document.head) return;
    var viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      document.head.appendChild(viewport);
    }
    var content = 'width=device-width, initial-scale=1, user-scalable=yes';
    if (viewport.getAttribute('content') !== content) {
      viewport.setAttribute('content', content);
    }
  }
  applyViewport();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyViewport, { once: true });
  }
})();
true;
`;

// The public library portals two desktop-sized SVG loading illustrations into
// its short header. They paint over the mobile filters while the header loads.
// Suppress only those decorative illustrations, retaining layout and loading labels.
export const lgMediaLoadingScript = `
(function () {
  if (window.location.protocol !== 'https:' || window.location.hostname !== 'media.us.lg.com') return;
  var path = window.location.pathname;
  if (path !== '/web/fb9b717fcfa19bcc/public-resources' && path !== '/web/fb9b717fcfa19bcc/public-resources/') return;
  function applyLoadingStyle() {
    if (!document.head || document.getElementById('hercules-lg-library-loading')) return;
    var style = document.createElement('style');
    style.id = 'hercules-lg-library-loading';
    style.textContent = '@media (max-width: 767px) {' +
      ' #rootHeaderTopBar > svg[role="img"][viewBox="0 0 360 50"],' +
      ' #rootHeaderTopBar > svg[role="img"][viewBox="0 0 1200 60"]' +
      ' { opacity: 0 !important; pointer-events: none !important; }' +
      ' }';
    document.head.appendChild(style);
  }
  applyLoadingStyle();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyLoadingStyle, { once: true });
  }
})();
true;
`;

// LG's registration page combines a flex-column body with Bootstrap's auto-width
// centered container. On phones that container expands beyond the viewport.
// Its Select2 model picker also takes a full row beside a fixed-width button.
// Constrain these two layout containers; preserve zoom, fields and site scripts.
export const lgWarrantyLayoutScript = `
(function () {
  if (window.location.protocol !== 'https:' || window.location.hostname !== 'lg-dfs-warranty.com') return;
  if (window.location.pathname !== '/register' && window.location.pathname !== '/register/') return;
  function applyLayout() {
    // Mark only the model picker's layout wrapper, never read or change a value.
    var picker = document.getElementById('equipment_model_selection');
    var group = picker && picker.parentElement;
    if (group && group.classList.contains('input-group')) group.classList.add('hercules-model-picker');
    if (!document.head || document.getElementById('hercules-lg-registration-layout')) return;
    var style = document.createElement('style');
    style.id = 'hercules-lg-registration-layout';
    style.textContent = '@media (max-width: 767px) {' +
      ' body#page-register > .container.content { width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box; }' +
      ' body#page-register .hercules-model-picker { display: flex; width: 100%; min-width: 0; }' +
      ' body#page-register .hercules-model-picker > .select2-container { flex: 1 1 0; min-width: 0; width: 0 !important; }' +
      ' body#page-register .hercules-model-picker > .input-group-btn { flex: 0 0 auto; width: auto; }' +
      ' }';
    document.head.appendChild(style);
  }
  applyLayout();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyLayout, { once: true });
  }
})();
true;
`;

export const webPageReadabilityScript = lgMediaViewportScript + lgMediaLoadingScript + lgWarrantyLayoutScript;
