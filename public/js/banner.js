// Version ultra-simple qui marche à coup sûr
console.log('🚀 Banner.js chargé');

// Protection contre le double chargement
if (window.bannerLoaded) {
    console.log('⚠️ Banner.js déjà chargé, abandon');
} else {
    window.bannerLoaded = true;

    // Fonction de fermeture globale avec sauvegarde
    window.closeBanner = function(button) {
        console.log('🗙 Fermeture bannière');
        const banner = button.closest('.event-banner');
        if (banner) {
            // Marquer comme fermée pour tout le site
            const currentBanner = localStorage.getItem('currentBanner');
            if (currentBanner) {
                try {
                    const bannerData = JSON.parse(currentBanner);
                    bannerData.closed = true;
                    bannerData.closedAt = new Date().toISOString();
                    localStorage.setItem('currentBanner', JSON.stringify(bannerData));
                    console.log('💾 Bannière marquée comme fermée');
                } catch (error) {
                    console.error('❌ Erreur sauvegarde fermeture:', error);
                }
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

    // Chargement et affichage
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📋 Vérification bannière...');

        const currentBanner = localStorage.getItem('currentBanner');
        if (!currentBanner) {
            console.log('ℹ️ Pas de bannière sauvegardée');
            return;
        }

        try {
            const banner = JSON.parse(currentBanner);
            console.log('📄 Bannière trouvée:', banner.title);

            // Vérifier si la bannière a été fermée
            if (banner.closed) {
                console.log('🚫 Bannière fermée par l\'utilisateur, pas d\'affichage');
                return;
            }

            // Vérifier s'il y a déjà une bannière affichée
            if (document.querySelector('.event-banner')) {
                console.log('⚠️ Bannière déjà présente, abandon');
                return;
            }

            // NOUVELLE MÉTHODE: Attendre Font Awesome avec plusieurs vérifications
            waitForFontAwesome().then((fontAwesomeLoaded) => {
                createAndShowBanner(banner, fontAwesomeLoaded);
            });
        } catch (error) {
            console.error('❌ Erreur bannière:', error);
        }
    });

    // Fonction améliorée pour attendre Font Awesome
    function waitForFontAwesome() {
        return new Promise((resolve) => {
            console.log('🔍 Début détection Font Awesome...');

            let attempts = 0;
            const maxAttempts = 50; // 5 secondes max

            function checkFontAwesome() {
                attempts++;

                // Méthode 1: Vérifier si le CSS Font Awesome est chargé
                const faLinks = document.querySelectorAll('link[href*="font-awesome"], link[href*="fontawesome"]');
                console.log(`Tentative ${attempts}: ${faLinks.length} liens Font Awesome trouvés`);

                if (faLinks.length === 0) {
                    console.log('❌ Aucun lien Font Awesome trouvé dans le DOM');
                    if (attempts >= maxAttempts) {
                        resolve(false);
                        return;
                    }
                    setTimeout(checkFontAwesome, 100);
                    return;
                }

                // Méthode 2: Vérifier avec un élément de test
                const testIcon = document.createElement('i');
                testIcon.className = 'fa-solid fa-home';
                testIcon.style.cssText = 'position: absolute; left: -9999px; top: -9999px; font-size: 16px;';
                document.body.appendChild(testIcon);

                // Attendre un frame pour le rendu
                requestAnimationFrame(() => {
                    const computedStyle = window.getComputedStyle(testIcon, '::before');
                    const fontFamily = window.getComputedStyle(testIcon).fontFamily;
                    const content = computedStyle.content;

                    console.log(`Font Family: ${fontFamily}`);
                    console.log(`Content: ${content}`);

                    // Méthode 3: Vérifier plusieurs indicateurs
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
                        console.log(`⏳ Font Awesome pas encore prêt (${attempts}/${maxAttempts})`);
                        setTimeout(checkFontAwesome, 100);
                    }
                });
            }

            // Démarrer la vérification
            setTimeout(checkFontAwesome, 200); // Délai initial plus long
        });
    }

    function createAndShowBanner(banner, fontAwesomeLoaded = true) {
        // Vérifier une dernière fois qu'il n'y a pas déjà une bannière
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

        // HTML simplifié
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
                        <!-- Titre avec date à côté -->
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
                            <a href="${banner.link}" style="
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

                    <!-- Bouton fermer -->
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

        // Insertion avec protection anti-masquage
        document.body.insertAdjacentHTML('afterbegin', bannerHTML);
        console.log('✅ Bannière insérée');

        // FORCER l'affichage (contre tout conflit)
        const insertedBanner = document.querySelector('.event-banner');
        if (insertedBanner) {
            // Style de protection
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

                // Confirmation d'affichage
                setTimeout(() => {
                    console.log(`✅ Bannière affichée avec ${fontAwesomeLoaded ? 'Font Awesome' : 'emojis fallback'}`);
                }, 100);

                // Double vérification après 1 seconde
                setTimeout(() => {
                    if (insertedBanner.style.display === 'none' || insertedBanner.style.visibility === 'hidden') {
                        console.log('🚨 Bannière masquée après coup - correction...');
                        insertedBanner.style.cssText += `
                            display: block !important;
                            visibility: visible !important;
                            opacity: 1 !important;
                        `;
                    }
                }, 1000);
            }, 100);
        }
    }
}
