"use client"

import { useEffect, useRef, useState } from "react"

interface ElevenLabsWidgetEmbedProps {
  agentId: string
  onTranscript?: (data: { role: "user" | "assistant"; text: string }) => void
  onCallStart?: () => void
  onCallEnd?: () => void
  onError?: (error: Error) => void
}

export default function ElevenLabsWidgetEmbed({
  agentId,
  onTranscript,
  onCallStart,
  onCallEnd,
  onError,
}: ElevenLabsWidgetEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!containerRef.current || isLoaded) return

    try {
      // Create iframe for ElevenLabs widget
      const iframe = document.createElement("iframe")
      iframe.src = `https://elevenlabs.io/convai-widget?agentId=${agentId}`
      iframe.style.width = "100%"
      iframe.style.height = "100%"
      iframe.style.border = "none"
      iframe.style.position = "absolute"
      iframe.style.top = "0"
      iframe.style.left = "0"
      iframe.style.opacity = "0"
      iframe.style.pointerEvents = "none"
      iframe.allow = "microphone"

      iframe.onload = () => {
        console.log("[ElevenLabs Widget] Iframe loaded")
        setIsLoaded(true)

        // Listen for messages from iframe
        window.addEventListener("message", (event) => {
          // Only accept messages from ElevenLabs domain
          if (!event.origin.includes("elevenlabs.io")) return

          const data = event.data
          console.log("[ElevenLabs Widget] Message received:", data)

          if (data.type === "transcript") {
            onTranscript?.({
              role: data.role || "user",
              text: data.text || "",
            })
          } else if (data.type === "callStart") {
            onCallStart?.()
          } else if (data.type === "callEnd") {
            onCallEnd?.()
          } else if (data.type === "error") {
            onError?.(new Error(data.message || "Widget error"))
          }
        })
      }

      iframe.onerror = () => {
        const error = new Error("Failed to load ElevenLabs widget")
        console.error("[ElevenLabs Widget] Error:", error)
        onError?.(error)
      }

      containerRef.current.appendChild(iframe)

      return () => {
        if (containerRef.current && iframe.parentNode) {
          containerRef.current.removeChild(iframe)
        }
      }
    } catch (error) {
      console.error("[ElevenLabs Widget] Initialization error:", error)
      onError?.(error as Error)
    }
  }, [agentId, isLoaded, onTranscript, onCallStart, onCallEnd, onError])

  const startCall = () => {
    if (containerRef.current) {
      const iframe = containerRef.current.querySelector("iframe")
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: "start" }, "*")
      }
    }
  }

  const endCall = () => {
    if (containerRef.current) {
      const iframe = containerRef.current.querySelector("iframe")
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: "stop" }, "*")
      }
    }
  }

  // Expose methods via ref (if needed)
  useEffect(() => {
    if (containerRef.current) {
      ;(containerRef.current as any).startCall = startCall
      ;(containerRef.current as any).endCall = endCall
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{
        zIndex: 1,
      }}
    />
  )
}

