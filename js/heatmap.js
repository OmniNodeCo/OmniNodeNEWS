// ============================================
// Contribution heatmap
// ============================================

function renderHeatmap(events) {
    const grid = $('#heatmapGrid');
    const monthsEl = $('#heatmapMonths');
    $('#heatmapYear').textContent = new Date().getFullYear();

    // Build date → count map from events
    const dateCounts = {};
    events.forEach(e => {
        const date = e.created_at.split('T')[0];
        dateCounts[date] = (dateCounts[date] || 0) + 1;
    });

    // Generate 52 weeks × 7 days
    const today = new Date();
    const cells = [];
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start on Sunday

    const months = [];
    let lastMonth = -1;

    for (let i = 0; i < 371; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        if (d > today) break;

        const dateStr = d.toISOString().split('T')[0];
        const count = dateCounts[dateStr] || 0;
        let level = 0;
        if (count >= 10) level = 4;
        else if (count >= 6) level = 3;
        else if (count >= 3) level = 2;
        else if (count >= 1) level = 1;

        const dayName = d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
        cells.push(`<div class="heatmap-cell level-${level}" title="${dayName}: ${count} event${count !== 1 ? 's' : ''}"></div>`);

        // Track month labels
        const month = d.getMonth();
        if (month !== lastMonth) {
            months.push({ name: d.toLocaleDateString('en', { month: 'short' }), col: Math.floor(i / 7) + 1 });
            lastMonth = month;
        }
    }

    grid.innerHTML = cells.join('');

    // Month labels
    monthsEl.innerHTML = months.map(m =>
        `<span class="heatmap-month-label" style="grid-column:${m.col}">${m.name}</span>`
    ).join('');
}