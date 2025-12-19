import React, { useEffect, useState } from 'react';
import { X, MessageCircle } from 'lucide-react';

interface PromoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PromoModal: React.FC<PromoModalProps> = ({ isOpen, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Small delay for smooth entry animation
      setTimeout(() => setIsVisible(true), 100);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-sm relative overflow-hidden transform transition-all duration-300 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-8 text-center">
          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 border border-green-100 shadow-sm ring-4 ring-green-50/50">
            <MessageCircle size={28} />
          </div>

          <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight">
            Mau dibuatkan custom?
          </h3>

          <p className="text-slate-500 mb-6 text-sm">
            Butuh aplikasi seperti ini dengan fitur khusus? Silakan konsultasi langsung.
          </p>

          <a
            href="https://wa.me/6282299307009"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full px-4 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold rounded-xl shadow-lg shadow-green-200 transition-all hover:scale-[1.02] active:scale-[0.98] mb-3"
          >
            <MessageCircle className="mr-2" size={18} />
            Hubungi WA 082299307009
          </a>

          <button
            onClick={onClose}
            className="text-xs font-medium text-slate-400 hover:text-slate-600 py-2 px-4 rounded transition-colors"
          >
            Nanti saja, terima kasih
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromoModal;