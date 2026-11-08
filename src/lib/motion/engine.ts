// Restrained scroll reveals. Loaded only when the visitor has not asked for reduced motion.
// Content is never hidden in the server HTML: only elements that start fully below the viewport
// are set to their start state here, and every fallback (focus, input, print, errors) shows them.
import { gsap } from 'gsap'

type Effect = 'reveal' | 'stagger' | 'draw'
const EASE = 'power3.out'

function build(el: HTMLElement, effect: Effect) {
  const tl = gsap.timeline({ paused: true })
  const done = (targets: Element[]) => () => {
    gsap.set(targets, { clearProps: 'opacity,transform,clipPath,--km-draw' })
    targets.forEach((t) => t.classList.remove('km-anim'))
  }
  if (effect === 'reveal') {
    el.classList.add('km-anim')
    gsap.set(el, { opacity: 0, y: 20 })
    tl.to(el, { opacity: 1, y: 0, duration: 0.7, ease: EASE, onComplete: done([el]) })
    return tl
  }
  const items = Array.from(el.children) as HTMLElement[]
  const clips = Array.from(el.querySelectorAll<HTMLElement>('[data-motion-clip]'))
  items.forEach((t) => t.classList.add('km-anim'))
  clips.forEach((t) => t.classList.add('km-anim'))
  gsap.set(items, { opacity: 0, y: effect === 'draw' ? 12 : 24 })
  if (effect === 'draw') gsap.set(items, { '--km-draw': 0 })
  if (clips.length) gsap.set(clips, { clipPath: 'inset(100% 0% 0% 0%)' })
  const step = effect === 'draw' ? 0.12 : 0.08
  if (effect === 'draw')
    tl.to(items, { '--km-draw': 1, duration: 0.8, ease: 'power2.inOut', stagger: step }, 0)
  tl.to(items, { opacity: 1, y: 0, duration: 0.7, ease: EASE, stagger: step }, effect === 'draw' ? 0.15 : 0)
  if (clips.length)
    tl.to(clips, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: EASE, stagger: step }, 0)
  tl.eventCallback('onComplete', done([...items, ...clips]))
  return tl
}

export function startMotion(root: HTMLElement = document.body) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  if (reduced.matches) return () => {}
  const pending = new Map<Element, gsap.core.Timeline>()
  let frame = 0
  const finish = (target?: Element) => {
    for (const [el, tl] of pending)
      if (!target || el.contains(target)) {
        tl.progress(1)
        pending.delete(el)
      }
  }
  // Checked on scroll and layout changes rather than with IntersectionObserver: an observer never
  // reports an element that a fast scroll or anchor jump skips, which would leave it hidden above.
  const check = () => {
    frame = 0
    const limit = window.innerHeight * 0.92
    for (const [el, tl] of pending) {
      const box = el.getBoundingClientRect()
      if (box.bottom < 0) tl.progress(1)
      else if (box.top < limit) tl.play()
      else continue
      pending.delete(el)
    }
  }
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(check)
  }
  // Timelines are created inside one context so a single revert() restores every inline style.
  const ctx = gsap.context(() => {
    try {
      for (const el of root.querySelectorAll<HTMLElement>('[data-motion]')) {
        const effect = el.dataset.motion as Effect
        if (!['reveal', 'stagger', 'draw'].includes(effect)) continue
        // Anything already on screen stays exactly as rendered: no flash, no replay.
        if (el.getBoundingClientRect().top < window.innerHeight) continue
        pending.set(el, build(el, effect))
      }
    } catch {
      finish()
    }
  })
  const onFocus = (e: FocusEvent) => finish(e.target as Element)
  const onInput = () => finish()
  const resize = new ResizeObserver(schedule)
  resize.observe(document.body)
  window.addEventListener('scroll', schedule, { passive: true })
  document.addEventListener('focusin', onFocus)
  document.addEventListener('input', onInput, true)
  window.addEventListener('beforeprint', onInput)
  document.documentElement.dataset.motionReady = ''
  let stopped = false
  const stop = () => {
    if (stopped) return
    stopped = true
    cancelAnimationFrame(frame)
    resize.disconnect()
    window.removeEventListener('scroll', schedule)
    document.removeEventListener('focusin', onFocus)
    document.removeEventListener('input', onInput, true)
    window.removeEventListener('beforeprint', onInput)
    reduced.removeEventListener('change', onReduce)
    delete document.documentElement.dataset.motionReady
    ctx.revert()
  }
  // Switching reduced motion on mid-visit restores everything to its static, visible state.
  const onReduce = () => reduced.matches && stop()
  reduced.addEventListener('change', onReduce)
  return stop
}
