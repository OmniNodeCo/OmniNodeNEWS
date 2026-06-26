// ============================================
// Profile rendering
// ============================================

function renderProfile(profile) {
    const card = $('#profileCard');
    const name = profile.name || profile.login || GITHUB_ORG;
    const bio = profile.bio || profile.description || 'Open source on GitHub.';
    let details = '';
    if (profile.location) details += `<li><i class="fas fa-map-marker-alt"></i> ${escapeHtml(profile.location)}</li>`;
    if (profile.blog) {
        const href = profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`;
        details += `<li><i class="fas fa-globe"></i> <a href="${href}" target="_blank">${escapeHtml(profile.blog)}</a></li>`;
    }
    details += `<li><i class="fas fa-book"></i> ${profile.public_repos || 0} repos</li>`;
    details += `<li><i class="fas fa-users"></i> ${profile.followers || 0} followers</li>`;

    card.innerHTML = `
        <div class="profile-header">
            <img src="${profile.avatar_url}" alt="${name}" class="profile-avatar" loading="lazy">
            <div><div class="profile-name">${escapeHtml(name)}</div><div class="profile-login">@${escapeHtml(profile.login || GITHUB_ORG)}</div></div>
        </div>
        <p class="profile-bio">${escapeHtml(bio)}</p>
        <ul class="profile-details">${details}</ul>`;
}

function renderHeroStats(profile, repos) {
    const stars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
    const forks = repos.reduce((s, r) => s + (r.forks_count || 0), 0);
    animateNumber($('#statRepos'), profile.public_repos || repos.length);
    animateNumber($('#statStars'), stars);
    animateNumber($('#statForks'), forks);
    animateNumber($('#statFollowers'), profile.followers || 0);
}

function renderLanguageChart(repos) {
    const container = $('#languageChart');
    const counts = {};
    repos.forEach(r => { if (r.language) counts[r.language] = (counts[r.language] || 0) + 1; });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (!total) { container.innerHTML = '<p style="color:var(--text-tertiary);font-size:0.82rem;">No data.</p>'; return; }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    container.innerHTML = `
        <div class="language-bar">${sorted.map(([l, c]) => `<div class="language-bar-segment" style="width:${(c/total*100)}%;background:${getLanguageColor(l)}" title="${l}: ${(c/total*100).toFixed(1)}%"></div>`).join('')}</div>
        <div class="language-list">${sorted.map(([l, c]) => `<div class="language-item"><span class="language-item-info"><span class="language-item-dot" style="background:${getLanguageColor(l)}"></span>${escapeHtml(l)}</span><span class="language-item-pct">${(c/total*100).toFixed(1)}%</span></div>`).join('')}</div>`;
}