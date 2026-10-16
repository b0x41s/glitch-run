window.BIOMES = window.BIOMES || {};
window.BIOMES.coral = {
  id: "coral",
  name: "Coral Coast",
  desc: "Strand, pier en koraal",
  svg: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 380">
  <defs>
    <radialGradient id="coral-sh" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(0,0,0,0.5)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
  </defs>
  <ellipse cx="240" cy="340" rx="170" ry="24" fill="url(#coral-sh)"/>
  <polygon points="56,176 240,288 240,324 56,212" fill="#cfa95c"/>
  <polygon points="424,176 240,288 240,324 424,212" fill="#1e7cae"/>
  <polygon points="240,64 424,176 240,288 56,176" fill="#f0d592"/>
  <path d="M268,81 L424,176 L240,288 L148,232 C175,215 165,195 195,185 C225,175 215,150 240,135 C255,120 250,100 268,81 Z" fill="#2f9fd8"/>
  <g class="asset" data-asset="fish" data-foreign="0">
    <g>
      <ellipse rx="6" ry="3.5" fill="#f59e0b"/>
      <path d="M6,0 L11,-4 L11,4 Z" fill="#f59e0b"/>
      <animateTransform attributeName="transform" type="translate" values="300,190; 282,198; 300,190" dur="6s" repeatCount="indefinite"/>
    </g>
    <g>
      <ellipse rx="5" ry="3" fill="#38bdf8"/>
      <path d="M5,0 L9.5,-3.5 L9.5,3.5 Z" fill="#38bdf8"/>
      <animateTransform attributeName="transform" type="translate" values="332,228; 354,216; 332,228" dur="8s" repeatCount="indefinite"/>
    </g>
  </g>
  <g class="asset" data-asset="coral" data-foreign="0">
    <g transform="translate(362,236)">
      <path d="M0,0 C-2,-8 -6,-10 -6,-14 M0,0 C2,-8 6,-10 6,-14 M0,0 C0,-9 0,-12 0,-16" stroke="#ec6aa0" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    </g>
  </g>
  <path d="M268,81 L424,176 L240,288 L148,232 C175,215 165,195 195,185 C225,175 215,150 240,135 C255,120 250,100 268,81 Z" fill="#2f9fd8" fill-opacity="0.55"/>
  <path d="M290,150 q10,-6 20,0 t20,0" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.7" stroke-dasharray="14 10">
    <animate attributeName="stroke-dashoffset" from="0" to="-48" dur="2s" repeatCount="indefinite"/>
  </path>
  <path d="M310,205 q10,-6 20,0 t20,0" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.55" stroke-dasharray="14 10">
    <animate attributeName="stroke-dashoffset" from="0" to="-48" dur="2.8s" repeatCount="indefinite"/>
  </path>
  <path d="M148,232 C175,215 165,195 195,185 C225,175 215,150 240,135 C255,120 250,100 268,81" stroke="#ffffff" stroke-width="3" fill="none" opacity="0.5"/>
  <g transform="translate(128,178)"><rect x="0" y="0" width="10" height="6" fill="#e8e8e8"/><rect x="0" y="0" width="10" height="2" fill="#e74c3c"/></g>
  <g transform="translate(86,214)"><rect x="0" y="0" width="10" height="6" fill="#e8e8e8"/><rect x="0" y="0" width="10" height="2" fill="#3b82c4"/></g>
  <g class="asset" data-asset="parasol" data-foreign="0" transform="translate(150,152)">
    <line x1="0" y1="0" x2="0" y2="-26" stroke="#8a5a3b" stroke-width="2.5"/>
    <path d="M-16,-26 A16,16 0 0 1 16,-26 Z" fill="#e74c3c"/>
    <path d="M0,-42 A16,16 0 0 1 11.3,-37.3 L16,-26 L8,-26 Z" fill="#ffffff"/>
    <path d="M-16,-26 L-8,-26 L-11.3,-37.3 A16,16 0 0 1 0,-42 Z" fill="#ffffff"/>
  </g>
  <g class="asset" data-asset="parasol2" data-foreign="0" transform="translate(104,206)">
    <line x1="0" y1="0" x2="0" y2="-26" stroke="#8a5a3b" stroke-width="2.5"/>
    <path d="M-16,-26 A16,16 0 0 1 16,-26 Z" fill="#3b82c4"/>
    <path d="M0,-42 A16,16 0 0 1 11.3,-37.3 L16,-26 L8,-26 Z" fill="#ffffff"/>
    <path d="M-16,-26 L-8,-26 L-11.3,-37.3 A16,16 0 0 1 0,-42 Z" fill="#ffffff"/>
  </g>
  <g class="asset" data-asset="lifeguard" data-foreign="0">
    <rect x="60" y="150" width="26" height="20" fill="#f4f4f4"/>
    <polygon points="56,150 88,150 82,140 62,140" fill="#e74c3c"/>
    <rect x="68" y="156" width="10" height="14" fill="#3b82c4"/>
  </g>
  <g class="asset" data-asset="palm" data-foreign="0">
    <path d="M196,110 q-4,-18 5,-30" stroke="#8a5a3b" stroke-width="5" fill="none"/>
    <path d="M201,80 q-15,-9 -26,-2 q13,7 26,2 Z" fill="#3f9b57"/>
    <path d="M201,80 q15,-9 26,-2 q-13,7 -26,2 Z" fill="#3f9b57"/>
    <path d="M201,80 q-5,-14 -16,-18 q5,12 16,18 Z" fill="#4caf67"/>
  </g>
  <g class="asset" data-asset="palm2" data-foreign="0">
    <path d="M240,96 q3,-16 -4,-26" stroke="#8a5a3b" stroke-width="4" fill="none"/>
    <path d="M236,70 q-13,-8 -23,-2 q11,6 23,2 Z" fill="#3f9b57"/>
    <path d="M236,70 q13,-8 23,-2 q-11,6 -23,2 Z" fill="#3f9b57"/>
  </g>
  <g class="asset" data-asset="pier" data-foreign="0">
    <path d="M170,196 L310,244 L310,250 L170,202 Z" fill="#a97142"/>
    <path d="M170,202 L310,250 L310,256 L170,208 Z" fill="#8a5a33"/>
    <line x1="200" y1="207" x2="200" y2="220" stroke="#7a4a2b" stroke-width="3"/>
    <line x1="245" y1="223" x2="245" y2="236" stroke="#7a4a2b" stroke-width="3"/>
    <line x1="290" y1="239" x2="290" y2="252" stroke="#7a4a2b" stroke-width="3"/>
  </g>
  <g class="asset" data-asset="boat" data-foreign="0">
    <g>
      <animateTransform attributeName="transform" type="translate" values="0 0; 0 3; 0 0" dur="3s" repeatCount="indefinite"/>
      <path d="M312,238 q16,10 34,0 l-4,10 q-13,5 -26,0 Z" fill="#7a4a2b"/>
      <rect x="324" y="228" width="10" height="10" fill="#e8e8e8"/>
    </g>
  </g>
  <g class="asset" data-asset="penguin" data-foreign="1" transform="translate(110,182)">
    <ellipse cx="0" cy="-7" rx="6" ry="8" fill="#26262e"/>
    <ellipse cx="0" cy="-5" rx="4" ry="6" fill="#f4f7fb"/>
    <path d="M0,-12 l5,2 l-5,1.5 Z" fill="#f59e0b"/>
    <ellipse cx="-2" cy="0" rx="2.5" ry="1.5" fill="#f59e0b"/>
    <ellipse cx="3" cy="0" rx="2.5" ry="1.5" fill="#f59e0b"/>
  </g>
  <g class="asset" data-asset="iceblock" data-foreign="1" transform="translate(134,228)">
    <polygon points="0,-10 12,-4 12,6 0,12 -12,6 -12,-4" fill="#bfe3f2"/>
    <polygon points="0,-10 12,-4 0,2 -12,-4" fill="#e6f5fd"/>
    <path d="M-6,-2 L0,1 L6,-2" stroke="#ffffff" stroke-width="1.5" fill="none" opacity="0.8"/>
  </g>
</svg>
`
};
