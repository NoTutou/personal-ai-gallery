// ---------------------------------------------------------------------------
//  All site content lives here. Replace the placeholder text with your own.
//  `art` picks one of the procedural sketch themes in src/lib/art.js:
//  'mountains' | 'sea' | 'house' | 'flowers' | 'city' | 'planet' | 'tree' | 'rocket'
// ---------------------------------------------------------------------------

export const site = {
  name: 'Your Name',
  alias: 'YN',
  role: 'Creative Developer',
  tagline: 'I build interactive websites that feel hand-made.',
  location: 'Somewhere on Earth',
  email: 'hello@example.com',
}

export const about = {
  title: 'About Me',
  intro:
    "Hi! I'm a creative developer who likes turning rough pencil sketches into living, breathing websites. I care about smooth motion, honest performance and the small details you only notice when they're missing.",
  paragraphs: [
    'I usually start on paper: boxes, arrows, scribbles. Then I jump straight into code and let the design grow while I build it — layout and scroll mechanics first, effects last.',
    'Outside of client work I prototype small experiments: shaders, playful UI components, tiny browser games. Some of them end up here.',
  ],
  skills: [
    { label: 'React / Next.js', checked: true },
    { label: 'Three.js / R3F', checked: true },
    { label: 'GSAP & scroll storytelling', checked: true },
    { label: 'GLSL shaders', checked: true },
    { label: 'Node & headless CMS', checked: true },
    { label: 'Figma wizardry', checked: false },
  ],
  facts: [
    { k: 'Based in', v: 'Somewhere on Earth' },
    { k: 'Coffee / day', v: '2.5 cups' },
    { k: 'Favourite tool', v: 'A 2B pencil' },
  ],
}

export const projects = [
  {
    id: 'aurora',
    title: 'Aurora Studio',
    subtitle: 'Photography website with smooth scroll animations',
    year: '2026',
    art: 'mountains',
    tags: ['React', 'GSAP', 'Lenis', 'Headless CMS'],
    description:
      'A bespoke, template-free site for a photography duo. Scattered gallery layout, FLIP lightbox transitions and virtualised image grids that stay at 60fps.',
    url: 'https://example.com',
  },
  {
    id: 'wave',
    title: 'Wave Runner',
    subtitle: 'Browser game controlled with your webcam',
    year: '2026',
    art: 'sea',
    tags: ['React', 'MediaPipe', 'Canvas'],
    description:
      'A 15-second speed challenge where pose tracking turns your arms into the controller. Runs entirely in the browser — no installs, no plugins.',
    url: 'https://example.com',
  },
  {
    id: 'neon',
    title: 'Neon Nights',
    subtitle: 'Musician website with WebGL image distortion',
    year: '2025',
    art: 'city',
    tags: ['WebGL', 'GLSL', 'Tailwind'],
    description:
      'Moody artist site where photographs bend and ripple under the cursor thanks to custom fragment shaders instead of CSS filters.',
    url: 'https://example.com',
  },
  {
    id: 'sketchbook',
    title: 'Sketchbook UI',
    subtitle: 'Animated hand-drawn UI components',
    year: '2025',
    art: 'flowers',
    tags: ['HTML', 'CSS', 'GSAP'],
    description:
      'A small library of pencil-textured buttons, toggles and sliders. Proof that interface elements do not have to look like everyone else’s.',
    url: 'https://example.com',
  },
  {
    id: 'orbit',
    title: 'Orbit Lab',
    subtitle: 'Interactive solar system playground',
    year: '2024',
    art: 'planet',
    tags: ['Three.js', 'Physics'],
    description:
      'Drag planets around, change gravity and watch orbits draw themselves as pencil trails. A weekend experiment that got out of hand.',
    url: 'https://example.com',
  },
  {
    id: 'launch',
    title: 'Launch Day',
    subtitle: 'Scroll-driven product story',
    year: '2024',
    art: 'rocket',
    tags: ['Next.js', 'ScrollTrigger'],
    description:
      'A landing page that tells a product story as a rocket launch — every section is a stage of the flight, choreographed to scroll.',
    url: 'https://example.com',
  },
]

