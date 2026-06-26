// ============================================
// OmniNodeNews — Main Application
// ============================================

const GITHUB_ORG = 'OmniNodeCo';
const API_BASE = 'https://api.github.com';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// --- State ---
let allRepos = [];
let currentFilter = 'all';

// --- DOM Elements ---
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigation();
    initScrollEffects();
    initFilterChips();
    initSearch();
    setCurrentYear();
    fetchAllData();
});

// --- Theme ---
function initTheme() {
    const saved = localStorage.getItem('theme');
    const theme = saved || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);

    $('#themeToggle').addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        updateThemeIcon(next);
    });
}

function updateThemeIcon(theme) {
    const icon = $('#themeIcon');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// --- Navigation ---
function initNavigation() {
    const mobileBtn = $('#mobileMenuBtn');
    const navLinks = $('#navLinks');

    mobileBtn.addEventListener('click', () => {
        mobileBtn.classList.toggle('active');
        navLinks.classList.toggle('open');
    });

    $$('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            mobileBtn.classList.remove('active');
            navLinks.classList.remove('open');
            $$('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

// --- Scroll Effects ---
function initScrollEffects() {
    const navbar = $('#navbar');
    const scrollTop = $('#scrollTop');
    const sections = $$('section[id], header[id]');

    window.addEventListener('scroll', () => {
        const y = window.scrollY;

        // Navbar
        navbar.classList.toggle('scrolled', y > 50);

        // Scroll to top button
        scrollTop.classList.toggle('visible', y > 500);

        // Active nav link
        let current = '';
        sections.forEach(section => {
            const top = section.offsetTop - 100;
            if (y >= top) current = section.id;
        });
        $$('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
        });
    });

    scrollTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// --- Filter Chips ---
function initFilterChips() {
    $$('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            $$('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilter = chip.dataset.filter;
            renderRepos();
        });
    });
}

// --- Search ---
function initSearch() {
    const searchInput = $('#repoSearch');
    let timeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => renderRepos(), 200);
    });
}

// --- Set Year ---
function setCurrentYear() {
    $('#currentYear').textContent = new Date().getFullYear();
}

// --- API Fetching ---
async function fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

async function fetchAllData() {
    showToast('Fetching data from GitHub...', 'info');
    updateTerminal([
        { type: 'prompt', text: 'curl https://api.github.com/orgs/OmniNodeCo' },
        { type: 'info', text: 'Connecting to GitHub API...' },
    ]);

    try {
        // Try org first, fall back to user
        let profileData;
        let isOrg = true;
        try {
            profileData = await fetchJSON(`${API_BASE}/orgs/${GITHUB_ORG}`);
        } catch {
            profileData = await fetchJSON(`${API_BASE}/users/${GITHUB_ORG}`);
            isOrg = false;
        }

        // Fetch repos (paginated)
        let repos = [];
        let page = 1;
        const type = isOrg ? 'orgs' : 'users';
        while (true) {
            const batch = await fetchJSON(`${API_BASE}/${type}/${GITHUB_ORG}/repos?per_page=100&page=${page}&sort=updated`);
            if (batch.length === 0) break;
            repos = repos.concat(batch);
            if (batch.length < 100) break;
            page++;
        }

        allRepos = repos;

        // Fetch events
        let events = [];
        try {
            events = await fetchJSON(`${API_BASE}/${type}/${GITHUB_ORG}/events?per_page=30`);
        } catch {
            // Events might not be available for all accounts
        }

        // Process and render
        renderProfile(profileData);
        renderHeroStats(profileData, repos);
        renderRepos();
        renderReleases(repos);
        renderActivity(events);
        renderLanguageChart(repos);
        updateTerminalSuccess(repos, events);
        updateLastRefresh();

        showToast('Data loaded successfully!', 'success');
    } catch (error) {
        console.error('Fetch error:', error);
        showToast('Failed to fetch data. Using cached or retry later.', 'error');
        updateTerminal([
            { type: 'prompt', text: 'curl https://api.github.com/orgs/OmniNodeCo' },
            { type: 'warning', text: `Error: ${error.message}` },
            { type: 'info', text: 'Retrying in 30 seconds...' },
        ]);
    }

    // Refresh button
    $('#refreshBtn').addEventListener('click', () => {
        fetchAllData();
    });
}

