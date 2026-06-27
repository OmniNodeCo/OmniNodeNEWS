// ============================================
// PWA / Service Worker / Install
// ============================================

function initPWA() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    }

    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        const card = $('#installCard');
        if (card) card.style.display = 'block';
    });

    const installBtn = $('#installBtn');
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const result = await deferredPrompt.userChoice;
            if (result.outcome === 'accepted') showToast('App installed!', 'success');
            deferredPrompt = null;
            const card = $('#installCard');
            if (card) card.style.display = 'none';
        });
    }
}

window.initPWA = initPWA;