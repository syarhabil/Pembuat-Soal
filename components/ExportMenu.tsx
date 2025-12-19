import React, { useState } from 'react';
import { GeneratedExam } from '../types';
import { copyToClipboard, generateDOCX, generatePDF, getPDFBlobUrl } from '../utils/exportUtils';
import { FileText, File, Check, ClipboardCopy, Eye } from 'lucide-react';

interface ExportMenuProps {
  exam: GeneratedExam;
}

const ExportMenu: React.FC<ExportMenuProps> = ({ exam }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(exam);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePreview = () => {
    const url = getPDFBlobUrl(exam);
    const newWindow = window.open(url, '_blank');
    
    // Check if popup blocked
    if (!newWindow) {
        alert("Browser memblokir jendela baru. Mohon izinkan pop-up untuk melihat preview PDF.");
    }
  };

  return (
    <>
        <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 mt-6 sticky bottom-6 z-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-slate-500 font-medium hidden md:block">
            Siap digunakan? Ekspor soal sekarang.
        </div>
        
        <div className="flex w-full md:w-auto gap-2 overflow-x-auto pb-1 md:pb-0">
            <button
            onClick={handleCopy}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium text-sm whitespace-nowrap"
            >
            {copied ? <Check size={18} className="text-green-600"/> : <ClipboardCopy size={18}/>}
            <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
            </button>

            <button
            onClick={handlePreview}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors font-medium text-sm border border-purple-200 whitespace-nowrap"
            >
            <Eye size={18} />
            <span>Preview PDF</span>
            </button>

            <button
            onClick={() => generateDOCX(exam)}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors font-medium text-sm border border-blue-200 whitespace-nowrap"
            >
            <FileText size={18} />
            <span>Word</span>
            </button>

            <button
            onClick={() => generatePDF(exam)}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors font-medium text-sm border border-red-200 whitespace-nowrap"
            >
            <File size={18} />
            <span>PDF</span>
            </button>
        </div>
        </div>
    </>
  );
};

export default ExportMenu;