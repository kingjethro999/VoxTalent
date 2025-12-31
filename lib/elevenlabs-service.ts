export interface AgentConfig {
  agentId: string
  name: string
}

export const RESUME_BUDDY_AGENT: AgentConfig = {
  agentId: process.env.NEXT_PUBLIC_RESUMEBUDDY_AGENT_ID || "agent_3101kdqdvxzse409wmgmbrk97fg6",
  name: "ResumeBuddy",
}

export const INTERPREP_AGENT: AgentConfig = {
  agentId: "agent_5901kdqx7sv0ef5sw5txaegdy9jv", // Legacy - InterPrep now uses Gemini + TTS
  name: "InterPrep",
}

export class ElevenLabsService {
  private agentId: string
  private conversationId: string | null = null
  private sessionId: string | null = null

  constructor(agentId: string) {
    this.agentId = agentId
  }

  // Initialize conversation with ElevenLabs
  async initializeConversation(): Promise<{
    conversationId: string
    sessionId: string
  }> {
    try {
      // Create unique session for tracking conversation
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      this.conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      return {
        conversationId: this.conversationId,
        sessionId: this.sessionId,
      }
    } catch (error) {
      console.error("Failed to initialize ElevenLabs conversation:", error)
      throw error
    }
  }

  // Send audio to agent and get response
  async sendAudio(audioBlob: Blob): Promise<{
    response: string
    conversationComplete: boolean
    extractedData?: any
  }> {
    try {
      const formData = new FormData()
      formData.append("audio", audioBlob)
      formData.append("agent_id", this.agentId)

      const response = await fetch("/api/elevenlabs/process-audio", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to process audio")
      }

      return {
        response: result.agentResponse,
        conversationComplete: result.conversationComplete,
        extractedData: result.data,
      }
    } catch (error) {
      console.error("Failed to send audio to agent:", error)
      throw error
    }
  }

  // Get agent ID
  getAgentId(): string {
    return this.agentId
  }

  // Get conversation ID
  getConversationId(): string | null {
    return this.conversationId
  }
}
