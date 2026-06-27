// ============================================
// Terminal animation
// ============================================

function updateTerminal(lines) {
    const body = $('#terminalBody');
    if (!body) return;
    body.innerHTML = lines.map(l => {
        if (l.type === 'prompt') return `<div class="terminal-line"><span class="terminal-prompt">$</span> <span class="terminal-output">${escapeHtml(l.text)}</span></div>`;
        return `<div class="terminal-line"><span class="terminal-output ${l.type || ''}">${escapeHtml(l.text)}</span></div>`;
    }).join('');
    body.scrollTop = body.scrollHeight;
}

function updateTerminalLoading() {
    updateTerminal([
        { type: 'prompt', text: `curl api.github.com/orgs/${GITHUB_ORG}` },
        { type: 'info', text: 'Connecting to GitHub API...' },
    ]);
}

function updateTerminalSuccess(repos, events) {
    const lines = [
        { type: 'prompt', text: `fetch --org ${GITHUB_ORG}` },
        { type: 'success', text: '✓ Connected to GitHub API' },
        { type: 'info', text: `Found ${repos.length} repositories` },
        { type: 'info', text: `Loaded ${events.length} events` },
        { type: 'success', text: `Stars: ${repos.reduce((s, r) => s + r.stargazers_count, 0)}` },
        { type: 'success', text: `Forks: ${repos.reduce((s, r) => s + r.forks_count, 0)}` },
    ];
    const top = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 3);
    if (top.length) {
        lines.push({ text: '' }, { type: 'info', text: '── Top Repos ──' });
        top.forEach((r, i) => lines.push({ text: `  ${i + 1}. ${r.name} ★${r.stargazers_count}` }));
    }
    lines.push({ text: '' }, { type: 'success', text: '✓ Dashboard ready.' });
    updateTerminal(lines);
}

function updateTerminalError(msg) {
    updateTerminal([
        { type: 'prompt', text: `fetch --org ${GITHUB_ORG}` },
        { type: 'warning', text: `Error: ${msg}` },
        { type: 'info', text: 'Check settings or try again later.' },
    ]);
}

window.updateTerminalLoading = updateTerminalLoading;
window.updateTerminalSuccess = updateTerminalSuccess;
window.updateTerminalError = updateTerminalError;