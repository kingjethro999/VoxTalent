"use client"

import { useEffect, useRef, useState, useCallback } from "react"

export interface TranscriptEvent {
  role: "user" | "assistant"
  text: string
  timestamp: number
}

export interface UseElevenLabsWidgetOptions {
  agentId: string
  onTranscript?: (event: TranscriptEvent) => void
  onCallStart?: () => void
  onCallEnd?: () => void
  onError?: (error: Error) => void
}

declare global {
  interface Window {
    ElevenLabsConvAI?: any
  }
}

export function useElevenLabsWidget({
  agentId,
  onTranscript,
  onCallStart,
  onCallEnd,
  onError,
}: UseElevenLabsWidgetOptions) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isCallActive, setIsCallActive] = useState(false)
  const widgetRef = useRef<HTMLDivElement>(null)
  const widgetInstanceRef = useRef<any>(null)
  const scriptRef = useRef<HTMLScriptElement | null>(null)

  // Initialize widget script
  useEffect(() => {
    if (typeof window === "undefined" || scriptRef.current) return

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="elevenlabs"]')
    if (existingScript) {
      console.log("[ElevenLabs Widget] Script already loaded")
      // Wait a bit for the script to be ready
      setTimeout(() => setIsInitialized(true), 500)
      return
    }

    // Try multiple possible script URLs
    const scriptUrls = [
      "https://elevenlabs.io/convai-widget/index.js",
      "https://elevenlabs.io/widget/index.js",
      "https://widget.elevenlabs.io/index.js",
    ]

    let currentUrlIndex = 0

    const tryLoadScript = () => {
      if (currentUrlIndex >= scriptUrls.length) {
        const error = new Error("Failed to load ElevenLabs widget script from all sources")
        console.error("[ElevenLabs Widget] Error:", error)
        onError?.(error)
        return
      }

      const script = document.createElement("script")
      script.src = scriptUrls[currentUrlIndex]
      script.async = true
      script.onload = () => {
        console.log(`[ElevenLabs Widget] Script loaded successfully from ${scriptUrls[currentUrlIndex]}`)
        // Wait a bit for the widget API to be available
        setTimeout(() => setIsInitialized(true), 500)
      }
      script.onerror = () => {
        console.warn(`[ElevenLabs Widget] Failed to load from ${scriptUrls[currentUrlIndex]}, trying next...`)
        currentUrlIndex++
        tryLoadScript()
      }

      document.head.appendChild(script)
      scriptRef.current = script
    }

    tryLoadScript()

    return () => {
      // Don't remove script on cleanup to avoid reloading
    }
  }, [onError])

  // Initialize widget when script is loaded
  useEffect(() => {
    if (!isInitialized || !widgetRef.current || typeof window === "undefined") return
    if (widgetInstanceRef.current) return // Already initialized

    let retryCount = 0
    const maxRetries = 20 // Try for 2 seconds

    // Wait for widget API to be available
    const initWidget = () => {
      try {
        // Try different possible widget API names
        const WidgetClass =
          (window as any).ElevenLabsConvAI ||
          (window as any).ElevenLabsWidget ||
          (window as any).ConvAIWidget ||
          (window as any).ElevenLabs

        if (WidgetClass) {
          console.log("[ElevenLabs Widget] Found widget API, initializing...")
          
          // Try different initialization patterns
          let widget: any = null
          
          try {
            // Pattern 1: Constructor with options
            widget = new WidgetClass({
              agentId: agentId,
              container: widgetRef.current!,
              onTranscript: (data: any) => {
                console.log("[ElevenLabs Widget] Transcript event:", data)
                if (onTranscript && data?.text) {
                  onTranscript({
                    role: data.role || "user",
                    text: data.text,
                    timestamp: Date.now(),
                  })
                }
              },
              onCallStart: () => {
                console.log("[ElevenLabs Widget] Call started")
                setIsCallActive(true)
                onCallStart?.()
              },
              onCallEnd: () => {
                console.log("[ElevenLabs Widget] Call ended")
                setIsCallActive(false)
                onCallEnd?.()
              },
              onError: (error: any) => {
                console.error("[ElevenLabs Widget] Error:", error)
                onError?.(new Error(error?.message || "Widget error"))
              },
            })
          } catch (e1) {
            try {
              // Pattern 2: Initialize method
              widget = WidgetClass.init({
                agentId: agentId,
                container: widgetRef.current!,
                onTranscript: onTranscript,
                onCallStart: onCallStart,
                onCallEnd: onCallEnd,
                onError: onError,
              })
            } catch (e2) {
              console.warn("[ElevenLabs Widget] Standard initialization failed, using fallback")
              // Fallback: Create a simple container and let the widget auto-initialize
              if (widgetRef.current) {
                widgetRef.current.setAttribute("data-elevenlabs-agent-id", agentId)
                widgetRef.current.setAttribute("data-elevenlabs-widget", "true")
              }
            }
          }

          if (widget) {
            widgetInstanceRef.current = widget
            console.log("[ElevenLabs Widget] Widget initialized successfully")
          } else {
            console.log("[ElevenLabs Widget] Using fallback initialization")
          }
        } else if (retryCount < maxRetries) {
          // Retry after a short delay
          retryCount++
          setTimeout(initWidget, 100)
        } else {
          console.warn("[ElevenLabs Widget] Widget API not found, using fallback DOM approach")
          // Fallback: Set up data attributes for auto-initialization
          if (widgetRef.current) {
            widgetRef.current.setAttribute("data-elevenlabs-agent-id", agentId)
            widgetRef.current.setAttribute("data-elevenlabs-widget", "true")
          }
        }
      } catch (error) {
        console.error("[ElevenLabs Widget] Initialization error:", error)
        // Don't call onError here as fallback might still work
        console.log("[ElevenLabs Widget] Attempting fallback initialization...")
        if (widgetRef.current) {
          widgetRef.current.setAttribute("data-elevenlabs-agent-id", agentId)
          widgetRef.current.setAttribute("data-elevenlabs-widget", "true")
        }
      }
    }

    // Small delay to ensure script is fully loaded
    const timeoutId = setTimeout(initWidget, 300)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [isInitialized, agentId, onTranscript, onCallStart, onCallEnd, onError])

  const startCall = useCallback(() => {
    if (!isInitialized || !widgetInstanceRef.current) {
      console.warn("[ElevenLabs Widget] Widget not initialized yet")
      return
    }

    try {
      // Use widget API if available
      if (widgetInstanceRef.current.start) {
        widgetInstanceRef.current.start()
      } else {
        // Fallback: find and click start button
        const widgetElement = widgetRef.current
        if (widgetElement) {
          const startButton = widgetElement.querySelector(
            'button[aria-label*="Start"], button[aria-label*="start"], button:first-child'
          ) as HTMLButtonElement
          if (startButton) {
            startButton.click()
          }
        }
      }
    } catch (error) {
      console.error("[ElevenLabs Widget] Error starting call:", error)
      onError?.(error as Error)
    }
  }, [isInitialized, onError])

  const endCall = useCallback(() => {
    if (!isCallActive || !widgetInstanceRef.current) return

    try {
      // Use widget API if available
      if (widgetInstanceRef.current.stop) {
        widgetInstanceRef.current.stop()
      } else {
        // Fallback: find and click end button
        const widgetElement = widgetRef.current
        if (widgetElement) {
          const endButton = widgetElement.querySelector(
            'button[aria-label*="End"], button[aria-label*="end"], button[aria-label*="Stop"], button:last-child'
          ) as HTMLButtonElement
          if (endButton) {
            endButton.click()
          }
        }
      }
    } catch (error) {
      console.error("[ElevenLabs Widget] Error ending call:", error)
      onError?.(error as Error)
    }
  }, [isCallActive, onError])

  return {
    widgetRef,
    isInitialized,
    isCallActive,
    startCall,
    endCall,
  }
}

