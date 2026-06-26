// ============================================
// Navigation & scroll effects
// ============================================

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
        });
    });

    // Scroll effects
    const navbar = $('#navbar');
    const scrollTopBtn = $('#scrollTop');
    const sections = $$('section[id], header[id]');

    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        navbar.classList.toggle('scrolled', y > 50);
        scrollTopBtn.classList.toggle('visible', y > 400);

        let current = '';
        sections.forEach(s => { if (y >= s.offsetTop - 120) current = s.id; });
        $$('.nav-link').forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${current}`));
    });

    scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // Year
    $('#currentYear').textContent = new Date().getFullYear();

    // Refresh button
    $('#refreshBtn').addEventListener('click', fetchAllData);
}