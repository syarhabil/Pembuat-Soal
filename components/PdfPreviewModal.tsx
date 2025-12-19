import React from 'react';
import { X, Download } from 'lucide-react';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  onDownload: () => void;
}

const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ isOpen, onClose, pdfUrl, onDownload }) => {
  if (!isOpen || !pdfUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">Preview Dokumen PDF</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={onDownload}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Download size={16} className="mr-2" />
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-slate-200 p-0 md:p-4 overflow-hidden">
            <iframe 
                src={pdfUrl} 
                className="w-full h-full rounded-none md:rounded-lg border border-slate-300 bg-white shadow-sm"
                title="PDF Preview"
            />
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;