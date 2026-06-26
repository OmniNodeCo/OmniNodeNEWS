// ============================================
// Command palette (Ctrl+K)
// ============================================

function initCommandPalette() {
    const overlay = $('#cmdOverlay');
    const input = $('#cmdInput');
    const results = $('#cmdResults');

    // Open/close
    const open = () => { overlay.classList.add('open'); input.value = ''; input.focus(); renderCmdResults(''); };
    const close = () => { overlay.classList.remove('open'); };

    $('#cmdPaletteBtn').addEventListener('click', open);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); open(); }
        if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });

    // Search
    input.addEventListener('input', () => renderCmdResults(input.value));

    // Actions
    results.addEventListener('click', (e) => {
        const item = e.target.closest('.cmd-item');
        if (!item) return;
        const action = item.dataset.action;
        const repo = item.dataset.repo;

        if (action === 'toggle-theme') toggleTheme();
        else if (action === 'go-releases') location.hash = '#releases';
        else if (action === 'go-repos') location.hash = '#repos';
        else if (action === 'go-activity') location.hash = '#heatmap';
        else if (action === 'refresh') fetchAllData();
        else if (action === 'github') window.open(`https://github.com/${GITHUB_ORG}`, '_blank');
        else if (action === 'open-repo' && repo) window.open(`https://github.com/${GITHUB_ORG}/${repo}`, '_blank');
        else if (action === 'readme' && repo) openReadme(repo);

        close();
    });
}

function renderCmdResults(query) {
    const results = $('#cmdResults');
    const q = query.toLowerCase().trim();

    let html = '';

    // Actions
    const actions = [
        { action: 'toggle-theme', icon: 'fas fa-palette', label: 'Toggle Theme' },
        { action: 'go-releases', icon: 'fas fa-tag', label: 'Go to Releases' },
        { action: 'go-repos', icon: 'fas fa-book', label: 'Go to Repositories' },
        { action: 'go-activity', icon: 'fas fa-bolt', label: 'Go to Activity' },
        { action: 'refresh', icon: 'fas fa-sync-alt', label: 'Refresh Data' },
        { action: 'github', icon: 'fab fa-github', label: 'Open GitHub Profile' },
    ];

    const filteredActions = q ? actions.filter(a => a.label.toLowerCase().includes(q)) : actions;
    if (filteredActions.length) {
        html += `<div class="cmd-group"><div class="cmd-group-title">Actions</div>${filteredActions.map(a =>
            `<button class="cmd-item" data-action="${a.action}"><i class="${a.icon}"></i> ${a.label}</button>`
        ).join('')}</div>`;
    }

    // Repos
    if (AppState.repos.length) {
        const filteredRepos = q
            ? AppState.repos.filter(r => r.name.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q))
            : AppState.repos.slice(0, 5);

        if (filteredRepos.length) {
            html += `<div class="cmd-group"><div class="cmd-group-title">Repositories</div>${filteredRepos.slice(0, 8).map(r =>
                `<button class="cmd-item" data-action="open-repo" data-repo="${escapeHtml(r.name)}"><i class="fas fa-book-bookmark"></i> ${escapeHtml(r.name)} <span style="margin-left:auto;font-size:0.72rem;color:var(--text-tertiary)">★${r.stargazers_count}</span></button>`
            ).join('')}</div>`;
        }
    }

    // Releases
    if (AppState.releases.length && q) {
        const filteredReleases = AppState.releases.filter(r =>
            (r.name || r.tag_name || '').toLowerCase().includes(q) || r.repoName.toLowerCase().includes(q)
        );
        if (filteredReleases.length) {
            html += `<div class="cmd-group"><div class="cmd-group-title">Releases</div>${filteredReleases.slice(0, 5).map(r =>
                `<button class="cmd-item" data-action="readme" data-repo="${escapeHtml(r.repoName)}"><i class="fas fa-tag"></i> ${escapeHtml(r.repoName)} ${escapeHtml(r.tag_name)}</button>`
            ).join('')}</div>`;
        }
    }

    if (!html) html = '<div class="cmd-group"><div class="cmd-group-title">No results</div><div class="cmd-item" style="color:var(--text-tertiary);cursor:default"><i class="fas fa-search"></i> No matches found</div></div>';

    results.innerHTML = html;
}