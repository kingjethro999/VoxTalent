'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

interface CVTemplate {
  name: string;
  image: string;
  route: string;
  id: string;
}

const cvTemplates: CVTemplate[] = [
  {
    name: "Balanced CV",
    image: "/cv/balanced-cv.jpg",
    route: "/view/balanced-cv",
    id: "balanced-cv",
  },
  {
    name: "Clean CV",
    image: "/cv/clean-cv.jpg",
    route: "/view/clean-cv",
    id: "clean-cv",
  },
  {
    name: "CV 1",
    image: "/cv/cv1.png",
    route: "/view/cv1",
    id: "cv1",
  },
  {
    name: "Double Column CV",
    image: "/cv/double-column-cv.png",
    route: "/view/double-column-cv",
    id: "double-column-cv",
  },
  {
    name: "Elegant CV",
    image: "/cv/elegant-cv.png",
    route: "/view/elegant-cv",
    id: "elegant-cv",
  },
  {
    name: "Industrial CV",
    image: "/cv/industrial-cv.jpg",
    route: "/view/industrial-cv",
    id: "industrial-cv",
  },
  {
    name: "Minimalist CV",
    image: "/cv/minimalist-cv.jpg",
    route: "/view/minimalist-cv",
    id: "minimalist-cv",
  },
];

function CVSelectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get stage, template, and voice from URL params
  const urlStage = searchParams.get('stage');
  const urlTemplate = searchParams.get('template');
  const urlVoice = searchParams.get('voice');
  
  const [stage, setStage] = useState<'1' | '2'>(urlStage === '2' ? '2' : '1');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(urlTemplate || null);
  const [selectedVoice, setSelectedVoice] = useState<'male' | 'female' | null>(
    urlVoice === 'male' || urlVoice === 'female' ? urlVoice : null
  );

  // Sync URL params when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (selectedTemplate) {
      params.set('template', selectedTemplate);
    }
    
    if (stage === '2') {
      params.set('stage', '2');
      if (selectedVoice) {
        params.set('voice', selectedVoice);
      }
    } else {
      params.set('stage', '1');
      params.delete('voice');
    }
    
    const newUrl = `?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [stage, selectedTemplate, selectedVoice, router]);

  // Restore state from URL on mount
  useEffect(() => {
    if (urlTemplate) {
      setSelectedTemplate(urlTemplate);
    }
    if (urlStage === '2') {
      setStage('2');
    }
    if (urlVoice === 'male' || urlVoice === 'female') {
      setSelectedVoice(urlVoice);
    }
  }, [urlTemplate, urlStage, urlVoice]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    // Navigate directly to view the CV
    router.push(`/view/${templateId}`);
  };

  const handleNext = () => {
    if (selectedTemplate) {
      router.push(`/view/${selectedTemplate}`);
    }
  };

  const handleStart = () => {
    if (selectedTemplate) {
      router.push(`/view/${selectedTemplate}`);
    }
  };

  return (
    <>
      <style jsx>{`
        :global(body) {
          margin: 0;
          padding: 0;
          font-family: 'Inter', sans-serif;
          background: #0a0a0c;
          color: white;
        }

        .container {
          width: 100vw !important;
          max-width: none !important;
          min-height: 100vh;
          padding: 100px 40px 40px;
          box-sizing: border-box;
        }

        .header {
          text-align: center;
          margin-bottom: 50px;
        }

        .header h1 {
          font-size: 2.5rem;
          font-weight: 800;
          margin: 0 0 10px 0;
          background: linear-gradient(to right, #fff, #888);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .header p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 1.1rem;
        }

        .stage-indicator {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 40px;
        }

        .stage-item {
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(255, 255, 255, 0.4);
          font-weight: 600;
        }

        .stage-item.active {
          color: #8E75FF;
        }

        .stage-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        .stage-item.active .stage-number {
          background: #8E75FF;
          color: white;
        }

        .templates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 24px;
          max-width: 1200px;
          margin: 0 auto 60px;
        }

        .template-card {
          background: #151518;
          border: 2px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s;
          text-align: center;
        }

        .template-card:hover {
          border-color: #8E75FF;
          transform: translateY(-5px);
        }

        .template-card.selected {
          border-color: #8E75FF;
          background: #1a1a25;
          box-shadow: 0 0 20px rgba(142, 117, 255, 0.3);
        }

        .template-image {
          width: 100%;
          height: 300px;
          object-fit: cover;
          border-radius: 12px;
          margin-bottom: 16px;
        }

        .template-name {
          font-size: 1.1rem;
          font-weight: 700;
          color: white;
        }

        .voice-selection {
          max-width: 600px;
          margin: 0 auto 40px;
          background: #151518;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          padding: 40px;
        }

        .voice-selection h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 10px 0;
          text-align: center;
        }

        .voice-selection p {
          color: rgba(255, 255, 255, 0.6);
          text-align: center;
          margin-bottom: 30px;
        }

        .voice-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .voice-option {
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 30px 20px;
          cursor: pointer;
          transition: all 0.3s;
          text-align: center;
        }

        .voice-option:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .voice-option.selected {
          border-color: #8E75FF;
          background: rgba(142, 117, 255, 0.1);
        }

        .voice-icon {
          font-size: 3rem;
          font-weight: 700;
          color: #8E75FF;
          margin-bottom: 12px;
        }

        .voice-label {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }

        .voice-name {
          font-size: 1.3rem;
          font-weight: 700;
          color: white;
        }

        .action-btn {
          display: block;
          margin: 0 auto;
          padding: 16px 40px;
          border-radius: 50px;
          background: #fff;
          color: #000;
          font-weight: 700;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          transition: all 0.3s;
          font-family: 'Inter', sans-serif;
        }

        .action-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.15);
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .selected-template-info {
          background: #151518;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 30px;
          text-align: center;
        }

        .selected-template-info h3 {
          margin: 0 0 10px 0;
          color: #8E75FF;
          font-size: 1.1rem;
        }

        .selected-template-info p {
          margin: 0;
          color: rgba(255, 255, 255, 0.6);
        }
      `}</style>

      <div className="container">
        <div className="header">
          <h1>Select Your Template</h1>
          <p>Choose a resume design that matches your style</p>
        </div>

        {/* Template Selection */}
        <div className="templates-grid">
          {cvTemplates.map((template) => (
            <div
              key={template.id}
              className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
              onClick={() => handleTemplateSelect(template.id)}
            >
              <Image
                src={template.image}
                alt={template.name}
                width={250}
                height={300}
                className="template-image"
              />
              <div className="template-name">{template.name}</div>
            </div>
          ))}
        </div>

        {selectedTemplate && (
          <button
            className="action-btn"
            onClick={handleNext}
          >
            View Resume
          </button>
        )}
      </div>
    </>
  );
}

export default function CVSelect() {
  return (
    <Suspense fallback={
      <div style={{
        width: '100vw',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0c',
        color: 'white'
      }}>
        <div>Loading...</div>
      </div>
    }>
      <CVSelectContent />
    </Suspense>
  );
}
