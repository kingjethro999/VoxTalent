'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CVData, cvData as defaultCvData } from '@/lib/data';

// Import template components directly
import BalancedCV from '@/app/view/balanced-cv/page';
import CleanCV from '@/app/view/clean-cv/page';
import CV1 from '@/app/view/cv1/page';
import DoubleColumnCV from '@/app/view/double-column-cv/page';
import ElegantCV from '@/app/view/elegant-cv/page';
import IndustrialCV from '@/app/view/industrial-cv/page';
import MinimalistCV from '@/app/view/minimalist-cv/page';

const templateComponents: Record<string, React.ComponentType<{ cvData?: CVData }>> = {
  'balanced-cv': BalancedCV,
  'clean-cv': CleanCV,
  'cv1': CV1,
  'double-column-cv': DoubleColumnCV,
  'elegant-cv': ElegantCV,
  'industrial-cv': IndustrialCV,
  'minimalist-cv': MinimalistCV,
};

export default function ViewCV() {
  const params = useParams();
  const template = params.template as string;
  // Initialize state from localStorage using function initializer
  const [cvData] = useState<CVData>(() => {
    if (typeof window === 'undefined') return defaultCvData;
    const savedData = localStorage.getItem('voxTalent_cvData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        return { ...defaultCvData, ...data };
      } catch (e) {
        console.error('Error loading CV data:', e);
        return defaultCvData;
      }
    }
    return defaultCvData;
  });
  const [loading] = useState(false);

  // Store CV data on window for templates to access (must be in useEffect)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as typeof window & { __voxTalent_cvData?: CVData }).__voxTalent_cvData = cvData;
    }
  }, [cvData]);

  if (loading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0c',
        color: 'white'
      }}>
        Loading your CV...
      </div>
    );
  }

  // Get the template component
  const TemplateComponent = templateComponents[template];

  if (!TemplateComponent) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0c',
        color: 'white'
      }}>
        Template not found. <a href="/cv-select" style={{ color: '#8E75FF' }}>Go back</a>
      </div>
    );
  }

  // Render the template - it will use the updated data
  return <TemplateComponent />;
}

