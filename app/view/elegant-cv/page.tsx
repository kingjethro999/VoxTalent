'use client';

import React, { useState, useRef } from 'react';
import { Edit2, Download } from 'lucide-react';
import { getCvData } from '@/lib/data';

const cvData = getCvData();

interface JsPDFInstance {
  internal: {
    getNumberOfPages: () => number;
    pageSize: {
      getWidth: () => number;
      getHeight: () => number;
    };
  };
  setPage: (pageNumber: number) => void;
  save: (filename: string) => void;
}

interface Html2PdfOptions {
  margin: [number, number, number, number];
  filename: string;
  image: { type: 'jpeg' | 'png' | 'webp'; quality: number };
  pagebreak: { mode: string[]; avoid: string[] };
  html2canvas: {
    scale: number;
    useCORS: boolean;
    logging: boolean;
    backgroundColor: string;
    onclone: (doc: Document, element: HTMLElement) => void;
  };
  jsPDF: { unit: string; format: string; orientation: 'portrait' | 'landscape' };
}

interface SkillProps {
  label: string;
  level: number;
  isEditing: boolean;
}

const EditableText: React.FC<{
  tag: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
  text: string;
  className?: string;
  style?: React.CSSProperties;
  isEditing: boolean;
}> = ({ tag: Tag, text, className, style, isEditing }) => {
  return (
    <Tag
      contentEditable={isEditing}
      suppressContentEditableWarning={true}
      className={className}
      style={{
        outline: 'none',
        minWidth: '20px',
        transition: 'background-color 0.2s',
        ...(isEditing && {
          borderBottom: '1px dashed #9ca3af',
          backgroundColor: 'rgba(243, 244, 246, 0.5)'
        }),
        ...style
      }}
    >
      {text}
    </Tag>
  );
};

const SkillBar: React.FC<SkillProps> = ({ label, level, isEditing }) => {
  const clampedLevel = Math.max(0, Math.min(100, level));
  
  return (
    <div className="skill-item mb-3">
      <EditableText
        tag="p"
        text={label}
        isEditing={isEditing}
        className="text-gray-700 mb-1"
      />
      <div className="w-full h-2 bg-amber-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-600 transition-all"
          style={{ width: `${clampedLevel}%` }}
        ></div>
      </div>
    </div>
  );
};

