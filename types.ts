export enum QuestionType {
  MULTIPLE_CHOICE = 'Pilihan Ganda',
  ESSAY = 'Esai',
  TRUE_FALSE = 'Benar / Salah',
  SHORT_ANSWER = 'Isian Singkat'
}

export enum CognitiveLevel {
  LOTS = 'LOTS (Mengingat & Memahami)',
  MOTS = 'MOTS (Menerapkan)',
  HOTS = 'HOTS (Menganalisis, Evaluasi, Mencipta)'
}

export enum EducationLevel {
  SD = 'SD',
  SMP = 'SMP',
  SMA = 'SMA/SMK',
  COLLEGE = 'Perguruan Tinggi',
  GENERAL = 'Umum/Kursus'
}

export enum LearningPurpose {
  DAILY_PRACTICE = 'Latihan Harian',
  DAILY_EXAM = 'Ulangan Harian',
  EVALUATION = 'Soal Evaluasi',
  QUIZ = 'Kuis',
  HOMEWORK = 'Tugas Mandiri'
}

export interface ExamConfig {
  subject: string;
  topic: string;
  grade: string; // Kelas/Semester
  level: EducationLevel;
  purpose: LearningPurpose;
  questionType: QuestionType;
  cognitiveLevel: CognitiveLevel;
  count: number;
  style: 'Formal' | 'Semi-Formal' | 'Santai';
  context: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  cognitiveLevel: CognitiveLevel; // For labeling
  options?: string[]; // For Multiple Choice
  correctAnswer?: string; // For Answer Key
  explanation?: string; // Optional explanation
}

export interface GeneratedExam {
  config: ExamConfig;
  questions: Question[];
  createdAt: Date;
}