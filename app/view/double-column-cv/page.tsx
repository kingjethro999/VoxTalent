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
        transition: 'background-color 0.2s',
        ...(isEditing && {
          borderBottom: '1px dashed #60a5fa',
          backgroundColor: 'rgba(239, 246, 255, 0.3)'
        }),
        ...style
      }}
    >
      {text}
    </Tag>
  );
};

export default function DoubleColumnCV() {
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

    <div className="min-h-screen bg-white py-8 px-4">
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

        <div ref={resumeRef} className="max-w-5xl mx-auto bg-white shadow-lg">
        {/* Header */}
        <header className="bg-gray-900 text-white p-6 mb-6">
            <EditableText
              tag="h1"
              text={cvData.personalInfo.name}
              isEditing={isEditing}
              className="text-4xl font-bold mb-2"
            />
            <EditableText
              tag="p"
              text={cvData.personalInfo.title}
              isEditing={isEditing}
              className="text-xl text-gray-300"
            />
        </header>

        <div className="grid grid-cols-3 gap-6 p-6">
          {/* Left Column - Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Summary */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-2">
                Professional Summary
              </h2>
                <EditableText
                  tag="p"
                  text={cvData.profile}
                  isEditing={isEditing}
                  className="text-gray-700 leading-relaxed text-sm"
                />
            </section>

            {/* Experience */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-2">
                Professional Experience
              </h2>
              <div className="space-y-5">
                {cvData.experience.map((exp, idx) => (
                    <div key={idx} className="job-item">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                          <EditableText
                            tag="h3"
                            text={exp.position}
                            isEditing={isEditing}
                            className="text-lg font-semibold text-gray-900"
                          />
                          <EditableText
                            tag="p"
                            text={exp.company}
                            isEditing={isEditing}
                            className="text-gray-700 font-medium"
                          />
                      </div>
                      <div className="text-right text-sm text-gray-600">
                          <EditableText
                            tag="p"
                            text={`${exp.startDate} - ${exp.endDate}`}
                            isEditing={isEditing}
                          />
                          <EditableText
                            tag="p"
                            text={exp.location}
                            isEditing={isEditing}
                          />
                      </div>
                    </div>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm ml-2">
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
          </div>

          {/* Right Column - Sidebar */}
          <div className="col-span-1 space-y-6">
            {/* Contact Info */}
            <section className="bg-gray-50 p-4 rounded">
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                Contact
              </h2>
              <div className="space-y-2 text-sm text-gray-700">
                  <EditableText tag="p" text={cvData.personalInfo.email} isEditing={isEditing} />
                  <EditableText tag="p" text={cvData.personalInfo.phone} isEditing={isEditing} />
                  <EditableText tag="p" text={`${cvData.personalInfo.city}, ${cvData.personalInfo.country}`} isEditing={isEditing} />
              </div>
            </section>

            {/* Education */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-2">
                Education
              </h2>
              {cvData.education.map((edu, idx) => (
                <div key={idx} className="mb-4">
                    <EditableText
                      tag="h3"
                      text={`${edu.degree}, ${edu.institution}`}
                      isEditing={isEditing}
                      className="font-semibold text-gray-900 text-sm"
                    />
                    <EditableText
                      tag="p"
                      text={edu.location}
                      isEditing={isEditing}
                      className="text-gray-700 text-sm"
                    />
                    <EditableText
                      tag="p"
                      text={`${edu.startDate} - ${edu.endDate}`}
                      isEditing={isEditing}
                      className="text-gray-600 text-xs"
                    />
                </div>
              ))}
            </section>

            {/* Skills */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-2">
                Skills
              </h2>
              <div className="space-y-3">
                {cvData.skills.map((skill, idx) => (
                  <div key={idx}>
                      <EditableText
                        tag="h3"
                        text={skill.label}
                        isEditing={isEditing}
                        className="font-semibold text-gray-900 text-sm mb-1"
                      />
                    <p className="text-gray-700 text-xs">
                        Level: {skill.level}%
                      </p>
                    </div>
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
