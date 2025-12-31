export interface PersonalInfo {
  name: string;
  title: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  nationality?: string;
}

export interface Experience {
  position: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string[];
}

export interface Education {
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
}

export interface Reference {
  name: string;
  email: string;
  phone?: string;
}

export interface Skill {
  label: string;
  level: number;
}

export interface Language {
  name: string;
  proficiency: number; // 0-100 percentage
}

export interface CVData {
  personalInfo: PersonalInfo;
  profile: string;
  experience: Experience[];
  education: Education[];
  references: Reference[];
  skills: Skill[];
  languages?: Language[];
}

const defaultCvData: CVData = {
  personalInfo: {
    name: "",
    title: "",
    address: "",
    city: "",
    country: "",
    phone: "",
    email: "",
    nationality: ""
  },
  profile: "",
  experience: [],
  education: [],
  references: [],
  skills: [],
  languages: []
};

// Function to get CV data (checks localStorage first, then defaults)
export const getCvData = (): CVData => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('voxTalent_cvData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Deep merge to ensure all nested fields exist
        return {
          personalInfo: { ...defaultCvData.personalInfo, ...parsed.personalInfo },
          profile: parsed.profile || defaultCvData.profile,
          experience: parsed.experience || defaultCvData.experience,
          education: parsed.education || defaultCvData.education,
          references: parsed.references || defaultCvData.references,
          skills: parsed.skills || defaultCvData.skills,
          languages: parsed.languages || defaultCvData.languages,
        };
      } catch (e) {
        console.error('Error loading saved CV data:', e);
      }
    }
  }
  return defaultCvData;
};

// Function to update CV data
export const updateCvData = (data: Partial<CVData>): void => {
  if (typeof window === 'undefined') return;
  
  const current = getCvData();
  const updated: CVData = {
    personalInfo: { ...current.personalInfo, ...data.personalInfo },
    profile: data.profile !== undefined ? data.profile : current.profile,
    experience: data.experience || current.experience,
    education: data.education || current.education,
    references: data.references || current.references,
    skills: data.skills || current.skills,
    languages: data.languages || current.languages,
  };
  
  localStorage.setItem('voxTalent_cvData', JSON.stringify(updated));
  console.log('[CV Data] Updated CV data:', updated);
};

// Export default for backward compatibility
export const cvData = defaultCvData;
