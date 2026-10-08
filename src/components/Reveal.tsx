import type { CSSProperties, ReactNode } from 'react'
import { useInView } from '../lib/hooks'

type Tag = 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div'

type RevealProps = {
  lines: ReactNode[]
  className?: string
  step?: number
  start?: number
  as?: Tag
}

export function Reveal({ lines, className = '', step = 95, start = 0, as = 'span' }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>(0.12)
  const El = as
  return (
    <El ref={ref as never} className={`reveal ${inView ? 'is-in' : ''} ${className}`}>
      {lines.map((line, i) => (
        <span className="reveal__l" key={i}>
          <span className="reveal__i" style={{ '--d': start + i * step } as CSSProperties}>
            {line}
          </span>
        </span>
      ))}
    </El>
  )
}

export function Fade({
  children,
  className = '',
  delay = 0,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  delay?: number
  as?: 'div' | 'span' | 'li'
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.1)
  const El = as
  return (
    <El
      ref={ref as never}
      className={`fade ${inView ? 'is-in' : ''} ${className}`}
      style={{ '--d': delay } as CSSProperties}
    >
      {children}
    </El>
  )
}

export function Rule() {
  const { ref, inView } = useInView<HTMLDivElement>(0.05)
  return <div ref={ref} className={`rule ${inView ? 'is-in' : ''}`} />
}