import { GoogleGenAI, Type, Schema, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { ExamConfig, Question, QuestionType, CognitiveLevel } from "../types";

// Using process.env.API_KEY as strictly required by guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to sanitize response text (remove Markdown code blocks)
const cleanJsonText = (text: string): string => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

// Helper to clean option text (remove "A. ", "a) ", etc if AI adds them)
const cleanOptionText = (opt: string): string => {
  return opt.replace(/^[A-Ea-e][\.\)]\s+/, '').trim();
};

export const generateQuestions = async (config: ExamConfig): Promise<Question[]> => {
  const modelName = 'gemini-3-flash-preview'; // Fast and capable for structured generation

  const prompt = `
    Bertindaklah sebagai pembuat soal ujian profesional untuk tingkat ${config.level}.
    Buatlah ${config.count} soal bertipe "${config.questionType}" untuk mata pelajaran "${config.subject}".
    
    Topik Spesifik: ${config.topic}
    Kelas/Semester: ${config.grade}
    Tujuan: ${config.purpose}
    Level Kognitif Target: ${config.cognitiveLevel}
    Gaya Bahasa: ${config.style}
    Konteks Tambahan: ${config.context || "Tidak ada"}

    Instruksi Khusus:
    1. Soal harus edukatif, tidak ambigu, dan sesuai dengan kurikulum di Indonesia.
    2. Jika tipe soal Pilihan Ganda, berikan 4 atau 5 opsi (A,B,C,D,E).
    3. Jika tipe Benar/Salah, berikan opsi "Benar" dan "Salah".
    4. Labeli setiap soal dengan level kognitif spesifik (Mengingat, Memahami, Menerapkan, Menganalisis, Mengevaluasi, atau Mencipta) yang sesuai dengan kategori ${config.cognitiveLevel}.
    5. Sertakan kunci jawaban dan penjelasan singkat.
  `;

  const questionSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      text: { type: Type.STRING, description: "Teks pertanyaan lengkap" },
      options: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING }, 
        description: "Pilihan jawaban (kosongkan jika esai/isian)" 
      },
      correctAnswer: { type: Type.STRING, description: "Kunci jawaban yang benar" },
      specificCognitiveTag: { type: Type.STRING, description: "Tag spesifik misal: C1 Mengingat, C4 Menganalisis" },
      explanation: { type: Type.STRING, description: "Penjelasan singkat jawaban" }
    },
    required: ["text", "specificCognitiveTag", "correctAnswer"]
  };

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: questionSchema
  };

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7, // Balance creativity with adherence to structure
        // Disable safety settings to prevent false positives on academic content
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
      }
    });

    const text = response.text;
    if (!text) {
        throw new Error("Respon dari server AI kosong (Empty Response).");
    }

    const cleanedText = cleanJsonText(text);
    let rawData;
    
    try {
        rawData = JSON.parse(cleanedText);
    } catch (parseError) {
        console.error("JSON Parse Error:", parseError, "Text:", cleanedText);
        throw new Error("Gagal membaca format data dari AI. Silakan coba lagi.");
    }

    // Map raw data to internal Question interface
    return rawData.map((item: any, index: number) => ({
      id: `q-${Date.now()}-${index}`,
      text: item.text,
      type: config.questionType,
      cognitiveLevel: config.cognitiveLevel, // Use the broad category requested
      options: (item.options || []).map((opt: string) => cleanOptionText(opt)),
      correctAnswer: item.correctAnswer,
      explanation: item.explanation
    }));

  } catch (error: any) {
    console.error("Gemini API Error Details:", error);
    
    let errorMessage = "Gagal membuat soal.";
    const errString = error.toString().toLowerCase();

    if (errString.includes("429")) {
        errorMessage = "Terlalu banyak permintaan (Quota Exceeded). Mohon tunggu 1 menit sebelum mencoba lagi.";
    } else if (errString.includes("500") || errString.includes("503") || errString.includes("overloaded")) {
        errorMessage = "Server AI sedang sibuk. Silakan coba lagi dalam beberapa saat.";
    } else if (errString.includes("safety") || errString.includes("blocked")) {
        errorMessage = "Topik soal terdeteksi sensitif oleh sistem keamanan AI. Coba ubah kata kunci topik.";
    } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
    }

    throw new Error(errorMessage);
  }
};

export const generateAdditionalQuestion = async (config: ExamConfig): Promise<Question> => {
  // Use the same logic but strictly for 1 question
  try {
    const singleConfig = { ...config, count: 1 };
    const questions = await generateQuestions(singleConfig);
    
    if (!questions || questions.length === 0) {
      throw new Error("Tidak ada soal yang dihasilkan.");
    }
    
    return {
        ...questions[0],
        id: `q-ai-${Date.now()}` // Ensure unique ID for added question
    };
  } catch (error: any) {
    throw new Error(error.message || "Gagal membuat soal tambahan.");
  }
};

/**
 * Finds a relevant image URL for a question using Google Search Grounding.
 */
export const findImageForQuestion = async (questionText: string, subject: string): Promise<string | null> => {
    try {
        const prompt = `Carikan satu URL gambar publik (format .jpg atau .png) yang sangat relevan untuk mengilustrasikan soal ujian berikut:
        
        Mata Pelajaran: ${subject}
        Pertanyaan: "${questionText}"
        
        Instruksi:
        1. Gunakan Google Search untuk mencari gambar edukatif yang jelas.
        2. Prioritaskan gambar dari sumber edukasi, Wikimedia, atau domain publik.
        3. Kembalikan HANYA URL gambar tersebut. Jangan ada teks lain.
        4. Jika tidak menemukan URL gambar langsung, kembalikan teks "null".`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                temperature: 0.1
            }
        });

        const result = response.text?.trim();
        
        // Simple validation to check if it looks like a URL
        if (result && result.startsWith('http') && result.length < 500) {
            return result;
        }

        // Fallback: Check grounding chunks if the text response wasn't a clean URL
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (groundingChunks) {
             // Try to find a web URI that looks like an image from sources
             // Note: Google Search tool mainly returns web pages, not direct image hotlinks usually, 
             // but sometimes the model can extract one.
             // This is a best-effort attempt.
             for (const chunk of groundingChunks) {
                if (chunk.web?.uri && (chunk.web.uri.endsWith('.jpg') || chunk.web.uri.endsWith('.png'))) {
                    return chunk.web.uri;
                }
             }
        }
        
        return null;
    } catch (error) {
        console.error("Error finding image:", error);
        return null;
    }
}