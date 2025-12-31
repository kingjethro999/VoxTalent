"use client"

import { useState, useCallback, useRef } from "react"
import type { TranscriptEvent } from "./use-elevenlabs-widget"

export interface TranscriptSession {
  events: TranscriptEvent[]
  fullTranscript: string
  startTime: number
  endTime?: number
}

export function useTranscriptCollector() {
  const [session, setSession] = useState<TranscriptSession | null>(null)
  const bufferRef = useRef<TranscriptEvent[]>([])

  const startSession = useCallback(() => {
    console.log("[Transcript Collector] Starting new session")
    const newSession: TranscriptSession = {
      events: [],
      fullTranscript: "",
      startTime: Date.now(),
    }
    setSession(newSession)
    bufferRef.current = []
  }, [])

  const addTranscript = useCallback((event: TranscriptEvent) => {
    console.log("[Transcript Collector] Adding transcript:", event.text.substring(0, 50) + "...")
    
    bufferRef.current.push(event)
    
    setSession((prev) => {
      if (!prev) {
        const newSession: TranscriptSession = {
          events: [event],
          fullTranscript: `${event.role === "assistant" ? "Agent" : "User"}: ${event.text}\n`,
          startTime: event.timestamp,
        }
        return newSession
      }

      const updatedEvents = [...prev.events, event]
      const updatedTranscript = prev.fullTranscript + `${event.role === "assistant" ? "Agent" : "User"}: ${event.text}\n`

      return {
        ...prev,
        events: updatedEvents,
        fullTranscript: updatedTranscript,
      }
    })
  }, [])

  const endSession = useCallback(() => {
    console.log("[Transcript Collector] Ending session")
    setSession((prev) => {
      if (!prev) return null
      return {
        ...prev,
        endTime: Date.now(),
      }
    })
  }, [])

  const getFullTranscript = useCallback((): string => {
    return session?.fullTranscript || ""
  }, [session])

  const reset = useCallback(() => {
    console.log("[Transcript Collector] Resetting")
    setSession(null)
    bufferRef.current = []
  }, [])

  return {
    session,
    startSession,
    addTranscript,
    endSession,
    getFullTranscript,
    reset,
  }
}

