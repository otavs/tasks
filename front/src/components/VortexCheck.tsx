import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'

export function VortexCheck() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      const size = container.clientWidth
      canvas.width = size
      canvas.height = size
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    let frame = 0

    type Particle = {
      angle: number
      radius: number
      size: number
      color: string
    }

    let particles: Particle[] = []

    function spawnParticles(n: number) {
      for (let i = 0; i < n; i++) {
        particles.push({
          angle: Math.random() * Math.PI * 2,
          radius: 100,
          size: 2,
          color: randomColor(),
        })
      }
    }

    const draw = () => {
      if (frame % 20 === 0) {
        spawnParticles(Math.floor(Math.random() * 5) + 2)
      }

      particles = particles.filter(p => p.radius > 1)

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const center = canvas.width / 2

      for (const particle of particles) {
        particle.radius *= 0.98
        particle.size *= 0.997

        const x = center + Math.cos(particle.angle) * particle.radius
        const y = center + Math.sin(particle.angle) * particle.radius

        ctx.beginPath()
        ctx.arc(x, y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.fill()
      }

      frame++
      requestAnimationFrame(draw)
    }

    draw()

    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: hovered ? 'none' : 'block',
        }}
      />
      {hovered && <Check size={30} color="#15ae97" />}
    </div>
  )
}

const randomColor = () => {
  const hue = Math.random() * 360
  return `hsl(${hue}, 100%, 50%)`
}
