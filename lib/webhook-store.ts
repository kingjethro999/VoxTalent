// In-memory store for webhook data (in production, use Redis or database)
const transcriptStore = new Map<string, { transcript: string; timestamp: number; agentId: string }>()
const agentTranscriptStore = new Map<string, { conversationId: string; transcript: string; timestamp: number }[]>()

// Clean up old entries (older than 1 hour)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    for (const [key, value] of transcriptStore.entries()) {
      if (value.timestamp < oneHourAgo) {
        transcriptStore.delete(key)
      }
    }
    for (const [agentId, transcripts] of agentTranscriptStore.entries()) {
      const filtered = transcripts.filter((t) => t.timestamp >= oneHourAgo)
      if (filtered.length === 0) {
        agentTranscriptStore.delete(agentId)
      } else {
        agentTranscriptStore.set(agentId, filtered)
      }
    }
  }, 60 * 60 * 1000) // Run cleanup every hour
}

export function getTranscript(conversationId: string): string | null {
  const data = transcriptStore.get(conversationId)
  return data ? data.transcript : null
}

export function hasTranscript(conversationId: string): boolean {
  return transcriptStore.has(conversationId)
}

export function setTranscript(conversationId: string, transcript: string, agentId: string): void {
  const timestamp = Date.now()
  transcriptStore.set(conversationId, {
    transcript,
    timestamp,
    agentId,
  })

  // Also store by agent_id for lookup
  if (!agentTranscriptStore.has(agentId)) {
    agentTranscriptStore.set(agentId, [])
  }
  const agentTranscripts = agentTranscriptStore.get(agentId)!
  // Remove old entry for this conversation if exists
  const existingIndex = agentTranscripts.findIndex((t) => t.conversationId === conversationId)
  if (existingIndex >= 0) {
    agentTranscripts.splice(existingIndex, 1)
  }
  // Add new entry
  agentTranscripts.push({ conversationId, transcript, timestamp })
  // Sort by timestamp (newest first)
  agentTranscripts.sort((a, b) => b.timestamp - a.timestamp)
}

export function getLatestTranscriptForAgent(agentId: string, sinceTimestamp?: number): { conversationId: string; transcript: string } | null {
  const transcripts = agentTranscriptStore.get(agentId)
  if (!transcripts || transcripts.length === 0) {
    return null
  }

  // If sinceTimestamp provided, get the most recent one after that time
  if (sinceTimestamp) {
    const recent = transcripts.find((t) => t.timestamp >= sinceTimestamp)
    return recent ? { conversationId: recent.conversationId, transcript: recent.transcript } : null
  }

  // Otherwise return the most recent
  const latest = transcripts[0]
  return latest ? { conversationId: latest.conversationId, transcript: latest.transcript } : null
}

