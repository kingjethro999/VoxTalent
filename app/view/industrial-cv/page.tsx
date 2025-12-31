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
        className="font-bold text-gray-900 uppercase mb-1"
      />
      <div className="w-full h-3 bg-gray-300 rounded overflow-hidden">
        <div
          className="h-full bg-gray-800 transition-all"
          style={{ width: `${clampedLevel}%` }}
        ></div>
      </div>
    </div>
  );
};

export default function IndustrialCV() {
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

    <div className="min-h-screen bg-gray-200 py-8 px-4">
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

        <div ref={resumeRef} className="max-w-4xl mx-auto bg-white border-4 border-gray-800">
        {/* Industrial Header */}
        <header className="bg-gray-800 text-white p-6 border-b-4 border-gray-600">
            <EditableText
              tag="h1"
              text={cvData.personalInfo.name.toUpperCase()}
              isEditing={isEditing}
              className="text-4xl font-bold uppercase tracking-wider mb-2"
            />
            <EditableText
              tag="p"
              text={cvData.personalInfo.title.toUpperCase()}
              isEditing={isEditing}
              className="text-xl text-gray-300 uppercase tracking-wide mb-4"
            />
          <div className="flex flex-wrap gap-4 text-sm border-t border-gray-600 pt-4">
            <span className="bg-gray-700 px-3 py-1 rounded">
                <EditableText tag="span" text={cvData.personalInfo.email} isEditing={isEditing} />
            </span>
            <span className="bg-gray-700 px-3 py-1 rounded">
                <EditableText tag="span" text={cvData.personalInfo.phone} isEditing={isEditing} />
            </span>
            <span className="bg-gray-700 px-3 py-1 rounded">
                <EditableText 
                  tag="span" 
                  text={`${cvData.personalInfo.address}, ${cvData.personalInfo.city}, ${cvData.personalInfo.country}`} 
                  isEditing={isEditing} 
                />
            </span>
          </div>
        </header>

        <div className="p-6">
          {/* Summary */}
          <section className="mb-6 border-2 border-gray-300 p-4 bg-gray-50">
            <h2 className="text-xl font-bold uppercase text-gray-900 mb-3 border-b-2 border-gray-800 pb-2">
              Professional Summary
            </h2>
              <EditableText
                tag="p"
                text={cvData.profile}
                isEditing={isEditing}
                className="text-gray-700 leading-relaxed"
              />
          </section>

          {/* Experience */}
          <section className="mb-6">
            <h2 className="text-xl font-bold uppercase text-gray-900 mb-4 border-b-2 border-gray-800 pb-2">
              Professional Experience
            </h2>
            <div className="space-y-5">
              {cvData.experience.map((exp, idx) => (
                <div key={idx} className="border-l-4 border-gray-800 pl-4 bg-gray-50 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                        <EditableText
                          tag="h3"
                          text={exp.position.toUpperCase()}
                          isEditing={isEditing}
                          className="text-lg font-bold text-gray-900 uppercase"
                        />
                        <EditableText
                          tag="p"
                          text={exp.company}
                          isEditing={isEditing}
                          className="text-gray-700 font-semibold"
                        />
                        <EditableText
                          tag="p"
                          text={exp.location}
                          isEditing={isEditing}
                          className="text-gray-600 text-sm"
                        />
                    </div>
                    <div className="text-right">
                      <span className="bg-gray-800 text-white px-3 py-1 text-sm font-bold">
                          <EditableText
                            tag="span"
                            text={`${exp.startDate} - ${exp.endDate}`}
                            isEditing={isEditing}
                          />
                      </span>
                    </div>
                  </div>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 mt-2">
                    {exp.description.map((item, i) => (
                        <li key={i}>
                          <EditableText tag="span" text={item} isEditing={isEditing} />
                        </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-6">
            {/* Education */}
            <section className="border-2 border-gray-300 p-4 bg-gray-50">
              <h2 className="text-xl font-bold uppercase text-gray-900 mb-3 border-b-2 border-gray-800 pb-2">
                Education
              </h2>
              {cvData.education.map((edu, idx) => (
                <div key={idx} className="mb-4">
                    <EditableText
                      tag="h3"
                      text={`${edu.degree}, ${edu.institution}`}
                      isEditing={isEditing}
                      className="text-lg font-bold text-gray-900 uppercase"
                    />
                    <EditableText
                      tag="p"
                      text={edu.location}
                      isEditing={isEditing}
                      className="text-gray-700 font-semibold"
                    />
                    <EditableText
                      tag="p"
                      text={`${edu.startDate} - ${edu.endDate}`}
                      isEditing={isEditing}
                      className="text-gray-600 text-sm"
                    />
                </div>
              ))}
            </section>

            {/* Skills */}
            <section className="border-2 border-gray-300 p-4 bg-gray-50">
              <h2 className="text-xl font-bold uppercase text-gray-900 mb-3 border-b-2 border-gray-800 pb-2">
                Skills
              </h2>
              <div className="space-y-3">
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
