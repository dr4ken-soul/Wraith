'use client'

import {Canvas, useFrame} from '@react-three/fiber'
import {useMemo, useEffect, useState, createContext, useContext, useRef, type ReactNode} from 'react'
import * as THREE from 'three'

type Density = 'hero' | 'sparse' | 'dense'
const DensityContext = createContext<Density>('hero')

/** Shares the density target from visible page sections with the particle field. */
function DensityProvider({children}: {children: ReactNode}) {
  const [density, setDensity] = useState<Density>('hero')
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('section[data-density]'))
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) setDensity((visible.target as HTMLElement).dataset.density as Density)
    }, {threshold: [0.1, 0.3, 0.6]})
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])
  return <DensityContext.Provider value={density}>{children}</DensityContext.Provider>
}

/** Renders and animates the shared procedural point cloud. */
function Points() {
  const density = useContext(DensityContext)
  const pointsRef = useRef<THREE.Points>(null)
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const count = typeof window !== 'undefined' && window.innerWidth < 768 ? 1800 : 4000
  const [accent, setAccent] = useState('rgb(184, 240, 255)')
  const positions = useMemo(() => {
    const values = new Float32Array(count * 3)
    for (let index = 0; index < count; index++) {
      const radius = Math.pow(Math.random(), 0.45)
      values[index * 3] = (Math.random() * 2 - 1) * 6 * radius
      values[index * 3 + 1] = (Math.random() * 2 - 1) * 6 * radius
      values[index * 3 + 2] = (Math.random() * 2 - 1) * 2 * radius
    }
    return values
  }, [count])
  const targetOpacity = density === 'dense' ? 0.12 : density === 'sparse' ? 0.3 : 0.55
  useEffect(() => {
    setAccent(getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || 'rgb(184, 240, 255)')
  }, [])
  useFrame((state) => {
    if (!pointsRef.current) return
    if (!reducedMotion) {
      pointsRef.current.rotation.y += 0.00033
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.08) * 0.04
    }
    const material = pointsRef.current.material as THREE.PointsMaterial
    material.opacity += ((reducedMotion ? 0.2 : targetOpacity) - material.opacity) * 0.04
  })
  return <points ref={pointsRef} frustumCulled={false}><bufferGeometry><bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} /></bufferGeometry><pointsMaterial size={0.014} color={accent} transparent opacity={0.2} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} /></points>
}

/** Mounts the single unified WebGL field at the application root. */
export function WraithField() {
  return <DensityProvider><div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true"><Canvas camera={{position: [0, 0, 6], fov: 45}} dpr={[1, 1.5]}><Points /></Canvas></div></DensityProvider>
}

