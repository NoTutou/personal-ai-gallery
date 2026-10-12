import { create } from 'zustand'
import { sound } from './lib/audio'
import { CORRIDOR, corridorArt, rooms } from './data/content'

export const ACHIEVEMENTS = [
  { id: 'first-steps', title: 'First Steps', text: 'Take your first steps into the corridor.', icon: '👣' },
  { id: 'knock-knock', title: 'Knock Knock', text: 'Enter your first room.', icon: '🚪' },
  { id: 'art-critic', title: 'Art Critic', text: 'Let every sketch in the corridor paint itself.', icon: '🎨' },
  { id: 'explorer', title: 'Explorer', text: 'Visit all four rooms.', icon: '🧭' },
  { id: 'curator', title: 'Curator', text: 'Inspect a project in the gallery.', icon: '🖼️' },
  { id: 'cartographer', title: 'Cartographer', text: 'Open the hand-drawn map.', icon: '🗺️' },
  { id: 'sound-engineer', title: 'Sound Engineer', text: 'Tweak the audio settings.', icon: '🎚️' },
  { id: 'end-of-line', title: 'Full Circle', text: 'Walk a whole lap and end up back at the start.', icon: '🔁' },
  { id: 'say-hi', title: 'Say Hi', text: 'Click one of the contact links.', icon: '✉️' },
]

const LS_KEY = 'sketch-portfolio-v1'
const saved = (() => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || {}
  } catch {
    return {}
  }
})()
const persist = (s) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ unlocked: s.unlocked, visited: s.visited, volumes: s.volumes, soundOn: s.soundOn }))
  } catch {
    /* ignore */
  }
}

let toastId = 0

export const useStore = create((set, get) => ({
  // 'loading' | 'ready' | 'intro' | 'corridor' | 'cinematic' | 'room'
  phase: 'loading',
  entered: false, // has the entrance door been opened this visit
  progress: 0,
  room: null,
  hoveredDoor: null,
  nearDoor: null,
  selectedProject: null,
  menuOpen: false,
  panel: null, // 'map' | 'audio' | 'achievements' | null
  unlocked: saved.unlocked || {},
  visited: saved.visited || {},
  revealed: {},
  toasts: [],
  soundOn: saved.soundOn ?? true,
  volumes: saved.volumes || { master: 0.8, music: 0.5, sfx: 0.7 },
  hasWalked: false,

  set: (patch) => set(patch),

  setPanel: (panel) => {
    const next = get().panel === panel ? null : panel
    set({ panel: next, menuOpen: false })
    if (next) sound.paper()
    if (next === 'map') get().unlock('cartographer')
  },

  toggleMenu: () => {
    set((s) => ({ menuOpen: !s.menuOpen, panel: null }))
    sound.paper()
  },

  setSound: (on) => {
    set({ soundOn: on })
    sound.setEnabled(on)
    persist(get())
  },

  setVolume: (key, value) => {
    const volumes = { ...get().volumes, [key]: value }
    set({ volumes })
    sound.setVolumes(volumes)
    get().unlock('sound-engineer')
    persist(get())
  },

  unlock: (id) => {
    if (get().unlocked[id]) return
    const a = ACHIEVEMENTS.find((x) => x.id === id)
    if (!a) return
    const unlocked = { ...get().unlocked, [id]: Date.now() }
    const toast = { key: ++toastId, ...a }
    set({ unlocked, toasts: [...get().toasts, toast] })
    sound.chime()
    persist(get())
    setTimeout(() => set({ toasts: get().toasts.filter((t) => t.key !== toast.key) }), 4200)
  },

  markVisited: (id) => {
    const visited = { ...get().visited, [id]: true }
    set({ visited })
    persist(get())
    get().unlock('knock-knock')
    if (rooms.every((r) => visited[r.id])) get().unlock('explorer')
  },

  markRevealed: (key) => {
    if (get().revealed[key]) return
    const revealed = { ...get().revealed, [key]: true }
    set({ revealed })
    if (corridorArt.every((_, i) => revealed[`c${i}`])) get().unlock('art-critic')
  },

  resetProgress: () => {
    set({ unlocked: {}, visited: {}, revealed: {} })
    persist(get())
  },
}))

// ---------------------------------------------------------------------------
// Mutable per-frame state (kept out of React to avoid re-renders)
// ---------------------------------------------------------------------------
export const nav = {
  target: CORRIDOR.introZ, // where scroll wants the camera to be
  mouseX: 0, // -1..1 look direction (pointer position, or touch drag)
  mouseY: 0,
}

// Authoritative camera pose. In walk mode the CameraRig damps it towards nav,
// in cinematic mode GSAP tweens it directly.
export const view = {
  x: 0,
  y: CORRIDOR.eye,
  z: CORRIDOR.introZ,
  yaw: 0,
  pitch: 0,
}

// door opening amount (0..1) per room id (+ the entrance) – tweened by the director
export const doors = Object.fromEntries([...rooms.map((r) => [r.id, 0]), ['entrance', 0]])

// Door portal: while a door is opening/closing, the room behind it is shown
// through the gap. The canvas computes the gap's screen polygon each frame.
export const portal = { active: false, id: null, z: 0, points: null, full: false }

// ---------------------------------------------------------------------------
// Looping corridor helpers (the corridor repeats every CORRIDOR.length metres)
// ---------------------------------------------------------------------------
const L = CORRIDOR.length
/** the copy of z (in some lap) closest to `near` */
export const loopZ = (z, near) => z + L * Math.round((near - z) / L)
/** distance between a and b along the looping corridor */
export const loopDist = (a, b) => Math.abs(a - loopZ(b, a))
/** 0..1 position within the current lap */
export const progressOf = (z) => ((((-z) % L) + L) % L) / L
