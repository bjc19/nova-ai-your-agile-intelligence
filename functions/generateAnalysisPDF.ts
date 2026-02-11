import { PDFDocument, PDFPage, rgb } from 'npm:pdf-lib@1.17.1';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { analysis, language, userRole } = await req.json();

    if (!analysis) {
      return Response.json({ error: 'Analysis data required' }, { status: 400 });
    }

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const fontSize = 12;
    const margin = 40;
    let page = pdfDoc.addPage([595, 842]); // A4 size
    let yPosition = 800;
    
    const pageHeight = 842;
    const pageWidth = 595;
    const contentWidth = pageWidth - 2 * margin;

    // Helper: Add text with wrapping
    const addText = (text, size = 12, bold = false, color = [0, 0, 0], maxWidth = contentWidth) => {
      const font = pdfDoc.getFont('Helvetica');
      const lines = [];
      let currentLine = '';
      
      const words = text.split(' ');
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const width = font.widthOfTextAtSize(testLine, size);
        if (width > maxWidth) {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);

      lines.forEach((line) => {
        if (yPosition - size < margin) {
          page = pdfDoc.addPage([595, 842]);
          yPosition = 800;
        }
        page.drawText(line, {
          x: margin,
          y: yPosition,
          size,
          font,
          color: rgb(color[0] / 255, color[1] / 255, color[2] / 255),
        });
        yPosition -= size + 4;
      });

      return yPosition;
    };

    // Helper: Add colored section header
    const addHeader = (title, color = [59, 130, 246]) => {
      if (yPosition - 35 < margin) {
        page = pdfDoc.addPage([595, 842]);
        yPosition = 800;
      }
      
      // Header background
      page.drawRectangle({
        x: margin,
        y: yPosition - 30,
        width: contentWidth,
        height: 30,
        color: rgb(color[0] / 255, color[1] / 255, color[2] / 255),
      });
      
      // Title text
      page.drawText(title, {
        x: margin + 10,
        y: yPosition - 22,
        size: 14,
        font: pdfDoc.getFont('Helvetica'),
        color: rgb(1, 1, 1),
      });
      
      yPosition -= 35;
      return yPosition;
    };

    // HEADER
    page.drawText('Nova - Analysis Report', {
      x: margin,
      y: yPosition,
      size: 24,
      font: pdfDoc.getFont('Helvetica'),
      color: rgb(15/255, 23/255, 42/255),
    });
    yPosition -= 35;

    // Date & User Info
    const dateStr = new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US');
    addText(`${language === 'fr' ? 'Date' : 'Date'}: ${dateStr}`, 10, false, [100, 100, 100]);
    addText(`${language === 'fr' ? 'Analysé par' : 'Analyzed by'}: ${user.full_name}`, 10, false, [100, 100, 100]);
    yPosition -= 10;

    // SUMMARY SECTION
    if (analysis.summary) {
      addHeader(language === 'fr' ? 'Résumé de la Réunion' : 'Meeting Summary', [59, 130, 246]);
      yPosition -= 10;
      addText(analysis.summary, 11, false, [0, 0, 0]);
      yPosition -= 15;
    }

    // BLOCKERS SECTION
    if (analysis.blockers && analysis.blockers.length > 0) {
      addHeader(`${language === 'fr' ? 'Blocages Détectés' : 'Detected Blockers'} (${analysis.blockers.length})`, [37, 99, 235]);
      yPosition -= 10;
      
      analysis.blockers.forEach((blocker, idx) => {
        if (yPosition - 60 < margin) {
          page = pdfDoc.addPage([595, 842]);
          yPosition = 800;
        }
        
        // Blocker box
        page.drawRectangle({
          x: margin,
          y: yPosition - 55,
          width: contentWidth,
          height: 50,
          borderColor: rgb(191/255, 219/255, 254/255),
          borderWidth: 1,
        });
        
        addText(`${idx + 1}. ${blocker.member || language === 'fr' ? 'Équipe' : 'Team'}`, 11, true, [37, 99, 235], contentWidth - 10);
        addText(`${language === 'fr' ? 'Problème' : 'Issue'}: ${blocker.issue}`, 10, false, [50, 50, 50], contentWidth - 20);
        addText(`${language === 'fr' ? 'Action' : 'Action'}: ${blocker.action}`, 10, false, [50, 50, 50], contentWidth - 20);
        yPosition -= 15;
      });
      yPosition -= 10;
    }

    // RISKS SECTION
    if (analysis.risks && analysis.risks.length > 0) {
      addHeader(`${language === 'fr' ? 'Risques Identifiés' : 'Identified Risks'} (${analysis.risks.length})`, [202, 138, 4]);
      yPosition -= 10;
      
      analysis.risks.forEach((risk, idx) => {
        if (yPosition - 60 < margin) {
          page = pdfDoc.addPage([595, 842]);
          yPosition = 800;
        }
        
        // Risk box
        page.drawRectangle({
          x: margin,
          y: yPosition - 55,
          width: contentWidth,
          height: 50,
          borderColor: rgb(254/255, 215/255, 170/255),
          borderWidth: 1,
        });
        
        addText(`${idx + 1}. ${risk.description.substring(0, 60)}`, 11, true, [202, 138, 4], contentWidth - 10);
        addText(`${language === 'fr' ? 'Impact' : 'Impact'}: ${risk.impact}`, 10, false, [50, 50, 50], contentWidth - 20);
        addText(`${language === 'fr' ? 'Atténuation' : 'Mitigation'}: ${risk.mitigation}`, 10, false, [50, 50, 50], contentWidth - 20);
        yPosition -= 15;
      });
      yPosition -= 10;
    }

    // RECOMMENDATIONS
    if (analysis.recommendations && analysis.recommendations.length > 0) {
      addHeader(language === 'fr' ? 'Recommandations' : 'Recommendations', [34, 197, 94]);
      yPosition -= 10;
      
      analysis.recommendations.slice(0, 5).forEach((rec, idx) => {
        if (yPosition - 20 < margin) {
          page = pdfDoc.addPage([595, 842]);
          yPosition = 800;
        }
        addText(`• ${rec}`, 10, false, [0, 0, 0]);
      });
    }

    // FOOTER
    const footerY = 20;
    page.drawText(language === 'fr' ? 'Généré par Nova AI' : 'Generated by Nova AI', {
      x: margin,
      y: footerY,
      size: 8,
      font: pdfDoc.getFont('Helvetica'),
      color: rgb(150/255, 150/255, 150/255),
    });

    // Save and return
    const pdfBuffer = await pdfDoc.save();
    const pdfBytes = Buffer.from(pdfBuffer);

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=Nova-Analysis-${new Date().toISOString().split('T')[0]}.pdf`
      }
    });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});