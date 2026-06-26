// ============================================
// Repository rendering & filtering
// ============================================

let currentFilter = 'all';

function initRepoFilters() {
    $$('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            $$('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilter = chip.dataset.filter;
            renderRepos();
        });
    });

    let timeout;
    $('#repoSearch').addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(renderRepos, 200);
    });
}

function renderRepos() {
    const grid = $('#reposGrid');
    const empty = $('#reposEmpty');
    const search = ($('#repoSearch').value || '').toLowerCase();

    let filtered = [...AppState.repos];
    if (search) {
        filtered = filtered.filter(r =>
            (r.name || '').toLowerCase().includes(search) ||
            (r.description || '').toLowerCase().includes(search) ||
            (r.language || '').toLowerCase().includes(search) ||
            (r.topics || []).some(t => t.toLowerCase().includes(search))
        );
    }

    switch (currentFilter) {
        case 'recent': filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)); break;
        case 'stars': filtered.sort((a, b) => b.stargazers_count - a.stargazers_count); break;
        case 'forks': filtered.sort((a, b) => b.forks_count - a.forks_count); break;
        default: filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }

    if (!filtered.length) { grid.innerHTML = ''; empty.classList.remove('hidden'); return; }
    empty.classList.add('hidden');

    grid.innerHTML = filtered.map(r => {
        const color = getLanguageColor(r.language);
        const topics = (r.topics || []).slice(0, 4);
        return `
        <div class="repo-card" data-repo="${escapeHtml(r.name)}">
            <div class="repo-header">
                <span class="repo-icon"><i class="fas fa-book-bookmark"></i></span>
                <div class="repo-name"><a href="${r.html_url}" target="_blank" onclick="event.stopPropagation()">${escapeHtml(r.name)}</a></div>
                <span class="repo-visibility">${r.visibility || 'public'}</span>
            </div>
            <p class="repo-description">${escapeHtml(r.description || 'No description provided.')}</p>
            ${topics.length ? `<div class="repo-topics">${topics.map(t => `<span class="topic-tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
            <div class="repo-meta">
                ${r.language ? `<span class="repo-meta-item"><span class="lang-dot" style="background:${color}"></span>${escapeHtml(r.language)}</span>` : ''}
                <span class="repo-meta-item"><i class="far fa-star"></i> ${r.stargazers_count || 0}</span>
                <span class="repo-meta-item"><i class="fas fa-code-branch"></i> ${r.forks_count || 0}</span>
                <button class="repo-readme-btn" onclick="event.stopPropagation(); openReadme('${escapeHtml(r.name)}')" title="View README"><i class="fas fa-book-open"></i> README</button>
            </div>
        </div>`;
    }).join('');
}