window.BIOMES = window.BIOMES || {};
window.BIOMES.desert = {
  id: "desert",
  name: "Desert Oasis",
  desc: "Dunen, ruïnes en oase",
  svg: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 380">
  <defs>
    <radialGradient id="ds-shadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(0,0,0,0.5)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
  </defs>
  <ellipse cx="240" cy="340" rx="170" ry="24" fill="url(#ds-shadow)"/>
  <polygon points="56,176 240,288 240,324 56,212" fill="#b98d4a"/>
  <polygon points="424,176 240,288 240,324 424,212" fill="#c99f58"/>
  <polygon points="240,64 424,176 240,288 56,176" fill="#e5c26b"/>
  <path d="M120,150 q60,-28 140,-8" stroke="#efd585" stroke-width="7" fill="none" stroke-linecap="round" opacity="0.8"/>
  <path d="M200,235 q70,-18 130,8" stroke="#efd585" stroke-width="7" fill="none" stroke-linecap="round" opacity="0.8"/>
  <circle cx="360" cy="140" r="4" fill="#c9a75f"/>
  <circle cx="130" cy="215" r="3" fill="#c9a75f"/>
  <circle cx="330" cy="255" r="3.5" fill="#c9a75f"/>
  <g class="asset" data-asset="oasis" data-foreign="0">
    <ellipse cx="240" cy="190" rx="58" ry="27" fill="#35b6d9"/>
    <ellipse cx="240" cy="190" rx="44" ry="19" fill="#45c3e6"/>
    <ellipse cx="240" cy="190" rx="20" ry="8" fill="none" stroke="#9fe4f5" stroke-width="2">
      <animate attributeName="rx" values="10;40" dur="3s" repeatCount="indefinite"/>
      <animate attributeName="ry" values="4;17" dur="3s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.9;0" dur="3s" repeatCount="indefinite"/>
    </ellipse>
    <ellipse cx="240" cy="190" rx="20" ry="8" fill="none" stroke="#9fe4f5" stroke-width="2">
      <animate attributeName="rx" values="10;40" dur="3s" begin="1.5s" repeatCount="indefinite"/>
      <animate attributeName="ry" values="4;17" dur="3s" begin="1.5s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.9;0" dur="3s" begin="1.5s" repeatCount="indefinite"/>
    </ellipse>
    <ellipse cx="268" cy="184" rx="9" ry="5" fill="#3f9b57"/>
    <circle cx="266" cy="182" r="2.5" fill="#e74c3c"/>
  </g>
  <g class="asset" data-asset="palm" data-foreign="0">
    <path d="M150,150 q-3,-20 6,-34" stroke="#8a5a3b" stroke-width="5" fill="none"/>
    <g>
      <animateTransform attributeName="transform" type="rotate" values="-4 156 116; 4 156 116; -4 156 116" dur="4s" repeatCount="indefinite"/>
      <path d="M156,116 q-16,-10 -28,-3 q14,8 28,3 Z" fill="#3f9b57"/>
      <path d="M156,116 q16,-10 28,-3 q-14,8 -28,3 Z" fill="#3f9b57"/>
      <path d="M156,116 q-6,-16 -18,-20 q6,14 18,20 Z" fill="#4caf67"/>
      <path d="M156,116 q6,-16 18,-20 q-6,14 -18,20 Z" fill="#4caf67"/>
    </g>
  </g>
  <g class="asset" data-asset="palm2" data-foreign="0">
    <path d="M306,128 q3,-18 -5,-30" stroke="#8a5a3b" stroke-width="4.5" fill="none"/>
    <g>
      <animateTransform attributeName="transform" type="rotate" values="4 301 98; -4 301 98; 4 301 98" dur="4.6s" repeatCount="indefinite"/>
      <path d="M301,98 q-14,-9 -25,-3 q12,7 25,3 Z" fill="#3f9b57"/>
      <path d="M301,98 q14,-9 25,-3 q-12,7 -25,3 Z" fill="#3f9b57"/>
      <path d="M301,98 q-5,-14 -16,-18 q5,12 16,18 Z" fill="#4caf67"/>
    </g>
  </g>
  <g class="asset" data-asset="cactus" data-foreign="0">
    <rect x="374" y="186" width="10" height="26" rx="5" fill="#3f9b57"/>
    <path d="M374,198 q-8,0 -8,8 v6" stroke="#3f9b57" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M384,204 q8,0 8,7 v5" stroke="#3f9b57" stroke-width="5" fill="none" stroke-linecap="round"/>
  </g>
  <g class="asset" data-asset="camel" data-foreign="0">
    <g>
      <animateTransform attributeName="transform" type="translate" values="0 0; 0 -1.5; 0 0" dur="3.2s" repeatCount="indefinite"/>
      <ellipse cx="322" cy="234" rx="16" ry="8" fill="#d2a86a"/>
      <ellipse cx="316" cy="231" rx="7" ry="5" fill="#e0bc80"/>
      <path d="M334,230 q6,-2 7,-9" stroke="#d2a86a" stroke-width="5" fill="none"/>
      <circle cx="341" cy="221" r="4" fill="#d2a86a"/>
      <line x1="314" y1="240" x2="314" y2="248" stroke="#b98d4a" stroke-width="3"/>
      <line x1="322" y1="241" x2="322" y2="249" stroke="#b98d4a" stroke-width="3"/>
      <line x1="330" y1="240" x2="330" y2="248" stroke="#b98d4a" stroke-width="3"/>
    </g>
  </g>
  <g class="asset" data-asset="ruin" data-foreign="0">
    <rect x="128" y="238" width="16" height="20" fill="#c9b391"/>
    <rect x="133" y="222" width="11" height="16" fill="#bda57f"/>
    <polygon points="144,258 158,250 158,266 144,270" fill="#b39a76"/>
  </g>
  <g class="asset" data-asset="pine" data-foreign="1">
    <polygon points="96,168 110,196 82,196" fill="#2e6b45"/>
    <polygon points="96,158 106,180 86,180" fill="#2e6b45"/>
    <rect x="93" y="196" width="6" height="9" fill="#5a3a26"/>
  </g>
  <g class="asset" data-asset="snowman" data-foreign="1">
    <circle cx="252" cy="262" r="9" fill="#f7fbff"/>
    <circle cx="252" cy="248" r="6.5" fill="#f7fbff"/>
    <circle cx="252" cy="238" r="5" fill="#f7fbff"/>
    <path d="M247,244 q5,3 10,0" stroke="#e74c3c" stroke-width="2.5" fill="none"/>
    <path d="M252,236 l6,2 l-6,1 Z" fill="#f59e0b"/>
  </g>
</svg>
`
};
