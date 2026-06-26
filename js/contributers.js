// ============================================
// Contributors rendering
// ============================================

async function renderContributors(repos) {
    const grid = $('#contributorsGrid');
    const contributorMap = {};

    // Fetch contributors from top repos
    const topRepos = repos.sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 10);

    await Promise.all(topRepos.map(async repo => {
        try {
            const contribs = await fetchJSON(`${API_BASE}/repos/${GITHUB_ORG}/${repo.name}/contributors?per_page=20`);
            contribs.forEach(c => {
                if (c.type === 'Bot') return;
                if (!contributorMap[c.login]) {
                    contributorMap[c.login] = { login: c.login, avatar: c.avatar_url, url: c.html_url, contributions: 0 };
                }
                contributorMap[c.login].contributions += c.contributions;
            });
        } catch {}
    }));

    const sorted = Object.values(contributorMap).sort((a, b) => b.contributions - a.contributions);
    const maxContrib = sorted[0] ? sorted[0].contributions : 1;

    if (!sorted.length) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><h3>No contributors found</h3></div>';
        return;
    }

    grid.innerHTML = sorted.slice(0, 20).map(c => `
        <div class="contributor-card">
            <img src="${c.avatar}" alt="${escapeHtml(c.login)}" class="contributor-avatar" loading="lazy">
            <div class="contributor-name"><a href="${c.url}" target="_blank">${escapeHtml(c.login)}</a></div>
            <div class="contributor-count">${c.contributions} contributions</div>
            <div class="contributor-bar"><div class="contributor-bar-fill" style="width:${(c.contributions/maxContrib*100)}%"></div></div>
        </div>
    `).join('');
}