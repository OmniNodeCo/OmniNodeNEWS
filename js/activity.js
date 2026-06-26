// ============================================
// Activity feed rendering
// ============================================

function renderActivity(events) {
    const timeline = $('#activityTimeline');
    const empty = $('#activityEmpty');
    if (!events || !events.length) { timeline.innerHTML = ''; empty.classList.remove('hidden'); return; }
    empty.classList.add('hidden');

    timeline.innerHTML = events.slice(0, 20).map(e => {
        const { icon, iconClass, title, desc } = parseEvent(e);
        return `
        <div class="activity-item">
            <div class="activity-icon ${iconClass}"><i class="${icon}"></i></div>
            <div class="activity-content">
                <div class="activity-title">${title}</div>
                ${desc ? `<div class="activity-desc">${desc}</div>` : ''}
                <div class="activity-time"><i class="far fa-clock"></i> ${timeAgo(e.created_at)}</div>
            </div>
        </div>`;
    }).join('');
}

function parseEvent(e) {
    const repo = e.repo ? e.repo.name.split('/')[1] : '';
    const repoLink = e.repo ? `<a href="https://github.com/${e.repo.name}" target="_blank">${escapeHtml(repo)}</a>` : '';
    const actor = e.actor ? escapeHtml(e.actor.login) : 'Unknown';
    const p = e.payload || {};

    const map = {
        PushEvent: () => {
            const commits = p.commits || [];
            return { icon: 'fas fa-code-commit', iconClass: 'push', title: `${actor} pushed ${commits.length} commit${commits.length !== 1 ? 's' : ''} to ${repoLink}`, desc: commits[0] ? escapeHtml(commits[0].message.split('\n')[0]) : '' };
        },
        CreateEvent: () => ({ icon: 'fas fa-plus', iconClass: 'create', title: `${actor} created ${p.ref_type}${p.ref ? ` <code>${escapeHtml(p.ref)}</code>` : ''} in ${repoLink}`, desc: '' }),
        DeleteEvent: () => ({ icon: 'fas fa-trash', iconClass: 'delete', title: `${actor} deleted ${p.ref_type} in ${repoLink}`, desc: '' }),
        IssuesEvent: () => ({ icon: 'fas fa-circle-dot', iconClass: 'issue', title: `${actor} ${p.action} issue in ${repoLink}`, desc: p.issue ? escapeHtml(p.issue.title) : '' }),
        IssueCommentEvent: () => ({ icon: 'fas fa-comment', iconClass: 'issue', title: `${actor} commented on issue in ${repoLink}`, desc: p.issue ? escapeHtml(p.issue.title) : '' }),
        PullRequestEvent: () => ({ icon: 'fas fa-code-pull-request', iconClass: 'pr', title: `${actor} ${p.action} PR in ${repoLink}`, desc: p.pull_request ? escapeHtml(p.pull_request.title) : '' }),
        ForkEvent: () => ({ icon: 'fas fa-code-branch', iconClass: 'fork', title: `${actor} forked ${repoLink}`, desc: '' }),
        WatchEvent: () => ({ icon: 'fas fa-star', iconClass: 'star', title: `${actor} starred ${repoLink}`, desc: '' }),
        ReleaseEvent: () => ({ icon: 'fas fa-rocket', iconClass: 'release', title: `${actor} released in ${repoLink}`, desc: p.release ? escapeHtml(p.release.name || p.release.tag_name) : '' }),
    };

    const handler = map[e.type];
    if (handler) return handler();
    return { icon: 'fas fa-circle', iconClass: 'default', title: `${actor} → ${e.type.replace('Event', '')} on ${repoLink}`, desc: '' };
}