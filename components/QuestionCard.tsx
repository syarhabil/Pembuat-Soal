import React, { useState } from 'react';
import { Question, QuestionType } from '../types';
import { Trash2, Copy, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  index: number;
  onUpdate: (id: string, updated: Partial<Question>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (question: Question) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, index, onUpdate, onDelete, onDuplicate }) => {
  const [showDetails, setShowDetails] = useState(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(question.id, { text: e.target.value });
  };

  const handleOptionChange = (optIndex: number, val: string) => {
    if (!question.options) return;
    const newOptions = [...question.options];
    newOptions[optIndex] = val;
    onUpdate(question.id, { options: newOptions });
  };

  const handleCorrectAnswerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onUpdate(question.id, { correctAnswer: e.target.value });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 mb-4 overflow-hidden group">
      {/* Header Bar */}
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="flex items-center justify-center w-6 h-6 bg-slate-200 rounded text-xs font-bold text-slate-600">
            {index + 1}
          </span>
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">
            {question.cognitiveLevel.split(' ')[0]}
          </span>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
             {question.type}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => onDuplicate(question)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Duplikat"
          >
            <Copy size={16} />
          </button>
          <button 
            onClick={() => onDelete(question.id)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Hapus"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="p-4 space-y-4">
        <div className="relative">
            <textarea
            className="w-full p-3 text-slate-900 text-lg border-none focus:ring-0 resize-none bg-transparent placeholder-slate-300"
            rows={2}
            value={question.text}
            onChange={handleTextChange}
            placeholder="Tulis pertanyaan di sini..."
            />
        </div>

        {/* Options for MC / True False */}
        {(question.type === QuestionType.MULTIPLE_CHOICE || question.type === QuestionType.TRUE_FALSE) && question.options && (
          <div className="space-y-2 pl-4 border-l-2 border-slate-100">
            {question.options.map((opt, i) => (
              <div key={i} className="flex items-center space-x-3">
                <span className="text-sm font-semibold text-slate-400 w-4 text-center">
                  {String.fromCharCode(65 + i)}.
                </span>
                <input
                  type="text"
                  className="flex-1 bg-slate-50 text-slate-900 border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400 transition-colors"
                  value={opt}
                  onChange={(e) => handleOptionChange(i, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Footer / Answer Key Toggle */}
        <div className="pt-2">
            <button 
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center text-xs text-slate-500 hover:text-blue-600 font-medium transition-colors"
            >
                {showDetails ? <ChevronUp size={14} className="mr-1"/> : <ChevronDown size={14} className="mr-1"/>}
                {showDetails ? "Sembunyikan Kunci & Pembahasan" : "Lihat Kunci & Pembahasan"}
            </button>

            {showDetails && (
                <div className="mt-3 bg-green-50 rounded-md p-3 border border-green-100 text-sm space-y-2 animate-fadeIn">
                    <div>
                        <span className="font-semibold text-green-800 block mb-1">Kunci Jawaban:</span>
                        <input 
                            type="text" 
                            className="w-full bg-white text-slate-900 border border-green-200 rounded px-2 py-1 focus:outline-none focus:border-green-400"
                            value={question.correctAnswer || ''}
                            onChange={handleCorrectAnswerChange}
                        />
                    </div>
                    {question.explanation && (
                        <div>
                            <span className="font-semibold text-green-800 block mb-1">Pembahasan:</span>
                            <textarea
                                className="w-full bg-white text-slate-900 border border-green-200 rounded px-2 py-1 focus:outline-none focus:border-green-400 text-sm"
                                rows={2}
                                value={question.explanation}
                                onChange={(e) => onUpdate(question.id, { explanation: e.target.value })}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;