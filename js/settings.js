// ============================================
// Settings drawer
// ============================================

function initSettings() {
    const overlay = $('#settingsOverlay');
    const openBtn = $('#settingsBtn');
    const closeBtn = $('#settingsClose');

    openBtn.addEventListener('click', () => overlay.classList.add('open'));
    closeBtn.addEventListener('click', () => overlay.classList.remove('open'));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });

    // Theme buttons
    $$('[data-theme-set]').forEach(btn => {
        btn.addEventListener('click', () => setTheme(btn.dataset.themeSet));
    });

    // Refresh interval
    const savedRefresh = localStorage.getItem('refresh_minutes') || '5';
    $$('[data-refresh]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.refresh === savedRefresh);
        btn.addEventListener('click', () => {
            $$('[data-refresh]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const mins = parseInt(btn.dataset.refresh);
            localStorage.setItem('refresh_minutes', btn.dataset.refresh);
            setupAutoRefresh(mins);
        });
    });
    setupAutoRefresh(parseInt(savedRefresh));

    // Token
    const savedToken = localStorage.getItem('gh_token') || '';
    if (savedToken) $('#ghTokenInput').value = '••••••••';
    $('#saveTokenBtn').addEventListener('click', () => {
        const val = $('#ghTokenInput').value.trim();
        if (val && !val.startsWith('••')) {
            localStorage.setItem('gh_token', val);
            showToast('Token saved! Refreshing...', 'success');
            fetchAllData();
        } else if (!val) {
            localStorage.removeItem('gh_token');
            showToast('Token cleared.', 'info');
        }
    });

    // Ticker toggle
    const tickerSaved = localStorage.getItem('ticker') || 'on';
    if (tickerSaved === 'off') $('#tickerBar').classList.add('hidden-ticker');
    $$('[data-ticker]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.ticker === tickerSaved);
        btn.addEventListener('click', () => {
            $$('[data-ticker]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            localStorage.setItem('ticker', btn.dataset.ticker);
            $('#tickerBar').classList.toggle('hidden-ticker', btn.dataset.ticker === 'off');
        });
    });
}

function setupAutoRefresh(minutes) {
    if (AppState.refreshInterval) clearInterval(AppState.refreshInterval);
    AppState.refreshMinutes = minutes;

    if (minutes > 0) {
        AppState.refreshInterval = setInterval(fetchAllData, minutes * 60 * 1000);
        startRefreshCountdown(minutes);
    } else {
        $('#statusRefresh').innerHTML = '<i class="fas fa-clock"></i> Auto-refresh: Off';
    }
}

function startRefreshCountdown(minutes) {
    let secondsLeft = minutes * 60;
    const update = () => {
        const m = Math.floor(secondsLeft / 60);
        const s = secondsLeft % 60;
        $('#statusRefresh').innerHTML = `<i class="fas fa-clock"></i> Refresh: ${m}:${s.toString().padStart(2, '0')}`;
        secondsLeft--;
        if (secondsLeft < 0) secondsLeft = minutes * 60;
    };
    update();
    if (AppState._countdownInterval) clearInterval(AppState._countdownInterval);
    AppState._countdownInterval = setInterval(update, 1000);
}