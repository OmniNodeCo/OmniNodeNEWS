// ============================================
// Utility functions
// ============================================

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function escapeHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function timeAgo(dateStr) {
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
    if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
    return `${Math.floor(diff / 31536000)}y ago`;
}

function formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
}

function animateNumber(el, target) {
    const duration = 1200;
    const startTime = performance.now();
    function update(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = formatNumber(Math.floor(target * eased));
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function showToast(message, type = 'info') {
    const container = $('#toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${escapeHtml(message)}`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('fade-out'); setTimeout(() => toast.remove(), 300); }, 3000);
}

function getLanguageColor(lang) {
    const c = {
        'JavaScript':'#f1e05a','TypeScript':'#3178c6','Python':'#3572A5','Java':'#b07219',
        'Go':'#00ADD8','Rust':'#dea584','C++':'#f34b7d','C':'#555555','C#':'#178600',
        'Ruby':'#701516','PHP':'#4F5D95','Swift':'#F05138','Kotlin':'#A97BFF','Dart':'#00B4AB',
        'Shell':'#89e051','HTML':'#e34c26','CSS':'#563d7c','SCSS':'#c6538c','Vue':'#41b883',
        'Svelte':'#ff3e00','Lua':'#000080','R':'#198CE7','Scala':'#c22d40','Haskell':'#5e5086',
        'Elixir':'#6e4a7e','Dockerfile':'#384d54','Zig':'#ec915c','Jupyter Notebook':'#DA5B0B',
        'Nix':'#7e7eff','OCaml':'#3be133','Makefile':'#427819',
    };
    return c[lang] || '#8b8b8b';
}

// Simple markdown-to-HTML (no dependencies)
function simpleMarkdown(text) {
    if (!text) return '<p>No content available.</p>';
    let html = escapeHtml(text);
    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    // Bold/italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    // Inline code
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    // Links
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>');
    // Images
    html = html.replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" loading="lazy">');
    // Blockquotes
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
    // Unordered lists
    html = html.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    // Line breaks → paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    if (!html.startsWith('<')) html = '<p>' + html + '</p>';
    return html;
}