import { Canvas } from '@react-three/fiber'
import { useStore } from '../store'
import { PAPER } from '../lib/sketch'
import Corridor, { PortalTracker } from './Corridor'
import GalleryRoom from './GalleryRoom'
import CameraRig, { useCorridorInput } from './CameraRig'

const GL = { antialias: true, powerPreference: 'high-performance' }

/** The corridor. Paused while you are fully inside a room. */
export default function Experience() {
  const phase = useStore((s) => s.phase)
  const room = useStore((s) => s.room)
  useCorridorInput()
  const inRoom = phase === 'room'

  return (
    <div className={`canvas-wrapper ${inRoom && room !== 'gallery' ? 'is-dimmed' : ''}`}>
      <Canvas flat dpr={[1, 1.75]} gl={GL} frameloop={inRoom ? 'never' : 'always'} camera={{ fov: 62, near: 0.05, far: 80, position: [0, 1.6, 2] }}>
        <color attach="background" args={[PAPER]} />
        <fog attach="fog" args={[PAPER, 10, 34]} />
        <Corridor />
        <CameraRig />
        <PortalTracker />
      </Canvas>
    </div>
  )
}

/** The round gallery lives in its own canvas so it can be seen through its door. */
export function GalleryStage() {
  return (
    <div className="gallery-stage">
      <Canvas flat dpr={[1, 1.75]} gl={GL} camera={{ fov: 62, near: 0.05, far: 60, position: [0, 1.65, 0.6] }}>
        <color attach="background" args={[PAPER]} />
        <fog attach="fog" args={[PAPER, 9, 20]} />
        <GalleryRoom />
      </Canvas>
    </div>
  )
}
