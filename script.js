'use strict';

(function () {
    const ROUTES = Object.freeze({
        '/home': { screen: 'home', nav: 'home', title: 'Arvena — Clearer choices for healthier living' },
        '/explore': { screen: 'explore', nav: 'explore', title: 'Explore healthier-living solutions — Arvena' },
        '/solutions/clean-water': { screen: 'clean-water', nav: 'clean-water', title: 'Cleaner drinking water at home — Arvena' },
        '/products/certified-point-of-use-filter': { screen: 'product', nav: 'clean-water', title: 'Certified point-of-use water filter — Arvena' },
        '/request': { screen: 'request', nav: 'clean-water', title: 'Request a verified water-filter option — Arvena' },
        '/result': { screen: 'result', nav: 'clean-water', title: 'Request confirmed — Arvena' },
        '/methodology': { screen: 'methodology', nav: 'methodology', title: 'Methodology and safety — Arvena' }
    });

    const DEFAULT_ROUTE = '/home';
    const LAST_SUBMISSION_KEY = 'arvena-last-submission-at';
    const CONFIRMATION_KEY = 'arvena-confirmation-reference';
    const THEME_KEY = 'arvena-theme';
    const SUBMISSION_COOLDOWN_MS = 45 * 1000;

    const screens = Array.from(document.querySelectorAll('[data-screen]'));
    const navLinks = Array.from(document.querySelectorAll('[data-nav-route]'));
    const menuToggle = document.querySelector('.menu-toggle');
    const primaryNav = document.querySelector('.primary-nav');
    const themeToggle = document.querySelector('.theme-toggle');
    const mainContent = document.getElementById('main-content');
    const form = document.getElementById('water-request-form');
    const formStatus = document.getElementById('form-status');
    const submitButton = document.getElementById('request-submit');
    const notesField = document.getElementById('request-notes');
    const notesCount = document.getElementById('notes-count');
    const confirmationReference = document.getElementById('confirmation-reference');
    let hasHandledInitialRoute = false;

    function getData() {
        return window.ARVENA_DATA || { solutions: [], products: [] };
    }

    function findSolution() {
        return getData().solutions.find((item) => item.slug === 'clean-water-at-home');
    }

    function findProduct() {
        return getData().products.find((item) => item.slug === 'certified-point-of-use-filter');
    }

    function setText(bindName, value) {
        const element = document.querySelector(`[data-bind="${bindName}"]`);
        if (element) element.textContent = value || '';
    }

    function renderStructuredContent() {
        const solution = findSolution();
        const product = findProduct();

        if (!solution || !product) return;

        setText('solution-reviewed-at', solution.reviewedAt);

        const steps = document.getElementById('solution-steps');
        steps.replaceChildren(...solution.steps.map((step) => {
            const item = document.createElement('li');
            const title = document.createElement('h3');
            const text = document.createElement('p');
            title.textContent = step.title;
            text.textContent = step.text;
            item.append(title, text);
            return item;
        }));

        const technologies = document.getElementById('solution-technologies');
        technologies.replaceChildren(...solution.technologies.map((technology) => {
            const article = document.createElement('article');
            article.className = 'technology-card';

            const level = document.createElement('span');
            level.className = 'technology-level';
            level.textContent = technology.level;

            const title = document.createElement('h3');
            title.textContent = technology.name;

            const details = document.createElement('dl');
            const usefulTerm = document.createElement('dt');
            const usefulDefinition = document.createElement('dd');
            const limitTerm = document.createElement('dt');
            const limitDefinition = document.createElement('dd');
            usefulTerm.textContent = 'Potential fit';
            usefulDefinition.textContent = technology.usefulFor;
            limitTerm.textContent = 'Important limit';
            limitDefinition.textContent = technology.limitation;
            details.append(usefulTerm, usefulDefinition, limitTerm, limitDefinition);
            article.append(level, title, details);
            return article;
        }));

        setText('product-title', product.title);
        setText('product-description', product.description);
        setText('product-why-selected', product.whySelected);
        setText('product-problem', product.problem);
        setText('product-materials', product.materials);
        setText('product-price', product.priceLevel);
        setText('product-status', product.status);
        setText('product-availability', product.availability);
        setText('product-reviewed-at', product.reviewedAt);

        const evidenceList = document.getElementById('product-evidence');
        evidenceList.replaceChildren(...product.evidence.map((evidence) => {
            const article = document.createElement('article');
            article.className = 'evidence-item';

            const meta = document.createElement('div');
            meta.className = 'evidence-item-meta';
            const type = document.createElement('span');
            const confidence = document.createElement('strong');
            type.textContent = evidence.type;
            confidence.textContent = evidence.confidence;
            meta.append(type, confidence);

            const content = document.createElement('div');
            const explanation = document.createElement('p');
            const source = document.createElement('a');
            explanation.textContent = evidence.explanation;
            source.className = 'evidence-source';
            source.href = evidence.sourceUrl;
            source.textContent = `${evidence.sourceTitle} →`;
            if (evidence.sourceUrl.startsWith('http')) {
                source.target = '_blank';
                source.rel = 'noreferrer';
            }
            content.append(explanation, source);
            article.append(meta, content);
            return article;
        }));

        const limitations = document.getElementById('product-limitations');
        limitations.replaceChildren(...product.limitations.map((limitation) => {
            const item = document.createElement('li');
            item.textContent = limitation;
            return item;
        }));
    }

    function normaliseRoute() {
        const rawHash = window.location.hash.replace(/^#/, '');
        if (!rawHash || rawHash === '/') return DEFAULT_ROUTE;
        return rawHash.startsWith('/') ? rawHash : `/${rawHash}`;
    }

    function closeMenu({ restoreFocus = false } = {}) {
        if (!menuToggle || !primaryNav) return;
        primaryNav.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.querySelector('.sr-only').textContent = 'Open navigation';
        document.body.classList.remove('nav-open');
        if (restoreFocus) menuToggle.focus();
    }

    function showRoute({ moveFocus = true } = {}) {
        let routePath = normaliseRoute();
        let route = ROUTES[routePath] || { screen: 'not-found', nav: '', title: 'Page not found — Arvena' };

        if (route.screen === 'result' && !sessionStorage.getItem(CONFIRMATION_KEY)) {
            routePath = '/request';
            route = ROUTES[routePath];
            window.history.replaceState(null, '', '#/request');
        }

        screens.forEach((screen) => {
            screen.hidden = screen.dataset.screen !== route.screen;
        });

        navLinks.forEach((link) => {
            if (link.dataset.navRoute === route.nav) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });

        document.title = route.title;
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        closeMenu();

        if (route.screen === 'result') {
            const reference = sessionStorage.getItem(CONFIRMATION_KEY);
            confirmationReference.textContent = reference || 'Not available';
        }

        const shouldMoveFocus = moveFocus && hasHandledInitialRoute;
        hasHandledInitialRoute = true;
        if (shouldMoveFocus) {
            const heading = document.querySelector(`[data-screen="${route.screen}"] h1`);
            if (heading) {
                heading.setAttribute('tabindex', '-1');
                heading.focus({ preventScroll: true });
            } else if (mainContent) {
                mainContent.focus({ preventScroll: true });
            }
        }
    }

    function getInitialTheme() {
        const stored = localStorage.getItem(THEME_KEY);
        if (stored === 'light' || stored === 'dark') return stored;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function applyTheme(theme) {
        document.documentElement.dataset.theme = theme;
        themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
        themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Use light theme' : 'Use dark theme');
    }

    function toggleTheme() {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
    }

    function toggleMenu() {
        const open = menuToggle.getAttribute('aria-expanded') === 'true';
        menuToggle.setAttribute('aria-expanded', String(!open));
        menuToggle.querySelector('.sr-only').textContent = open ? 'Open navigation' : 'Close navigation';
        primaryNav.classList.toggle('is-open', !open);
        document.body.classList.toggle('nav-open', !open);
        if (!open) {
            const firstLink = primaryNav.querySelector('a');
            if (firstLink) firstLink.focus();
        }
    }

    function setFormStatus(message, state = '') {
        formStatus.textContent = message;
        formStatus.className = 'form-status';
        if (state) formStatus.classList.add(`is-${state}`);
    }

    function clearFieldValidity() {
        form.querySelectorAll('[aria-invalid="true"]').forEach((field) => {
            field.removeAttribute('aria-invalid');
        });
    }

    function validateForm() {
        clearFieldValidity();
        const requiredFields = Array.from(form.querySelectorAll('[required]'));
        const firstInvalid = requiredFields.find((field) => !field.checkValidity());
        if (firstInvalid) {
            firstInvalid.setAttribute('aria-invalid', 'true');
            firstInvalid.focus();
            firstInvalid.reportValidity();
            setFormStatus('Please complete the highlighted field before sending.', 'error');
            return false;
        }

        if (form.elements.website.value.trim()) {
            setFormStatus('This request could not be submitted.', 'error');
            return false;
        }

        return true;
    }

    function decodeJwtRole(key) {
        try {
            const payload = key.split('.')[1];
            if (!payload) return '';
            const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
            const normalised = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
            const decoded = JSON.parse(atob(normalised));
            return decoded.role || '';
        } catch (_error) {
            return '';
        }
    }

    function getSupabaseConfig() {
        const config = window.ARVENA_SUPABASE_CONFIG || {};
        const url = String(config.url || '').replace(/\/$/, '');
        const key = String(config.publishableKey || '');
        const table = String(config.table || 'arvena_mvp_requests');
        const urlIsValid = /^https:\/\/[a-z0-9]+\.supabase\.co$/i.test(url);
        const keyIsSecret = key.startsWith('sb_secret_') || decodeJwtRole(key) === 'service_role';
        const keyLooksPublishable = key.startsWith('sb_publishable_') || decodeJwtRole(key) === 'anon';

        if (!urlIsValid || !keyLooksPublishable || keyIsSecret || table !== 'arvena_mvp_requests') {
            throw new Error('The request service is not connected to the dedicated Arvena Supabase project in this checkout. No information was sent.');
        }

        return { url, key, table };
    }

    function createRequestId() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            return window.crypto.randomUUID();
        }
        const bytes = new Uint8Array(16);
        window.crypto.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }

    function cooldownRemaining() {
        const submittedAt = Number(sessionStorage.getItem(LAST_SUBMISSION_KEY) || 0);
        return Math.max(0, SUBMISSION_COOLDOWN_MS - (Date.now() - submittedAt));
    }

    async function submitRequest(event) {
        event.preventDefault();
        setFormStatus('');
        if (!validateForm()) return;

        const remaining = cooldownRemaining();
        if (remaining > 0) {
            setFormStatus(`Please wait ${Math.ceil(remaining / 1000)} seconds before sending another request.`, 'error');
            return;
        }

        let config;
        try {
            config = getSupabaseConfig();
        } catch (error) {
            setFormStatus(error.message, 'error');
            return;
        }

        const requestId = createRequestId();
        const payload = {
            client_request_id: requestId,
            request_type: 'water_filter_match',
            email: form.elements.email.value.trim(),
            country: form.elements.country.value.trim(),
            concern: form.elements.concern.value,
            notes: form.elements.notes.value.trim() || null,
            consent: form.elements.consent.checked,
            solution_slug: 'clean-water-at-home',
            product_slug: 'certified-point-of-use-filter',
            source_path: '#/request'
        };

        submitButton.disabled = true;
        submitButton.textContent = 'Sending request…';
        setFormStatus('Connecting securely to Arvena…', 'pending');

        try {
            const response = await fetch(`${config.url}/rest/v1/${config.table}`, {
                method: 'POST',
                headers: {
                    apikey: config.key,
                    Authorization: `Bearer ${config.key}`,
                    'Content-Type': 'application/json',
                    Prefer: 'return=minimal'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                let code = '';
                try {
                    const errorPayload = await response.json();
                    code = errorPayload.code || '';
                } catch (_error) {
                    code = '';
                }
                throw new Error(code ? `Database request failed (${code}).` : 'The database did not accept the request.');
            }

            const shortReference = `ARV-${requestId.slice(0, 8).toUpperCase()}`;
            sessionStorage.setItem(LAST_SUBMISSION_KEY, String(Date.now()));
            sessionStorage.setItem(CONFIRMATION_KEY, shortReference);
            form.reset();
            notesCount.textContent = '0';
            window.location.hash = '#/result';
        } catch (error) {
            const message = error instanceof TypeError
                ? 'Arvena could not reach the request service. Check the connection and try again; no success was recorded.'
                : `${error.message} No success was recorded.`;
            setFormStatus(message, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Send sourcing request';
        }
    }

    renderStructuredContent();
    applyTheme(getInitialTheme());
    showRoute({ moveFocus: false });

    window.addEventListener('hashchange', () => showRoute());
    themeToggle.addEventListener('click', toggleTheme);
    menuToggle.addEventListener('click', toggleMenu);
    primaryNav.addEventListener('click', (event) => {
        if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && primaryNav.classList.contains('is-open')) {
            closeMenu({ restoreFocus: true });
        }
    });
    window.addEventListener('resize', () => {
        if (window.innerWidth > 900) closeMenu();
    });
    notesField.addEventListener('input', () => {
        notesCount.textContent = String(notesField.value.length);
    });
    form.addEventListener('submit', submitRequest);
})();
