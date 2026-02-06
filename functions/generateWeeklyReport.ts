import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import jsPDF from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculer la semaine précédente
    const today = new Date();
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() - weekEnd.getDay()); // Dimanche précédent
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6); // Lundi

    // Récupérer les analyses de la semaine
    const analyses = await base44.entities.AnalysisHistory.filter({
      created_by: user.email
    });

    const weekAnalyses = analyses.filter(a => {
      const analyzeDate = new Date(a.created_date);
      return analyzeDate >= weekStart && analyzeDate <= weekEnd;
    });

    // Calculer les statistiques
    const totalBlockers = weekAnalyses.reduce((sum, a) => sum + (a.blockers_count || 0), 0);
    const totalRisks = weekAnalyses.reduce((sum, a) => sum + (a.risks_count || 0), 0);

    // Top 3 blockers
    const allBlockers = [];
    weekAnalyses.forEach(a => {
      if (a.analysis_data?.blockers) {
        allBlockers.push(...a.analysis_data.blockers);
      }
    });
    const topBlockers = allBlockers.slice(0, 3).map(b => ({
      title: b.issue || b.member || 'Unknown',
      impact: 'High',
      resolution: 'In progress'
    }));

    // Top 3 risks
    const allRisks = [];
    weekAnalyses.forEach(a => {
      if (a.analysis_data?.risks) {
        allRisks.push(...a.analysis_data.risks);
      }
    });
    const topRisks = allRisks.slice(0, 3).map(r => ({
      title: r.description || 'Unknown risk',
      severity: 'Medium',
      mitigation: 'Monitor'
    }));

    // Générer le PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.text('Nova Weekly Report', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Week of ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`, 20, yPosition);
    yPosition += 15;

    // Summary
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Executive Summary', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(11);
    const summaryText = `This week, Nova detected ${totalBlockers} blockers and ${totalRisks} risks across ${weekAnalyses.length} analyses. Key focus areas identified for the team.`;
    const wrappedSummary = doc.splitTextToSize(summaryText, pageWidth - 40);
    doc.text(wrappedSummary, 20, yPosition);
    yPosition += wrappedSummary.length * 5 + 10;

    // Key Metrics
    doc.setFontSize(12);
    doc.text('Key Metrics', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.text(`Total Blockers: ${totalBlockers}`, 25, yPosition);
    yPosition += 6;
    doc.text(`Total Risks: ${totalRisks}`, 25, yPosition);
    yPosition += 6;
    doc.text(`Analyses Run: ${weekAnalyses.length}`, 25, yPosition);
    yPosition += 12;

    // Top Blockers
    doc.setFontSize(12);
    doc.text('Top 3 Blockers', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    topBlockers.forEach((blocker, idx) => {
      doc.text(`${idx + 1}. ${blocker.title}`, 25, yPosition);
      yPosition += 5;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Impact: ${blocker.impact} | Status: ${blocker.resolution}`, 30, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 6;
      doc.setFontSize(10);
    });

    yPosition += 5;

    // Top Risks
    doc.setFontSize(12);
    doc.text('Top 3 Risks', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    topRisks.forEach((risk, idx) => {
      doc.text(`${idx + 1}. ${risk.title}`, 25, yPosition);
      yPosition += 5;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Severity: ${risk.severity} | Mitigation: ${risk.mitigation}`, 30, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 6;
      doc.setFontSize(10);
    });

    // Convert PDF to bytes
    const pdfBytes = doc.output('arraybuffer');

    // Upload PDF to storage
    const fileName = `weekly-report-${weekStart.toISOString().split('T')[0]}.pdf`;
    const uploadRes = await base44.integrations.Core.UploadFile({
      file: new Blob([pdfBytes], { type: 'application/pdf' })
    });

    const pdfUrl = uploadRes.file_url;

    // Create WeeklyReport record
    const report = await base44.entities.WeeklyReport.create({
      week_start: weekStart.toISOString().split('T')[0],
      week_end: weekEnd.toISOString().split('T')[0],
      pdf_url: pdfUrl,
      summary: summaryText,
      top_blockers: topBlockers,
      top_risks: topRisks,
      key_metrics: {
        total_blockers: totalBlockers,
        total_risks: totalRisks,
        analyses_count: weekAnalyses.length,
        pattern_detections: 0
      },
      generated_at: new Date().toISOString()
    });

    return Response.json({ 
      report_id: report.id,
      pdf_url: pdfUrl,
      message: 'Weekly report generated successfully'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});