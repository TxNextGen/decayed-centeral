'use client'

import { useEffect, useRef, useState } from 'react'
import { ExternalLink } from 'lucide-react'

interface ProxyFrameProps {
  url: string
  onUrlChange?: (url: string) => void
}

export default function ProxyFrame({ url, onUrlChange }: ProxyFrameProps) {
  const mathRef = useRef<HTMLIFrameElement>(null)
  const [scramjetLoaded, setScramjetLoaded] = useState(false)
  const [proxiedUrl, setProxiedUrl] = useState<string>('')

  useEffect(() => {
    const script = document.createElement('script')
    script.src = '/tinyjet/scramjet.all.js'
    script.onload = () => {
      setScramjetLoaded(true)
      console.log('Scramjet loaded successfully')
    }
    document.head.appendChild(script)

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  useEffect(() => {
    if (url && mathRef.current && scramjetLoaded) {
      const loadProxy = async () => {
        try {
          function search(input: string) {
            let template = "https://search.brave.com/search?q=%s"

            try {
              return new URL(input).toString()
            } catch (err) {}

            try {
              let url = new URL(`http://${input}`)
              if (url.hostname.includes(".")) return url.toString()
            } catch (err) {}

            return template.replace("%s", input)
          }

          const fixedUrl = search(url)
          
          if (window.$scramjetLoadController) {
            const { ScramjetController } = window.$scramjetLoadController()
            const scramjet = new ScramjetController({ 
              files: { 
                wasm: "/tinyjet/wasm.wasm", 
                all: "/tinyjet/scramjet.all.js", 
                sync: "/tinyjet/scramjet.sync.js" 
              } 
            })
            
            await scramjet.init()
            
            const src = scramjet.encodeUrl(fixedUrl)
            console.log('Scramjet encoded URL:', src)
            setProxiedUrl(src)
            
            if (mathRef.current) {
              mathRef.current.src = src
            }
          }
        } catch (error) {
          console.error('Failed to load proxy:', error)
        }
      }

      loadProxy()
    }
  }, [url, scramjetLoaded])

  const openInNewTab = () => {
    if (proxiedUrl) {
      window.open(proxiedUrl, '_blank')
    }
  }

  return (
    <div className="relative w-full h-full">
      <button
        onClick={openInNewTab}
        className="absolute top-4 right-4 z-10 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg shadow-lg transition-colors"
        title="Open in new tab"
      >
        <ExternalLink size={16} />
      </button>
      <iframe
        ref={mathRef}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-forms allow-popups allow-modals allow-top-navigation allow-same-origin"
        title="Proxy Frame"
      />
    </div>
  )
}
