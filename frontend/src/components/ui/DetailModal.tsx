import React from 'react';
import Modal from './Modal';

interface DetailItem {
  label: string;
  value: string | number | React.ReactNode;
}

interface DetailSection {
  title?: string;
  items: DetailItem[];
  bgColor?: 'orange' | 'slate' | 'blue' | 'purple';
}

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sections: DetailSection[];
  actions?: React.ReactNode;
}

export default function DetailModal({ 
  isOpen, 
  onClose, 
  title, 
  sections,
  actions
}: DetailModalProps) {
  const getBgClass = (color?: 'orange' | 'slate' | 'blue' | 'purple') => {
    switch(color) {
      case 'orange': return 'bg-orange-50 border-orange-200';
      case 'blue': return 'bg-blue-50 border-blue-200';
      case 'purple': return 'bg-purple-50 border-purple-200';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        {sections.map((section, index) => (
          <div key={index} className={`p-4 border ${getBgClass(section.bgColor)}`}>
            {section.title && (
              <h3 className="font-bold text-slate-800 mb-3">{section.title}</h3>
            )}
            <div className="space-y-2 text-sm">
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex}>
                  <span className="text-slate-600">{item.label}:</span>{' '}
                  <span className="font-semibold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-end gap-2 mt-4">
          {actions ? (
            actions
          ) : (
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium text-slate-700"
            >
              Đóng
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
