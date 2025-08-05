// ==== GESTION DES COOKIES - Version complète ====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🍪 Cookies.js chargé');

    // Initialisation
    checkCookieConsent();
    autoLoadCalendarIfConsented();
    setupEventListeners();
    setupMobileMenu();
    setupScrollEffects();
    setupSmoothScrolling();
});

// ==== VÉRIFICATION ET AFFICHAGE DE LA BANNIÈRE ====
function checkCookieConsent() {
    const consent = localStorage.getItem('cookie-consent');
    const banner = document.getElementById('cookie-banner');

    console.log('Vérification consentement:', consent);

    if (!consent && banner) {
        banner.style.display = 'block';
        console.log('✅ Bannière affichée');
    } else if (banner) {
        banner.style.display = 'none';
        console.log('Bannière masquée - consentement:', consent);
    }
}

// ==== GESTION DES ÉVÉNEMENTS ====
function setupEventListeners() {
    // Boutons de la bannière
    const acceptAllBtn = document.querySelector('[data-action="accept-all"]');
    const acceptEssentialBtn = document.querySelector('[data-action="accept-essential"]');

    if (acceptAllBtn) {
        acceptAllBtn.addEventListener('click', acceptAllCookies);
        console.log('✅ Bouton "Accepter tout" connecté');
    }

    if (acceptEssentialBtn) {
        acceptEssentialBtn.addEventListener('click', acceptEssentialOnly);
        console.log('✅ Bouton "Essentiel uniquement" connecté');
    }

    // Boutons de la page cookies.html (si présents)
    setupCookiesPageButtons();

    // Gestion du calendrier
    setupCalendarButtons();
}

// ==== FONCTIONS PRINCIPALES COOKIES ====
function acceptAllCookies() {
    localStorage.setItem('cookie-consent', 'all');
    localStorage.setItem('calendar-consent', 'true');
    hideCookieBanner();
    showMessage('Tous les cookies acceptés');
    autoLoadCalendarIfConsented();
    console.log('✅ Tous les cookies acceptés');
}

function acceptEssentialOnly() {
    localStorage.setItem('cookie-consent', 'essential');
    localStorage.removeItem('calendar-consent');
    hideCookieBanner();
    showMessage('Seuls les cookies essentiels sont utilisés');
    console.log('✅ Cookies essentiels uniquement acceptés');
}

function hideCookieBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner) {
        banner.style.display = 'none';
    }
}

function showMessage(text) {
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed; top: 20px; right: 20px; background: #c9a96e;
        color: white; padding: 1rem; border-radius: 6px; z-index: 10001;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-family: inherit;
        font-size: 0.9rem;
    `;
    message.textContent = text;
    document.body.appendChild(message);
    setTimeout(() => {
        if (message.parentNode) {
            message.remove();
        }
    }, 3000);
}

// ==== BOUTONS DE LA PAGE COOKIES.HTML ====
function setupCookiesPageButtons() {
    // Ces fonctions sont appelées par onclick dans cookies.html
    // On les rend disponibles globalement
    window.acceptAllCookies = acceptAllCookies;
    window.acceptEssentialOnly = acceptEssentialOnly;
}

// ==== GESTION DU CALENDRIER GOOGLE ====
function setupCalendarButtons() {
    const loadCalendarBtn = document.getElementById('loadCalendarBtn');
    const acceptCalendarBtn = document.querySelector('[data-action="accept-calendar"]');
    const cancelCalendarBtn = document.querySelector('[data-action="cancel-calendar"]');

    if (loadCalendarBtn) {
        loadCalendarBtn.addEventListener('click', loadGoogleCalendar);
    }

    if (acceptCalendarBtn) {
        acceptCalendarBtn.addEventListener('click', acceptCalendar);
    }

    if (cancelCalendarBtn) {
        cancelCalendarBtn.addEventListener('click', cancelCalendar);
    }
}

function loadGoogleCalendar() {
    const calendarConsent = localStorage.getItem('calendar-consent');
    if (calendarConsent === 'true') {
        showCalendar();
    } else {
        const consentDiv = document.getElementById('calendarConsent');
        const loadBtn = document.getElementById('loadCalendarBtn');
        if (consentDiv) consentDiv.style.display = 'block';
        if (loadBtn) loadBtn.style.display = 'none';
    }
}

function acceptCalendar() {
    localStorage.setItem('calendar-consent', 'true');
    const consentDiv = document.getElementById('calendarConsent');
    if (consentDiv) consentDiv.style.display = 'none';
    showCalendar();
    showMessage('Calendrier Google chargé');
}

function cancelCalendar() {
    const consentDiv = document.getElementById('calendarConsent');
    const loadBtn = document.getElementById('loadCalendarBtn');
    if (consentDiv) consentDiv.style.display = 'none';
    if (loadBtn) loadBtn.style.display = 'inline-block';
}

function showCalendar() {
    // IMPORTANT: Remplacez par votre vraie URL d'intégration Google Calendar
    const calendarUrl = "https://calendar.google.com/calendar/embed?src=museefrancais40%40gmail.com&ctz=Europe%2FBrussels";

    const iframe = document.getElementById('googleCalendar');
    const loadBtn = document.getElementById('loadCalendarBtn');

    if (iframe && !iframe.src) {
        iframe.src = calendarUrl;
        iframe.style.display = 'block';
        console.log('✅ Calendrier Google chargé');
    }
    if (loadBtn) {
        loadBtn.style.display = 'none';
    }
}

function autoLoadCalendarIfConsented() {
    const calendarConsent = localStorage.getItem('calendar-consent');
    const cookieConsent = localStorage.getItem('cookie-consent');

    if (calendarConsent === 'true' || cookieConsent === 'all') {
        showCalendar();
        const loadBtn = document.getElementById('loadCalendarBtn');
        const consentDiv = document.getElementById('calendarConsent');
        if (loadBtn) loadBtn.style.display = 'none';
        if (consentDiv) consentDiv.style.display = 'none';
    }
}

// ==== MENU MOBILE ====
function setupMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
}

function toggleMobileMenu() {
    const nav = document.getElementById('mainNav');
    const btn = document.querySelector('.mobile-menu-btn');

    if (nav && btn) {
        const isExpanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', !isExpanded);
        nav.classList.toggle('show');
    }
}

// ==== EFFETS DE SCROLL ====
function setupScrollEffects() {
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.site-header');
        if (header) {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    });
}

// ==== SMOOTH SCROLLING ====
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const header = document.querySelector('.site-header');
                const headerHeight = header ? header.offsetHeight : 0;
                const targetPosition = target.offsetTop - headerHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                target.focus();
            }
        });
    });
}

// ==== FONCTIONS DE TEST (pour test-cookies.html) ====
window.showBanner = function() {
    const banner = document.getElementById('cookie-banner');
    if (banner) {
        banner.style.display = 'block';
    }
};

window.hideBanner = function() {
    hideCookieBanner();
};

window.resetEverything = function() {
    localStorage.clear();
    sessionStorage.clear();
    alert('✅ Tous les cookies effacés !\n\n🔄 Rechargez la page (F5) pour voir la bannière apparaître automatiquement.');
};
