window.BIOMES = window.BIOMES || {};
window.BIOMES.harvest = {
  id: "harvest",
  name: "Harvest Plains",
  desc: "Boerderij, molen en akkers",
  svg: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 380">
  <defs>
    <radialGradient id="hv-shadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(0,0,0,0.5)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
  </defs>
  <ellipse cx="240" cy="340" rx="170" ry="24" fill="url(#hv-shadow)"/>
  <polygon points="56,176 240,288 240,324 56,212" fill="#4a7d42"/>
  <polygon points="424,176 240,288 240,324 424,212" fill="#568c4b"/>
  <polygon points="240,64 424,176 240,288 56,176" fill="#67a95c"/>
  <g class="asset" data-asset="wheat" data-foreign="0">
    <polygon points="128,150 238,217 238,225 128,158" fill="#e0b84f"/>
    <path d="M150,163 l0,8 M172,177 l0,8 M194,191 l0,8 M216,205 l0,8" stroke="#c99f3f" stroke-width="2" fill="none"/>
  </g>
  <g class="asset" data-asset="wheat2" data-foreign="0">
    <polygon points="150,132 260,199 260,207 150,140" fill="#e0b84f"/>
    <path d="M172,145 l0,8 M194,159 l0,8 M216,173 l0,8 M238,187 l0,8" stroke="#c99f3f" stroke-width="2" fill="none"/>
  </g>
  <g class="asset" data-asset="wheat3" data-foreign="0">
    <polygon points="110,190 220,257 220,265 110,198" fill="#e0b84f"/>
    <path d="M132,203 l0,8 M154,217 l0,8 M176,231 l0,8 M198,245 l0,8" stroke="#c99f3f" stroke-width="2" fill="none"/>
  </g>
  <g class="asset" data-asset="barn" data-foreign="0">
    <polygon points="168,98 198,116 168,152 138,116" fill="#8a2a22"/>
    <polygon points="138,116 168,152 168,168 138,150" fill="#b3392f"/>
    <polygon points="198,116 168,152 168,168 198,150" fill="#9c3128"/>
    <path d="M146,131 L160,139 L160,152 L146,144 Z" fill="#e8e8e8"/>
    <path d="M146,131 L160,152 M160,131 L146,152" stroke="#b3392f" stroke-width="1.6" fill="none"/>
    <path d="M150,122 L158,127 L158,133 L150,128 Z" fill="#6e1f19"/>
  </g>
  <g class="asset" data-asset="windmill" data-foreign="0">
    <polygon points="322,160 338,160 335,106 325,106" fill="#f2f2f2"/>
    <polygon points="338,160 335,106 330,106 330,160" fill="#d8dde2"/>
    <polygon points="323,106 337,106 330,96" fill="#d9534f"/>
    <g>
      <animateTransform attributeName="transform" type="rotate" from="0 330 102" to="360 330 102" dur="5s" repeatCount="indefinite"/>
      <path d="M330,102 L334,98 L332,72 L328,72 L326,98 Z" fill="#ffffff"/>
      <path d="M330,102 L334,98 L332,72 L328,72 L326,98 Z" fill="#ffffff" transform="rotate(90 330 102)"/>
      <path d="M330,102 L334,98 L332,72 L328,72 L326,98 Z" fill="#ffffff" transform="rotate(180 330 102)"/>
      <path d="M330,102 L334,98 L332,72 L328,72 L326,98 Z" fill="#ffffff" transform="rotate(270 330 102)"/>
      <circle cx="330" cy="102" r="3.5" fill="#8a9099"/>
    </g>
  </g>
  <g class="asset" data-asset="tractor" data-foreign="0">
    <g>
      <animateTransform attributeName="transform" type="translate" values="0 0; 0 -1; 0 0" dur="2.4s" repeatCount="indefinite"/>
      <rect x="262" y="228" width="26" height="12" rx="3" fill="#3f8a4c"/>
      <rect x="278" y="218" width="10" height="12" rx="2" fill="#2f6e3b"/>
      <circle cx="268" cy="242" r="6" fill="#26262e"/>
      <circle cx="282" cy="242" r="4" fill="#26262e"/>
      <circle cx="268" cy="242" r="2" fill="#8a9099"/>
    </g>
    <circle cx="285" cy="214" r="2.5" fill="#d8dde2">
      <animate attributeName="cy" values="214;204" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.7;0" dur="2s" repeatCount="indefinite"/>
    </circle>
  </g>
  <g class="asset" data-asset="fence" data-foreign="0">
    <path d="M84,196 L148,232 M84,192 L148,228" stroke="#f4f4f4" stroke-width="2.5" fill="none"/>
    <path d="M92,196 v8 M108,204 v8 M124,213 v8 M140,221 v8" stroke="#f4f4f4" stroke-width="3"/>
  </g>
  <g class="asset" data-asset="hay" data-foreign="0">
    <ellipse cx="212" cy="286" rx="11" ry="6" fill="#d9b45c"/>
    <ellipse cx="212" cy="286" rx="5" ry="2.6" fill="#c99f3f"/>
    <ellipse cx="178" cy="272" rx="9" ry="5" fill="#d9b45c"/>
    <ellipse cx="178" cy="272" rx="4" ry="2.2" fill="#c99f3f"/>
  </g>
  <g class="asset" data-asset="palm" data-foreign="1">
    <path d="M368,232 q4,-14 12,-22" stroke="#8a5a3b" stroke-width="4" fill="none"/>
    <path d="M380,210 q-14,-8 -24,-2 q12,6 24,2 Z" fill="#3f9b57"/>
    <path d="M380,210 q14,-8 24,-2 q-12,6 -24,2 Z" fill="#3f9b57"/>
    <path d="M380,210 q-4,-14 -14,-18 q4,12 14,18 Z" fill="#4caf67"/>
  </g>
  <g class="asset" data-asset="icepeak" data-foreign="1">
    <polygon points="392,168 404,206 380,206" fill="#bfe3f2"/>
    <polygon points="392,168 404,206 392,206" fill="#9fcbe4"/>
  </g>
</svg>
`
};
