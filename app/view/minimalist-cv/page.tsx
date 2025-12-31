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

export default function MinimalistCV() {
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
          avoid: ['li', 'h3', 'h2', '.job-item', '.section-title']
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

      <div className="min-h-screen bg-white py-16 px-4">
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

        <div ref={resumeRef} className="max-w-2xl mx-auto">
          {/* Minimalist Header */}
          <header className="mb-12 text-center">
            <EditableText
              tag="h1"
              text={cvData.personalInfo.name.toUpperCase()}
              isEditing={isEditing}
              className="text-4xl font-light text-gray-900 mb-3 tracking-widest"
            />
            <div className="w-16 h-px bg-gray-400 mx-auto mb-4"></div>
            <EditableText
              tag="p"
              text={cvData.personalInfo.title}
              isEditing={isEditing}
              className="text-sm text-gray-500 mb-6"
            />
            <div className="flex justify-center gap-6 text-xs text-gray-400">
              <span>
                <EditableText tag="span" text={cvData.personalInfo.email} isEditing={isEditing} />
              </span>
              <span>•</span>
              <span>
                <EditableText tag="span" text={cvData.personalInfo.phone} isEditing={isEditing} />
              </span>
              <span>•</span>
              <span>
                <EditableText 
                  tag="span" 
                  text={`${cvData.personalInfo.city}, ${cvData.personalInfo.country}`} 
                  isEditing={isEditing} 
                />
              </span>
            </div>
          </header>

          {/* Summary */}
          <section className="mb-12">
            <EditableText
              tag="p"
              text={cvData.profile}
              isEditing={isEditing}
              className="text-gray-600 leading-relaxed text-center"
            />
          </section>

          {/* Experience */}
          <section className="mb-12">
            <h2 className="text-xs font-light text-gray-400 uppercase tracking-widest mb-8 text-center">
              Experience
            </h2>
            <div className="space-y-10">
              {cvData.experience.map((exp, idx) => (
                <div key={idx} className="text-center">
                  <div className="mb-3">
                    <EditableText
                      tag="h3"
                      text={exp.position}
                      isEditing={isEditing}
                      className="text-lg font-light text-gray-900 mb-1"
                    />
                    <EditableText
                      tag="p"
                      text={exp.company}
                      isEditing={isEditing}
                      className="text-sm text-gray-500"
                    />
                    <EditableText
                      tag="p"
                      text={`${exp.startDate} - ${exp.endDate}`}
                      isEditing={isEditing}
                      className="text-xs text-gray-400 mt-1"
                    />
                  </div>
                  <ul className="list-none text-gray-600 space-y-2 text-sm max-w-md mx-auto">
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

          {/* Education */}
          <section className="mb-12 text-center">
            <h2 className="text-xs font-light text-gray-400 uppercase tracking-widest mb-8">
              Education
            </h2>
            {cvData.education.map((edu, idx) => (
              <div key={idx} className="mb-4">
                <EditableText
                  tag="h3"
                  text={`${edu.degree}, ${edu.institution}`}
                  isEditing={isEditing}
                  className="text-lg font-light text-gray-900"
                />
                <EditableText
                  tag="p"
                  text={edu.location}
                  isEditing={isEditing}
                  className="text-sm text-gray-500"
                />
                <EditableText
                  tag="p"
                  text={`${edu.startDate} - ${edu.endDate}`}
                  isEditing={isEditing}
                  className="text-xs text-gray-400"
                />
              </div>
            ))}
          </section>

          {/* Skills */}
          <section className="text-center">
            <h2 className="text-xs font-light text-gray-400 uppercase tracking-widest mb-8">
              Skills
            </h2>
            <div className="space-y-4">
              {cvData.skills.map((skill, idx) => (
                <div key={idx}>
                  <EditableText
                    tag="p"
                    text={skill.label}
                    isEditing={isEditing}
                    className="text-sm text-gray-500 mb-1"
                  />
                  <div className="w-32 h-1 bg-gray-300 mx-auto">
                    <div
                      className="h-full bg-gray-600 transition-all"
                      style={{ width: `${Math.max(0, Math.min(100, skill.level))}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
