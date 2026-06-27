// ============================================
// Theme management
// ============================================

function initTheme() {
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon(saved);
    updateThemeButtons(saved);

    const toggle = $('#themeToggle');
    if (toggle) toggle.addEventListener('click', toggleTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeIcon(theme);
    updateThemeButtons(theme);
}

function updateThemeIcon(theme) {
    const icon = $('#themeIcon');
    if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function updateThemeButtons(theme) {
    $$('[data-theme-set]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.themeSet === theme);
    });
}

window.initTheme = initTheme;
window.toggleTheme = toggleTheme;
window.setTheme = setTheme;