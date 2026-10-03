import React, { useRef, useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MAIN_TABS } from './BottomTabBar'

interface SwipeContainerProps {
  children: React.ReactNode
}

export default function SwipeContainer({ children }: SwipeContainerProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const touchStartTime = useRef<number>(0)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | 'none'>('none')
  const prevTabIndex = useRef<number>(-1)

  const currentTabIndex = MAIN_TABS.findIndex(
    t => t.path === location.pathname || (t.path === '/recetas' && location.pathname === '/vaciar-nevera')
  )
  const isMainTab = currentTabIndex !== -1

  useEffect(() => {
    if (prevTabIndex.current !== -1 && isMainTab) {
      if (currentTabIndex > prevTabIndex.current) {
        setSlideDirection('left')
      } else if (currentTabIndex < prevTabIndex.current) {
        setSlideDirection('right')
      }
      const timer = setTimeout(() => setSlideDirection('none'), 300)
      return () => clearTimeout(timer)
    }
    prevTabIndex.current = currentTabIndex
  }, [location.pathname, currentTabIndex, isMainTab])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMainTab) return
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    touchStartTime.current = Date.now()
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMainTab || touchStartX.current === null || touchStartY.current === null) return

    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    const deltaY = e.changedTouches[0].clientY - touchStartY.current
    const elapsedTime = Date.now() - touchStartTime.current

    touchStartX.current = null
    touchStartY.current = null

    // Validar que sea un swipe horizontal intencionado y rápido (no un scroll vertical)
    if (Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && elapsedTime < 450) {
      if (deltaX < 0) {
        // Swipe izquierda -> pestaña siguiente
        if (currentTabIndex < MAIN_TABS.length - 1) {
          navigate(MAIN_TABS[currentTabIndex + 1].path)
        }
      } else {
        // Swipe derecha -> pestaña anterior
        if (currentTabIndex > 0) {
          navigate(MAIN_TABS[currentTabIndex - 1].path)
        }
      }
    }
  }

  const animationClass =
    slideDirection === 'left'
      ? 'tab-slide-left'
      : slideDirection === 'right'
      ? 'tab-slide-right'
      : ''

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`w-full h-full flex-1 flex flex-col overflow-hidden ${animationClass}`}
    >
      {children}
    </div>
  )
}
