// ============================================
// GitHub API layer
// ============================================

const GITHUB_ORG = 'OmniNodeCo';
const API_BASE = 'https://api.github.com';

const AppState = {
    repos: [],
    events: [],
    profile: null,
    releases: [],
    contributors: {},
    isOrg: true,
    refreshInterval: null,
    refreshMinutes: 5,
};

function getHeaders() {
    const headers = { 'Accept': 'application/vnd.github.v3+json' };
    const token = localStorage.getItem('gh_token');
    if (token) headers['Authorization'] = `token ${token}`;
    return headers;
}

async function fetchJSON(url) {
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

async function fetchAllData() {
    showToast('Fetching data from GitHub...', 'info');
    updateTerminalLoading();

    try {
        // Profile
        try {
            AppState.profile = await fetchJSON(`${API_BASE}/orgs/${GITHUB_ORG}`);
            AppState.isOrg = true;
        } catch {
            AppState.profile = await fetchJSON(`${API_BASE}/users/${GITHUB_ORG}`);
            AppState.isOrg = false;
        }

        // Repos (paginated)
        const type = AppState.isOrg ? 'orgs' : 'users';
        let repos = [], page = 1;
        while (true) {
            const batch = await fetchJSON(`${API_BASE}/${type}/${GITHUB_ORG}/repos?per_page=100&page=${page}&sort=updated`);
            if (!batch.length) break;
            repos = repos.concat(batch);
            if (batch.length < 100) break;
            page++;
        }
        AppState.repos = repos;

        // Events
        try {
            AppState.events = await fetchJSON(`${API_BASE}/${type}/${GITHUB_ORG}/events?per_page=30`);
        } catch { AppState.events = []; }

        // Render everything
        renderProfile(AppState.profile);
        renderHeroStats(AppState.profile, repos);
        renderRepos();
        await renderReleases(repos);
        renderActivity(AppState.events);
        renderLanguageChart(repos);
        renderHeatmap(AppState.events);
        await renderContributors(repos);
        updateTerminalSuccess(repos, AppState.events);
        updateTicker(AppState.events);
        updateStatusBar(repos);
        updateLastRefresh();
        checkRateLimit();

        showToast('Data loaded successfully!', 'success');
    } catch (err) {
        console.error('Fetch error:', err);
        showToast('Failed to fetch data: ' + err.message, 'error');
        updateTerminalError(err.message);
    }
}

async function checkRateLimit() {
    try {
        const data = await fetchJSON(`${API_BASE}/rate_limit`);
        const core = data.resources.core;
        const pct = ((core.limit - core.remaining) / core.limit) * 100;
        $('#rateBarFill').style.width = `${100 - pct}%`;
        $('#rateLimitText').textContent = `${core.remaining} / ${core.limit}`;
        $('#statusRate').innerHTML = `<i class="fas fa-gauge"></i> Rate: ${core.remaining}/${core.limit}`;
    } catch {}
}

function updateLastRefresh() {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
    $('#lastRefresh').textContent = `${date} at ${time}`;
}

function updateStatusBar(repos) {
    $('#statusRepos').innerHTML = `<i class="fas fa-circle-check"></i> ${repos.length} repos loaded`;
}