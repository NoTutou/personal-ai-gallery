// Self-generated Klein blue composition for the hero frame — no external assets.
const dots = Array.from({ length: 5 }, (_, row) =>
  Array.from({ length: 9 }, (_, col) => `<circle cx="${104 + col * 46}" cy="${104 + row * 46}" r="1.8"/>`).join(''),
).join('')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<defs>
<radialGradient id="bg" cx="30%" cy="18%" r="115%">
<stop offset="0" stop-color="#1544e0"/>
<stop offset=".4" stop-color="#002fa7"/>
<stop offset="1" stop-color="#000a2c"/>
</radialGradient>
<linearGradient id="sheen" x1="0" y1="0" x2=".9" y2="1">
<stop offset="0" stop-color="#ffffff" stop-opacity=".16"/>
<stop offset=".5" stop-color="#ffffff" stop-opacity="0"/>
</linearGradient>
<filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
<feGaussianBlur stdDeviation="110"/>
</filter>
</defs>
<rect width="1600" height="1000" fill="url(#bg)"/>
<circle cx="1210" cy="300" r="330" fill="#2e5cff" opacity=".55" filter="url(#glow)"/>
<circle cx="330" cy="850" r="360" fill="#001e7a" opacity=".9" filter="url(#glow)"/>
<g fill="none" stroke="#ffffff">
<circle cx="1210" cy="300" r="285" stroke-opacity=".38" stroke-width="1.5"/>
<circle cx="1210" cy="300" r="368" stroke-opacity=".2" stroke-width="1"/>
<circle cx="1210" cy="300" r="465" stroke-opacity=".11" stroke-width="1"/>
<rect x="150" y="120" width="300" height="300" transform="rotate(-12 300 270)" stroke-opacity=".22" stroke-width="1.5"/>
<path d="M-20 700 C 300 590, 620 760, 980 600 S 1560 640, 1660 590" stroke-opacity=".2" stroke-width="1.5"/>
</g>
<g fill="#ffffff" fill-opacity=".22">${dots}</g>
<circle cx="1210" cy="300" r="5" fill="#ffffff" opacity=".95"/>
<circle cx="300" cy="270" r="4" fill="#ffffff" opacity=".8"/>
<rect width="1600" height="1000" fill="url(#sheen)"/>
</svg>`

export const heroMedia = `data:image/svg+xml,${encodeURIComponent(svg)}`
