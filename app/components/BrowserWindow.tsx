'use client'

import { useState, useEffect } from 'react'
import TabBar from './TabBar'
import NavigationBar from './NavigationBar'
import ProxyFrame from './ProxyFrame'

export default function BrowserWindow() {
  const [time, setTime] = useState(new Date())
  const [currentUrl, setCurrentUrl] = useState('')

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const displayHours = hours % 12 || 12
    const displayMinutes = minutes.toString().padStart(2, '0')
    return { hours: displayHours, minutes: displayMinutes }
  }

  const { hours, minutes } = formatTime(time)

  const handleUrlSubmit = (url: string) => {
    let processedUrl = url
    try {
      new URL(url)
    } catch {
      processedUrl = `https://search.brave.com/search?q=${encodeURIComponent(url)}`
    }
    setCurrentUrl(processedUrl)
  }

  return (
    <div className="w-full h-screen bg-black flex flex-col">
      <TabBar />
      <NavigationBar onUrlSubmit={handleUrlSubmit} />
      <div className="flex-1 bg-[#282c34]">
        {currentUrl ? (
          <ProxyFrame url={currentUrl} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-8xl font-bold text-[#92a4bf] tracking-tight">
                {hours}:{minutes}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
