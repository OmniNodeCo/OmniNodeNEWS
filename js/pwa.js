// ============================================
// PWA / Service Worker / Install
// ============================================

function initPWA() {
    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    }

    // Install prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        $('#installCard').style.display = 'block';
    });

    $('#installBtn').addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        if (result.outcome === 'accepted') showToast('App installed!', 'success');
        deferredPrompt = null;
        $('#installCard').style.display = 'none';
    });
}