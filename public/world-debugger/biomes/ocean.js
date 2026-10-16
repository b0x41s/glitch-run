window.BIOMES = window.BIOMES || {};
window.BIOMES.ocean = {
  id: "ocean",
  name: "Open Water",
  desc: "Schip, haaien en open zee",
  svg: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 380">
  <defs>
    <radialGradient id="oc-shadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(0,0,0,0.5)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
    <radialGradient id="oc-floor" cx="46%" cy="38%" r="70%">
      <stop offset="0%" stop-color="#a9cde4"/>
      <stop offset="65%" stop-color="#8fb9d9"/>
      <stop offset="100%" stop-color="#b9d9ec"/>
    </radialGradient>
    <linearGradient id="oc-surface" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6b96bd" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#4d7ea8" stop-opacity="0.40"/>
    </linearGradient>
    <path id="oc-shark1" d="M205,170 C290,148 345,195 322,232 C298,268 205,270 170,238 C140,208 148,182 205,170 Z"/>
    <path id="oc-shark2" d="M252,192 C305,180 325,212 303,238 C280,262 228,258 202,236 C182,218 198,198 252,192 Z"/>
    <path id="oc-gull" d="M120,90 C180,60 320,55 370,95 C330,70 190,75 120,90 Z"/>
  </defs>
  <ellipse cx="240" cy="340" rx="170" ry="24" fill="url(#oc-shadow)"/>
  <polygon points="56,176 240,288 240,324 56,212" fill="#2c4d6e"/>
  <polygon points="424,176 240,288 240,324 424,212" fill="#3a6690"/>
  <polygon points="240,64 424,176 240,288 56,176" fill="url(#oc-floor)"/>
  <!-- mist + wolkenschaduw over het water -->
  <ellipse cx="190" cy="160" rx="55" ry="20" fill="#ffffff" opacity="0.12">
    <animateTransform attributeName="transform" type="translate" values="0 0; 14 5; 0 0" dur="11s" repeatCount="indefinite"/>
  </ellipse>
  <ellipse cx="320" cy="205" rx="65" ry="22" fill="#ffffff" opacity="0.10">
    <animateTransform attributeName="transform" type="translate" values="0 0; -12 4; 0 0" dur="13s" repeatCount="indefinite"/>
  </ellipse>
  <ellipse cx="240" cy="255" rx="48" ry="16" fill="#ffffff" opacity="0.09">
    <animateTransform attributeName="transform" type="translate" values="0 0; 10 -4; 0 0" dur="15s" repeatCount="indefinite"/>
  </ellipse>
  <ellipse cx="265" cy="150" rx="42" ry="15" fill="#24466b" opacity="0.16">
    <animateTransform attributeName="transform" type="translate" values="0 0; 18 8; 0 0" dur="17s" repeatCount="indefinite"/>
  </ellipse>
  <path d="M170,190 q18,-10 40,-4 q14,4 8,14 q-20,12 -42,6 q-14,-4 -6,-16 Z" fill="#d4eef8" opacity="0.55"/>
  <path d="M280,150 q16,-8 34,-3 q10,4 5,12 q-18,10 -36,5 q-12,-4 -3,-14 Z" fill="#d4eef8" opacity="0.5"/>
  <path d="M250,235 q14,-8 30,-3 q9,3 4,11 q-16,9 -32,4 q-11,-4 -2,-12 Z" fill="#d4eef8" opacity="0.5"/>
  <g class="asset" data-asset="rocks" data-foreign="0">
    <ellipse cx="180" cy="200" rx="11" ry="5.5" fill="#7fa8bd"/>
    <ellipse cx="177" cy="198" rx="6" ry="3" fill="#93bccf"/>
    <ellipse cx="292" cy="170" rx="9" ry="4.5" fill="#7fa8bd"/>
    <ellipse cx="332" cy="252" rx="10" ry="5" fill="#7fa8bd"/>
    <ellipse cx="335" cy="250" rx="5.5" ry="2.6" fill="#93bccf"/>
    <ellipse cx="150" cy="158" rx="8" ry="4" fill="#8fb6c9"/>
    <circle cx="240" cy="252" r="2" fill="#e4f4fb"/>
    <circle cx="272" cy="148" r="2" fill="#e4f4fb"/>
    <circle cx="198" cy="128" r="1.8" fill="#e4f4fb"/>
    <circle cx="312" cy="222" r="2.2" fill="#e4f4fb"/>
  </g>
  <g class="asset" data-asset="kelp" data-foreign="0">
    <g>
      <path d="M135,215 q-5,-10 0,-20 q5,-9 0,-17" stroke="#7d4fb5" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M142,215 q5,-8 0,-17 q-4,-7 0,-13" stroke="#9a6fd0" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M129,215 q-3,-7 0,-14" stroke="#9a6fd0" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <animateTransform attributeName="transform" type="rotate" values="-5 135 215; 5 135 215; -5 135 215" dur="3.8s" repeatCount="indefinite"/>
    </g>
  </g>
  <g class="asset" data-asset="kelp2" data-foreign="0">
    <g>
      <path d="M355,205 q5,-9 0,-18 q-5,-8 0,-14" stroke="#7d4fb5" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M349,205 q-4,-7 0,-14 q3,-6 0,-11" stroke="#9a6fd0" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M361,205 q4,-7 0,-13" stroke="#9a6fd0" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <animateTransform attributeName="transform" type="rotate" values="5 355 205; -5 355 205; 5 355 205" dur="4.4s" repeatCount="indefinite"/>
    </g>
  </g>
  <g class="asset" data-asset="fish" data-foreign="0">
    <g>
      <ellipse rx="6" ry="3.4" fill="#f59e0b"/>
      <path d="M6,0 L10,-3.5 L10,3.5 Z" fill="#f59e0b"/>
      <circle cx="3.5" cy="-1" r="0.8" fill="#3a2a08"/>
      <animateTransform attributeName="transform" type="translate" values="170,240; 224,252; 170,240" dur="7s" repeatCount="indefinite"/>
    </g>
    <g>
      <ellipse rx="4.5" ry="2.6" fill="#fb923c"/>
      <path d="M4.5,0 L8,-2.8 L8,2.8 Z" fill="#fb923c"/>
      <animateTransform attributeName="transform" type="translate" values="320,180; 268,166; 320,180" dur="9s" repeatCount="indefinite"/>
    </g>
    <g>
      <animateTransform attributeName="transform" type="translate" values="200,200; 230,188; 200,200" dur="6s" begin="-2s" repeatCount="indefinite"/>
      <ellipse rx="3.4" ry="2" fill="#fbbf24"/>
      <path d="M3.4,0 L6,-2.2 L6,2.2 Z" fill="#fbbf24"/>
      <ellipse cx="14" cy="6" rx="3" ry="1.8" fill="#fbbf24"/>
      <path d="M17,6 L19.5,4.2 L19.5,7.8 Z" fill="#fbbf24"/>
      <ellipse cx="-12" cy="7" rx="3" ry="1.8" fill="#fbbf24"/>
      <path d="M-9,7 L-6.5,5.2 L-6.5,8.8 Z" fill="#fbbf24"/>
    </g>
  </g>
  <path d="M130,180 q15,8 30,0 t30,0 t30,0" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.16" stroke-dasharray="22 12">
    <animate attributeName="stroke-dashoffset" from="0" to="-68" dur="4.5s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.08;0.22;0.08" dur="4.5s" repeatCount="indefinite"/>
  </path>
  <path d="M230,140 q15,8 30,0 t30,0 t30,0" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.14" stroke-dasharray="20 14">
    <animate attributeName="stroke-dashoffset" from="0" to="-68" dur="5.5s" repeatCount="indefinite"/>
  </path>
  <path d="M180,240 q15,8 30,0 t30,0 t30,0" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.14" stroke-dasharray="20 14">
    <animate attributeName="stroke-dashoffset" from="0" to="68" dur="6s" repeatCount="indefinite"/>
  </path>
  <ellipse rx="16" ry="5" fill="#2e5e7e" opacity="0.28">
    <animateMotion dur="14s" repeatCount="indefinite" rotate="auto"><mpath href="#oc-shark1"/></animateMotion>
  </ellipse>
  <ellipse rx="13" ry="4" fill="#2e5e7e" opacity="0.28">
    <animateMotion dur="10s" begin="-4s" repeatCount="indefinite" rotate="auto"><mpath href="#oc-shark2"/></animateMotion>
  </ellipse>
  <g class="asset" data-asset="shark" data-foreign="0">
    <g>
      <!-- staart: maanvormige waaier van bovenaf -->
      <path d="M-13,0 Q-18,-2.5 -24,-9.5 Q-20.5,0 -24,9.5 Q-18,2.5 -13,0 Z" fill="#57687a"/>
      <!-- bekkenvinnen -->
      <path d="M-4,-4 L-11,-10.5 Q-8,-4.5 -4,-3.5 Z" fill="#57687a"/>
      <path d="M-4,4 L-11,10.5 Q-8,4.5 -4,3.5 Z" fill="#57687a"/>
      <!-- borstvinnen: naar achteren gezweept -->
      <path d="M7,-5 L-5,-14 L1,-4 Z" fill="#5e7183"/>
      <path d="M7,5 L-5,14 L1,4 Z" fill="#5e7183"/>
      <!-- romp: ruggenzicht, snuit op +x (rijrichting) -->
      <path d="M23,0 Q16,-7 3,-7.2 Q-9,-7 -14,-3.2 Q-15.5,0 -14,3.2 Q-9,7 3,7.2 Q16,7 23,0 Z" fill="#66798a"/>
      <!-- ruggenlijn -->
      <path d="M18,0 Q4,0 -11,0" stroke="#7d92a3" stroke-width="1.6" fill="none" opacity="0.6"/>
      <!-- rugvin-ribbel op de rug -->
      <path d="M-1,-1.6 L4,0 L-1,1.6 Z" fill="#57687a" opacity="0.85"/>
      <!-- ogen aan beide zijkanten van de kop -->
      <circle cx="16" cy="-3.4" r="1.2" fill="#16232c"/>
      <circle cx="16" cy="3.4" r="1.2" fill="#16232c"/>
      <circle cx="16.3" cy="-3.7" r="0.35" fill="#cfe3ee"/>
      <circle cx="16.3" cy="3.1" r="0.35" fill="#cfe3ee"/>
      <animateMotion dur="14s" repeatCount="indefinite" rotate="auto"><mpath href="#oc-shark1"/></animateMotion>
    </g>
  </g>
  <g class="asset" data-asset="shark2" data-foreign="0">
    <g>
      <!-- staart -->
      <path d="M-10.5,0 Q-14,-2 -19,-7.5 Q-16.5,0 -19,7.5 Q-14,2 -10.5,0 Z" fill="#68798a"/>
      <!-- borstvinnen -->
      <path d="M5,-4.5 L-4,-11.5 L0.5,-3.5 Z" fill="#6c7e8e"/>
      <path d="M5,4.5 L-4,11.5 L0.5,3.5 Z" fill="#6c7e8e"/>
      <!-- bekkenvinnen -->
      <path d="M-3,-3 L-8.5,-8 Q-6,-3.5 -3,-2.6 Z" fill="#68798a"/>
      <path d="M-3,3 L-8.5,8 Q-6,3.5 -3,2.6 Z" fill="#68798a"/>
      <!-- romp: ruggenzicht -->
      <path d="M18,0 Q12,-5.6 2,-5.8 Q-7,-5.6 -11.5,-2.6 Q-13,0 -11.5,2.6 Q-7,5.6 2,5.8 Q12,5.6 18,0 Z" fill="#77899a"/>
      <path d="M14,0 Q3,0 -8.5,0" stroke="#8fa3b3" stroke-width="1.4" fill="none" opacity="0.6"/>
      <circle cx="12.5" cy="-2.8" r="1" fill="#16232c"/>
      <circle cx="12.5" cy="2.8" r="1" fill="#16232c"/>
      <animateMotion dur="10s" begin="-4s" repeatCount="indefinite" rotate="auto"><mpath href="#oc-shark2"/></animateMotion>
    </g>
  </g>
  <polygon points="240,64 424,176 240,288 56,176" fill="url(#oc-surface)"/>
  <polygon points="240,64 424,176 240,288 56,176" fill="none" stroke="#7ba7c8" stroke-width="3" opacity="0.5"/>
  <path d="M148,152 q11,-7 22,0 t22,0" stroke="#ffffff" stroke-width="2.2" fill="none" opacity="0.65" stroke-dasharray="13 10">
    <animate attributeName="stroke-dashoffset" from="0" to="-46" dur="2.2s" repeatCount="indefinite"/>
  </path>
  <path d="M268,138 q11,-7 22,0 t22,0" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.5" stroke-dasharray="13 10">
    <animate attributeName="stroke-dashoffset" from="0" to="-46" dur="2.9s" repeatCount="indefinite"/>
  </path>
  <path d="M208,242 q11,-7 22,0 t22,0" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.5" stroke-dasharray="13 10">
    <animate attributeName="stroke-dashoffset" from="0" to="-46" dur="2.5s" repeatCount="indefinite"/>
  </path>
  <path d="M318,192 q10,-6 20,0 t20,0" stroke="#ffffff" stroke-width="1.8" fill="none" opacity="0.4" stroke-dasharray="10 9">
    <animate attributeName="stroke-dashoffset" from="0" to="-38" dur="3.2s" repeatCount="indefinite"/>
  </path>
  <path d="M118,196 q9,-5 18,0 t18,0" stroke="#ffffff" stroke-width="1.6" fill="none" opacity="0.35" stroke-dasharray="9 8">
    <animate attributeName="stroke-dashoffset" from="0" to="-34" dur="3.6s" repeatCount="indefinite"/>
  </path>
  <circle cx="185" cy="142" r="1.8" fill="#ffffff">
    <animate attributeName="opacity" values="0.15;0.9;0.15" dur="2.4s" repeatCount="indefinite"/>
  </circle>
  <circle cx="300" cy="163" r="1.5" fill="#ffffff">
    <animate attributeName="opacity" values="0.15;0.85;0.15" dur="3.1s" begin="-1s" repeatCount="indefinite"/>
  </circle>
  <circle cx="243" cy="205" r="1.7" fill="#ffffff">
    <animate attributeName="opacity" values="0.15;0.8;0.15" dur="2.8s" begin="-0.6s" repeatCount="indefinite"/>
  </circle>
  <circle cx="338" cy="212" r="1.5" fill="#ffffff">
    <animate attributeName="opacity" values="0.15;0.85;0.15" dur="3.4s" begin="-1.8s" repeatCount="indefinite"/>
  </circle>
  <circle cx="160" cy="192" r="1.4" fill="#ffffff">
    <animate attributeName="opacity" values="0.1;0.75;0.1" dur="2.6s" begin="-2s" repeatCount="indefinite"/>
  </circle>
  <!-- rugvin van de haai, boven het water (altijd verticaal, volgt exact het pad) -->
  <g class="asset" data-asset="sharkfin" data-foreign="0">
    <g>
      <!-- waterkies: V die openvalt in de vaarrichting -->
      <path d="M-2,-2.5 Q-8,-4.5 -11,-2" stroke="#ffffff" stroke-width="1.4" fill="none" opacity="0.75"/>
      <path d="M-2,2.5 Q-8,4.5 -11,2" stroke="#ffffff" stroke-width="1.4" fill="none" opacity="0.75"/>
      <!-- vinblaad: loodrecht op de rug, meedraaiend met de haai -->
      <path d="M-1.5,0 Q3.5,-2 8,0 Q3.5,2 -1.5,0 Z" fill="#66798a" stroke="#4d606e" stroke-width="0.8"/>
      <!-- rimpeling rond de basis -->
      <path d="M-4,0 Q3.5,-3.4 11,0 Q3.5,3.4 -4,0 Z" fill="none" stroke="#4d7ea8" stroke-width="1.6" opacity="0.55"/>
      <animateMotion dur="14s" repeatCount="indefinite" rotate="auto"><mpath href="#oc-shark1"/></animateMotion>
    </g>
  </g>
  <g class="asset" data-asset="boat" data-foreign="0" transform="translate(252,150) scale(1.28)">
    <ellipse cx="4" cy="13" rx="60" ry="17" fill="#1e3f5e" opacity="0.34"/>
    <ellipse cx="0" cy="10" rx="54" ry="14" fill="#ffffff" opacity="0.18">
      <animate attributeName="rx" values="54;59;54" dur="3.5s" repeatCount="indefinite"/>
    </ellipse>
    <path d="M44,6 L78,16" stroke="#ffffff" stroke-width="2.5" fill="none" opacity="0.55" stroke-linecap="round" stroke-dasharray="8 7">
      <animate attributeName="stroke-dashoffset" from="0" to="-30" dur="1.6s" repeatCount="indefinite"/>
    </path>
    <path d="M44,12 L78,30" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.4" stroke-linecap="round" stroke-dasharray="7 6">
      <animate attributeName="stroke-dashoffset" from="0" to="-26" dur="1.9s" repeatCount="indefinite"/>
    </path>
    <g>
      <animateTransform attributeName="transform" type="translate" values="0 0; 0 2.5; 0 0" dur="3.5s" repeatCount="indefinite"/>
      <animateTransform attributeName="transform" type="rotate" values="-1.2; 1.2; -1.2" dur="5s" repeatCount="indefinite" additive="sum"/>
      <path d="M-44,-2 L-40,9 Q0,16 36,9 L42,-2 Q20,4 0,4 Q-22,4 -44,-2 Z" fill="#f4f1e8"/>
      <path d="M-37,4 Q0,11.5 37,4" stroke="#e8e4d8" stroke-width="2" fill="none"/>
      <path d="M-37,2 Q0,10 37,2" stroke="#c0392b" stroke-width="3.5" fill="none"/>
      <rect x="-16" y="-21" width="32" height="17" fill="#f4f1e8"/>
      <rect x="-16" y="-7" width="32" height="3" fill="#8a5a3b" opacity="0.35"/>
      <polygon points="-18,-21 18,-21 13,-30 -13,-30" fill="#8a5a3b"/>
      <polygon points="-18,-21 18,-21 18,-19.5 -18,-19.5" fill="#6f4630" opacity="0.6"/>
      <rect x="-11" y="-16" width="7" height="6" fill="#3b82c4"/>
      <rect x="2" y="-16" width="7" height="6" fill="#3b82c4"/>
      <rect x="-3" y="-11" width="6" height="7" fill="#8a5a3b"/>
      <circle cx="-20" cy="-8" r="3.2" fill="none" stroke="#e67e22" stroke-width="2"/>
      <rect x="17" y="-30" width="5" height="10" fill="#4a4a52"/>
      <circle cx="20" cy="-35" r="2.5" fill="#d8dde2">
        <animate attributeName="cy" values="-35;-48" dur="2.6s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0" dur="2.6s" repeatCount="indefinite"/>
      </circle>
      <line x1="-4" y1="-30" x2="-4" y2="-58" stroke="#d8d5cc" stroke-width="2.5"/>
      <line x1="-14" y1="-48" x2="6" y2="-48" stroke="#d8d5cc" stroke-width="2"/>
      <polygon points="-4,-58 12,-53 -4,-48" fill="#e74c3c"/>
    </g>
  </g>
  <g class="asset" data-asset="seagull" data-foreign="0">
    <g>
      <path d="M-8,0 q4,-6 8,0 q4,-6 8,0" stroke="#f4f4f4" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <animateMotion dur="16s" repeatCount="indefinite"><mpath href="#oc-gull"/></animateMotion>
    </g>
    <g>
      <path d="M-5,0 q2.5,-4 5,0 q2.5,-4 5,0" stroke="#e8e8e8" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <animateMotion dur="16s" begin="-8s" repeatCount="indefinite"><mpath href="#oc-gull"/></animateMotion>
    </g>
  </g>
  <g class="asset" data-asset="barn" data-foreign="1">
    <ellipse cx="399" cy="158" rx="14" ry="6" fill="#ffffff" opacity="0.35">
      <animate attributeName="opacity" values="0.2;0.45;0.2" dur="3s" repeatCount="indefinite"/>
    </ellipse>
    <polygon points="390,150 412,159 407,168 385,159" fill="#7fa8bd"/>
    <polygon points="392,155 402,160 402,169 392,164" fill="#b03a34"/>
    <polygon points="402,160 410,156 410,165 402,169" fill="#8e2f2b"/>
    <polygon points="390,154 401,148 412,154 401,159" fill="#6e2622"/>
    <polygon points="396,160 399,161.5 399,166 396,164.5" fill="#f4f1e8"/>
  </g>
  <g class="asset" data-asset="cactus" data-foreign="1">
    <ellipse cx="111" cy="206" rx="11" ry="5" fill="#ffffff" opacity="0.35">
      <animate attributeName="opacity" values="0.2;0.45;0.2" dur="3.4s" begin="-1.5s" repeatCount="indefinite"/>
    </ellipse>
    <polygon points="104,196 120,203 116,212 98,205" fill="#7fa8bd"/>
    <rect x="106" y="184" width="8" height="20" rx="4" fill="#3f9b57"/>
    <path d="M106,194 q-6,0 -6,6 v4" stroke="#3f9b57" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M114,198 q6,0 6,5 v4" stroke="#3f9b57" stroke-width="4" fill="none" stroke-linecap="round"/>
  </g>
</svg>
`
};
