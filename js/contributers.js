// ============================================
// Contributors rendering
// ============================================

async function renderContributors(repos) {
    const grid = $('#contributorsGrid');
    if (!grid) return;

    const contributorMap = {};

    // Method 1: Try fetching contributors from repos
    const topRepos = [...repos]
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 10);

    let fetchedAny = false;

    await Promise.all(topRepos.map(async repo => {
        try {
            const contribs = await fetchJSON(
                `${API_BASE}/repos/${GITHUB_ORG}/${repo.name}/contributors?per_page=30`
            );
            if (Array.isArray(contribs)) {
                contribs.forEach(c => {
                    if (!c || !c.login) return;
                    if (c.type === 'Bot') return;
                    if (c.login.includes('[bot]')) return;
                    if (!contributorMap[c.login]) {
                        contributorMap[c.login] = {
                            login: c.login,
                            avatar: c.avatar_url || '',
                            url: c.html_url || `https://github.com/${c.login}`,
                            contributions: 0,
                        };
                    }
                    contributorMap[c.login].contributions += (c.contributions || 0);
                    fetchedAny = true;
                });
            }
        } catch (err) {
            console.warn(`Contributors fetch failed for ${repo.name}:`, err.message);
        }
    }));

    // Method 2: Fallback — extract contributors from events if API failed
    if (!fetchedAny && AppState.events && AppState.events.length) {
        console.log('Falling back to events for contributor data');
        AppState.events.forEach(e => {
            if (!e.actor || !e.actor.login) return;
            const login = e.actor.login;
            if (login.includes('[bot]') || login === 'github-actions') return;
            if (!contributorMap[login]) {
                contributorMap[login] = {
                    login: login,
                    avatar: e.actor.avatar_url || '',
                    url: `https://github.com/${login}`,
                    contributions: 0,
                };
            }
            contributorMap[login].contributions += 1;
        });
    }

    // Method 3: Fallback — extract owner from repos
    if (Object.keys(contributorMap).length === 0) {
        repos.forEach(r => {
            if (r.owner && r.owner.login) {
                const login = r.owner.login;
                if (!contributorMap[login]) {
                    contributorMap[login] = {
                        login: login,
                        avatar: r.owner.avatar_url || '',
                        url: r.owner.html_url || `https://github.com/${login}`,
                        contributions: repos.length,
                    };
                }
            }
        });
    }

    const sorted = Object.values(contributorMap)
        .sort((a, b) => b.contributions - a.contributions);

    if (!sorted.length) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1">
                <i class="fas fa-users"></i>
                <h3>No contributors found</h3>
                <p>Try adding a GitHub token in Settings to increase API limits.</p>
            </div>`;
        return;
    }

    const maxContrib = sorted[0].contributions || 1;

    grid.innerHTML = sorted.slice(0, 24).map(c => {
        const initial = c.login ? c.login[0].toUpperCase() : '?';
        const fallbackImg = `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=6366f1&color=fff&size=128`;
        const avatarSrc = c.avatar || fallbackImg;
        const contribLabel = fetchedAny ? 'contributions' : 'events';

        return `
        <div class="contributor-card">
            <img
                src="${escapeHtml(avatarSrc)}"
                alt="${escapeHtml(c.login)}"
                class="contributor-avatar"
                loading="lazy"
                onerror="this.onerror=null; this.src='${fallbackImg}'"
            >
            <div class="contributor-name">
                <a href="${escapeHtml(c.url)}" target="_blank">${escapeHtml(c.login)}</a>
            </div>
            <div class="contributor-count">${c.contributions} ${contribLabel}</div>
            <div class="contributor-bar">
                <div class="contributor-bar-fill" style="width:${(c.contributions / maxContrib * 100).toFixed(1)}%"></div>
            </div>
        </div>`;
    }).join('');
}

window.renderContributors = renderContributors;