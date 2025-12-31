// InterPrep Service for interview simulation management

export interface InterviewContext {
  targetRole: string
  jobDescription: string
  resumeFile?: File
  resumeText?: string
}

export interface FeedbackItem {
  category: "communication" | "technical" | "behavioral" | "confidence"
  score: number
  feedback: string
  suggestion: string
}

export interface InterviewFeedback {
  overallScore: number
  strengths: string[]
  improvements: string[]
  detailedFeedback: FeedbackItem[]
  nextSteps: string[]
}

export class InterPrepService {
  private context: InterviewContext | null = null
  private sessionId: string | null = null
  private recordingStartTime: number | null = null
  private audioChunks: Blob[] = []

  constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  setContext(context: InterviewContext): void {
    this.context = context
  }

  getContext(): InterviewContext | null {
    return this.context
  }

  getSessionId(): string | null {
    return this.sessionId
  }

  startRecording(): MediaRecorder | null {
    if (!navigator.mediaDevices) {
      console.error("Media devices not supported")
      return null
    }

    this.recordingStartTime = Date.now()
    return null // Will be implemented in component
  }

  addAudioChunk(chunk: Blob): void {
    this.audioChunks.push(chunk)
  }

  getRecordingDuration(): number {
    if (!this.recordingStartTime) return 0
    return Math.floor((Date.now() - this.recordingStartTime) / 1000)
  }

  clearRecording(): void {
    this.audioChunks = []
    this.recordingStartTime = null
  }

  // Generate mock feedback (in production, this would use AI analysis)
  async generateFeedback(): Promise<InterviewFeedback> {
    return {
      overallScore: 78,
      strengths: [
        "Clear communication of technical concepts",
        "Demonstrated problem-solving approach",
        "Good use of specific examples from experience",
      ],
      improvements: [
        "Could speak more slowly for clarity",
        "Add more detail about technical challenges overcome",
        "Prepare more examples of leadership moments",
      ],
      detailedFeedback: [
        {
          category: "communication",
          score: 80,
          feedback: "You explained your thoughts clearly with good structure.",
          suggestion: "Try to slow down slightly and add pauses for emphasis.",
        },
        {
          category: "technical",
          score: 75,
          feedback: "Good technical understanding demonstrated.",
          suggestion: "Provide more quantifiable results from your projects.",
        },
        {
          category: "behavioral",
          score: 78,
          feedback: "You gave relevant examples from your experience.",
          suggestion: "Include more examples showing leadership or influence.",
        },
        {
          category: "confidence",
          score: 80,
          feedback: "You presented yourself professionally.",
          suggestion: "Show more enthusiasm about the role and company.",
        },
      ],
      nextSteps: [
        "Practice technical deep-dives on your key projects",
        "Prepare more STAR method examples",
        "Research the company more thoroughly before next interview",
        "Practice speaking at a slower pace",
      ],
    }
  }
}
