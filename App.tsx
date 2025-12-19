import React, { useState, useEffect } from 'react';
import { ExamConfig, GeneratedExam, Question } from './types';
import { generateQuestions, generateAdditionalQuestion } from './services/geminiService';
import ConfigForm from './components/ConfigForm';
import LoadingScreen from './components/LoadingScreen';
import QuestionCard from './components/QuestionCard';
import ExportMenu from './components/ExportMenu';
import PromoModal from './components/PromoModal';
import { Plus, ArrowLeft, GraduationCap, Sparkles, Loader2, Heart, MessageCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [isAddingAi, setIsAddingAi] = useState(false);
  const [exam, setExam] = useState<GeneratedExam | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPromo, setShowPromo] = useState(false);

  useEffect(() => {
    // Show promo modal on initial load
    const timer = setTimeout(() => {
      setShowPromo(true);
    }, 1500); // Slight delay for better UX
    return () => clearTimeout(timer);
  }, []);

  const handleGenerate = async (config: ExamConfig) => {
    setLoading(true);
    setError(null);
    try {
      const questions = await generateQuestions(config);
      setExam({
        config,
        questions,
        createdAt: new Date()
      });
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat membuat soal.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuestion = (id: string, updated: Partial<Question>) => {
    if (!exam) return;
    const newQuestions = exam.questions.map(q => q.id === id ? { ...q, ...updated } : q);
    setExam({ ...exam, questions: newQuestions });
  };

  const handleDeleteQuestion = (id: string) => {
    if (!exam) return;
    const newQuestions = exam.questions.filter(q => q.id !== id);
    setExam({ ...exam, questions: newQuestions });
  };

  const handleDuplicateQuestion = (question: Question) => {
    if (!exam) return;
    const newQuestion = { 
        ...question, 
        id: `q-${Date.now()}-dup`, 
        text: `${question.text} (Salinan)` 
    };
    // Insert after the original
    const index = exam.questions.findIndex(q => q.id === question.id);
    const newQuestions = [...exam.questions];
    newQuestions.splice(index + 1, 0, newQuestion);
    setExam({ ...exam, questions: newQuestions });
  };

  const handleAddQuestion = () => {
    if (!exam) return;
    const newQuestion: Question = {
      id: `q-${Date.now()}-new`,
      text: '',
      type: exam.config.questionType,
      cognitiveLevel: exam.config.cognitiveLevel,
      options: exam.config.questionType.includes('Pilihan') ? ['','','',''] : undefined,
    };
    setExam({ ...exam, questions: [...exam.questions, newQuestion] });
  };

  const handleAddQuestionAi = async () => {
    if (!exam) return;
    setIsAddingAi(true);
    setError(null);
    try {
        const newQuestion = await generateAdditionalQuestion(exam.config);
        setExam(prev => prev ? ({
            ...prev,
            questions: [...prev.questions, newQuestion]
        }) : null);
        // Scroll to bottom logic could be added here
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } catch (err: any) {
        setError(err.message || "Gagal membuat soal tambahan dengan AI.");
    } finally {
        setIsAddingAi(false);
    }
  };

  const handleReset = () => {
    if(window.confirm("Yakin ingin kembali? Soal yang belum disimpan akan hilang.")) {
        setExam(null);
        setError(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <PromoModal isOpen={showPromo} onClose={() => setShowPromo(false)} />

      {/* Navbar / Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                    <GraduationCap size={20} />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-800">SOAL<span className="text-blue-600">GEN</span></h1>
            </div>
            {exam && !loading && (
                <button 
                    onClick={handleReset}
                    className="text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
                >
                    <ArrowLeft size={16} className="mr-1"/> Buat Baru
                </button>
            )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-8 flex-grow w-full">
        
        {/* Error State */}
        {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200 flex justify-between items-center">
                <span>{error}</span>
                <button onClick={() => setError(null)} className="font-bold">&times;</button>
            </div>
        )}

        {/* View Switcher */}
        {loading ? (
            <LoadingScreen />
        ) : !exam ? (
            <ConfigForm onGenerate={handleGenerate} isGenerating={loading} />
        ) : (
            <div className="animate-fadeIn pb-12">
                <div className="mb-6 flex items-end justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">{exam.config.purpose}</h2>
                        <p className="text-slate-500">{exam.config.subject} • {exam.config.topic}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                        <span className="text-xs font-semibold bg-slate-200 text-slate-600 px-2 py-1 rounded">
                            {exam.questions.length} Soal
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    {exam.questions.map((q, index) => (
                        <QuestionCard 
                            key={q.id} 
                            question={q} 
                            index={index}
                            onUpdate={handleUpdateQuestion}
                            onDelete={handleDeleteQuestion}
                            onDuplicate={handleDuplicateQuestion}
                        />
                    ))}
                </div>

                {/* Add Buttons Area */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    <button 
                        onClick={handleAddQuestion}
                        className="py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-medium hover:border-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center group"
                    >
                        <Plus className="mr-2 group-hover:scale-110 transition-transform" /> Tambah Soal Manual
                    </button>

                    <button 
                        onClick={handleAddQuestionAi}
                        disabled={isAddingAi}
                        className="py-4 border-2 border-dashed border-blue-200 bg-blue-50 rounded-xl text-blue-600 font-medium hover:border-blue-400 hover:bg-blue-100 transition-all flex items-center justify-center group disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isAddingAi ? (
                            <Loader2 className="mr-2 animate-spin" />
                        ) : (
                            <Sparkles className="mr-2 group-hover:scale-110 transition-transform" />
                        )}
                        {isAddingAi ? "Sedang Membuat..." : "Tambah Soal Otomatis (AI)"}
                    </button>
                </div>

                {/* Fixed/Sticky Export Menu */}
                <ExportMenu exam={exam} />
            </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-sm text-slate-500 gap-4">
          <div className="flex items-center space-x-1">
            <span>Dibuat dengan</span>
            <Heart size={14} className="text-red-500 fill-red-500" />
            <span>oleh <strong>Syarhabil Abdussalam</strong></span>
          </div>
          <div className="flex items-center">
            <a 
              href="https://wa.me/6282299307009" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full hover:bg-green-100 transition-colors border border-green-200"
            >
              <MessageCircle size={16} />
              <span>Mau dibuatkan custom? Hubungi WA 082299307009</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};