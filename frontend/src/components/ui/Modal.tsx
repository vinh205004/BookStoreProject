import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      {/* THAY ĐỔI 1: Khóa chiều cao tối đa max-h-[90vh] và dùng flex-col */}
      <div className="bg-white shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col transform transition-all">
        
        {/* Header (Cố định không cuộn) */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 shrink-0">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        {/* THAY ĐỔI 2: Thêm overflow-y-auto cho phần Body để cuộn nội dung */}
        <div className="p-5 overflow-y-auto custom-scrollbar">
          {children}
        </div>

      </div>
    </div>
  );
}