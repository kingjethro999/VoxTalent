// Resume data structure
export interface ResumeData {
  personalInfo: {
    name: string
    title: string
    location: string
    contact: {
      email: string
      phone: string
      linkedin: string
    }
  }
  experience: Array<{
    company: string
    role: string
    dates: string
    location: string
    rawDescription: string
    optimizedDescription?: string
  }>
  education: Array<{
    institution: string
    degree: string
    graduationDate: string
    details: string
  }>
  skills: {
    technical: string[]
    soft: string[]
  }
  languages: string[]
}

// Message interface
export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp?: Date
}

// ElevenLabs agent response
export interface AgentMessage {
  role: "user" | "assistant"
  content: string
}

// Conversation state
export interface ConversationState {
  messages: Message[]
  resumeData?: ResumeData
}
