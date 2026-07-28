'use client'

import {useEffect, useRef, useState} from 'react'

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&'

/** Reveals a string through a short encrypted-looking character scramble. */
export function ScrambleValue({text, speed = 30}: {text: string; speed?: number}) {
  const [display, setDisplay] = useState('')
  const triggerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const node = triggerRef.current
    if (!node) return
    let active = true
    let frame = 0
    let iteration = 0
    const tick = () => {
      if (!active) return
      setDisplay(text.split('').map((character, index) => index < iteration ? character : characters[Math.floor(Math.random() * characters.length)]).join(''))
      iteration += 1 / 3
      if (iteration < text.length) frame = window.setTimeout(() => requestAnimationFrame(tick), speed)
      else setDisplay(text)
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        iteration = 0
        window.clearTimeout(frame)
        requestAnimationFrame(tick)
      }
    }, {threshold: 0.1})
    observer.observe(node)
    return () => { active = false; window.clearTimeout(frame); observer.disconnect() }
  }, [speed, text])

  return <span ref={triggerRef}>{display || text.replace(/./g, '#')}</span>
}

