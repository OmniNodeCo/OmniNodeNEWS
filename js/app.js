// ============================================
// Main app initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigation();
    initRepoFilters();
    initReadmeModal();
    initCommandPalette();
    initSettings();
    initPWA();
    fetchAllData();
});