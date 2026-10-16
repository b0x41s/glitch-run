window.BIOMES = window.BIOMES || {};
window.BIOMES.alpine = {
  id: "alpine",
  name: "Alpine Valley",
  desc: "Bergen, bos en water",
  svg: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 380">
  <defs>
    <radialGradient id="alpine-shadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(0,0,0,0.5)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
  </defs>

  <!-- schaduw -->
  <ellipse cx="240" cy="344" rx="180" ry="22" fill="url(#alpine-shadow)"/>

  <!-- zwevende iso-tile -->
  <polygon points="56,176 240,288 240,324 56,212" fill="#3e7439"/>
  <polygon points="424,176 240,288 240,324 424,212" fill="#4a8543"/>
  <polygon points="240,64 424,176 240,288 56,176" fill="#5f9e4f"/>

  <!-- gras spikkels -->
  <ellipse cx="170" cy="210" rx="6" ry="2" fill="#4f8a42"/>
  <ellipse cx="280" cy="200" rx="6" ry="2" fill="#4f8a42"/>
  <ellipse cx="230" cy="270" rx="6" ry="2" fill="#4f8a42"/>

  <!-- bergen met sneeuwtoppen -->
  <g class="asset" data-asset="mountain" data-foreign="0">
    <polygon points="150,138 185,88 222,138" fill="#8b95a5"/>
    <polygon points="185,88 174,106 196,106" fill="#ffffff"/>
    <polygon points="214,142 255,74 296,142" fill="#8b95a5"/>
    <polygon points="255,74 242,98 268,98" fill="#ffffff"/>
    <polygon points="296,152 330,102 364,152" fill="#8b95a5"/>
    <polygon points="330,102 318,120 342,120" fill="#ffffff"/>
  </g>

  <!-- rivier + waterval -->
  <g class="asset" data-asset="river" data-foreign="0">
    <path d="M255,142 C246,168 258,190 248,215 C240,238 244,262 240,288" fill="none" stroke="#3fb6e8" stroke-width="14" stroke-linecap="round"/>
    <path d="M255,142 C246,168 258,190 248,215 C240,238 244,262 240,288" fill="none" stroke="#bfe9ff" stroke-width="5" stroke-linecap="round" stroke-dasharray="10 14">
      <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="1.2s" repeatCount="indefinite"/>
    </path>
    <polygon points="233,288 247,288 247,324 233,324" fill="#3fb6e8"/>
    <line x1="240" y1="286" x2="240" y2="324" stroke="#bfe9ff" stroke-width="4" stroke-dasharray="6 8">
      <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="0.9s" repeatCount="indefinite"/>
    </line>
    <ellipse cx="240" cy="326" rx="12" ry="4" fill="#bfe9ff" opacity="0.8"/>
  </g>

  <!-- hutje -->
  <g class="asset" data-asset="hut" data-foreign="0">
    <rect x="116" y="182" width="42" height="30" fill="#8a5a3b"/>
    <polygon points="162,182 137,162 149,153 174,171" fill="#6e4429"/>
    <polygon points="112,182 137,162 162,182" fill="#5a3a26"/>
    <rect x="130" y="194" width="11" height="18" fill="#4a2f1f"/>
  </g>

  <!-- regenwolk -->
  <g class="asset" data-asset="cloud" data-foreign="0">
    <ellipse cx="112" cy="148" rx="14" ry="10" fill="#ffffff"/>
    <ellipse cx="128" cy="142" rx="18" ry="12" fill="#ffffff"/>
    <ellipse cx="146" cy="148" rx="13" ry="9" fill="#ffffff"/>
    <line x1="112" y1="158" x2="112" y2="178" stroke="#9fd8f0" stroke-width="2" stroke-dasharray="3 5">
      <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="0.7s" repeatCount="indefinite"/>
    </line>
    <line x1="126" y1="160" x2="126" y2="180" stroke="#9fd8f0" stroke-width="2" stroke-dasharray="3 5">
      <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="0.7s" repeatCount="indefinite" begin="0.2s"/>
    </line>
    <line x1="140" y1="160" x2="140" y2="180" stroke="#9fd8f0" stroke-width="2" stroke-dasharray="3 5">
      <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="0.7s" repeatCount="indefinite" begin="0.4s"/>
    </line>
    <line x1="152" y1="158" x2="152" y2="178" stroke="#9fd8f0" stroke-width="2" stroke-dasharray="3 5">
      <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="0.7s" repeatCount="indefinite" begin="0.6s"/>
    </line>
  </g>

  <!-- dennenbomen -->
  <g class="asset" data-asset="pine" data-foreign="0">
    <rect x="115" y="186" width="6" height="10" fill="#6b4a2f"/>
    <polygon points="118,156 102,186 134,186" fill="#2e6b45"/>
    <polygon points="118,166 99,188 137,188" fill="#2e6b45"/>
  </g>
  <g class="asset" data-asset="pine2" data-foreign="0">
    <rect x="335" y="198" width="6" height="8" fill="#6b4a2f"/>
    <polygon points="338,172 325,198 351,198" fill="#2e6b45"/>
    <polygon points="338,181 322,200 354,200" fill="#2e6b45"/>
  </g>
  <g class="asset" data-asset="pine3" data-foreign="0">
    <rect x="297" y="232" width="6" height="8" fill="#6b4a2f"/>
    <polygon points="300,208 288,232 312,232" fill="#2e6b45"/>
    <polygon points="300,216 286,234 314,234" fill="#2e6b45"/>
  </g>

  <!-- stenen -->
  <polygon points="282,244 292,240 298,248 288,252" fill="#9aa5b1"/>
  <polygon points="294,246 300,244 302,249 296,251" fill="#8b95a5"/>

  <!-- FOREIGN: cactus rechts -->
  <g class="asset" data-asset="cactus" data-foreign="1">
    <rect x="362" y="150" width="12" height="32" rx="6" fill="#3f8a4c"/>
    <path d="M363,164 h-9 v-9" stroke="#3f8a4c" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M373,170 h8 v-8" stroke="#3f8a4c" stroke-width="6" fill="none" stroke-linecap="round"/>
  </g>

  <!-- FOREIGN: palmboom linksvoor -->
  <g class="asset" data-asset="palm" data-foreign="1">
    <path d="M190,250 C192,236 194,228 198,220" stroke="#8a5a3b" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M198,220 q14,-10 26,-4" stroke="#3f8a4c" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M198,220 q-14,-10 -26,-4" stroke="#3f8a4c" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M198,220 q16,2 22,12" stroke="#3f8a4c" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M198,220 q-16,2 -22,12" stroke="#3f8a4c" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M198,220 q2,-14 10,-18" stroke="#3f8a4c" stroke-width="4" fill="none" stroke-linecap="round"/>
  </g>
</svg>`
};
