// Orchestrates cinematic camera moves between the corridor and the rooms.
//
// Entering a room: walk to the door, turn to face it, and open it. The room's
// page is shown *through the gap* of the opening door (see PortalTracker /
// RoomLayer) and grows to fill the screen as you step through. Leaving plays
// the same move backwards and closes the door behind you.
import gsap from 'gsap'
import { useStore, nav, view, doors, portal, loopZ } from './store'
import { rooms, CORRIDOR } from './data/content'
import { sound } from './lib/audio'

const HALF = CORRIDOR.width / 2
const roomById = (id) => rooms.find((r) => r.id === id)
let busy = false

// Where to stand when facing a door: further back on narrow (portrait) screens
// so the whole door fits, and a little towards the latch side so you look into
// the gap rather than at the leaf swinging towards you.
function standPose(room, doorZ) {
  const narrow = window.innerWidth / window.innerHeight < 0.8
  return { x: -room.side * (narrow ? 2.0 : 0.5), z: doorZ + room.side * (narrow ? 0.45 : 0.3) }
}

const tween = (target, vars) => new Promise((resolve) => gsap.to(target, { ...vars, onComplete: resolve }))
const wait = (s) => new Promise((r) => setTimeout(r, s * 1000))

/** First visit: open the entrance door and step into the corridor. */
export async function enterCorridor() {
  const store = useStore.getState()
  if (busy || store.phase !== 'intro') return
  busy = true
  store.set({ phase: 'cinematic', hoveredDoor: null })
  doors.entrance = Math.max(doors.entrance, 0.14)
  sound.creak()
  gsap.to(view, { yaw: 0, pitch: 0, duration: 0.6, ease: 'power2.out' })
  await tween(doors, { entrance: 1, duration: 1, ease: 'power2.inOut' })
  await tween(view, { z: CORRIDOR.entryZ, duration: 1.9, ease: 'power2.inOut' })
  nav.target = view.z
  busy = false
  useStore.setState({ phase: 'corridor', entered: true })
}

/**
 * Walk to a door and open it into its room.
 * @param id room id
 * @param z  world z of the door that was clicked (the corridor repeats, so a
 *           room exists once per lap); defaults to the nearest copy.
 */
export async function enterRoom(id, z) {
  const store = useStore.getState()
  if (busy) return
  const room = roomById(id)
  if (!room) return
  if (store.phase === 'room') return travelTo(id)
  if (store.phase !== 'corridor') return
  busy = true
  const doorZ = z ?? loopZ(room.z, view.z)
  store.set({ phase: 'cinematic', menuOpen: false, panel: null, hoveredDoor: null })

  const dist = Math.abs(view.z - doorZ)
  const walk = Math.min(2.4, 0.7 + dist * 0.06)
  const yaw = -room.side * (Math.PI / 2)

  // 1. walk to a spot across from the door and turn towards it
  gsap.to(view, { ...standPose(room, doorZ), pitch: 0, duration: walk, ease: 'power2.inOut' })
  await tween(view, { yaw, duration: Math.min(1.1, walk * 0.7), delay: walk * 0.45, ease: 'power2.inOut' })

  // 2. mount the room behind the door (clipped to the door gap) and open it
  Object.assign(portal, { active: true, id, z: doorZ, points: null, full: false })
  useStore.setState({ room: id, selectedProject: null })
  doors[id] = Math.max(doors[id], 0.14)
  sound.creak()
  gsap.to(doors, { [id]: 1, duration: 1.3, ease: 'power2.inOut' })

  // 3. step through while the room grows to fill the view
  await wait(0.55)
  await tween(view, { x: room.side * (HALF - 0.3), z: doorZ, duration: 1.5, ease: 'power2.inOut' })

  portal.active = false
  store.markVisited(id)
  useStore.setState({ phase: 'room' })
  busy = false
}

export async function exitRoom() {
  const store = useStore.getState()
  if (busy || store.phase !== 'room') return
  busy = true
  const room = roomById(store.room)
  useStore.setState({ phase: 'cinematic', selectedProject: null, menuOpen: false, panel: null })

  // the camera is still standing in the doorway, facing the room
  Object.assign(view, { x: room.side * (HALF - 0.3), yaw: -room.side * (Math.PI / 2), pitch: 0 })
  Object.assign(portal, { active: true, id: room.id, z: view.z, points: null, full: true })
  doors[room.id] = 1

  // 1. step back out into the corridor, then close the door on the room
  gsap.to(doors, { [room.id]: 0, duration: 1.1, delay: 0.75, ease: 'power2.inOut', onStart: () => sound.creak() })
  await tween(view, { ...standPose(room, view.z), duration: 1.5, ease: 'power2.inOut' })
  await wait(0.4)

  portal.active = false
  useStore.setState({ room: null })

  // 2. turn back down the corridor
  await tween(view, { x: 0, yaw: 0, duration: 1, ease: 'power2.inOut' })
  nav.target = view.z
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
    await exitRoom()
  }
  if (useStore.getState().phase === 'intro') await enterCorridor()
  return enterRoom(id)
}

/** Walk (not enter) to a point of the lap, e.g. from the map. */
export function walkTo(z) {
  if (useStore.getState().phase !== 'corridor') return
  nav.target = loopZ(z, view.z)
}
