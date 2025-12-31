"use client"

import type { ResumeData } from "./types"

// Central data store for resume information
// Updated by Gemini optimization and consumed by all resume templates

let resumeData: ResumeData = {
  personalInfo: {
    name: "",
    title: "",
    location: "",
    contact: {
      email: "",
      phone: "",
      linkedin: "",
    },
  },
  experience: [],
  education: [],
  skills: {
    technical: [],
    soft: [],
  },
  languages: [],
}

// Listener function type
type DataChangeListener = (data: ResumeData) => void
const listeners: Set<DataChangeListener> = new Set()

/**
 * Update resume data and notify all listeners
 * This is called after Gemini optimization
 */
export function updateResumeData(newData: Partial<ResumeData>): void {
  resumeData = {
    ...resumeData,
    ...newData,
  }
  notifyListeners()
}

/**
 * Deep update for nested objects
 */
export function updateResumeDataDeep(updates: Partial<ResumeData>): void {
  if (updates.personalInfo) {
    resumeData.personalInfo = {
      ...resumeData.personalInfo,
      ...updates.personalInfo,
    }
  }
  if (updates.experience) {
    resumeData.experience = updates.experience
  }
  if (updates.education) {
    resumeData.education = updates.education
  }
  if (updates.skills) {
    resumeData.skills = {
      ...resumeData.skills,
      ...updates.skills,
    }
  }
  if (updates.languages) {
    resumeData.languages = updates.languages
  }
  notifyListeners()
}

/**
 * Get current resume data
 */
export function getResumeData(): ResumeData {
  return JSON.parse(JSON.stringify(resumeData)) // Return deep copy
}

/**
 * Subscribe to data changes
 */
export function subscribeToResumeData(listener: DataChangeListener): () => void {
  listeners.add(listener)
  // Return unsubscribe function
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Notify all listeners of data changes
 */
function notifyListeners(): void {
  listeners.forEach((listener) => {
    try {
      listener(getResumeData())
    } catch (error) {
      console.error("Error in resume data listener:", error)
    }
  })
}

/**
 * Reset resume data to empty state
 */
export function resetResumeData(): void {
  resumeData = {
    personalInfo: {
      name: "",
      title: "",
      location: "",
      contact: {
        email: "",
        phone: "",
        linkedin: "",
      },
    },
    experience: [],
    education: [],
    skills: {
      technical: [],
      soft: [],
    },
    languages: [],
  }
  notifyListeners()
}

/**
 * Parse raw agent response into structured resume data
 */
export function parseAgentResponse(conversationHistory: string[]): Partial<ResumeData> {
  // This function would parse the conversation history from the agent
  // and extract structured data
  // For now, return empty - will be enhanced based on agent output format

  return {}
}
