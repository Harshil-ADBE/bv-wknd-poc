/**
 * Cookiebot consent integration.
 *
 * Loaded in the delayed phase (see loadDelayed() in scripts.js), so the banner
 * renders a few seconds after page load and stays off the critical path.
 * Consent-dependent code (analytics, martech, etc.) lives in consented.js and
 * is imported once, only after the visitor grants statistics or marketing
 * consent.
 *
 * For testing, a query parameter short-circuits the banner:
 *   ?consent=accept   grant consent (loads consented.js)
 *   ?consent=decline  decline consent
 */
const COOKIEBOT_SRC = 'https://consent.cookiebot.com/uc.js';
// Cookiebot Domain Group ID (Cookiebot > Settings > Your scripts > data-cbid)
const COOKIEBOT_CBID = '1d5d1290-0a6c-47a7-bfd0-2547e91a819e';

let consentedLoaded = false;

/**
 * Loads consented scripts once consent is available.
 */
function loadConsented() {
  if (consentedLoaded) return;
  consentedLoaded = true;
  import('./consented.js');
}

/**
 * Notifies listeners of the current consent state and loads consented
 * scripts if consent has been granted.
 * @param {boolean} consented true if the visitor has consented
 */
function updateConsent(consented) {
  window.dispatchEvent(new CustomEvent('consent.update', { detail: { consented } }));
  if (consented) {
    loadConsented();
  }
}

/**
 * Handles Cookiebot's consent ready / accept / decline events.
 */
function onCookiebotConsent() {
  const consent = window.Cookiebot?.consent || {};
  updateConsent(!!(consent.statistics || consent.marketing));
}

function loadCookiebot() {
  if (document.getElementById('Cookiebot')) return;
  if (!COOKIEBOT_CBID || COOKIEBOT_CBID === 'your-cookiebot-id') {
    // eslint-disable-next-line no-console
    console.warn('Cookiebot CBID not configured in scripts/consent-check.js; consent declined');
    updateConsent(false);
    return;
  }
  window.addEventListener('CookiebotOnConsentReady', onCookiebotConsent);
  window.addEventListener('CookiebotOnAccept', onCookiebotConsent);
  window.addEventListener('CookiebotOnDecline', onCookiebotConsent);

  const script = document.createElement('script');
  script.id = 'Cookiebot';
  script.src = COOKIEBOT_SRC;
  script.type = 'text/javascript';
  script.setAttribute('data-cbid', COOKIEBOT_CBID);
  script.setAttribute('data-blockingmode', 'manual');
  document.head.append(script);
}

const override = new URLSearchParams(window.location.search).get('consent');
if (override !== null) {
  updateConsent(['accept', 'true', '1', 'yes'].includes(override.toLowerCase()));
} else {
  loadCookiebot();
}
