/* Public configuration only. Never put passwords, tokens or API keys here.
   Override before score-client.js, or edit this file for another deployment. */
window.TEX_ARCADE_CONFIG = Object.assign({
  scoreApiUrl: 'https://scores.b0x41s.nl',
  requestTimeoutMs: 4000
}, window.TEX_ARCADE_CONFIG || {});
