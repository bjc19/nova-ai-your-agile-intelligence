import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { analysis, language } = await req.json();

    if (!analysis) {
      return Response.json({ error: 'Analysis data required' }, { status: 400 });
    }

    // Simple text-based PDF generation
    let pdfContent = '%PDF-1.4\n';
    let objectCount = 1;
    const objects = [];

    const addObject = (content) => {
      objects.push({
        num: objectCount++,
        content: content
      });
    };

    // Add catalog object
    addObject('<<\n/Type /Catalog\n/Pages 2 0 R\n>>');

    // Add pages object
    let pageRefs = '';
    const numPages = 1;
    for (let i = 0; i < numPages; i++) {
      pageRefs += `${i + 3} 0 R `;
    }
    addObject(`<<\n/Type /Pages\n/Kids [${pageRefs}]\n/Count ${numPages}\n>>`);

    // Add content stream
    let content = '';
    content += 'BT\n/F1 24 Tf\n50 800 Td\n(Nova - Analysis Report) Tj\n';
    content += '/F1 10 Tf\n50 780 Td\n';
    content += `(${language === 'fr' ? 'Date' : 'Date'}: ${new Date().toLocaleDateString()}) Tj\n`;
    content += '0 -15 Td\n';
    content += `(${language === 'fr' ? 'Analysé par' : 'Analyzed by'}: ${user.full_name}) Tj\n`;
    
    content += '/F1 14 Tf\n0 -30 Td\n';
    content += `(${language === 'fr' ? 'Résumé de la Réunion' : 'Meeting Summary'}) Tj\n`;
    content += '/F1 11 Tf\n0 -15 Td\n';
    const summary = (analysis.summary || '').substring(0, 200);
    content += `(${summary}) Tj\n`;

    if (analysis.blockers && analysis.blockers.length > 0) {
      content += '/F1 14 Tf\n0 -40 Td\n';
      content += `(${language === 'fr' ? 'Blocages' : 'Blockers'} (${analysis.blockers.length})) Tj\n`;
      content += '/F1 10 Tf\n0 -20 Td\n';
      analysis.blockers.slice(0, 3).forEach((b, idx) => {
        content += `(${idx + 1}. ${(b.member || 'Team').substring(0, 30)}) Tj\n0 -12 Td\n`;
      });
    }

    if (analysis.risks && analysis.risks.length > 0) {
      content += '/F1 14 Tf\n0 -30 Td\n';
      content += `(${language === 'fr' ? 'Risques' : 'Risks'} (${analysis.risks.length})) Tj\n`;
      content += '/F1 10 Tf\n0 -20 Td\n';
      analysis.risks.slice(0, 3).forEach((r, idx) => {
        content += `(${idx + 1}. ${(r.description || '').substring(0, 30)}) Tj\n0 -12 Td\n`;
      });
    }

    content += 'ET\n';

    addObject(`<<\n/Length ${content.length}\n>>\nstream\n${content}\nendstream`);

    // Add page object
    addObject(`<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 595 842]\n/Contents 4 0 R\n/Resources <<\n/Font <<\n/F1 <<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\n>>\n>>\n>>`);

    // Build xref
    let xrefOffset = pdfContent.length;
    pdfContent += 'xref\n';
    pdfContent += `0 ${objectCount}\n`;
    pdfContent += '0000000000 65535 f\n';

    let currentOffset = pdfContent.length + (objectCount * 20) + 30;
    for (const obj of objects) {
      pdfContent += `${String(currentOffset).padStart(10, '0')} 00000 n\n`;
      currentOffset += obj.content.length + 50;
    }

    // Add trailer
    pdfContent += `trailer\n<<\n/Size ${objectCount}\n/Root 1 0 R\n>>\n`;
    pdfContent += `startxref\n${xrefOffset}\n%%EOF\n`;

    // Add objects to PDF
    let finalPDF = '%PDF-1.4\n';
    let offset = 9;
    const offsets = [offset];

    for (const obj of objects) {
      const objStr = `${obj.num} 0 obj\n${obj.content}\nendobj\n`;
      finalPDF += objStr;
      offset += objStr.length;
      offsets.push(offset);
    }

    // Simple xref
    const xrefStart = finalPDF.length;
    finalPDF += 'xref\n';
    finalPDF += `0 ${objects.length + 1}\n`;
    finalPDF += '0000000000 65535 f\n';
    for (const off of offsets.slice(0, -1)) {
      finalPDF += `${String(off).padStart(10, '0')} 00000 n\n`;
    }
    finalPDF += `trailer\n<<\n/Size ${objects.length + 1}\n/Root 1 0 R\n>>\n`;
    finalPDF += `startxref\n${xrefStart}\n%%EOF`;

    const pdfBytes = new TextEncoder().encode(finalPDF);

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