export default function ElegantCV() {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const resumeRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!resumeRef.current) return;
    setIsEditing(false);

    const html2pdf = (await import('html2pdf.js')).default;

    setTimeout(() => {
      const element = resumeRef.current;
      if (!element) return;

      const verticalMargin = 0.4;
      const marginConfig: [number, number, number, number] = [verticalMargin, 0, verticalMargin, 0];
      const fileName = `${cvData.personalInfo.name.replace(/\s+/g, '-')}-CV.pdf`;

      const opt: Html2PdfOptions = {
        margin: marginConfig,
        filename: fileName,
        image: { type: 'png', quality: 1.0 },
        pagebreak: {
          mode: ['css', 'legacy'],
          avoid: ['li', 'h3', 'h2', '.job-item', '.section-title', '.skill-item']
        },
        html2canvas: {
          scale: 4,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          onclone: (_clonedDoc: Document, clonedElement: HTMLElement) => {
            clonedElement.style.minHeight = 'auto';
            clonedElement.style.height = 'auto';
          }
        },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      html2pdf().set(opt).from(element).toPdf().get('pdf').then((pdf: JsPDFInstance) => {
        pdf.save(fileName);
      });
    }, 100);
  };

  return (
    <>
      <style>{`
        .fab-container {
          position: fixed;
          bottom: 40px;
          right: 40px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          z-index: 50;
        }

        .fab-group {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
        }

        .fab-expandable {
          background-color: #2563eb;
          color: #ffffff;
          border-radius: 9999px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s ease-in-out;
          width: 56px;
          overflow: hidden;
          white-space: nowrap;
        }

        .fab-expandable:hover {
          width: 192px;
        }

        .fab-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          color: #ffffff;
          cursor: pointer;
          transition: color 0.2s;
        }

        .fab-button:hover {
          color: #bfdbfe;
        }

        .fab-divider {
          width: 1px;
          height: 24px;
          background-color: #60a5fa;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .fab-expandable:hover .fab-divider {
          opacity: 1;
        }

        .fab-text {
          opacity: 0;
          transition: opacity 0.3s;
        }

        .fab-expandable:hover .fab-text {
          opacity: 1;
        }
      `}</style>

    <div className="min-h-screen bg-amber-50 py-12 px-4">
        {/* Floating Action Button */}
        <div className="fab-container">
          <div className="fab-group">
            <div className="fab-expandable">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="fab-button"
                title="Toggle Edit Mode"
              >
                <Edit2 size={24} />
                <span className="fab-text">
                  {isEditing ? 'Done' : 'Edit'}
                </span>
              </button>

              <div className="fab-divider"></div>

              <button
                onClick={handleDownloadPDF}
                className="fab-button"
                title="Download PDF"
              >
                <Download size={24} />
                <span className="fab-text">Save</span>
              </button>
            </div>
          </div>
        </div>

        <div ref={resumeRef} className="max-w-4xl mx-auto bg-white shadow-2xl">
        {/* Elegant Header */}
        <header className="bg-gradient-to-b from-amber-100 to-white p-10 border-b-4 border-amber-800">
            <EditableText
              tag="h1"
              text={cvData.personalInfo.name}
              isEditing={isEditing}
              className="text-5xl font-serif text-amber-900 mb-3 tracking-wide"
            />
            <EditableText
              tag="p"
              text={cvData.personalInfo.title}
              isEditing={isEditing}
              className="text-2xl text-amber-700 font-light mb-6"
            />
          <div className="flex flex-wrap gap-6 text-amber-800">
            <span className="border-r border-amber-300 pr-6">
                <EditableText tag="span" text={cvData.personalInfo.email} isEditing={isEditing} />
            </span>
            <span className="border-r border-amber-300 pr-6">
                <EditableText tag="span" text={cvData.personalInfo.phone} isEditing={isEditing} />
              </span>
              <span>
                <EditableText 
                  tag="span" 
                  text={`${cvData.personalInfo.address}, ${cvData.personalInfo.city}, ${cvData.personalInfo.country}`} 
                  isEditing={isEditing} 
                />
            </span>
          </div>
        </header>

        <div className="p-10">
          {/* Summary */}
          <section className="mb-8">
            <h2 className="text-3xl font-serif text-amber-900 mb-4 border-b-2 border-amber-200 pb-2">
              Professional Summary
            </h2>
              <EditableText
                tag="p"
                text={cvData.profile}
                isEditing={isEditing}
                className="text-gray-700 leading-relaxed text-lg"
              />
          </section>

          {/* Experience */}
          <section className="mb-8">
            <h2 className="text-3xl font-serif text-amber-900 mb-4 border-b-2 border-amber-200 pb-2">
              Professional Experience
            </h2>
            <div className="space-y-6">
              {cvData.experience.map((exp, idx) => (
                <div key={idx} className="pl-4 border-l-4 border-amber-300">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                        <EditableText
                          tag="h3"
                          text={exp.position}
                          isEditing={isEditing}
                          className="text-2xl font-serif text-amber-900"
                        />
                        <EditableText
                          tag="p"
                          text={exp.company}
                          isEditing={isEditing}
                          className="text-xl text-amber-700 font-light"
                        />
                        <EditableText
                          tag="p"
                          text={exp.location}
                          isEditing={isEditing}
                          className="text-amber-600"
                        />
                      </div>
                      <EditableText
                        tag="span"
                        text={`${exp.startDate} - ${exp.endDate}`}
                        isEditing={isEditing}
                        className="text-amber-700 font-light"
                      />
                  </div>
                  <ul className="list-none text-gray-700 space-y-2 mt-3">
                    {exp.description.map((item, i) => (
                      <li key={i} className="flex items-start">
                        <span className="mr-3 text-amber-600">▸</span>
                          <EditableText tag="span" text={item} isEditing={isEditing} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-8">
            {/* Education */}
            <section>
              <h2 className="text-3xl font-serif text-amber-900 mb-4 border-b-2 border-amber-200 pb-2">
                Education
              </h2>
              {cvData.education.map((edu, idx) => (
                <div key={idx} className="mb-4">
                    <EditableText
                      tag="h3"
                      text={`${edu.degree}, ${edu.institution}`}
                      isEditing={isEditing}
                      className="text-xl font-serif text-amber-900"
                    />
                    <EditableText
                      tag="p"
                      text={edu.location}
                      isEditing={isEditing}
                      className="text-amber-700 font-light"
                    />
                    <EditableText
                      tag="p"
                      text={`${edu.startDate} - ${edu.endDate}`}
                      isEditing={isEditing}
                      className="text-amber-600 text-sm"
                    />
                </div>
              ))}
            </section>

            {/* Skills */}
            <section>
              <h2 className="text-3xl font-serif text-amber-900 mb-4 border-b-2 border-amber-200 pb-2">
                Skills
              </h2>
              <div className="space-y-4">
                {cvData.skills.map((skill, idx) => (
                    <SkillBar key={idx} label={skill.label} level={skill.level} isEditing={isEditing} />
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
