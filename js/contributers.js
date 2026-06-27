// ============================================
// Contributors rendering
// ============================================

async function renderContributors(repos) {
    const grid = $('#contributorsGrid');
    if (!grid) return;

    const contributorMap = {};

    const topRepos = [...repos]
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 10);

    await Promise.all(topRepos.map(async repo => {
        try {
            const contribs = await fetchJSON(
                `${API_BASE}/repos/${GITHUB_ORG}/${repo.name}/contributors?per_page=20`
            );
            contribs.forEach(c => {
                if (c.type === 'Bot') return;
                if (!contributorMap[c.login]) {
                    contributorMap[c.login] = {
                        login: c.login,
                        avatar: c.avatar_url,
                        url: c.html_url,
                        contributions: 0,
                    };
                }
                contributorMap[c.login].contributions += c.contributions;
            });
        } catch {}
    }));

    const sorted = Object.values(contributorMap)
        .sort((a, b) => b.contributions - a.contributions);

    if (!sorted.length) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No contributors found</h3>
                <p>Contributors will appear here once data loads.</p>
            </div>`;
        return;
    }

    const maxContrib = sorted[0].contributions || 1;

    grid.innerHTML = sorted.slice(0, 20).map(c => {
        const initial = c.login ? c.login[0].toUpperCase() : '?';
        const fallback = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><circle cx=%2220%22 cy=%2220%22 r=%2220%22 fill=%22%236366f1%22/><text x=%2250%25%22 y=%2255%25%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2218%22>${initial}%3C/text%3E%3C/svg%3E`;
        return `
        <div class="contributor-card">
            <img
                src="${escapeHtml(c.avatar)}"
                alt="${escapeHtml(c.login)}"
                class="contributor-avatar"
                loading="lazy"
                onerror="this.src='${fallback}'"
            >
            <div class="contributor-name">
                <a href="${escapeHtml(c.url)}" target="_blank">${escapeHtml(c.login)}</a>
            </div>
            <div class="contributor-count">${c.contributions} contributions</div>
            <div class="contributor-bar">
                <div class="contributor-bar-fill" style="width:${(c.contributions / maxContrib * 100).toFixed(1)}%"></div>
            </div>
        </div>`;
    }).join('');
}

window.renderContributors = renderContributors;