// Frames hanging on the corridor walls (decorative, they "paint themselves")
export const corridorArt = [
  { art: 'tree', caption: 'first sketch' },
  { art: 'house', caption: 'home' },
  { art: 'sea', caption: 'summer' },
  { art: 'mountains', caption: 'weekend trip' },
  { art: 'flowers', caption: 'spring' },
  { art: 'city', caption: 'late night' },
  { art: 'planet', caption: 'daydream' },
  { art: 'rocket', caption: 'ship it' },
]

export const studio = [
  {
    type: 'article',
    platform: 'Blog',
    title: 'How I built a 3D portfolio without a single 3D model',
    text: 'A technical write-up about flat geometry, pencil textures and a paint-reveal shader.',
    date: '2026-06',
    art: 'house',
    url: 'https://example.com',
  },
  {
    type: 'video',
    platform: 'YouTube',
    title: 'Full build walkthrough',
    text: 'Long-form coding session: from paper sketch to a deployed interactive site.',
    date: '2026-07',
    art: 'rocket',
    url: 'https://example.com',
  },
  {
    type: 'post',
    platform: 'LinkedIn',
    title: '100 people played my webcam game',
    text: 'Notes from showing a browser game at a local science festival.',
    date: '2026-06',
    art: 'sea',
    url: 'https://example.com',
  },
  {
    type: 'post',
    platform: 'Instagram',
    title: 'Behind the scenes',
    text: 'Short reels, sketches and work-in-progress experiments.',
    date: '2026-07',
    art: 'flowers',
    url: 'https://example.com',
  },
  {
    type: 'article',
    platform: 'Press',
    title: 'Local news feature',
    text: 'A hometown story about building websites that people remember.',
    date: '2026-07',
    art: 'city',
    url: 'https://example.com',
  },
  {
    type: 'video',
    platform: 'TikTok',
    title: 'Websites that inspire me',
    text: 'Quick visual breakdowns of beautiful sites from around the web.',
    date: '2026-07',
    art: 'planet',
    url: 'https://example.com',
  },
]

export const awards = [
  { title: 'Site of the Day', org: 'Award Platform A', date: '2026-04', kind: 'sotd' },
  { title: 'Honorable Mention', org: 'Award Platform B', date: '2026-04', kind: 'other' },
  { title: 'Special Kudos', org: 'Award Platform C', date: '2026-04', kind: 'other' },
  { title: 'Featured of the Day', org: 'Gallery D', date: '2026-05', kind: 'sotd' },
  { title: 'Public UI Award', org: 'Award Platform C', date: '2026-04', kind: 'other' },
  { title: 'Site of the Day', org: 'Gallery E', date: '2026-01', kind: 'sotd' },
]

export const contact = {
  title: 'Contact Me',
  text: 'Have a project in mind, a design that needs motion, or just want to say hi? Pick a channel — I read everything.',
  methods: [
    { label: 'Email', value: site.email, url: `mailto:${site.email}` },
    { label: 'GitHub', value: '@your-handle', url: 'https://github.com/' },
    { label: 'LinkedIn', value: '/in/your-handle', url: 'https://www.linkedin.com/' },
    { label: 'Instagram', value: '@your.handle', url: 'https://www.instagram.com/' },
    { label: 'X / Twitter', value: '@your_handle', url: 'https://x.com/' },
    { label: 'YouTube', value: '@your-handle', url: 'https://www.youtube.com/' },
  ],
}

// Rooms along the corridor. `z` is the door position, `side` the wall.
export const rooms = [
  { id: 'about', label: 'About', z: -11, side: -1, color: '#f2b880' },
  { id: 'gallery', label: 'Gallery', z: -23, side: 1, color: '#8fc1e3' },
  { id: 'studio', label: 'Studio', z: -35, side: -1, color: '#b8d98f' },
  { id: 'contact', label: 'Contact', z: -47, side: 1, color: '#e79ab0' },
]

export const CORRIDOR = {
  width: 5,
  height: 3.6,
  backZ: 4, // wall behind the starting point
  endWallZ: -56, // wall at the far end
  startZ: 2, // first camera position
  endZ: -51, // furthest the camera can walk
  eye: 1.6,
}
