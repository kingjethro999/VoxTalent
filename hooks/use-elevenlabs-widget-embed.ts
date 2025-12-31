"use client"

import { useEffect, useRef, useState, useCallback } from "react"

export interface TranscriptEvent {
  role: "user" | "assistant"
  text: string
  timestamp: number
}

export interface UseElevenLabsWidgetEmbedOptions {
  agentId: string
  onTranscript?: (event: TranscriptEvent) => void
  onCallStart?: () => void
  onCallEnd?: () => void
  onError?: (error: Error) => void
}

export function useElevenLabsWidgetEmbed({
  agentId,
  onTranscript,
  onCallStart,
  onCallEnd,
  onError,
}: UseElevenLabsWidgetEmbedOptions) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isCallActive, setIsCallActive] = useState(false)
  const widgetRef = useRef<HTMLElement | null>(null)
  const scriptRef = useRef<HTMLScriptElement | null>(null)
  const transcriptBufferRef = useRef<string>("")

  // Load widget script
  useEffect(() => {
    if (typeof window === "undefined") return

    // Check if custom element is already defined (from previous load or script)
    if (customElements.get("elevenlabs-convai")) {
      console.log("[ElevenLabs Widget] Custom element already registered")
      setIsInitialized(true)
      return
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="elevenlabs/convai-widget-embed"]')
    if (existingScript) {
      console.log("[ElevenLabs Widget] Script already loaded, waiting for registration")
      // Wait a bit for script to finish loading and register custom element
      const checkInterval = setInterval(() => {
        if (customElements.get("elevenlabs-convai")) {
          console.log("[ElevenLabs Widget] Custom element registered")
          setIsInitialized(true)
          clearInterval(checkInterval)
        }
      }, 100)

      // Timeout after 5 seconds
      const timeoutId = setTimeout(() => {
        clearInterval(checkInterval)
        if (!customElements.get("elevenlabs-convai")) {
          console.warn("[ElevenLabs Widget] Custom element not registered after timeout")
          setIsInitialized(true) // Try anyway
        }
      }, 5000)

      return () => {
        clearInterval(checkInterval)
        clearTimeout(timeoutId)
      }
    }

    // Prevent duplicate script loading - check both ref and DOM
    if (scriptRef.current) {
      console.log("[ElevenLabs Widget] Script ref exists, checking if element is registered")
      // If script exists but element not registered yet, wait for it
      if (!customElements.get("elevenlabs-convai")) {
        const checkInterval = setInterval(() => {
          if (customElements.get("elevenlabs-convai")) {
            console.log("[ElevenLabs Widget] Custom element registered")
            setIsInitialized(true)
            clearInterval(checkInterval)
          }
        }, 100)
        const timeoutId = setTimeout(() => {
          clearInterval(checkInterval)
          if (!customElements.get("elevenlabs-convai")) {
            setIsInitialized(true) // Try anyway
          }
        }, 5000)
        return () => {
          clearInterval(checkInterval)
          clearTimeout(timeoutId)
        }
      } else {
        setIsInitialized(true)
      }
      return
    }

    const script = document.createElement("script")
    script.src = "https://unpkg.com/@elevenlabs/convai-widget-embed@beta"
    script.async = true
    script.type = "text/javascript"
    
    let checkInterval: NodeJS.Timeout | null = null
    let timeoutId: NodeJS.Timeout | null = null

    script.onload = () => {
      console.log("[ElevenLabs Widget] Script loaded successfully")
      // Wait for custom element registration
      checkInterval = setInterval(() => {
        if (customElements.get("elevenlabs-convai")) {
          console.log("[ElevenLabs Widget] Custom element registered")
          setIsInitialized(true)
          if (checkInterval) clearInterval(checkInterval)
        }
      }, 100)

      // Timeout after 5 seconds
      timeoutId = setTimeout(() => {
        if (checkInterval) clearInterval(checkInterval)
        if (!customElements.get("elevenlabs-convai")) {
          console.warn("[ElevenLabs Widget] Custom element not registered after timeout")
          setIsInitialized(true) // Try anyway
        }
      }, 5000)
    }
    
    script.onerror = () => {
      const error = new Error("Failed to load ElevenLabs widget script")
      console.error("[ElevenLabs Widget] Error:", error)
      if (checkInterval) clearInterval(checkInterval)
      if (timeoutId) clearTimeout(timeoutId)
      onError?.(error)
    }

    document.head.appendChild(script)
    scriptRef.current = script

    return () => {
      if (checkInterval) clearInterval(checkInterval)
      if (timeoutId) clearTimeout(timeoutId)
      // Don't remove script on cleanup to avoid re-registration
    }
  }, [onError])

  // Initialize widget element
  useEffect(() => {
    if (!isInitialized || !widgetRef.current || typeof window === "undefined") return

    const widgetElement = widgetRef.current as HTMLElement

    // Set up event listeners for the widget
    const handleTranscript = (event: CustomEvent) => {
      const data = event.detail
      console.log("[ElevenLabs Widget] Transcript event:", data)
      
      if (data?.text) {
        transcriptBufferRef.current += `${data.role === "assistant" ? "Agent" : "User"}: ${data.text}\n`
        
        if (onTranscript) {
          onTranscript({
            role: data.role || "user",
            text: data.text,
            timestamp: Date.now(),
          })
        }
      }
    }

    const handleCallStart = () => {
      console.log("[ElevenLabs Widget] Call started")
      setIsCallActive(true)
      transcriptBufferRef.current = ""
      onCallStart?.()
    }

    const handleCallEnd = () => {
      console.log("[ElevenLabs Widget] Call ended")
      setIsCallActive(false)
      onCallEnd?.()
    }

    // Listen for custom events from widget
    widgetElement.addEventListener("elevenlabs:transcript", handleTranscript as EventListener)
    widgetElement.addEventListener("elevenlabs:callStart", handleCallStart)
    widgetElement.addEventListener("elevenlabs:callEnd", handleCallEnd)

    // Also try to listen to native events if available
    if ((window as any).ElevenLabsConvAI) {
      console.log("[ElevenLabs Widget] Widget API available")
    }

    return () => {
      widgetElement.removeEventListener("elevenlabs:transcript", handleTranscript as EventListener)
      widgetElement.removeEventListener("elevenlabs:callStart", handleCallStart)
      widgetElement.removeEventListener("elevenlabs:callEnd", handleCallEnd)
    }
  }, [isInitialized, onTranscript, onCallStart, onCallEnd])

  const startCall = useCallback(() => {
    if (!isInitialized || !widgetRef.current) {
      console.warn("[ElevenLabs Widget] Widget not initialized yet")
      return
    }

    try {
      const widgetElement = widgetRef.current as any
      
      // Try to trigger start programmatically
      if (widgetElement.start) {
        widgetElement.start()
      } else {
        // Find and click the start button
        const startButton = widgetElement.querySelector('button[aria-label*="Start"], button:first-child') as HTMLButtonElement
        if (startButton) {
          startButton.click()
        } else {
          // Dispatch custom event
          widgetElement.dispatchEvent(new CustomEvent("start-call"))
        }
      }
    } catch (error) {
      console.error("[ElevenLabs Widget] Error starting call:", error)
      onError?.(error as Error)
    }
  }, [isInitialized, onError])

  const endCall = useCallback(() => {
    if (!isCallActive || !widgetRef.current) return

    try {
      const widgetElement = widgetRef.current as any
      
      if (widgetElement.stop) {
        widgetElement.stop()
      } else {
        const endButton = widgetElement.querySelector('button[aria-label*="End"], button[aria-label*="Stop"], button:last-child') as HTMLButtonElement
        if (endButton) {
          endButton.click()
        } else {
          widgetElement.dispatchEvent(new CustomEvent("end-call"))
        }
      }
    } catch (error) {
      console.error("[ElevenLabs Widget] Error ending call:", error)
      onError?.(error as Error)
    }
  }, [isCallActive, onError])

  const getFullTranscript = useCallback(() => {
    return transcriptBufferRef.current
  }, [])

  return {
    widgetRef,
    isInitialized,
    isCallActive,
    startCall,
    endCall,
    getFullTranscript,
  }
}

