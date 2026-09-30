import { Canvas } from '@react-three/fiber'
import { useStore } from '../store'
import { PAPER } from '../lib/sketch'
import Corridor from './Corridor'
import GalleryRoom from './GalleryRoom'
import CameraRig, { useCorridorInput } from './CameraRig'

export default function Experience() {
  const room = useStore((s) => s.room)
  useCorridorInput()
  const inGallery = room === 'gallery'

  return (
    <div className={`canvas-wrapper ${room && !inGallery ? 'is-dimmed' : ''}`}>
      <Canvas
        flat
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ fov: 62, near: 0.05, far: 80, position: [0, 1.6, 2] }}
      >
        <color attach="background" args={[PAPER]} />
        {inGallery ? <fog attach="fog" args={[PAPER, 9, 20]} /> : <fog attach="fog" args={[PAPER, 10, 34]} />}
        {inGallery ? <GalleryRoom /> : <Corridor />}
        <CameraRig />
      </Canvas>
    </div>
  )
}
