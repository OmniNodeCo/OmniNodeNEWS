// ============================================
// Live ticker bar
// ============================================

function updateTicker(events) {
    const content = $('#tickerContent');
    if (!events.length) return;

    const items = events.slice(0, 15).map(e => {
        const actor = e.actor ? e.actor.login : '?';
        const repo = e.repo ? e.repo.name.split('/')[1] : '';
        const icons = {
            PushEvent: 'fa-code-commit', CreateEvent: 'fa-plus', WatchEvent: 'fa-star',
            ForkEvent: 'fa-code-branch', IssuesEvent: 'fa-circle-dot',
            PullRequestEvent: 'fa-code-pull-request', ReleaseEvent: 'fa-rocket',
            DeleteEvent: 'fa-trash', IssueCommentEvent: 'fa-comment',
        };
        const icon = icons[e.type] || 'fa-circle';
        const action = e.type.replace('Event', '').replace(/([A-Z])/g, ' $1').trim();
        return `<span class="ticker-item"><i class="fas ${icon}"></i> ${escapeHtml(actor)} → ${action} on ${escapeHtml(repo)}</span>`;
    });

    // Duplicate for seamless loop
    content.innerHTML = items.join('') + items.join('');
}