// --- Render Profile ---
function renderProfile(profile) {
    const card = $('#profileCard');
    const name = profile.name || profile.login || GITHUB_ORG;
    const bio = profile.bio || profile.description || 'Open source organization on GitHub.';
    const avatar = profile.avatar_url || '';
    const location = profile.location || '';
    const blog = profile.blog || '';
    const publicRepos = profile.public_repos || 0;
    const followers = profile.followers || 0;

    let detailsHtml = '';
    if (location) {
        detailsHtml += `<li><i class="fas fa-map-marker-alt"></i> ${escapeHtml(location)}</li>`;
    }
    if (blog) {
        const href = blog.startsWith('http') ? blog : `https://${blog}`;
        detailsHtml += `<li><i class="fas fa-globe"></i> <a href="${href}" target="_blank">${escapeHtml(blog)}</a></li>`;
    }
    detailsHtml += `<li><i class="fas fa-book"></i> ${publicRepos} repositories</li>`;
    detailsHtml += `<li><i class="fas fa-users"></i> ${followers} followers</li>`;

    card.innerHTML = `
        <div class="profile-header">
            <img src="${avatar}" alt="${name}" class="profile-avatar" loading="lazy">
            <div>
                <div class="profile-name">${escapeHtml(name)}</div>
                <div class="profile-login">@${escapeHtml(profile.login || GITHUB_ORG)}</div>
            </div>
        </div>
        <p class="profile-bio">${escapeHtml(bio)}</p>
        <ul class="profile-details">${detailsHtml}</ul>
    `;
}

// --- Render Hero Stats ---
function renderHeroStats(profile, repos) {
    const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
    const totalForks = repos.reduce((sum, r) => sum + (r.forks_count || 0), 0);

    animateNumber($('#statRepos'), profile.public_repos || repos.length);
    animateNumber($('#statStars'), totalStars);
    animateNumber($('#statForks'), totalForks);
    animateNumber($('#statFollowers'), profile.followers || 0);
}

function animateNumber(el, target) {
    const duration = 1500;
    const start = 0;
    const startTime = performance.now();

    function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (target - start) * eased);
        el.textContent = formatNumber(current);
        if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
}

function formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
}

// --- Render Repos ---
function renderRepos() {
    const grid = $('#reposGrid');
    const empty = $('#reposEmpty');
    const searchTerm = ($('#repoSearch').value || '').toLowerCase();

    let filtered = [...allRepos];

    // Search
    if (searchTerm) {
        filtered = filtered.filter(repo =>
            (repo.name || '').toLowerCase().includes(searchTerm) ||
            (repo.description || '').toLowerCase().includes(searchTerm) ||
            (repo.language || '').toLowerCase().includes(searchTerm) ||
            (repo.topics || []).some(t => t.toLowerCase().includes(searchTerm))
        );
    }

    // Sort
    switch (currentFilter) {
        case 'recent':
            filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
            break;
        case 'stars':
            filtered.sort((a, b) => b.stargazers_count - a.stargazers_count);
            break;
        case 'forks':
            filtered.sort((a, b) => b.forks_count - a.forks_count);
            break;
        default:
            filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }

    if (filtered.length === 0) {
        grid.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }

    empty.classList.add('hidden');

    grid.innerHTML = filtered.map(repo => {
        const langColor = getLanguageColor(repo.language);
        const topics = (repo.topics || []).slice(0, 5);
        const updated = timeAgo(repo.updated_at);

        return `
            <div class="repo-card">
                <div class="repo-header">
                    <span class="repo-icon"><i class="fas fa-book-bookmark"></i></span>
                    <div class="repo-name">
                        <a href="${repo.html_url}" target="_blank">${escapeHtml(repo.name)}</a>
                    </div>
                    <span class="repo-visibility">${repo.visibility || 'public'}</span>
                </div>
                <p class="repo-description">${escapeHtml(repo.description || 'No description provided.')}</p>
                ${topics.length > 0 ? `
                    <div class="repo-topics">
                        ${topics.map(t => `<span class="topic-tag">${escapeHtml(t)}</span>`).join('')}
                    </div>
                ` : ''}
                <div class="repo-meta">
                    ${repo.language ? `
                        <span class="repo-meta-item">
                            <span class="lang-dot" style="background:${langColor}"></span>
                            ${escapeHtml(repo.language)}
                        </span>
                    ` : ''}
                    <span class="repo-meta-item">
                        <i class="far fa-star"></i> ${repo.stargazers_count || 0}
                    </span>
                    <span class="repo-meta-item">
                        <i class="fas fa-code-branch"></i> ${repo.forks_count || 0}
                    </span>
                    <span class="repo-updated">Updated ${updated}</span>
                </div>
            </div>
        `;
    }).join('');
}

