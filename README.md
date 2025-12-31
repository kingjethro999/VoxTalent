# VoxTalent

**Voice-First Resume Builder & Interview Preparation Platform**

VoxTalent is an innovative, voice-powered platform that helps job seekers create professional, ATS-optimized resumes through natural conversation and master their interview skills with AI-powered simulation. Built with Next.js, React, and cutting-edge AI technologies.

![VoxTalent](https://img.shields.io/badge/Next.js-16.0.10-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.9-38B2AC?style=for-the-badge&logo=tailwind-css)

## 🎯 Features

### ResumeBuddy - Voice-Powered Resume Builder
- **🎤 Natural Voice Interview**: Conduct a conversational interview with an AI agent to gather your professional information
- **🤖 AI-Powered Optimization**: Gemini AI structures and optimizes your resume for ATS (Applicant Tracking Systems)
- **📄 Multiple CV Templates**: Choose from 7+ professional resume templates
- **💾 Real-time Data Management**: Your information is stored and synced across all templates
- **📥 PDF Download**: Export your resume as a professional PDF

### InterPrep - AI Interview Simulation
- **📝 Resume Upload**: Support for TXT, PDF, and DOCX resume formats
- **🔗 Job Description Parsing**: Paste a job posting URL to automatically extract the job description
- **🎯 Targeted Questions**: AI generates personalized interview questions based on your resume and job description
- **🗣️ Voice-First Interview**: Fully voice-powered interview simulation with automatic speech recognition
- **📊 Real-time Feedback**: Get instant analysis after each answer with strengths, improvements, and scores
- **🎤 Text-to-Speech**: ElevenLabs TTS provides natural-sounding question narration
- **📈 Final Analysis**: Receive a comprehensive, brutally honest analysis of your interview performance

## 🛠️ Tech Stack

### Frontend
- **Next.js 16.0.10** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript 5.0** - Type safety
- **Tailwind CSS 4.1.9** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library

### Backend & APIs
- **ElevenLabs** - Voice AI (Conversational AI widget, Text-to-Speech)
- **Google Gemini 2.5 Flash** - AI for resume optimization and interview analysis
- **Web Speech API** - Browser-based speech recognition

### File Processing
- **pdf-parse** - PDF text extraction
- **mammoth** - DOCX text extraction
- **html2canvas & jsPDF** - PDF generation

### Development Tools
- **pnpm** - Package manager
- **ESLint** - Code linting
- **TypeScript** - Static type checking

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18.x or higher
- **pnpm** 8.x or higher ([Install pnpm](https://pnpm.io/installation))
- **Git** for version control

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd vox-talent-website-build
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# ElevenLabs API Configuration
# Get your API key from https://elevenlabs.io/app/settings/api-keys
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# ElevenLabs Webhook Secret (REQUIRED for ResumeBuddy)
# Get this from https://elevenlabs.io/app/agents/settings → Webhooks
# When you create a webhook, ElevenLabs will provide a secret (starts with "wsec_")
ELEVENLABS_CONVAI_WEBHOOK_SECRET=your_webhook_secret_here

# ElevenLabs Agent IDs
NEXT_PUBLIC_RESUMEBUDDY_AGENT_ID=your_resumebuddy_agent_id_here

# Google Gemini API
# Get your API key from https://aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# ElevenLabs Voice ID for InterPrep TTS
INTERVIEWPREP_VOICE_ID=your_voice_id_here
```

### 4. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production

```bash
pnpm build
pnpm start
```

## 🔧 Configuration

### ElevenLabs Setup

1. **Create an Agent for ResumeBuddy**:
   - Go to [ElevenLabs Agents](https://elevenlabs.io/app/agents)
   - Create a new agent configured for resume interviews
   - Copy the Agent ID to `NEXT_PUBLIC_RESUMEBUDDY_AGENT_ID`

2. **Configure Webhooks**:
   - In your agent settings, go to Webhooks
   - Add webhook URL: `https://yourdomain.com/api/elevenlabs-webhook` (production) or use ngrok for local development
   - Copy the webhook secret to `ELEVENLABS_CONVAI_WEBHOOK_SECRET`
   - See `WEBHOOK-SECRET-GUIDE.md` for detailed instructions

3. **Get Voice ID for InterPrep**:
   - Go to [ElevenLabs Voices](https://elevenlabs.io/app/voices)
   - Select or create a voice
   - Copy the Voice ID to `INTERVIEWPREP_VOICE_ID`

### Gemini API Setup

1. **Get API Key**:
   - Visit [Google AI Studio](https://aistudio.google.com/apikey)
   - Create a new API key
   - Copy to `GEMINI_API_KEY`

2. **Model Selection**:
   - The app uses `gemini-2.5-flash` by default
   - You can modify the model in API route files if needed

## 📁 Project Structure

```
vox-talent-website-build/
├── app/                          # Next.js App Router pages
│   ├── ai/                       # Voice interview interface
│   ├── api/                      # API routes
│   │   ├── elevenlabs/          # ElevenLabs integrations
│   │   ├── gemini/               # Gemini AI processing
│   │   └── parse-*/              # File parsing endpoints
│   ├── cv-select/                # CV template selection
│   ├── interprep-interview/      # InterPrep interview page
│   ├── interview/                 # Interview results page
│   └── view/                     # CV template previews
├── components/                    # React components
│   ├── ui/                       # Reusable UI components
│   └── *.tsx                     # Feature components
├── hooks/                         # Custom React hooks
├── lib/                          # Utility functions and services
├── public/                       # Static assets
└── styles/                       # Global styles
```

## 🎨 Features in Detail

### ResumeBuddy Flow

1. **Voice Interview**: User clicks "Start Crafting" and engages in a natural conversation with the AI agent
2. **Transcript Collection**: System collects the full conversation transcript via webhooks
3. **AI Processing**: Gemini AI extracts and structures resume data from the transcript
4. **ATS Optimization**: AI optimizes content for Applicant Tracking Systems
5. **Template Selection**: User chooses from multiple professional CV templates
6. **Preview & Download**: User previews and downloads their resume as PDF

### InterPrep Flow

1. **Resume Upload**: User uploads resume (TXT, PDF, or DOCX)
2. **Job Description**: User provides job title and description (or paste URL to auto-parse)
3. **Question Generation**: Gemini AI generates personalized interview questions
4. **Voice Interview**: 
   - AI asks questions via TTS (ElevenLabs)
   - Auto-listening activates after question
   - User speaks answers (Web Speech API)
   - Auto-submits after 3 seconds of silence
5. **Real-time Analysis**: Each answer is analyzed with strengths, improvements, and scores
6. **Final Analysis**: Comprehensive interview performance analysis
7. **Download Results**: Download analysis as text file

## 🔌 API Endpoints

### ElevenLabs
- `POST /api/elevenlabs/text-to-speech` - Convert text to speech
- `POST /api/elevenlabs-webhook` - Receive webhook events from ElevenLabs

### Gemini AI
- `POST /api/gemini/process-transcript` - Process ResumeBuddy conversation transcript
- `POST /api/gemini/generate-questions` - Generate interview questions
- `POST /api/gemini/analyze-response` - Analyze interview answers
- `POST /api/gemini/process-interview` - Generate final interview analysis

### File Processing
- `POST /api/parse-resume` - Extract text from PDF/DOCX resumes
- `POST /api/parse-job-link` - Extract job description from URL

## 🧪 Testing

### Sample Files
- `sample-resume.txt` - Sample resume for testing InterPrep
- `sample-job-description.txt` - Sample job description for testing

### Local Development with Webhooks

For local webhook testing, use [ngrok](https://ngrok.com/):

```bash
ngrok http 3000
```

Update your ElevenLabs webhook URL to: `https://your-ngrok-url.ngrok.io/api/elevenlabs-webhook`

## 🐛 Troubleshooting

### Microphone Not Working
- Ensure browser permissions are granted
- Use Chrome or Edge for best Web Speech API support
- Check that microphone is not being used by another application

### Webhook Not Receiving Events
- Verify webhook URL is accessible (use ngrok for local dev)
- Check webhook secret matches in `.env.local`
- Ensure webhook is configured in ElevenLabs agent settings

### Gemini API Errors
- Verify API key is correct in `.env.local`
- Check API quota limits
- Ensure model name is correct (`gemini-2.5-flash`)

### File Upload Issues
- Ensure file is in supported format (TXT, PDF, DOCX)
- Check file size limits
- Verify file is not corrupted

## 📝 License

See [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Support

For issues, questions, or contributions, please open an issue on the repository.

## 🙏 Acknowledgments

- [ElevenLabs](https://elevenlabs.io/) - Voice AI technology
- [Google Gemini](https://deepmind.google/technologies/gemini/) - AI processing
- [Next.js](https://nextjs.org/) - React framework
- [Radix UI](https://www.radix-ui.com/) - Component primitives

## 📄 Additional Documentation

- [README-VOICE-SETUP.md](README-VOICE-SETUP.md) - Detailed voice setup guide
- [WEBHOOK-SECRET-GUIDE.md](WEBHOOK-SECRET-GUIDE.md) - Webhook configuration guide
- [webhooksetup.txt](webhooksetup.txt) - Webhook setup instructions

---

**Built with ❤️ for job seekers everywhere**

