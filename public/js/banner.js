// Version hybride : localStorage en local, API en production
console.log('🚀 Banner.js chargé (version hybride)');

// Protection contre le double chargement
if (window.bannerLoaded) {
    console.log('⚠️ Banner.js déjà chargé, abandon');
} else {
    window.bannerLoaded = true;

    // Détecter l'environnement
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    const API_BASE = isProduction ? '' : 'http://localhost:3000';

    console.log(`🌐 Environnement détecté: ${isProduction ? 'PRODUCTION' : 'LOCAL'}`);

    // Fonction de fermeture globale
    window.closeBanner = function(button) {
        console.log('🗙 Fermeture bannière');
        const banner = button.closest('.event-banner');
        if (banner) {
            // Marquer comme fermée selon l'environnement
            if (isProduction) {
                markBannerAsClosedAPI();
            } else {
                markBannerAsClosedLocal();
            }

            banner.style.transition = 'all 0.3s ease';
            banner.style.transform = 'translateY(-20px)';
            banner.style.opacity = '0';
            setTimeout(() => {
                banner.remove();
                console.log('✅ Bannière supprimée');
            }, 300);
        } else {
            console.log('❌ Bannière non trouvée');
        }
    };

    // Marquer comme fermée en production (API)
    async function markBannerAsClosedAPI() {
        try {
            const userId = getUserId();
            const response = await fetch(`${API_BASE}/api/banner/close`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId })
            });

            if (response.ok) {
                console.log('💾 Bannière marquée comme fermée côté serveur');
            } else {
                console.log('⚠️ Erreur API, fallback vers localStorage');
                markBannerAsClosedLocal();
            }
        } catch (error) {
            console.error('❌ Erreur lors de la fermeture API:', error);
            markBannerAsClosedLocal();
        }
    }

    // Marquer comme fermée en local (localStorage)
    function markBannerAsClosedLocal() {
        const currentBanner = localStorage.getItem('currentBanner');
        if (currentBanner) {
            try {
                const bannerData = JSON.parse(currentBanner);
                bannerData.closed = true;
                bannerData.closedAt = new Date().toISOString();
                localStorage.setItem('currentBanner', JSON.stringify(bannerData));
                console.log('💾 Bannière marquée comme fermée localement');
            } catch (error) {
                console.error('❌ Erreur sauvegarde locale:', error);
            }
        }
    }

    // Générer un ID unique pour le visiteur
    function getUserId() {
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('userId', userId);
        }
        return userId;
    }

    // Chargement et affichage
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📋 Vérification bannière...');

        if (isProduction) {
            loadBannerFromServer();
        } else {
            console.log('🏠 Mode local: utilisation de localStorage');
            loadBannerFromLocalStorage();
        }
    });

    // Charger depuis le serveur (production uniquement)
    async function loadBannerFromServer() {
        try {
            const userId = getUserId();
            const response = await fetch(`${API_BASE}/api/banner/current?userId=${userId}`);

            if (!response.ok) {
                console.log('ℹ️ Pas de bannière disponible sur le serveur');
                return;
            }

            const data = await response.json();

            if (!data.banner) {
                console.log('ℹ️ Aucune bannière active');
                return;
            }

            if (data.userHasClosed) {
                console.log('🚫 Bannière fermée par cet utilisateur');
                return;
            }

            const banner = data.banner;
            console.log('📄 Bannière serveur trouvée:', banner.title);

            if (document.querySelector('.event-banner')) {
                console.log('⚠️ Bannière déjà présente, abandon');
                return;
            }

            waitForFontAwesome().then((fontAwesomeLoaded) => {
                createAndShowBanner(banner, fontAwesomeLoaded);
            });

        } catch (error) {
            console.error('❌ Erreur lors du chargement depuis le serveur:', error);
        }
    }

    // Charger depuis localStorage (local)
    function loadBannerFromLocalStorage() {
        const currentBanner = localStorage.getItem('currentBanner');
        if (!currentBanner) {
            console.log('ℹ️ Pas de bannière sauvegardée localement');
            return;
        }

        try {
            const banner = JSON.parse(currentBanner);
            console.log('📄 Bannière locale trouvée:', banner.title);

            if (banner.closed) {
                console.log('🚫 Bannière fermée localement');
                return;
            }

            if (document.querySelector('.event-banner')) {
                console.log('⚠️ Bannière déjà présente, abandon');
                return;
            }

            waitForFontAwesome().then((fontAwesomeLoaded) => {
                createAndShowBanner(banner, fontAwesomeLoaded);
            });
        } catch (error) {
            console.error('❌ Erreur bannière locale:', error);
        }
    }

    // Fonction pour attendre Font Awesome
    function waitForFontAwesome() {
        return new Promise((resolve) => {
            console.log('🔍 Début détection Font Awesome...');

            let attempts = 0;
            const maxAttempts = 50;

            function checkFontAwesome() {
                attempts++;

                const faLinks = document.querySelectorAll('link[href*="font-awesome"], link[href*="fontawesome"]');

                if (faLinks.length === 0) {
                    if (attempts >= maxAttempts) {
                        resolve(false);
                        return;
                    }
                    setTimeout(checkFontAwesome, 100);
                    return;
                }

                const testIcon = document.createElement('i');
                testIcon.className = 'fa-solid fa-home';
                testIcon.style.cssText = 'position: absolute; left: -9999px; top: -9999px;';
                document.body.appendChild(testIcon);

                requestAnimationFrame(() => {
                    const computedStyle = window.getComputedStyle(testIcon, '::before');
                    const fontFamily = window.getComputedStyle(testIcon).fontFamily;
                    const content = computedStyle.content;

                    const hasCorrectFont = fontFamily.includes('Font Awesome') || fontFamily.includes('FontAwesome');
                    const hasContent = content && content !== 'none' && content !== '""' && content !== 'normal';
                    const hasWidth = testIcon.offsetWidth > 0;

                    document.body.removeChild(testIcon);

                    if (hasCorrectFont && (hasContent || hasWidth)) {
                        console.log('✅ Font Awesome détecté comme fonctionnel');
                        resolve(true);
                    } else if (attempts >= maxAttempts) {
                        console.log('⚠️ Timeout Font Awesome - utilisation des fallbacks');
                        resolve(false);
                    } else {
                        setTimeout(checkFontAwesome, 100);
                    }
                });
            }

            setTimeout(checkFontAwesome, 200);
        });
    }

    function createAndShowBanner(banner, fontAwesomeLoaded = true) {
        if (document.querySelector('.event-banner')) {
            console.log('⚠️ Bannière déjà présente dans le DOM, abandon');
            return;
        }

        console.log('🎨 Création bannière avec Font Awesome:', fontAwesomeLoaded ? 'CHARGÉ' : 'FALLBACK');

        // Style unifié en ocre
        const style = {
            bg: 'rgba(201, 169, 110, 0.08)',
            border: '#c9a96e',
            title: '#c9a96e',
            icon: banner.type === 'event' ? 'fa-calendar-alt' : 'fa-info-circle'
        };

        // Icônes avec fallbacks
        const icons = {
            event: fontAwesomeLoaded ? '<i class="fa-solid fa-calendar-alt"></i>' : '📅',
            info: fontAwesomeLoaded ? '<i class="fa-solid fa-info-circle"></i>' : 'ℹ️',
            clock: fontAwesomeLoaded ? '<i class="fa-solid fa-clock"></i>' : '🕐',
            arrow: fontAwesomeLoaded ? '<i class="fa-solid fa-arrow-right"></i>' : '→',
            close: fontAwesomeLoaded ? '<i class="fa-solid fa-times"></i>' : '✕'
        };

        // Date formatée
        const dateStr = banner.date ? new Date(banner.date).toLocaleDateString('fr-FR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        }) : '';
        const timeStr = banner.time || '';

        // HTML de la bannière
        const bannerHTML = `
            <div class="event-banner" style="
                background: ${style.bg};
                border: 1px solid rgba(201, 169, 110, 0.3);
                border-left: 4px solid ${style.border};
                padding: 24px;
                border-radius: 12px;
                margin: 16px auto 24px auto;
                margin-top: 120px;
                box-shadow: 0 4px 20px rgba(201, 169, 110, 0.15);
                max-width: 1000px;
                width: calc(100% - 48px);
                position: relative;
            ">
                <div style="display: flex; align-items: flex-start; gap: 24px;">
                    ${banner.image ? `
                        <img src="${banner.image}" style="
                            width: 120px;
                            height: 90px;
                            object-fit: cover;
                            border-radius: 8px;
                            flex-shrink: 0;
                        " alt="Image de l'événement">
                    ` : ''}

                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 8px;">
                            <h3 style="
                                margin: 0;
                                color: ${style.title};
                                font-size: 20px;
                                font-weight: 600;
                                font-family: 'Playfair Display', serif;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                            ">
                                <span style="color: ${style.title}; font-size: 16px;">
                                    ${banner.type === 'event' ? icons.event : icons.info}
                                </span>
                                ${banner.title}
                            </h3>

                            ${dateStr || timeStr ? `
                                <div style="
                                    display: flex;
                                    align-items: center;
                                    gap: 6px;
                                    font-size: 14px;
                                    font-weight: 500;
                                    color: ${style.title};
                                    background: rgba(201, 169, 110, 0.1);
                                    padding: 4px 12px;
                                    border-radius: 20px;
                                    white-space: nowrap;
                                ">
                                    <span style="color: ${style.title}; font-size: 12px;">
                                        ${icons.clock}
                                    </span>
                                    <span>${dateStr}${dateStr && timeStr ? ' à ' : ''}${timeStr}</span>
                                </div>
                            ` : ''}
                        </div>

                        <p style="
                            margin: 0 0 16px 0;
                            font-size: 16px;
                            line-height: 1.6;
                            color: #4a4a4a;
                        ">${banner.message}</p>

                        ${banner.link ? `
                            <a href="${banner.link}" target="_blank" rel="noopener noreferrer" style="
                                background: #c9a96e;
                                color: #2a2a2a;
                                padding: 8px 16px;
                                border-radius: 2px;
                                font-weight: 600;
                                font-size: 14px;
                                text-transform: uppercase;
                                text-decoration: none;
                                display: inline-flex;
                                align-items: center;
                                gap: 8px;
                                transition: all 0.3s ease;
                            " onmouseover="this.style.background='#d4b579'" onmouseout="this.style.background='#c9a96e'">
                                En savoir plus
                                <span style="font-size: 11px;">${icons.arrow}</span>
                            </a>
                        ` : ''}
                    </div>

                    <button onclick="window.closeBanner(this)" style="
                        background: rgba(201, 169, 110, 0.1);
                        border: 1px solid rgba(201, 169, 110, 0.3);
                        color: #666;
                        cursor: pointer;
                        padding: 8px;
                        width: 32px;
                        height: 32px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 50%;
                        font-size: 14px;
                        transition: all 0.2s ease;
                        flex-shrink: 0;
                    " onmouseover="this.style.background='rgba(201, 169, 110, 0.2)'" onmouseout="this.style.background='rgba(201, 169, 110, 0.1)'" title="Fermer cette bannière">
                        ${icons.close}
                    </button>
                </div>
            </div>

            <style>
                @media (max-width: 768px) {
                    .event-banner {
                        margin-top: 100px !important;
                        margin-left: 16px !important;
                        margin-right: 16px !important;
                        width: calc(100% - 32px) !important;
                    }
                    .event-banner > div {
                        flex-direction: column !important;
                        gap: 16px !important;
                    }
                }
            </style>
        `;

        // Insertion et animation
        document.body.insertAdjacentHTML('afterbegin', bannerHTML);
        console.log('✅ Bannière insérée');

        const insertedBanner = document.querySelector('.event-banner');
        if (insertedBanner) {
            insertedBanner.style.cssText += `
                display: block !important;
                visibility: visible !important;
                position: relative !important;
                z-index: 999 !important;
            `;

            insertedBanner.style.opacity = '0';
            insertedBanner.style.transform = 'translateY(-20px)';

            setTimeout(() => {
                insertedBanner.style.transition = 'all 0.5s ease';
                insertedBanner.style.opacity = '1';
                insertedBanner.style.transform = 'translateY(0)';
                console.log('✅ Animation terminée');

                setTimeout(() => {
                    console.log(`✅ Bannière affichée avec ${fontAwesomeLoaded ? 'Font Awesome' : 'emojis fallback'}`);
                }, 100);
            }, 100);
        }
    }
}
