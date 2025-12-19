import React, { useState } from 'react';
import { ExamConfig, EducationLevel, LearningPurpose, CognitiveLevel, QuestionType } from '../types';
import { BookOpen, Target, BrainCircuit, PenTool, Layout, Sparkles } from 'lucide-react';

interface ConfigFormProps {
  onGenerate: (config: ExamConfig) => void;
  isGenerating: boolean;
}

const ConfigForm: React.FC<ConfigFormProps> = ({ onGenerate, isGenerating }) => {
  const [config, setConfig] = useState<ExamConfig>({
    subject: '',
    topic: '',
    grade: '',
    level: EducationLevel.SMA,
    purpose: LearningPurpose.DAILY_EXAM,
    questionType: QuestionType.MULTIPLE_CHOICE,
    cognitiveLevel: CognitiveLevel.MOTS,
    count: 5,
    style: 'Formal',
    context: ''
  });

  const handleChange = (field: keyof ExamConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const isValid = config.subject && config.topic && config.grade;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center">
          <Sparkles className="w-6 h-6 text-yellow-500 mr-2" />
          Konfigurasi Soal
        </h2>
        <p className="text-slate-500 mt-1">Isi detail di bawah untuk menghasilkan soal yang presisi.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Section 1: Basic Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
            <BookOpen className="w-4 h-4 mr-2" /> Informasi Dasar
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mata Pelajaran / Kuliah</label>
            <input 
              type="text" 
              placeholder="Contoh: Matematika, Biologi, Pengantar Manajemen"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={config.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Materi / Topik Spesifik</label>
            <input 
              type="text" 
              placeholder="Contoh: Hukum Newton, Aljabar Linear"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={config.topic}
              onChange={(e) => handleChange('topic', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jenjang</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={config.level}
                  onChange={(e) => handleChange('level', e.target.value)}
                >
                  {Object.values(EducationLevel).map(v => <option key={v} value={v}>{v}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kelas/Semester</label>
                <input 
                  type="text" 
                  placeholder="Misal: X Genap"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={config.grade}
                  onChange={(e) => handleChange('grade', e.target.value)}
                />
            </div>
          </div>
        </div>

        {/* Section 2: Exam Specs */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
            <Target className="w-4 h-4 mr-2" /> Spesifikasi Soal
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tujuan</label>
              <select 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={config.purpose}
                onChange={(e) => handleChange('purpose', e.target.value)}
              >
                {Object.values(LearningPurpose).map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bentuk Soal</label>
              <select 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={config.questionType}
                onChange={(e) => handleChange('questionType', e.target.value)}
              >
                {Object.values(QuestionType).map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Level Kognitif</label>
             <div className="grid grid-cols-1 gap-2">
                {Object.values(CognitiveLevel).map((level) => (
                    <label key={level} className={`
                        flex items-center px-3 py-2 rounded-lg border cursor-pointer transition-all
                        ${config.cognitiveLevel === level 
                            ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' 
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'}
                    `}>
                        <input 
                            type="radio" 
                            name="cognitiveLevel" 
                            className="mr-3 text-blue-600 focus:ring-blue-500"
                            checked={config.cognitiveLevel === level}
                            onChange={() => handleChange('cognitiveLevel', level)}
                        />
                        <span className="text-sm font-medium">
                            {level}
                        </span>
                    </label>
                ))}
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah Soal</label>
                <input 
                  type="number" 
                  min="1" 
                  max="20"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={config.count}
                  onChange={(e) => handleChange('count', parseInt(e.target.value))}
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gaya Bahasa</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={config.style}
                  onChange={(e) => handleChange('style', e.target.value)}
                >
                  <option value="Formal">Formal</option>
                  <option value="Semi-Formal">Semi-Formal</option>
                  <option value="Santai">Santai/Interaktif</option>
                </select>
             </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-100">
        <label className="block text-sm font-medium text-slate-700 mb-1">Konteks Tambahan (Opsional)</label>
        <textarea 
            placeholder="Contoh: Kaitkan soal dengan fenomena alam terkini, atau gunakan nama tokoh fiksi populer."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            rows={2}
            value={config.context}
            onChange={(e) => handleChange('context', e.target.value)}
        />
      </div>

      <div className="mt-8 flex justify-end">
        <button
            onClick={() => onGenerate(config)}
            disabled={!isValid || isGenerating}
            className={`
                px-8 py-3 rounded-lg font-semibold text-white shadow-lg flex items-center
                ${!isValid || isGenerating 
                    ? 'bg-slate-300 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all'}
            `}
        >
            {isGenerating ? 'Memproses...' : 'Buat Soal Sekarang'}
            {!isGenerating && <PenTool className="ml-2 w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};

export default ConfigForm;