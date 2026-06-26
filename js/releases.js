// ============================================
// Releases rendering
// ============================================

async function renderReleases(repos) {
    const grid = $('#releasesGrid');
    const empty = $('#releasesEmpty');
    const reposToCheck = repos.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 15);

    const results = await Promise.all(reposToCheck.map(async repo => {
        try {
            const releases = await fetchJSON(`${API_BASE}/repos/${GITHUB_ORG}/${repo.name}/releases?per_page=3`);
            return releases.map(r => ({ ...r, repoName: repo.name, repoUrl: repo.html_url }));
        } catch { return []; }
    }));

    AppState.releases = results.flat().sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at));

    if (!AppState.releases.length) { grid.innerHTML = ''; empty.classList.remove('hidden'); return; }
    empty.classList.add('hidden');

    grid.innerHTML = AppState.releases.slice(0, 9).map(r => {
        const body = r.body ? r.body.substring(0, 180).replace(/[#*`]/g, '') + (r.body.length > 180 ? '...' : '') : 'No release notes.';
        return `
        <div class="release-card">
            <div class="release-header">
                <span class="release-repo"><i class="fas fa-book-bookmark"></i> ${escapeHtml(r.repoName)}</span>
                <span class="release-tag"><i class="fas fa-tag"></i> ${escapeHtml(r.tag_name)}</span>
            </div>
            <h3 class="release-title"><a href="${r.html_url}" target="_blank">${escapeHtml(r.name || r.tag_name)}</a></h3>
            <div class="release-body">${escapeHtml(body)}</div>
            <div class="release-meta">
                <span class="release-date"><i class="far fa-clock"></i> ${timeAgo(r.published_at || r.created_at)}</span>
                <a href="${r.html_url}" target="_blank" class="release-link">View <i class="fas fa-arrow-right"></i></a>
            </div>
        </div>`;
    }).join('');
}