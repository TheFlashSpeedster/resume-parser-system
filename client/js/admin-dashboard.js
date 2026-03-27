async function renderDashboard() {
  const auth = await requireAdminAuth();
  if (!auth) return;

  try {
    const [dashboardPayload, logsPayload] = await Promise.all([
      apiRequest('/api/admin/dashboard'),
      apiRequest('/api/admin/logs?limit=8')
    ]);
    const data = dashboardPayload.data;

    qs('#totalResumes').textContent = data.totalResumes;
    qs('#totalDuplicates').textContent = data.totalDuplicates;
    qs('#successCount').textContent = data.parsingSuccessCount;
    qs('#failureCount').textContent = data.parsingFailureCount;

    const recentTbody = qs('#recentUploadsBody');
    recentTbody.innerHTML = '';

    if (!data.recentUploads.length) {
      recentTbody.innerHTML = '<tr><td colspan="6">No uploads found.</td></tr>';
    } else {
      data.recentUploads.forEach((item) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${toSafeText(item.parsedData?.name || '-')}</td>
          <td>${toSafeText((item.parsedData?.emails || [])[0] || '-')}</td>
          <td>${toSafeText((item.parsedData?.phones || [])[0] || '-')}</td>
          <td>${item.parsingStatus}</td>
          <td>${item.duplicateFlag ? 'Yes' : 'No'}</td>
          <td>${formatDate(item.createdAt)}</td>
        `;
        recentTbody.appendChild(row);
      });
    }

    const chartWrap = qs('#skillChart');
    chartWrap.innerHTML = '';

    if (!data.skillSummary.length) {
      chartWrap.innerHTML = '<div class="empty">No skill summary available.</div>';
    } else {
      const max = Math.max(...data.skillSummary.map((s) => s.count), 1);
      data.skillSummary.forEach((entry) => {
        const row = document.createElement('div');
        row.className = 'chart-row';
        row.innerHTML = `
          <div>${toSafeText(entry.skill)}</div>
          <div class="chart-track"><div class="chart-fill" style="width:${Math.round((entry.count / max) * 100)}%"></div></div>
          <div>${entry.count}</div>
        `;
        chartWrap.appendChild(row);
      });
    }

    const logsBody = qs('#recentLogsBody');
    logsBody.innerHTML = '';

    const logs = logsPayload.data?.items || [];
    if (!logs.length) {
      logsBody.innerHTML = '<tr><td colspan="4">No logs available.</td></tr>';
    } else {
      logs.forEach((log) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${toSafeText(log.actionType)}</td>
          <td>${toSafeText(log.actor)}</td>
          <td>${toSafeText(log.message)}</td>
          <td>${formatDate(log.timestamp)}</td>
        `;
        logsBody.appendChild(row);
      });
    }
  } catch (err) {
    showToast(err.message || 'Failed to load dashboard.', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  attachLogout('#logoutBtn');
  renderDashboard();
});
