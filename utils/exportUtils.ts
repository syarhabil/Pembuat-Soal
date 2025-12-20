import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import saveAs from 'file-saver';
import jsPDF from 'jspdf';
import { GeneratedExam, Question, QuestionType } from '../types';

/**
 * Formats options as a string (A. Option, B. Option...)
 */
const formatOptions = (options: string[] | undefined): string => {
  if (!options || options.length === 0) return '';
  return options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt.replace(/^[A-Ea-e][\.\)]\s+/, '').trim()}`).join('\n');
};

/**
 * Helper to get Base64 from URL (needed for DOCX export of remote images)
 * This might fail due to CORS for remote images found by AI. 
 * Manual uploads (Base64) will pass through fine.
 */
const getBase64FromUrl = async (url: string): Promise<string | null> => {
    if (url.startsWith('data:image')) {
        return url.split(',')[1];
    }
    // Attempt fetch for remote URLs (Best Effort)
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn("Could not fetch remote image for export (CORS/Network):", url);
        return null;
    }
};

/**
 * Copy to Clipboard Logic
 */
export const copyToClipboard = (exam: GeneratedExam) => {
  let text = "";
  if (exam.config.institution) text += `${exam.config.institution.toUpperCase()}\n`;
  text += `SOAL ${exam.config.subject.toUpperCase()}\n`;
  text += `Topik: ${exam.config.topic} | Kelas: ${exam.config.grade}\n`;
  if (exam.config.teacherName) {
      text += `Pengajar: ${exam.config.teacherName}`;
      if (exam.config.teacherId) text += ` (${exam.config.idType}: ${exam.config.teacherId})`;
      text += '\n';
  }
  text += `----------------------------------------\n\n`;

  exam.questions.forEach((q, i) => {
    text += `${i + 1}. ${q.text}\n`;
    if (q.imageUrl) text += `[Gambar tersedia di versi PDF/DOCX]\n`;
    if ((q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.TRUE_FALSE) && q.options) {
      q.options.forEach((opt, idx) => {
        const cleanOpt = opt.replace(/^[A-Ea-e][\.\)]\s+/, '').trim();
        text += `   ${String.fromCharCode(65 + idx)}. ${cleanOpt}\n`;
      });
    }
    text += '\n';
  });

  text += `\nKUNCI JAWABAN\n----------------------------------------\n`;
  exam.questions.forEach((q, i) => {
    text += `${i + 1}. ${q.correctAnswer}\n`;
  });

  navigator.clipboard.writeText(text);
};

/**
 * Generate Word DOCX
 */
export const generateDOCX = async (exam: GeneratedExam) => {
  const docChildren: any[] = [];

  // Header Table Logic
  // Structure: [Logo (15%)] [Text Content (85%)]
  const cleanBase64 = exam.config.logoUrl ? exam.config.logoUrl.split(',')[1] : null;

  const headerRows = [
    new TableRow({
      children: [
        // Logo Cell (Optional)
        ...(cleanBase64 ? [new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          verticalAlign: "center",
          children: [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new ImageRun({
                        data: cleanBase64,
                        transformation: { width: 60, height: 60 },
                        type: "png"
                    })
                ]
            })
          ],
        })] : []),
        
        // Text Content Cell
        new TableCell({
           width: { size: cleanBase64 ? 85 : 100, type: WidthType.PERCENTAGE },
           verticalAlign: "center",
           children: [
            // Institution Name (Bold, Larger)
            ...(exam.config.institution ? [new Paragraph({
                text: exam.config.institution.toUpperCase(),
                heading: HeadingLevel.HEADING_1, // We will customize this style logic conceptually or just use bold/size
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: exam.config.institution.toUpperCase(), bold: true, size: 28 })]
            })] : []),

            // Subject
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: `SOAL UJIAN: ${exam.config.subject.toUpperCase()}`, bold: true, size: 24 })],
                spacing: { before: 50 }
            }),

            // Meta Info 1
            new Paragraph({
                text: `${exam.config.purpose} - ${exam.config.topic}`,
                alignment: AlignmentType.CENTER,
            }),

            // Meta Info 2 (Grade & Teacher)
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({ text: `Kelas: ${exam.config.grade} | Waktu: 60 Menit` }),
                    ...(exam.config.teacherName ? [new TextRun({ text: `\nGuru Pengampu: ${exam.config.teacherName} ${exam.config.teacherId ? `(${exam.config.idType}. ${exam.config.teacherId})` : ''}`, italics: true })] : [])
                ]
            }),
           ]
        })
      ],
    }),
  ];

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
         top: { style: BorderStyle.NONE },
         bottom: { style: BorderStyle.DOUBLE, size: 6, space: 1 }, // Double border for Kop Surat feel
         left: { style: BorderStyle.NONE },
         right: { style: BorderStyle.NONE },
         insideVertical: { style: BorderStyle.NONE },
         insideHorizontal: { style: BorderStyle.NONE },
    },
    rows: headerRows,
  });

  docChildren.push(headerTable);
  docChildren.push(new Paragraph({ text: "", spacing: { after: 300 } })); // Spacer after header

  // Questions Loop
  // We need to loop asynchronously to fetch images
  for (let i = 0; i < exam.questions.length; i++) {
    const q = exam.questions[i];
    
    // Question Text
    docChildren.push(
      new Paragraph({
        children: [
            new TextRun({ text: `${i + 1}. `, bold: true }),
            new TextRun({ text: q.text })
        ],
        spacing: { before: 200, after: 100 }
      })
    );

    // Image for Question
    if (q.imageUrl) {
        const imgData = await getBase64FromUrl(q.imageUrl);
        if (imgData) {
            docChildren.push(
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new ImageRun({
                            data: imgData,
                            transformation: { width: 200, height: 150 }, // Standard size
                            type: "png" // default, docx usually handles jpeg in png type wrapper fine or detects
                        })
                    ],
                    spacing: { after: 100 }
                })
            );
        }
    }

    // Options
    if ((q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.TRUE_FALSE) && q.options) {
      q.options.forEach((opt, idx) => {
        const cleanOpt = opt.replace(/^[A-Ea-e][\.\)]\s+/, '').trim();
        docChildren.push(
          new Paragraph({
            text: `      ${String.fromCharCode(65 + idx)}. ${cleanOpt}`,
            spacing: { after: 50 }
          })
        );
      });
    }
  }

  // Page break for Key
  docChildren.push(new Paragraph({ pageBreakBefore: true }));
  
  docChildren.push(
    new Paragraph({
      text: "KUNCI JAWABAN & PEMBAHASAN",
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  );

  exam.questions.forEach((q, i) => {
    docChildren.push(
        new Paragraph({
            children: [
                new TextRun({ text: `${i + 1}. ${q.correctAnswer}`, bold: true }),
            ]
        })
    );
    if(q.explanation) {
        docChildren.push(
            new Paragraph({
                text: `Pembahasan: ${q.explanation}`,
                spacing: { after: 100 },
                indent: { left: 300 }
            })
        );
    }
  });

  const doc = new Document({
    sections: [{
      properties: {
        page: {
            margin: {
                top: 1440,
                right: 1440,
                bottom: 1440,
                left: 1440,
            },
        },
      },
      children: docChildren,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Soal_${exam.config.subject}_${exam.config.topic}.docx`);
};

