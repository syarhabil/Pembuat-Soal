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
 * Copy to Clipboard Logic
 */
export const copyToClipboard = (exam: GeneratedExam) => {
  let text = `SOAL ${exam.config.subject.toUpperCase()}\n`;
  text += `Topik: ${exam.config.topic} | Kelas: ${exam.config.grade}\n`;
  text += `----------------------------------------\n\n`;

  exam.questions.forEach((q, i) => {
    text += `${i + 1}. ${q.text}\n`;
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

  // Handle Logo for DOCX
  if (exam.config.logoUrl) {
    const cleanBase64 = exam.config.logoUrl.split(',')[1];
    
    // Create a table for Header to align Logo Left and Text Center
    const headerTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
         top: { style: BorderStyle.NONE },
         bottom: { style: BorderStyle.NONE },
         left: { style: BorderStyle.NONE },
         right: { style: BorderStyle.NONE },
         insideVertical: { style: BorderStyle.NONE },
         insideHorizontal: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 15, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: cleanBase64,
                            transformation: { width: 50, height: 50 },
                            type: "png"
                        })
                    ]
                })
              ],
            }),
            new TableCell({
               width: { size: 85, type: WidthType.PERCENTAGE },
               children: [
                new Paragraph({
                    text: exam.config.subject.toUpperCase(),
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                    text: `${exam.config.purpose} - ${exam.config.topic}`,
                    alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                    text: `Kelas: ${exam.config.grade} | Waktu: 60 Menit (Estimasi)`,
                    alignment: AlignmentType.CENTER,
                }),
               ]
            })
          ],
        }),
      ],
    });
    docChildren.push(headerTable);
    docChildren.push(new Paragraph({ text: "", spacing: { after: 200 } })); // Spacer
  } else {
      // Standard Header without Logo
      docChildren.push(
        new Paragraph({
          text: exam.config.subject.toUpperCase(),
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),
        new Paragraph({
          text: `${exam.config.purpose} - ${exam.config.topic}`,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),
        new Paragraph({
          text: `Kelas: ${exam.config.grade} | Waktu: 60 Menit (Estimasi)`,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        })
      );
  }

  // Questions Loop
  exam.questions.forEach((q, i) => {
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
  });

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

  // Handle Logo Logic
  if (exam.config.logoUrl) {
      try {
          doc.addImage(exam.config.logoUrl, 'PNG', margin, 15, 20, 20);
      } catch (e) {
          console.error("Failed to add image to PDF", e);
      }
  }

  // Header Text
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(exam.config.subject.toUpperCase(), pageWidth / 2, y, { align: "center" });
  y += 8;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`${exam.config.purpose} - ${exam.config.topic}`, pageWidth / 2, y, { align: "center" });
  y += 8;
  doc.text(`Kelas: ${exam.config.grade}`, pageWidth / 2, y, { align: "center" });
  y += 15;

  doc.setFontSize(11);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Questions
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
