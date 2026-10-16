window.BIOMES = window.BIOMES || {};
window.BIOMES.frozen = {
  id: "frozen",
  name: "Frozen Frontier",
  desc: "IJs, onderzoek en oceaan",
  svg: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 380">
  <defs>
    <radialGradient id="fr-shadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(0,0,0,0.5)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
  </defs>

  <!-- schaduw -->
  <ellipse cx="240" cy="340" rx="175" ry="24" fill="url(#fr-shadow)"/>

  <!-- aurora -->
  <g class="asset" data-asset="aurora" data-foreign="0">
    <path d="M84,50 Q210,14 396,46" stroke="#4ade80" stroke-width="8" fill="none" stroke-linecap="round">
      <animate attributeName="stroke-opacity" values="0.12;0.4;0.12" dur="5s" repeatCount="indefinite"/>
    </path>
    <path d="M120,64 Q250,34 404,60" stroke="#6ee7a8" stroke-width="4" fill="none" stroke-linecap="round">
      <animate attributeName="stroke-opacity" values="0.1;0.35;0.1" dur="6.5s" begin="-2s" repeatCount="indefinite"/>
    </path>
  </g>

  <!-- tile -->
  <path d="M56,176 L240,288 L240,324 L56,212 Z" fill="#a9cde4"/>
  <path d="M424,176 L240,288 L240,324 L424,212 Z" fill="#b9d8ec"/>
  <path d="M240,64 L424,176 L240,288 L56,176 Z" fill="#dceefb" stroke="#b9d8ec" stroke-width="1.5"/>

  <!-- sneeuwkuilen -->
  <ellipse cx="150" cy="185" rx="18" ry="6" fill="#f4fbff"/>
  <ellipse cx="215" cy="160" rx="13" ry="5" fill="#f4fbff"/>
  <ellipse cx="305" cy="205" rx="20" ry="7" fill="#f4fbff"/>
  <ellipse cx="285" cy="252" rx="15" ry="5" fill="#f4fbff"/>

  <!-- ijspegels -->
  <g class="asset" data-asset="icepeak" data-foreign="0" transform="translate(185,120)">
    <polygon points="0,-74 28,0 -28,0" fill="#bfe3f2"/>
    <polygon points="0,-74 -28,0 0,0" fill="#9fd0e8"/>
  </g>
  <g class="asset" data-asset="icepeak2" data-foreign="0" transform="translate(272,142) scale(1.25)">
    <polygon points="0,-74 28,0 -28,0" fill="#bfe3f2"/>
    <polygon points="0,-74 -28,0 0,0" fill="#9fd0e8"/>
  </g>
  <g class="asset" data-asset="icepeak3" data-foreign="0" transform="translate(349,168) scale(0.85)">
    <polygon points="0,-74 28,0 -28,0" fill="#bfe3f2"/>
    <polygon points="0,-74 -28,0 0,0" fill="#9fd0e8"/>
  </g>

  <!-- open-waterpoel -->
  <g class="asset" data-asset="pond" data-foreign="0">
    <ellipse cx="235" cy="228" rx="55" ry="19" fill="#3fa9d8"/>
    <ellipse cx="235" cy="227" rx="44" ry="14" fill="#5fc4e8"/>
    <polygon points="200,232 214,228 224,234 208,237" fill="#e6f5fd" opacity="0.9"/>
    <polygon points="256,222 268,219 274,225 262,228" fill="#e6f5fd" opacity="0.9"/>
  </g>

  <!-- FOREIGN: zeilbootje op de poel -->
  <g class="asset" data-asset="sailboat" data-foreign="1" transform="translate(262,231)">
    <animateTransform attributeName="transform" type="translate" values="262,231;262,228;262,231" dur="2.4s" repeatCount="indefinite"/>
    <path d="M-13,2 L13,2 L7,9 L-7,9 Z" fill="#8a5a33"/>
    <line x1="0" y1="2" x2="0" y2="-20" stroke="#8a5a33" stroke-width="2"/>
    <polygon points="0,-20 12,-4 0,-4" fill="#f4f7fb"/>
    <polygon points="0,-20 -9,-5 0,-5" fill="#e2ecf5"/>
  </g>

  <!-- pinguins -->
  <g class="asset" data-asset="penguin" data-foreign="0" transform="translate(168,232)">
    <g>
      <animateTransform attributeName="transform" type="rotate" values="-4 0 0;4 0 0;-4 0 0" dur="1.8s" repeatCount="indefinite"/>
      <ellipse cx="0" cy="-10" rx="7" ry="10" fill="#26262e"/>
      <ellipse cx="0" cy="-8" rx="4.5" ry="7" fill="#f4f7fb"/>
      <path d="M0,-17 l6,2.5 l-6,1.5 Z" fill="#f59e0b"/>
      <circle cx="3" cy="-15" r="1.2" fill="#e8f1fa"/>
      <ellipse cx="-3.5" cy="0" rx="3" ry="1.5" fill="#f59e0b"/>
      <ellipse cx="3.5" cy="0" rx="3" ry="1.5" fill="#f59e0b"/>
    </g>
  </g>
  <g class="asset" data-asset="penguin2" data-foreign="0" transform="translate(196,251)">
    <g>
      <animateTransform attributeName="transform" type="rotate" values="-4 0 0;4 0 0;-4 0 0" dur="2.2s" begin="-0.9s" repeatCount="indefinite"/>
      <ellipse cx="0" cy="-10" rx="7" ry="10" fill="#26262e"/>
      <ellipse cx="0" cy="-8" rx="4.5" ry="7" fill="#f4f7fb"/>
      <path d="M0,-17 l6,2.5 l-6,1.5 Z" fill="#f59e0b"/>
      <circle cx="3" cy="-15" r="1.2" fill="#e8f1fa"/>
      <ellipse cx="-3.5" cy="0" rx="3" ry="1.5" fill="#f59e0b"/>
      <ellipse cx="3.5" cy="0" rx="3" ry="1.5" fill="#f59e0b"/>
    </g>
  </g>

  <!-- onderzoeksantenne -->
  <g class="asset" data-asset="antenna" data-foreign="0" transform="translate(352,196)">
    <ellipse cx="0" cy="0" rx="7" ry="2.5" fill="#c3dcee"/>
    <rect x="-1.5" y="-42" width="3" height="42" fill="#8b9bbd"/>
    <circle cx="0" cy="-44" r="4" fill="#c8d6e8"/>
    <circle cx="0" cy="-49" r="2.5" fill="#f87171">
      <animate attributeName="opacity" values="0.25;1;0.25" dur="1.2s" repeatCount="indefinite"/>
    </circle>
  </g>

  <!-- FOREIGN: cactus -->
  <g class="asset" data-asset="cactus" data-foreign="1" transform="translate(108,198)">
    <rect x="-4" y="-27" width="8" height="27" rx="4" fill="#4caf67"/>
    <rect x="-12" y="-22" width="8" height="5" rx="2.5" fill="#4caf67"/>
    <rect x="-12" y="-26" width="5" height="12" rx="2.5" fill="#4caf67"/>
    <rect x="4" y="-17" width="8" height="5" rx="2.5" fill="#4caf67"/>
    <rect x="7" y="-23" width="5" height="11" rx="2.5" fill="#4caf67"/>
  </g>

  <!-- vallende sneeuw -->
  <g transform="translate(120,0)">
    <circle r="2" fill="#ffffff" opacity="0">
      <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.8;1" dur="4.5s" begin="-0.5s" repeatCount="indefinite"/>
    </circle>
    <animateTransform attributeName="transform" type="translate" from="0 -15" to="0 305" dur="4.5s" begin="-0.5s" repeatCount="indefinite" additive="sum"/>
  </g>
  <g transform="translate(180,0)">
    <circle r="2.4" fill="#ffffff" opacity="0">
      <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.8;1" dur="5.4s" begin="-2.1s" repeatCount="indefinite"/>
    </circle>
    <animateTransform attributeName="transform" type="translate" from="0 -15" to="0 305" dur="5.4s" begin="-2.1s" repeatCount="indefinite" additive="sum"/>
  </g>
  <g transform="translate(248,0)">
    <circle r="1.8" fill="#ffffff" opacity="0">
      <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.8;1" dur="4.8s" begin="-3.4s" repeatCount="indefinite"/>
    </circle>
    <animateTransform attributeName="transform" type="translate" from="0 -15" to="0 305" dur="4.8s" begin="-3.4s" repeatCount="indefinite" additive="sum"/>
  </g>
  <g transform="translate(316,0)">
    <circle r="2.2" fill="#ffffff" opacity="0">
      <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.8;1" dur="5.8s" begin="-1.3s" repeatCount="indefinite"/>
    </circle>
    <animateTransform attributeName="transform" type="translate" from="0 -15" to="0 305" dur="5.8s" begin="-1.3s" repeatCount="indefinite" additive="sum"/>
  </g>
  <g transform="translate(384,0)">
    <circle r="1.6" fill="#ffffff" opacity="0">
      <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.8;1" dur="4.3s" begin="-2.8s" repeatCount="indefinite"/>
    </circle>
    <animateTransform attributeName="transform" type="translate" from="0 -15" to="0 305" dur="4.3s" begin="-2.8s" repeatCount="indefinite" additive="sum"/>
  </g>
</svg>
`
};