/**
 * Internal Logic to Create jsPDF Object
 */
const createPDFDoc = (exam: GeneratedExam): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Margin 20mm
  const margin = 20; 
  const maxLineWidth = pageWidth - (margin * 2);

  let y = 20;

  // Header Logic for PDF
  // Logo
  if (exam.config.logoUrl) {
      try {
          // Keep logo on left
          doc.addImage(exam.config.logoUrl, 'PNG', margin, 15, 20, 20);
      } catch (e) {
          console.error("Failed to add image to PDF", e);
      }
  }

  // Header Text Centered
  const centerX = pageWidth / 2;
  const startTextY = 18;

  // Institution
  if (exam.config.institution) {
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(exam.config.institution.toUpperCase(), centerX, startTextY, { align: "center" });
      y = startTextY + 7;
  } else {
      y = startTextY;
  }

  // Subject
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`SOAL ${exam.config.subject.toUpperCase()}`, centerX, y, { align: "center" });
  y += 6;

  // Purpose & Topic
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`${exam.config.purpose} - ${exam.config.topic}`, centerX, y, { align: "center" });
  y += 5;

  // Grade & Teacher
  let metaText = `Kelas: ${exam.config.grade}`;
  if (exam.config.teacherName) {
      metaText += ` | Pengajar: ${exam.config.teacherName}`;
      if (exam.config.teacherId) metaText += ` (${exam.config.idType}: ${exam.config.teacherId})`;
  }
  doc.text(metaText, centerX, y, { align: "center" });
  y += 8;

  // Separator Line (Double line simulation)
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineWidth(0.2);
  doc.line(margin, y + 1, pageWidth - margin, y + 1);
  
  y += 10;

  // Questions
  doc.setFontSize(11);
  exam.questions.forEach((q, i) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    // Question Text
    const qText = `${i + 1}. ${q.text}`;
    const qLines = doc.splitTextToSize(qText, maxLineWidth);
    doc.text(qLines, margin, y);
    y += (qLines.length * 6);

    // Question Image
    if (q.imageUrl) {
        // Image Dimensions
        const imgH = 40;
        const imgW = 50; 
        
        if (y + imgH > 270) {
            doc.addPage();
            y = 20;
        }

        try {
            // NOTE: Remote images (http) might fail due to CORS in jsPDF directly.
            // Best effort. Manual uploads (data:image) work fine.
            doc.addImage(q.imageUrl, 'PNG', margin, y, imgW, imgH);
            y += imgH + 5;
        } catch (e) {
            console.warn("Skipping PDF image due to error (likely CORS):", q.imageUrl);
        }
    }

    // Options
    if ((q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.TRUE_FALSE) && q.options) {
      q.options.forEach((opt, idx) => {
         if (y > 275) { doc.addPage(); y = 20; }
         const cleanOpt = opt.replace(/^[A-Ea-e][\.\)]\s+/, '').trim();
         const optText = `   ${String.fromCharCode(65 + idx)}. ${cleanOpt}`;
         const optLines = doc.splitTextToSize(optText, maxLineWidth);
         doc.text(optLines, margin, y);
         y += (optLines.length * 6);
      });
    }
    y += 5; // Spacing between questions
  });

  // Key Page
  doc.addPage();
  y = 20;
  doc.setFont("helvetica", "bold");
  doc.text("KUNCI JAWABAN", pageWidth / 2, y, { align: "center" });
  y += 15;
  
  doc.setFont("helvetica", "normal");
  exam.questions.forEach((q, i) => {
     if (y > 270) { doc.addPage(); y = 20; }
     doc.text(`${i + 1}. ${q.correctAnswer}`, margin, y);
     y += 7;
  });

  return doc;
};

/**
 * Generate PDF Download
 */
export const generatePDF = (exam: GeneratedExam) => {
  const doc = createPDFDoc(exam);
  doc.save(`Soal_${exam.config.subject}_${exam.config.topic}.pdf`);
};

/**
 * Get PDF Blob URL for Preview
 */
export const getPDFBlobUrl = (exam: GeneratedExam): string => {
    const doc = createPDFDoc(exam);
    // Cast to string to satisfy type requirement (jsPDF types return URL, actual runtime returns string or compatible URL object)
    return String(doc.output('bloburl'));
};
