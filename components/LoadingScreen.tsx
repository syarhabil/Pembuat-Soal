import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <div className="relative">
        <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
        <div className="relative bg-white p-4 rounded-full shadow-lg border border-blue-100">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        </div>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-slate-800">Sedang Meracik Soal...</h3>
        <p className="text-slate-500 max-w-md mt-2">
          AI sedang menganalisis topik dan menyusun pertanyaan yang relevan sesuai level kognitif yang diminta.
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;