// --- Render Releases ---
async function renderReleases(repos) {
    const grid = $('#releasesGrid');
    const empty = $('#releasesEmpty');

    let allReleases = [];

    // Fetch releases from all repos (limit to avoid rate limits)
    const reposToCheck = repos
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 15);

    const promises = reposToCheck.map(async (repo) => {
        try {
            const releases = await fetchJSON(`${API_BASE}/repos/${GITHUB_ORG}/${repo.name}/releases?per_page=3`);
            return releases.map(r => ({ ...r, repoName: repo.name, repoUrl: repo.html_url }));
        } catch {
            return [];
        }
    });

    const results = await Promise.all(promises);
    allReleases = results.flat().sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at));

    if (allReleases.length === 0) {
        grid.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }

    empty.classList.add('hidden');

    grid.innerHTML = allReleases.slice(0, 9).map(release => {
        const body = release.body
            ? release.body.substring(0, 200).replace(/[#*`]/g, '') + (release.body.length > 200 ? '...' : '')
            : 'No release notes provided.';
        const date = timeAgo(release.published_at || release.created_at);
        const isPreRelease = release.prerelease;

        return `
            <div class="release-card">
                <div class="release-header">
                    <span class="release-repo">
                        <i class="fas fa-book-bookmark"></i> ${escapeHtml(release.repoName)}
                    </span>
                    <span class="release-tag ${isPreRelease ? 'pre-release' : ''}">
                        <i class="fas fa-tag"></i> ${escapeHtml(release.tag_name)}
                    </span>
                </div>
                <h3 class="release-title">
                    <a href="${release.html_url}" target="_blank">${escapeHtml(release.name || release.tag_name)}</a>
                </h3>
                <div class="release-body">${escapeHtml(body)}</div>
                <div class="release-meta">
                    <span class="release-date">
                        <i class="far fa-clock"></i> ${date}
                    </span>
                    <a href="${release.html_url}" target="_blank" class="release-link">
                        View Release <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

// --- Render Activity ---
function renderActivity(events) {
    const timeline = $('#activityTimeline');
    const empty = $('#activityEmpty');

    if (!events || events.length === 0) {
        timeline.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }

    empty.classList.add('hidden');

    timeline.innerHTML = events.slice(0, 20).map(event => {
        const { icon, iconClass, title, desc } = parseEvent(event);
        const time = timeAgo(event.created_at);

        return `
            <div class="activity-item">
                <div class="activity-icon ${iconClass}">
                    <i class="${icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${title}</div>
                    ${desc ? `<div class="activity-desc">${desc}</div>` : ''}
                    <div class="activity-time"><i class="far fa-clock"></i> ${time}</div>
                </div>
            </div>
        `;
    }).join('');
}

function parseEvent(event) {
    const repo = event.repo ? event.repo.name.split('/')[1] : '';
    const repoLink = event.repo ? `<a href="https://github.com/${event.repo.name}" target="_blank">${escapeHtml(repo)}</a>` : '';
    const actor = event.actor ? event.actor.login : 'Unknown';

    switch (event.type) {
        case 'PushEvent': {
            const commits = event.payload.commits || [];
            const count = commits.length;
            const branch = (event.payload.ref || '').replace('refs/heads/', '');
            return {
                icon: 'fas fa-code-commit',
                iconClass: 'push',
                title: `${escapeHtml(actor)} pushed ${count} commit${count !== 1 ? 's' : ''} to ${repoLink}`,
                desc: commits.length > 0 ? escapeHtml(commits[0].message.split('\n')[0]) : '',
            };
        }
        case 'CreateEvent': {
            const refType = event.payload.ref_type;
            const ref = event.payload.ref;
            return {
                icon: 'fas fa-plus',
                iconClass: 'create',
                title: `${escapeHtml(actor)} created ${refType}${ref ? ` <code>${escapeHtml(ref)}</code>` : ''} in ${repoLink}`,
                desc: event.payload.description ? escapeHtml(event.payload.description) : '',
            };
        }
        case 'DeleteEvent': {
            return {
                icon: 'fas fa-trash',
                iconClass: 'delete',
                title: `${escapeHtml(actor)} deleted ${event.payload.ref_type} <code>${escapeHtml(event.payload.ref || '')}</code> in ${repoLink}`,
                desc: '',
            };
        }
        case 'IssuesEvent': {
            const action = event.payload.action;
            const issue = event.payload.issue;
            return {
                icon: 'fas fa-circle-dot',
                iconClass: 'issue',
                title: `${escapeHtml(actor)} ${action} issue in ${repoLink}`,
                desc: issue ? escapeHtml(issue.title) : '',
            };
        }
        case 'IssueCommentEvent': {
            const issue = event.payload.issue;
            return {
                icon: 'fas fa-comment',
                iconClass: 'issue',
                title: `${escapeHtml(actor)} commented on issue in ${repoLink}`,
                desc: issue ? escapeHtml(issue.title) : '',
            };
        }
        case 'PullRequestEvent': {
            const pr = event.payload.pull_request;
            return {
                icon: 'fas fa-code-pull-request',
                iconClass: 'pr',
                title: `${escapeHtml(actor)} ${event.payload.action} PR in ${repoLink}`,
                desc: pr ? escapeHtml(pr.title) : '',
            };
        }
        case 'PullRequestReviewEvent': {
            return {
                icon: 'fas fa-eye',
                iconClass: 'pr',
                title: `${escapeHtml(actor)} reviewed PR in ${repoLink}`,
                desc: '',
            };
        }
        case 'ForkEvent': {
            return {
                icon: 'fas fa-code-branch',
                iconClass: 'fork',
                title: `${escapeHtml(actor)} forked ${repoLink}`,
                desc: '',
            };
        }
        case 'WatchEvent': {
            return {
                icon: 'fas fa-star',
                iconClass: 'star',
                title: `${escapeHtml(actor)} starred ${repoLink}`,
                desc: '',
            };
        }
        case 'ReleaseEvent': {
            const release = event.payload.release;
            return {
                icon: 'fas fa-rocket',
                iconClass: 'release',
                title: `${escapeHtml(actor)} published release in ${repoLink}`,
                desc: release ? escapeHtml(release.name || release.tag_name) : '',
            };
        }
        case 'MemberEvent': {
            return {
                icon: 'fas fa-user-plus',
                iconClass: 'member',
                title: `${escapeHtml(actor)} ${event.payload.action} member in ${repoLink}`,
                desc: event.payload.member ? escapeHtml(event.payload.member.login) : '',
            };
        }
        case 'PublicEvent': {
            return {
                icon: 'fas fa-globe',
                iconClass: 'create',
                title: `${escapeHtml(actor)} made ${repoLink} public`,
                desc: '',
            };
        }
        default:
            return {
                icon: 'fas fa-circle',
                iconClass: 'default',
                title: `${escapeHtml(actor)} performed ${event.type.replace('Event', '')} on ${repoLink}`,
                desc: '',
            };
    }
}

// --- Language Chart ---
function renderLanguageChart(repos) {
    const container = $('#languageChart');
    const langCounts = {};

    repos.forEach(repo => {
        if (repo.language) {
            langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
        }
    });

    const total = Object.values(langCounts).reduce((a, b) => a + b, 0);
    if (total === 0) {
        container.innerHTML = '<p style="color:var(--text-tertiary);font-size:0.85rem;">No language data available.</p>';
        return;
    }

    const sorted = Object.entries(langCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

    const barHtml = `<div class="language-bar">${sorted.map(([lang, count]) => {
        const pct = (count / total * 100);
        const color = getLanguageColor(lang);
        return `<div class="language-bar-segment" style="width:${pct}%;background:${color}" title="${lang}: ${pct.toFixed(1)}%"></div>`;
    }).join('')}</div>`;

    const listHtml = `<div class="language-list">${sorted.map(([lang, count]) => {
        const pct = (count / total * 100).toFixed(1);
        const color = getLanguageColor(lang);
        return `
            <div class="language-item">
                <span class="language-item-info">
                    <span class="language-item-dot" style="background:${color}"></span>
                    ${escapeHtml(lang)}
                </span>
                <span class="language-item-pct">${pct}%</span>
            </div>
        `;
    }).join('')}</div>`;

    container.innerHTML = barHtml + listHtml;
}

// --- Terminal ---
function updateTerminal(lines) {
    const body = $('#terminalBody');
    body.innerHTML = lines.map(line => {
        if (line.type === 'prompt') {
            return `<div class="terminal-line"><span class="terminal-prompt">$</span> <span class="terminal-output">${escapeHtml(line.text)}</span></div>`;
        }
        const cls = line.type || '';
        return `<div class="terminal-line"><span class="terminal-output ${cls}">${escapeHtml(line.text)}</span></div>`;
    }).join('');
}

function updateTerminalSuccess(repos, events) {
    const lines = [
        { type: 'prompt', text: `curl api.github.com/orgs/${GITHUB_ORG}` },
        { type: 'success', text: '✓ Connected to GitHub API' },
        { type: 'info', text: `Found ${repos.length} repositories` },
        { type: 'info', text: `Loaded ${events.length} recent events` },
        { type: 'success', text: `Total stars: ${repos.reduce((s, r) => s + r.stargazers_count, 0)}` },
        { type: 'success', text: `Total forks: ${repos.reduce((s, r) => s + r.forks_count, 0)}` },
    ];

    // Top repos
    const topRepos = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 3);
    if (topRepos.length > 0) {
        lines.push({ type: '', text: '' });
        lines.push({ type: 'info', text: '── Top Repositories ──' });
        topRepos.forEach((r, i) => {
            lines.push({ type: '', text: `  ${i + 1}. ${r.name} ★${r.stargazers_count}` });
        });
    }

    // Recent activity
    if (events.length > 0) {
        lines.push({ type: '', text: '' });
        lines.push({ type: 'info', text: '── Recent Activity ──' });
        events.slice(0, 3).forEach(e => {
            const actor = e.actor ? e.actor.login : '?';
            const type = e.type.replace('Event', '');
            const repo = e.repo ? e.repo.name.split('/')[1] : '';
            lines.push({ type: '', text: `  ${actor}: ${type} → ${repo}` });
        });
    }

    lines.push({ type: '', text: '' });
    lines.push({ type: 'success', text: '✓ Dashboard ready. Live data loaded.' });

    updateTerminal(lines);
}

// --- Toast Notification ---
function showToast(message, type = 'info') {
    const container = $('#toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon;
    switch (type) {
        case 'success': icon = 'fas fa-check-circle'; break;
        case 'error': icon = 'fas fa-exclamation-circle'; break;
        default: icon = 'fas fa-info-circle';
    }

    toast.innerHTML = `<i class="${icon}"></i> ${escapeHtml(message)}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- Last Refresh ---
function updateLastRefresh() {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
    $('#lastRefresh').textContent = `${date} at ${time}`;
}

// --- Utility Functions ---
function timeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
    if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
    return `${Math.floor(diff / 31536000)}y ago`;
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function getLanguageColor(language) {
    const colors = {
        'JavaScript': '#f1e05a',
        'TypeScript': '#3178c6',
        'Python': '#3572A5',
        'Java': '#b07219',
        'Go': '#00ADD8',
        'Rust': '#dea584',
        'C++': '#f34b7d',
        'C': '#555555',
        'C#': '#178600',
        'Ruby': '#701516',
        'PHP': '#4F5D95',
        'Swift': '#F05138',
        'Kotlin': '#A97BFF',
        'Dart': '#00B4AB',
        'Shell': '#89e051',
        'HTML': '#e34c26',
        'CSS': '#563d7c',
        'SCSS': '#c6538c',
        'Vue': '#41b883',
        'Svelte': '#ff3e00',
        'Lua': '#000080',
        'Perl': '#0298c3',
        'R': '#198CE7',
        'Scala': '#c22d40',
        'Haskell': '#5e5086',
        'Elixir': '#6e4a7e',
        'Clojure': '#db5855',
        'Dockerfile': '#384d54',
        'Makefile': '#427819',
        'Nix': '#7e7eff',
        'Zig': '#ec915c',
        'OCaml': '#3be133',
        'Jupyter Notebook': '#DA5B0B',
        'MATLAB': '#e16737',
    };
    return colors[language] || '#8b8b8b';
}