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
    _countdownInterval: null,
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

function safeCall(fnName, ...args) {
    if (typeof window[fnName] === 'function') {
        return window[fnName](...args);
    } else {
        console.warn(`safeCall: ${fnName} is not defined`);
        return Promise.resolve();
    }
}

async function fetchAllData() {
    showToast('Fetching data from GitHub...', 'info');
    safeCall('updateTerminalLoading');

    try {
        try {
            AppState.profile = await fetchJSON(`${API_BASE}/orgs/${GITHUB_ORG}`);
            AppState.isOrg = true;
        } catch {
            AppState.profile = await fetchJSON(`${API_BASE}/users/${GITHUB_ORG}`);
            AppState.isOrg = false;
        }

        const type = AppState.isOrg ? 'orgs' : 'users';
        let repos = [], page = 1;
        while (true) {
            const batch = await fetchJSON(
                `${API_BASE}/${type}/${GITHUB_ORG}/repos?per_page=100&page=${page}&sort=updated`
            );
            if (!batch.length) break;
            repos = repos.concat(batch);
            if (batch.length < 100) break;
            page++;
        }
        AppState.repos = repos;

        try {
            AppState.events = await fetchJSON(
                `${API_BASE}/${type}/${GITHUB_ORG}/events?per_page=30`
            );
        } catch {
            AppState.events = [];
        }

        safeCall('renderProfile', AppState.profile);
        safeCall('renderHeroStats', AppState.profile, repos);
        safeCall('renderRepos');
        await safeCall('renderReleases', repos);
        safeCall('renderActivity', AppState.events);
        safeCall('renderLanguageChart', repos);
        safeCall('renderHeatmap', AppState.events);
        await safeCall('renderContributors', repos);
        safeCall('updateTerminalSuccess', repos, AppState.events);
        safeCall('updateTicker', AppState.events);
        safeCall('updateStatusBar', repos);
        updateLastRefresh();
        checkRateLimit();

        showToast('Data loaded successfully!', 'success');
    } catch (err) {
        console.error('Fetch error:', err);
        showToast('Failed to fetch: ' + err.message, 'error');
        safeCall('updateTerminalError', err.message);
    }
}

async function checkRateLimit() {
    try {
        const data = await fetchJSON(`${API_BASE}/rate_limit`);
        const core = data.resources.core;
        const used = core.limit - core.remaining;
        const pct = (used / core.limit) * 100;
        const fill = $('#rateBarFill');
        const text = $('#rateLimitText');
        const status = $('#statusRate');
        if (fill) fill.style.width = `${100 - pct}%`;
        if (text) text.textContent = `${core.remaining} / ${core.limit}`;
        if (status) status.innerHTML = `<i class="fas fa-gauge"></i> Rate: ${core.remaining}/${core.limit}`;
    } catch {}
}

function updateLastRefresh() {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const el = $('#lastRefresh');
    if (el) el.textContent = `${date} at ${time}`;
}

function updateStatusBar(repos) {
    const el = $('#statusRepos');
    if (el) el.innerHTML = `<i class="fas fa-circle-check"></i> ${repos.length} repos loaded`;
}

window.fetchAllData = fetchAllData;
window.updateStatusBar = updateStatusBar;