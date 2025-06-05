import React, { useState } from 'react';

interface InfoSection {
  title: string;
  content: string;
  isExpanded?: boolean;
}

interface InfoCardProps {
  title: string;
  description?: string;
  imageUrl?: string;
  sections?: InfoSection[];
  className?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ 
  title, 
  sections = [],
  className = ""
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    sections.reduce((acc, section, index) => {
      acc[index.toString()] = section.isExpanded ?? false;
      return acc;
    }, {} as Record<string, boolean>)
  );

  const toggleSection = (index: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 mx-auto w-full max-w-2xl ${className}`}>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      </div>
      
      {sections.length > 0 && (
        <div className="space-y-3 mt-4">
          {sections.map((section, index) => (
            <div 
              key={index}
              className="border rounded-md overflow-hidden"
            >
              <button 
                onClick={() => toggleSection(index.toString())}
                className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 flex justify-between items-center"
              >
                <span className="font-medium text-gray-800">{section.title}</span>
                <span className="text-gray-500">
                  {expandedSections[index.toString()] ? '▼' : '▶'}
                </span>
              </button>
              
              {expandedSections[index.toString()] && (
                <div className="p-4 bg-white">
                  <p className="text-gray-700">{section.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InfoCard;
