// ============================================
// README modal viewer
// ============================================

function initReadmeModal() {
    const overlay = $('#readmeOverlay');
    const closeBtn = $('#readmeClose');

    closeBtn.addEventListener('click', closeReadme);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeReadme();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('open')) closeReadme();
    });
}

async function openReadme(repoName) {
    const overlay = $('#readmeOverlay');
    const body = $('#readmeBody');
    const nameEl = $('#readmeRepoName');
    const ghLink = $('#readmeGhLink');

    nameEl.textContent = `${repoName} / README.md`;
    ghLink.href = `https://github.com/${GITHUB_ORG}/${repoName}`;
    body.innerHTML = '<div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text short"></div>';
    overlay.classList.add('open');

    try {
        const data = await fetchJSON(`${API_BASE}/repos/${GITHUB_ORG}/${repoName}/readme`);
        const content = atob(data.content);
        body.innerHTML = simpleMarkdown(content);
    } catch (err) {
        body.innerHTML = `<div class="empty-state"><i class="fas fa-file-circle-xmark"></i><h3>README not found</h3><p>${escapeHtml(err.message)}</p></div>`;
    }
}

function closeReadme() {
    $('#readmeOverlay').classList.remove('open');
}