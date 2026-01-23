"use client";

import { AnalyticsData } from "@/app/actions/get-analytics-data";

export function exportToCSV(data: AnalyticsData, timeRange: number) {
  // Prepare CSV content
  const lines: string[] = [];

  // Header
  lines.push(`CIS Support Pro - Analytics Report (Last ${timeRange} Days)`);
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push("");

  // Overview Stats
  lines.push("OVERVIEW STATISTICS");
  lines.push("Metric,Value");
  lines.push(`Total Tickets,${data.overview.totalTickets}`);
  lines.push(`Open Tickets,${data.overview.openTickets}`);
  lines.push(`Avg Response Time (hours),${data.overview.avgResponseTime.toFixed(2)}`);
  lines.push(`Avg Resolution Time (hours),${data.overview.avgResolutionTime.toFixed(2)}`);
  lines.push("");

  // Ticket Trends
  lines.push("TICKET TRENDS");
  lines.push("Date,Created,Resolved");
  data.ticketTrends.forEach((trend) => {
    lines.push(`${trend.date},${trend.created},${trend.resolved}`);
  });
  lines.push("");

  // Status Distribution
  lines.push("STATUS DISTRIBUTION");
  lines.push("Status,Count,Percentage");
  data.statusDistribution.forEach((status) => {
    lines.push(`${status.status},${status.count},${status.percentage.toFixed(1)}%`);
  });
  lines.push("");

  // Priority Distribution
  lines.push("PRIORITY DISTRIBUTION");
  lines.push("Priority,Count");
  data.priorityDistribution.forEach((priority) => {
    lines.push(`${priority.priority},${priority.count}`);
  });
  lines.push("");

  // Category Breakdown
  lines.push("CATEGORY BREAKDOWN");
  lines.push("Category,Count");
  data.categoryBreakdown.forEach((category) => {
    lines.push(`${category.category},${category.count}`);
  });
  lines.push("");

  // Technician Performance
  if (data.technicianPerformance.length > 0) {
    lines.push("TECHNICIAN PERFORMANCE");
    lines.push("Name,Assigned,Resolved,Avg Resolution Time (hours),Acceptance Rate (%)");
    data.technicianPerformance.forEach((tech) => {
      lines.push(
        `${tech.name},${tech.assigned},${tech.resolved},${tech.avgResolutionTime.toFixed(2)},${tech.acceptanceRate.toFixed(1)}`
      );
    });
  }

  // Create and download file
  const csvContent = lines.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `analytics-report-${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJSON(data: AnalyticsData, timeRange: number) {
  const exportData = {
    generatedAt: new Date().toISOString(),
    timeRange: `${timeRange} days`,
    ...data,
  };

  const jsonContent = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `analytics-data-${new Date().toISOString().split("T")[0]}.json`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printReport(data: AnalyticsData, timeRange: number) {
  // Create a printable HTML version
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Analytics Report - CIS Support Pro</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          max-width: 1200px;
          margin: 0 auto;
        }
        h1 {
          color: #333;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }
        h2 {
          color: #555;
          margin-top: 30px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin: 20px 0;
        }
        .stat-card {
          border: 1px solid #ddd;
          padding: 20px;
          border-radius: 8px;
        }
        .stat-value {
          font-size: 32px;
          font-weight: bold;
          color: #333;
        }
        .stat-label {
          color: #666;
          margin-top: 5px;
        }
        @media print {
          body { padding: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>CIS Support Pro - Analytics Report</h1>
      <p><strong>Period:</strong> Last ${timeRange} Days</p>
      <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>

      <h2>Overview Statistics</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${data.overview.totalTickets}</div>
          <div class="stat-label">Total Tickets</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${data.overview.openTickets}</div>
          <div class="stat-label">Open Tickets</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${data.overview.avgResponseTime.toFixed(1)}h</div>
          <div class="stat-label">Avg Response Time</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${data.overview.avgResolutionTime.toFixed(1)}h</div>
          <div class="stat-label">Avg Resolution Time</div>
        </div>
      </div>

      <h2>Status Distribution</h2>
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Count</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
          ${data.statusDistribution.map((s) => `
            <tr>
              <td>${s.status.replace("_", " ").toUpperCase()}</td>
              <td>${s.count}</td>
              <td>${s.percentage.toFixed(1)}%</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <h2>Priority Distribution</h2>
      <table>
        <thead>
          <tr>
            <th>Priority</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          ${data.priorityDistribution.map((p) => `
            <tr>
              <td>${p.priority.toUpperCase()}</td>
              <td>${p.count}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <h2>Category Breakdown</h2>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          ${data.categoryBreakdown.map((c) => `
            <tr>
              <td>${c.category.toUpperCase()}</td>
              <td>${c.count}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      ${data.technicianPerformance.length > 0 ? `
        <h2>Technician Performance</h2>
        <table>
          <thead>
            <tr>
              <th>Technician</th>
              <th>Assigned</th>
              <th>Resolved</th>
              <th>Avg Resolution Time</th>
              <th>Acceptance Rate</th>
            </tr>
          </thead>
          <tbody>
            ${data.technicianPerformance.map((t) => `
              <tr>
                <td>${t.name}</td>
                <td>${t.assigned}</td>
                <td>${t.resolved}</td>
                <td>${t.avgResolutionTime.toFixed(1)}h</td>
                <td>${t.acceptanceRate.toFixed(1)}%</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      ` : ""}

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
