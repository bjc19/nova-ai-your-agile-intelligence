import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import jsPDF from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculer le mois précédent
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    // Identifier le workspace principal actif (Jira ou Trello)
    const [activeJiraWorkspaces, activeTrelloWorkspaces] = await Promise.all([
      base44.entities.JiraProjectSelection.filter({ is_active: true }),
      base44.entities.TrelloProjectSelection.filter({ is_active: true }),
    ]);

    let activeWorkspaceId = null;
    let activeWorkspaceType = null;

    if (activeJiraWorkspaces?.length > 0) {
      const sorted = activeJiraWorkspaces.sort((a, b) =>
        new Date(b.selected_date || b.created_date) - new Date(a.selected_date || a.created_date)
      );
      activeWorkspaceId = sorted[0].id;
      activeWorkspaceType = 'jira';
    } else if (activeTrelloWorkspaces?.length > 0) {
      const sorted = activeTrelloWorkspaces.sort((a, b) =>
        new Date(b.connected_at || b.created_date) - new Date(a.connected_at || a.created_date)
      );
      activeWorkspaceId = sorted[0].id;
      activeWorkspaceType = 'trello';
    }

    // Récupérer les analyses filtrées par workspace actif
    let analyses = [];
    if (activeWorkspaceId) {
      const wsFilter = activeWorkspaceType === 'jira'
        ? { jira_project_selection_id: activeWorkspaceId }
        : { trello_project_selection_id: activeWorkspaceId };
      analyses = await base44.entities.AnalysisHistory.filter(wsFilter);
    } else {
      analyses = await base44.entities.AnalysisHistory.filter({ created_by: user.email });
    }

    const monthAnalyses = analyses.filter(a => {
      const analyzeDate = new Date(a.created_date);
      return analyzeDate >= monthStart && analyzeDate <= monthEnd;
    });

    // Statistiques
    const totalBlockers = monthAnalyses.reduce((sum, a) => sum + (a.blockers_count || 0), 0);
    const totalRisks = monthAnalyses.reduce((sum, a) => sum + (a.risks_count || 0), 0);

    // Récupérer les rapports hebdomadaires du mois
    const weeklyReports = await base44.entities.WeeklyReport.filter({
      created_by: user.email
    });

    const monthWeeklyReports = weeklyReports.filter(r => {
      const reportDate = new Date(r.week_start);
      return reportDate >= monthStart && reportDate <= monthEnd;
    });

    // Top blockers et risks
    const allBlockers = [];
    const blockerFreq = {};
    monthAnalyses.forEach(a => {
      if (a.analysis_data?.blockers) {
        a.analysis_data.blockers.forEach(b => {
          const key = b.issue || b.member || 'Unknown';
          allBlockers.push(key);
          blockerFreq[key] = (blockerFreq[key] || 0) + 1;
        });
      }
    });

    const topBlockers = Object.entries(blockerFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([title, frequency]) => ({
        title,
        frequency,
        resolution: 'Being addressed'
      }));

    const allRisks = [];
    monthAnalyses.forEach(a => {
      if (a.analysis_data?.risks) {
        allRisks.push(...a.analysis_data.risks);
      }
    });
    const topRisks = allRisks.slice(0, 3).map(r => ({
      title: r.description || 'Unknown risk',
      severity: 'Medium',
      mitigation: 'Under review'
    }));

    // Générer PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.text('Nova Monthly Report', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`${monthStart.toLocaleDateString()} - ${monthEnd.toLocaleDateString()}`, 20, yPosition);
    yPosition += 15;

    // Summary
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Executive Summary', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(11);
    const summaryText = `During this month, Nova monitored ${monthAnalyses.length} team interactions, identifying ${totalBlockers} blockers and ${totalRisks} risks. ${monthWeeklyReports.length} weekly reports were generated.`;
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
    doc.text(`Analyses: ${monthAnalyses.length}`, 25, yPosition);
    yPosition += 6;
    doc.text(`Weekly Reports: ${monthWeeklyReports.length}`, 25, yPosition);
    yPosition += 12;

    // Top Blockers
    doc.setFontSize(12);
    doc.text('Top 3 Recurring Blockers', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    topBlockers.forEach((blocker, idx) => {
      doc.text(`${idx + 1}. ${blocker.title} (${blocker.frequency}x)`, 25, yPosition);
      yPosition += 5;
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
    });

    const pdfBytes = doc.output('arraybuffer');

    // Upload PDF
    const uploadRes = await base44.integrations.Core.UploadFile({
      file: new Blob([pdfBytes], { type: 'application/pdf' })
    });

    const pdfUrl = uploadRes.file_url;
    const monthStr = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;

    // Create MonthlyReport record
    const report = await base44.entities.MonthlyReport.create({
      month: monthStr,
      pdf_url: pdfUrl,
      summary: summaryText,
      top_blockers: topBlockers,
      top_risks: topRisks,
      key_metrics: {
        total_blockers: totalBlockers,
        total_risks: totalRisks,
        analyses_count: monthAnalyses.length,
        weeks_count: monthWeeklyReports.length,
        pattern_frequency: blockerFreq
      },
      trends: ['Increasing blocker diversity', 'Risk trend stable'],
      generated_at: new Date().toISOString()
    });

    return Response.json({ 
      report_id: report.id,
      pdf_url: pdfUrl,
      message: 'Monthly report generated successfully'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});