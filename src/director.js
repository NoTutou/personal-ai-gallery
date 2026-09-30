// Orchestrates cinematic camera moves between the corridor and the rooms.
import gsap from 'gsap'
import { useStore, nav, view, doors } from './store'
import { rooms, CORRIDOR } from './data/content'
import { sound } from './lib/audio'

const HALF = CORRIDOR.width / 2
const roomById = (id) => rooms.find((r) => r.id === id)
let busy = false

function wipe(direction) {
  const el = document.getElementById('page-wipe')
  if (!el) return Promise.resolve()
  sound.paper()
  return new Promise((resolve) => {
    if (direction === 'in') {
      gsap.fromTo(el, { xPercent: -130, autoAlpha: 1 }, { xPercent: 0, duration: 0.75, ease: 'power3.inOut', onComplete: resolve })
    } else {
      gsap.to(el, { xPercent: 130, duration: 0.8, ease: 'power3.inOut', delay: 0.05, onComplete: () => { gsap.set(el, { autoAlpha: 0 }); resolve() } })
    }
  })
}

const tween = (target, vars) => new Promise((resolve) => gsap.to(target, { ...vars, onComplete: resolve }))

export async function enterRoom(id) {
  const store = useStore.getState()
  if (busy) return
  const room = roomById(id)
  if (!room) return
  if (store.phase === 'room') return travelTo(id)
  busy = true
  store.set({ phase: 'cinematic', menuOpen: false, panel: null, hoveredDoor: null })

  const dist = Math.abs(view.z - room.z)
  const walk = Math.min(2.4, 0.7 + dist * 0.06)
  const yaw = -room.side * (Math.PI / 2)

  // 1. walk to the door and turn towards it
  gsap.to(view, { z: room.z, x: room.side * 0.4, pitch: 0, duration: walk, ease: 'power2.inOut' })
  await tween(view, { yaw, duration: Math.min(1.1, walk * 0.7), delay: walk * 0.45, ease: 'power2.inOut' })

  // 2. open the door
  sound.creak()
  await tween(doors, { [id]: 1, duration: 0.9, ease: 'power2.out' })

  // 3. step through while the page wipe covers the screen
  gsap.to(view, { x: room.side * (HALF - 0.15), duration: 1.1, ease: 'power2.in' })
  await new Promise((r) => setTimeout(r, 450))
  await wipe('in')

  store.markVisited(id)
  useStore.setState({ room: id, phase: 'room', selectedProject: null })
  doors[id] = 0
  busy = false
  await wipe('out')
}

export async function exitRoom({ silent = false } = {}) {
  const store = useStore.getState()
  if (busy || store.phase !== 'room') return
  busy = true
  const room = roomById(store.room)
  await wipe('in')

  useStore.setState({ room: null, selectedProject: null, phase: 'cinematic' })
  // place the camera just inside the door, looking back into the corridor
  Object.assign(view, { x: room.side * (HALF - 0.3), z: room.z, yaw: -room.side * (Math.PI / 2), pitch: 0 })
  doors[room.id] = 1
  nav.target = room.z

  if (silent) {
    Object.assign(view, { x: 0, yaw: 0 })
    doors[room.id] = 0
    busy = false
    useStore.setState({ phase: 'corridor' })
    return
  }

  await wipe('out')
  gsap.to(doors, { [room.id]: 0, duration: 1, delay: 0.5, ease: 'power2.inOut' })
  await tween(view, { x: 0, yaw: 0, duration: 1.3, ease: 'power2.inOut' })
  busy = false
  useStore.setState({ phase: 'corridor' })
}

export async function travelTo(id) {
  const store = useStore.getState()
  if (busy) return
  if (store.phase === 'room') {
    if (store.room === id) {
      useStore.setState({ menuOpen: false, panel: null })
      return
    }
    // leave the current room without the walk-out animation, start a few
    // metres before the destination door, then walk in.
    await exitRoom({ silent: true })
    const room = roomById(id)
    view.z = nav.target = Math.min(CORRIDOR.startZ, room.z + 4)
    await wipe('out')
  }
  return enterRoom(id)
}

/** Walk (not enter) to a point in the corridor, e.g. from the map. */
export function walkTo(z) {
  nav.target = Math.max(CORRIDOR.endZ, Math.min(CORRIDOR.startZ, z))
}
