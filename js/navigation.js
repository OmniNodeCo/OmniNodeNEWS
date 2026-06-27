// ============================================
// Navigation & scroll effects
// ============================================

function initNavigation() {
    const mobileBtn = $('#mobileMenuBtn');
    const navLinks = $('#navLinks');

    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            mobileBtn.classList.toggle('active');
            navLinks.classList.toggle('open');
        });

        $$('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileBtn.classList.remove('active');
                navLinks.classList.remove('open');
            });
        });
    }

    const navbar = $('#navbar');
    const scrollTopBtn = $('#scrollTop');
    const sections = $$('section[id], header[id]');

    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        if (navbar) navbar.classList.toggle('scrolled', y > 50);
        if (scrollTopBtn) scrollTopBtn.classList.toggle('visible', y > 400);

        let current = '';
        sections.forEach(s => { if (y >= s.offsetTop - 120) current = s.id; });
        $$('.nav-link').forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${current}`));
    });

    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    const yearEl = $('#currentYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const refreshBtn = $('#refreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', fetchAllData);
}

window.initNavigation = initNavigation;