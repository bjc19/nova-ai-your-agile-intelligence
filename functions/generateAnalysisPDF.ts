import { jsPDF } from 'npm:jspdf@4.0.0';
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

    // Create PDF
    const doc = new jsPDF();
    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;

    // Helper function for text wrapping
    const addWrappedText = (text, x, y, maxWid, fontSize = 12, isBold = false) => {
      doc.setFontSize(fontSize);
      if (isBold) doc.setFont(undefined, 'bold');
      const lines = doc.splitTextToSize(text, maxWid);
      doc.text(lines, x, y);
      if (isBold) doc.setFont(undefined, 'normal');
      return y + lines.length * (fontSize / 2.5);
    };

    // Helper for new page if needed
    const checkPageBreak = (needed = 15) => {
      if (yPosition + needed > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
    };

    // Title
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text(language === 'fr' ? 'Rapport d\'Analyse' : 'Analysis Report', margin, yPosition);
    yPosition += 15;

    // Date
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const dateStr = new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US');
    doc.text(`${language === 'fr' ? 'Date' : 'Date'}: ${dateStr}`, margin, yPosition);
    yPosition += 8;

    // User info
    doc.text(`${language === 'fr' ? 'Analysé par' : 'Analyzed by'}: ${user.full_name} (${user.email})`, margin, yPosition);
    yPosition += 12;

    // Summary
    if (analysis.summary) {
      checkPageBreak(20);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(language === 'fr' ? 'Résumé' : 'Summary', margin, yPosition);
      yPosition += 8;
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      yPosition = addWrappedText(analysis.summary, margin, yPosition, maxWidth, 11);
      yPosition += 10;
    }

    // Blockers
    if (analysis.blockers && analysis.blockers.length > 0) {
      checkPageBreak(20);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(language === 'fr' ? `Blocages (${analysis.blockers.length})` : `Blockers (${analysis.blockers.length})`, margin, yPosition);
      yPosition += 8;

      analysis.blockers.forEach((blocker, idx) => {
        checkPageBreak(12);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text(`${idx + 1}. ${blocker.member || 'Unknown'}`, margin, yPosition);
        yPosition += 6;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        yPosition = addWrappedText(`${language === 'fr' ? 'Problème' : 'Issue'}: ${blocker.issue}`, margin + 5, yPosition, maxWidth - 5, 10);
        yPosition = addWrappedText(`${language === 'fr' ? 'Action' : 'Action'}: ${blocker.action}`, margin + 5, yPosition, maxWidth - 5, 10);
        yPosition = addWrappedText(`${language === 'fr' ? 'Urgence' : 'Urgency'}: ${blocker.urgency}`, margin + 5, yPosition, maxWidth - 5, 10);
        yPosition += 4;
      });
      yPosition += 5;
    }

    // Risks
    if (analysis.risks && analysis.risks.length > 0) {
      checkPageBreak(20);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(language === 'fr' ? `Risques (${analysis.risks.length})` : `Risks (${analysis.risks.length})`, margin, yPosition);
      yPosition += 8;

      analysis.risks.forEach((risk, idx) => {
        checkPageBreak(12);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text(`${idx + 1}. ${risk.description.substring(0, 50)}...`, margin, yPosition);
        yPosition += 6;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        yPosition = addWrappedText(`${language === 'fr' ? 'Impact' : 'Impact'}: ${risk.impact}`, margin + 5, yPosition, maxWidth - 5, 10);
        yPosition = addWrappedText(`${language === 'fr' ? 'Urgence' : 'Urgency'}: ${risk.urgency}`, margin + 5, yPosition, maxWidth - 5, 10);
        yPosition = addWrappedText(`${language === 'fr' ? 'Atténuation' : 'Mitigation'}: ${risk.mitigation}`, margin + 5, yPosition, maxWidth - 5, 10);
        yPosition += 4;
      });
      yPosition += 5;
    }

    // Recommendations
    if (analysis.recommendations && analysis.recommendations.length > 0) {
      checkPageBreak(20);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(language === 'fr' ? 'Recommandations' : 'Recommendations', margin, yPosition);
      yPosition += 8;

      analysis.recommendations.forEach((rec, idx) => {
        checkPageBreak(8);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const bullet = `${idx + 1}. ${rec}`;
        yPosition = addWrappedText(bullet, margin, yPosition, maxWidth, 10);
        yPosition += 3;
      });
    }

    // Footer
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(language === 'fr' ? 'Généré par Nova AI' : 'Generated by Nova AI', margin, pageHeight - 10);

    // Get PDF as buffer
    const pdfBuffer = doc.output('arraybuffer');

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=Nova-Analysis-${new Date().toISOString().split('T')[0]}.pdf`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});