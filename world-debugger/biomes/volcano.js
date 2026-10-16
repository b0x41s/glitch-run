window.BIOMES = window.BIOMES || {};
window.BIOMES.volcano = {
  id: "volcano",
  name: "Volcanic Forge",
  desc: "Lava, basalt en ertsen",
  svg: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 380">
  <defs>
    <radialGradient id="volc-shadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(0,0,0,0.5)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
  </defs>

  <ellipse cx="240" cy="340" rx="170" ry="24" fill="url(#volc-shadow)"/>

  <!-- tile sides -->
  <polygon points="56,176 240,288 240,324 56,212" fill="#332b31"/>
  <polygon points="424,176 240,288 240,324 424,212" fill="#3d3339"/>
  <!-- tile top -->
  <polygon points="240,64 424,176 240,288 56,176" fill="#4b4149"/>

  <!-- back props -->
  <g class="asset" data-asset="palm" data-foreign="1">
    <path d="M105,158 C103,140 101,128 99,116" stroke="#8a5a3b" stroke-width="5" fill="none" stroke-linecap="round"/>
    <g fill="#3e8e5a">
      <path d="M99,116 C85,108 74,110 66,118 C78,120 90,120 99,116"/>
      <path d="M99,116 C113,108 124,110 132,118 C120,120 108,120 99,116"/>
      <path d="M99,116 C92,102 96,94 104,90 C106,102 102,110 99,116"/>
      <path d="M99,116 C106,104 116,102 124,106 C114,112 106,114 99,116"/>
    </g>
  </g>

  <g class="asset" data-asset="hut" data-foreign="0">
    <polygon points="336,150 366,150 366,172 336,172" fill="#6b5f66"/>
    <polygon points="332,150 351,138 370,150" fill="#4a3a42"/>
    <rect x="346" y="158" width="10" height="14" fill="#3a3038"/>
  </g>

  <g class="asset" data-asset="basalt" data-foreign="0">
    <polygon points="150,210 166,219 166,232 150,223 134,214" fill="#2c2530"/>
    <polygon points="134,214 150,210 166,219 150,223" fill="#3a3140"/>
    <polygon points="316,232 332,241 332,252 316,243 300,234" fill="#2c2530"/>
    <polygon points="300,234 316,232 332,241 316,243" fill="#3a3140"/>
  </g>

  <!-- volcano -->
  <g class="asset" data-asset="volcano" data-foreign="0">
    <ellipse cx="240" cy="192" rx="88" ry="40" fill="#453229"/>
    <path d="M160,198 L206,98 L274,98 L320,198 Z" fill="#5a4038"/>
    <path d="M160,198 L206,98 L240,104 L228,204 Z" fill="#654a3f"/>
    <ellipse cx="240" cy="98" rx="36" ry="14" fill="#6b4a3e"/>
  </g>

  <!-- crater + glow -->
  <ellipse cx="240" cy="99" rx="24" ry="9" fill="#ff7a1a"/>
  <circle cx="240" cy="96" r="34" fill="#ff9d4d" opacity="0.35">
    <animate attributeName="opacity" values="0.2;0.55;0.2" dur="2.2s" repeatCount="indefinite"/>
    <animate attributeName="r" values="32;40;32" dur="2.2s" repeatCount="indefinite"/>
  </circle>

  <!-- lava flows -->
  <g class="asset" data-asset="lava1" data-foreign="0">
    <path d="M230,104 C224,128 246,142 236,166 C229,184 241,202 233,220"
          fill="none" stroke="#ff7a1a" stroke-width="7" stroke-linecap="round" stroke-dasharray="12 9">
      <animate attributeName="stroke-dashoffset" from="0" to="-42" dur="1.3s" repeatCount="indefinite"/>
    </path>
  </g>
  <g class="asset" data-asset="lava2" data-foreign="0">
    <path d="M254,104 C264,122 250,146 262,170 C270,188 259,206 268,224"
          fill="none" stroke="#ff9d4d" stroke-width="6" stroke-linecap="round" stroke-dasharray="10 8">
      <animate attributeName="stroke-dashoffset" from="0" to="-36" dur="1.6s" repeatCount="indefinite"/>
    </path>
  </g>

  <!-- front props -->
  <g class="asset" data-asset="crystal" data-foreign="0">
    <polygon points="185,238 194,212 203,238" fill="#7c5cbf"/>
    <polygon points="194,212 203,238 196,238" fill="#9b7ee8"/>
  </g>
  <g class="asset" data-asset="crystal2" data-foreign="0">
    <polygon points="272,252 281,228 290,252" fill="#7c5cbf"/>
    <polygon points="281,228 290,252 283,252" fill="#9b7ee8"/>
  </g>
  <g class="asset" data-asset="iceblock" data-foreign="1">
    <polygon points="370,204 386,213 370,222 354,213" fill="#d8f1fb"/>
    <polygon points="354,213 370,222 370,240 354,231" fill="#a8d4e8"/>
    <polygon points="386,213 370,222 370,240 386,231" fill="#bfe3f2"/>
  </g>

  <!-- smoke puffs -->
  <g class="asset" data-asset="smoke" data-foreign="0">
    <ellipse cx="234" cy="78" rx="9" ry="6" fill="#8b8794" opacity="0.7">
      <animateTransform attributeName="transform" type="translate" values="0 0; -4 -36" dur="2.7s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.7;0" dur="2.7s" repeatCount="indefinite"/>
    </ellipse>
    <ellipse cx="244" cy="72" rx="11" ry="7" fill="#9a96a3" opacity="0.6">
      <animateTransform attributeName="transform" type="translate" values="0 0; 4 -40" dur="2.7s" begin="0.9s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0;0.6;0" keyTimes="0;0.2;1" dur="2.7s" begin="0.9s" repeatCount="indefinite"/>
    </ellipse>
    <ellipse cx="238" cy="70" rx="8" ry="5" fill="#8b8794" opacity="0.6">
      <animateTransform attributeName="transform" type="translate" values="0 0; 0 -44" dur="2.7s" begin="1.8s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0;0.6;0" keyTimes="0;0.2;1" dur="2.7s" begin="1.8s" repeatCount="indefinite"/>
    </ellipse>
  </g>
</svg>
`
};
