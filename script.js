'use strict';

(function () {
    const ROUTES = Object.freeze({
        '/cabinet': { screen: 'platform', nav: '', title: 'Cabinet | Arvena' },
        '/cabinet/account': { screen: 'platform', nav: '', title: 'Account | Arvena' },
        '/cabinet/interests': { screen: 'platform', nav: '', title: 'Interests | Arvena' },
        '/provider-space': { screen: 'platform', nav: '', title: 'Provider space | Arvena' },
        '/editorial': { screen: 'platform', nav: '', title: 'Editorial | Arvena' },
        '/home': { screen: 'home', nav: 'home', title: 'Arvena | Curated marketplace for better living' },
        '/explore': { screen: 'explore', nav: 'explore', title: 'Explore | Arvena' },
        '/solutions': { screen: 'solutions', nav: 'solutions', title: 'Solution areas | Arvena' },
        '/solutions/clean-water': { screen: 'clean-water', nav: 'solutions', title: 'Clean Water | Arvena' },
        '/solution-classes/point-of-use-filtration': { screen: 'solution-class', nav: 'solutions', title: 'Point-of-use filtration | Arvena' },
        '/products/certified-point-of-use-filter': { screen: 'solution-class', nav: 'solutions', title: 'Point-of-use filtration | Arvena' },
        '/offers': { screen: 'offers', nav: 'explore', title: 'Offers | Arvena' },
        '/providers': { screen: 'providers', nav: 'explore', title: 'Providers | Arvena' },
        '/integrated-solutions': { screen: 'integrated', nav: 'solutions', title: 'Integrated solutions | Arvena' },
        '/how-we-select': { screen: 'methodology', nav: 'how-we-select', title: 'How Arvena selects | Arvena' },
        '/methodology': { screen: 'methodology', nav: 'how-we-select', title: 'How Arvena selects | Arvena' },
        '/craft-local': { screen: 'craft', nav: 'solutions', title: 'Craft, local production and conscious sourcing | Arvena' },
        '/about': { screen: 'about', nav: 'about', title: 'About | Arvena' },
        '/development': { screen: 'development', nav: 'about', title: 'Development, research and accessibility | Arvena' },
        '/participate': { screen: 'participate', nav: 'participate', title: 'Participate | Arvena' },
        '/participate/producers': { screen: 'producers', nav: 'participate', title: 'For producers and specialists | Arvena' },
        '/participate/work': { screen: 'work', nav: 'participate', title: 'Work with Arvena | Arvena' },
        '/contact': { screen: 'contact', nav: 'participate', title: 'Contact | Arvena' },
        '/request': { screen: 'request', nav: 'solutions', title: 'Clean Water sourcing status | Arvena' },
        '/result': { screen: 'result', nav: 'solutions', title: 'Request confirmed | Arvena' }
    });

    const DEFAULT_ROUTE = '/home';
    const LAST_SUBMISSION_KEY = 'arvena-last-submission-at';
    const CONFIRMATION_KEY = 'arvena-confirmation-reference';
    const THEME_KEY = 'arvena-theme';
    const SUBMISSION_COOLDOWN_MS = 45 * 1000;
    const REQUEST_UNAVAILABLE_MESSAGE = 'Clean Water sourcing requests are not currently open.';

    const screens = Array.from(document.querySelectorAll('[data-screen], .screen[id^="screen-"]'));
    const navLinks = Array.from(document.querySelectorAll('[data-route-link], [data-nav-route]'));
    const skipLink = document.querySelector('[data-skip-link]');
    const menuToggle = document.querySelector('.menu-toggle');
    const primaryNav = document.querySelector('.primary-nav');
    const mobileNavigationQuery = window.matchMedia('(max-width: 900px)');
    const themeToggle = document.querySelector('.theme-toggle');
    const mainContent = document.getElementById('main-content');
    const form = document.getElementById('water-request-form');
    const formStatus = document.getElementById('form-status');
    const requestFields = document.getElementById('request-fields');
    const requestAvailabilityNotice = document.getElementById('request-availability-notice');
    const requestAvailabilityText = requestAvailabilityNotice?.querySelector('p') || null;
    const requestTitle = document.getElementById('request-title');
    const requestIntro = document.getElementById('request-intro');
    const submitButton = document.getElementById('request-submit');
    const notesField = document.getElementById('request-notes');
    const notesCount = document.getElementById('notes-count');
    const confirmationReference = document.getElementById('confirmation-reference');
    let hasHandledInitialRoute = false;

    const exploreSearch = document.getElementById('explore-search');
    const exploreDomainFilter = document.getElementById('explore-domain-filter');
    const exploreTypeFilter = document.getElementById('explore-type-filter');
    const exploreForm = document.querySelector('#screen-explore .catalogue-controls');
    const exploreResults = document.getElementById('explore-results');
    const exploreResultCount = document.getElementById('explore-result-count');
    const exploreEmpty = document.getElementById('explore-empty');
    const exploreClear = document.getElementById('explore-clear');

    function getData() {
        const data = window.ARVENA_DATA || {};
        return {
            meta: data.meta || {},
            domains: Array.isArray(data.domains) ? data.domains : [],
            discoveryRecords: [...(data.discoveryRecords || []), ...(window.ArvenaKnowledge?.records() || []), ...(window.ArvenaPlatform?.discoveryRecords() || [])],
            offers: Array.isArray(data.offers) ? data.offers : [],
            providers: Array.isArray(data.providers) ? data.providers : []
        };
    }

    function findDiscoveryRecord(recordType, slug) {
        return getData().discoveryRecords.find((record) => (
            record.recordType === recordType && record.slug === slug
        ));
    }

    function findCleanWaterGuide() {
        return findDiscoveryRecord('guide', 'clean-water-at-home');
    }

    function findPointOfUseSolutionClass() {
        return findDiscoveryRecord('solution-class', 'point-of-use-filtration');
    }

    function byId(id, legacyId = '') {
        return document.getElementById(id) || (legacyId ? document.getElementById(legacyId) : null);
    }

    function setText(bindName, value) {
        document.querySelectorAll(`[data-bind="${bindName}"]`).forEach((element) => {
            element.textContent = value || '';
        });
    }

    function setTextById(id, value, legacyBindName = '') {
        const element = document.getElementById(id);
        if (element) element.textContent = value || '';
        if (legacyBindName) setText(legacyBindName, value);
    }

    function recordTypeLabel(recordType) {
        if (recordType === 'direction') return 'Direction · knowledge';
        if (recordType === 'context') return 'Context · knowledge';
        return recordType === 'offer' ? 'Offer' : recordType === 'solution-class' ? 'Solution class' : 'Guide';
    }

    function recordRoute(record) {
        if (record.route) return record.route;
        if (record.recordType === 'offer') return '#/offers/' + record.slug;
        return record.recordType === 'solution-class'
            ? '#/solution-classes/point-of-use-filtration'
            : '#/solutions/clean-water';
    }

    function createDomainCard(domain, compact = false) {
        const article = document.createElement('article');
        article.className = `domain-card domain-card--${domain.status}${compact ? ' domain-card--compact' : ''}`;

        const status = document.createElement('span');
        status.className = 'domain-card-status';
        status.textContent = domain.slug === 'water' ? 'Topic map and detailed material' : 'Topic map available';

        const title = document.createElement('h3');
        title.textContent = domain.title;

        const description = document.createElement('p');
        description.className = 'domain-card-copy';
        description.textContent = window.ARVENA_KNOWLEDGE.domains.find(d => d.slug === domain.slug)?.description || domain.description;

        article.append(status, title, description);

        {
            const link = document.createElement('a');
            link.className = 'domain-card-link';
            link.href = '#/solutions/' + domain.slug;
            link.textContent = 'Explore this direction';
            article.append(link);
        }

        return article;
    }

    function renderDomains() {
        const domains = getData().domains;
        const homePreview = document.getElementById('home-domain-preview');
        const solutionGrid = document.getElementById('solutions-domain-grid');
        const developingList = document.getElementById('developing-domain-list');

        if (homePreview) {
            homePreview.replaceChildren(...domains.map((domain) => createDomainCard(domain, true)));
        }
        if (solutionGrid) {
            solutionGrid.replaceChildren(...domains.map((domain) => createDomainCard(domain)));
        }
        if (developingList) {
            const itemTag = developingList.matches('ul, ol') ? 'li' : 'span';
            const items = domains
                .filter((domain) => domain.status === 'developing')
                .map((domain) => {
                    const item = document.createElement(itemTag);
                    item.textContent = domain.title;
                    return item;
                });
            developingList.replaceChildren(...items);
        }
    }

    function populateFilter(select, entries, defaultLabel) {
        if (!select) return;
        select.replaceChildren();

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = defaultLabel;
        select.append(defaultOption);

        entries.forEach(({ value, label }) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            select.append(option);
        });
    }

    function createDiscoveryCard(record, domainBySlug) {
        const article = document.createElement('article');
        article.className = 'discovery-card';

        const meta = document.createElement('div');
        meta.className = 'discovery-card-meta';

        const type = document.createElement('span');
        type.className = 'discovery-card-type';
        type.textContent = recordTypeLabel(record.recordType);

        const status = document.createElement('span');
        status.className = 'status-badge';
        status.textContent = record.publicationLabel || (record.publicationStatus === 'published' ? 'Published' : 'Developing');
        meta.append(type, status);

        const title = document.createElement('h3');
        title.textContent = record.title;

        const domain = document.createElement('p');
        domain.className = 'discovery-card-domain';
        domain.textContent = domainBySlug.get(record.domainSlug)?.title || '';

        const summary = document.createElement('p');
        summary.className = 'discovery-card-copy';
        summary.textContent = record.description || record.problem || '';

        const link = document.createElement('a');
        link.className = 'text-link';
        link.href = recordRoute(record);
        link.textContent = record.recordType === 'offer' ? 'View offer' : record.recordType === 'solution-class' ? 'Explore solution class' : record.route ? 'Read topic' : 'Read guide';

        article.append(meta, title, domain, summary, link);
        return article;
    }

    function searchableRecordText(record) {
        const approachText = Array.isArray(record.approaches)
            ? record.approaches.map((approach) => `${approach.name} ${approach.usefulFor} ${approach.limitation}`).join(' ')
            : '';
        return [record.title, record.problem, record.description, record.whyIncluded, record.searchTerms, approachText]
            .filter(Boolean)
            .join(' ')
            .toLocaleLowerCase('en');
    }

    function renderExploreResults() {
        if (!exploreResults) return;

        const data = getData();
        const query = (exploreSearch?.value || '').trim().toLocaleLowerCase('en');
        const domainValue = exploreDomainFilter?.value || '';
        const typeValue = exploreTypeFilter?.value || '';
        const domainBySlug = new Map(data.domains.map((domain) => [domain.slug, domain]));
        const matchingRecords = data.discoveryRecords.filter((record) => (
            (!query || searchableRecordText(record).includes(query))
            && (!domainValue || record.domainSlug === domainValue || record.domainSlugs?.includes(domainValue))
            && (!typeValue || record.recordType === typeValue)
        ));

        exploreResults.replaceChildren(...matchingRecords.map((record) => createDiscoveryCard(record, domainBySlug)));

        if (exploreResultCount) {
            const offerCount = matchingRecords.filter(r => r.recordType === 'offer').length;
            exploreResultCount.textContent = `${matchingRecords.length - offerCount} knowledge records · ${window.ArvenaPlatform?.catalogueState === 'ready' ? offerCount + ' offers' : 'offer availability not confirmed'}`;
        }
        if (exploreEmpty) exploreEmpty.hidden = matchingRecords.length > 0;
    }

    function setupExplore() {
        const data = getData();
        const domainBySlug = new Map(data.domains.map((domain) => [domain.slug, domain]));
        const domainSlugs = [...new Set(data.discoveryRecords.map((record) => record.domainSlug))];
        const recordTypes = [...new Set([...data.discoveryRecords.map((record) => record.recordType), 'offer'])];

        populateFilter(
            exploreDomainFilter,
            domainSlugs.map((slug) => ({ value: slug, label: domainBySlug.get(slug)?.title || slug })),
            'All published domains'
        );
        populateFilter(
            exploreTypeFilter,
            recordTypes.map((recordType) => ({ value: recordType, label: recordTypeLabel(recordType) })),
            'All record types'
        );

        [exploreSearch, exploreDomainFilter, exploreTypeFilter].forEach((control) => {
            if (!control) return;
            control.addEventListener(control === exploreSearch ? 'input' : 'change', renderExploreResults);
        });
        if (exploreForm) {
            exploreForm.addEventListener('submit', (event) => {
                event.preventDefault();
                renderExploreResults();
            });
        }
        const clearControls = [exploreClear, ...document.querySelectorAll('[data-explore-clear]')]
            .filter((control, index, controls) => control && controls.indexOf(control) === index);
        clearControls.forEach((control) => {
            control.addEventListener('click', () => {
                if (exploreSearch) exploreSearch.value = '';
                if (exploreDomainFilter) exploreDomainFilter.value = '';
                if (exploreTypeFilter) exploreTypeFilter.value = '';
                renderExploreResults();
                if (exploreSearch) exploreSearch.focus();
            });
        });

        renderExploreResults();
    }

    function createEvidenceItem(evidence) {
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
        source.textContent = evidence.sourceTitle;
        if (evidence.sourceUrl.startsWith('http')) {
            source.target = '_blank';
            source.rel = 'noopener noreferrer';
            const indicator = document.createElement('span');
            indicator.className = 'external-link-indicator';
            indicator.setAttribute('aria-hidden', 'true');
            indicator.textContent = ' ↗';
            const accessLabel = document.createElement('span');
            accessLabel.className = 'sr-only';
            accessLabel.textContent = ' (opens in a new tab)';
            source.append(indicator, accessLabel);
            source.dataset.externalReady = 'true';
        }
        content.append(explanation, source);
        article.append(meta, content);
        return article;
    }

    function renderCleanWaterGuide(guide) {
        if (!guide) return;

        setTextById('solution-title', guide.title);
        setTextById('solution-problem', guide.problem);
        setTextById('solution-updated', guide.updatedAt, 'solution-updated-at');

        const steps = document.getElementById('solution-steps');
        if (steps) {
            steps.replaceChildren(...guide.steps.map((step) => {
                const item = document.createElement('li');
                const title = document.createElement('h3');
                const text = document.createElement('p');
                title.textContent = step.title;
                text.textContent = step.text;
                item.append(title, text);
                return item;
            }));
        }

        const approaches = byId('technology-grid', 'solution-technologies');
        if (approaches) {
            approaches.replaceChildren(...guide.approaches.map((approach) => {
                const article = document.createElement('article');
                article.className = 'technology-card';

                const level = document.createElement('span');
                level.className = 'technology-level';
                level.textContent = approach.level;

                const title = document.createElement('h3');
                title.textContent = approach.name;

                const details = document.createElement('dl');
                const usefulTerm = document.createElement('dt');
                const usefulDefinition = document.createElement('dd');
                const limitTerm = document.createElement('dt');
                const limitDefinition = document.createElement('dd');
                usefulTerm.textContent = 'Potential fit';
                usefulDefinition.textContent = approach.usefulFor;
                limitTerm.textContent = 'Important limit';
                limitDefinition.textContent = approach.limitation;
                details.append(usefulTerm, usefulDefinition, limitTerm, limitDefinition);
                article.append(level, title, details);
                return article;
            }));
        }
    }

    function renderSolutionClass(solutionClass) {
        if (!solutionClass) return;

        setTextById('class-title', solutionClass.title, 'product-title');
        setTextById('class-description', solutionClass.description, 'product-description');
        setTextById('class-problem', solutionClass.problem, 'product-problem');
        setTextById('class-why-included', solutionClass.whyIncluded, 'product-why-selected');
        setTextById('class-materials', solutionClass.materials, 'product-materials');
        setTextById('class-publication', solutionClass.publicationLabel, 'product-publication-status');
        setTextById('class-access', solutionClass.accessStatus, 'product-access-status');
        setTextById('class-price', solutionClass.priceState.statement, 'product-price');
        setTextById('class-availability', solutionClass.availabilityState.statement, 'product-availability');
        setTextById('class-updated', solutionClass.updatedAt, 'product-updated-at');
        setTextById('class-disclosure', solutionClass.commercialDisclosure, 'product-commercial-disclosure');
        setText('product-offer-type', 'Solution class');

        const evidenceList = byId('class-evidence', 'product-evidence');
        if (evidenceList) {
            evidenceList.replaceChildren(...solutionClass.evidence.map(createEvidenceItem));
        }

        const limitations = byId('class-limitations', 'product-limitations');
        if (limitations) {
            limitations.replaceChildren(...solutionClass.limitations.map((limitation) => {
                const item = document.createElement('li');
                item.textContent = limitation;
                return item;
            }));
        }
    }

    function enhanceExternalLinks() {
        document.querySelectorAll('a[href^="http"]').forEach((link) => {
            if (link.dataset.externalReady === 'true') return;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            const accessLabel = document.createElement('span');
            accessLabel.className = 'sr-only';
            accessLabel.textContent = ' (opens in a new tab)';
            link.append(accessLabel);
            link.dataset.externalReady = 'true';
        });
    }

    function renderStructuredContent() {
        const data = getData();
        renderDomains();
        renderCleanWaterGuide(findCleanWaterGuide());
        renderSolutionClass(findPointOfUseSolutionClass());
        setTextById('offer-count', String(data.offers.length));
        setTextById('provider-count', String(data.providers.length));
        enhanceExternalLinks();
    }

    function normaliseRoute() {
        const rawHash = window.location.hash.replace(/^#/, '');
        if (!rawHash || rawHash === '/') return DEFAULT_ROUTE;
        const path = (rawHash.startsWith('/') ? rawHash : `/${rawHash}`).split('?')[0];
        return path.length > 1 ? path.replace(/\/+$/, '') : path;
    }

    function requestsAreEnabled() {
        const config = window.ARVENA_SUPABASE_CONFIG || {};
        return config.requestsEnabled === true;
    }

    function applyRequestAvailability() {
        if (!form || !requestFields || !submitButton) return;
        const enabled = requestsAreEnabled();
        requestFields.disabled = !enabled;
        submitButton.disabled = !enabled;
        if (requestAvailabilityNotice) requestAvailabilityNotice.hidden = enabled;
        if (requestAvailabilityText) requestAvailabilityText.textContent = `${REQUEST_UNAVAILABLE_MESSAGE} This form is disabled and will not send information.`;
        form.dataset.requestsEnabled = String(enabled);
        form.setAttribute('aria-disabled', String(!enabled));

        if (enabled) {
            form.removeAttribute('aria-describedby');
            if (requestTitle) requestTitle.textContent = 'Request a Clean Water option';
            if (requestIntro) requestIntro.textContent = 'Tell Arvena what you need to investigate. This records a Clean Water sourcing request; it does not promise a product or replace water-quality or public-health advice.';
            submitButton.textContent = 'Send sourcing request';
            return;
        }

        if (requestAvailabilityNotice) form.setAttribute('aria-describedby', 'request-availability-notice');
        if (requestTitle) requestTitle.textContent = 'Clean Water sourcing requests are not currently open';
        if (requestIntro) requestIntro.textContent = 'The educational guide and solution-class profile remain available. This form is disabled and will not send information.';
        submitButton.textContent = 'Requests not open';
        sessionStorage.removeItem(CONFIRMATION_KEY);
        setFormStatus('');
    }

    function syncNavigationAccessibility(isOpen = primaryNav?.classList.contains('is-open') || false) {
        if (!primaryNav) return;
        const isClosedOnMobile = mobileNavigationQuery.matches && !isOpen;
        primaryNav.toggleAttribute('inert', isClosedOnMobile);
        navLinks.filter((link) => primaryNav.contains(link)).forEach((link) => {
            if (isClosedOnMobile) {
                link.setAttribute('tabindex', '-1');
            } else {
                link.removeAttribute('tabindex');
            }
        });
        if (isClosedOnMobile) {
            primaryNav.setAttribute('aria-hidden', 'true');
        } else {
            primaryNav.removeAttribute('aria-hidden');
        }
    }

    function skipToMainContent(event) {
        event.preventDefault();
        if (!mainContent) return;
        mainContent.focus();
        mainContent.scrollIntoView({ block: 'start' });
    }

    function closeMenu({ restoreFocus = false } = {}) {
        if (!menuToggle || !primaryNav) return;
        const focusIsInsideMobileMenu = mobileNavigationQuery.matches && primaryNav.contains(document.activeElement);
        if (restoreFocus || focusIsInsideMobileMenu) menuToggle.focus();
        primaryNav.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        const menuLabel = menuToggle.querySelector('.sr-only');
        if (menuLabel) menuLabel.textContent = 'Open navigation';
        document.body.classList.remove('nav-open');
        syncNavigationAccessibility(false);
    }

    function screenNameCandidates(screenName) {
        const legacyNames = {
            'solution-class': 'product'
        };
        return [screenName, `screen-${screenName}`, legacyNames[screenName]].filter(Boolean);
    }

    function findScreen(screenName) {
        const candidates = screenNameCandidates(screenName);
        return screens.find((screen) => (
            candidates.includes(screen.id) || candidates.includes(screen.dataset.screen)
        )) || null;
    }

    function focusRouteHeading(screen) {
        const heading = screen?.querySelector('h1');
        if (!heading) {
            if (mainContent) mainContent.focus({ preventScroll: true });
            return;
        }

        document.querySelectorAll('[data-route-focus="true"]').forEach((element) => {
            element.removeAttribute('data-route-focus');
        });
        heading.setAttribute('tabindex', '-1');
        heading.setAttribute('data-route-focus', 'true');
        heading.addEventListener('blur', () => heading.removeAttribute('data-route-focus'), { once: true });
        heading.focus({ preventScroll: true });
    }

    function showRoute({ moveFocus = true } = {}) {
        let routePath = normaliseRoute();
        const topic = window.ArvenaKnowledge?.atRoute(routePath);
        let route = ROUTES[routePath] || (topic ? { screen: 'knowledge', nav: 'solutions', title: topic.title + ' | Arvena' } : null) || (window.ArvenaPlatform?.matches(routePath) ? { screen: 'platform', nav: '', title: 'Arvena' } : null) || { screen: 'not-found', nav: '', title: 'Page not found | Arvena' };

        if (route.screen === 'result' && (!requestsAreEnabled() || !sessionStorage.getItem(CONFIRMATION_KEY))) {
            routePath = '/request';
            route = ROUTES[routePath];
            window.history.replaceState(null, '', '#/request');
        }

        let activeScreen = findScreen(route.screen);
        if (!activeScreen && route.screen !== 'not-found') {
            route = { screen: 'not-found', nav: '', title: 'Page not found | Arvena' };
            activeScreen = findScreen('not-found');
        }

        screens.forEach((screen) => {
            screen.hidden = screen !== activeScreen;
        });

        navLinks.forEach((link) => {
            const key = link.dataset.routeLink || link.dataset.navRoute || '';
            const hrefPath = (link.getAttribute('href') || '').replace(/^#/, '');
            const isCurrent = key === route.nav
                || key === routePath
                || key === routePath.replace(/^\//, '')
                || hrefPath === routePath;
            if (isCurrent) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });

        if (topic) window.ArvenaKnowledge.render(routePath);
        if (route.screen === 'offers') window.ArvenaKnowledge.renderCatalogue();
        if (['offers', 'providers', 'knowledge', 'craft', 'explore', 'clean-water', 'solution-class', 'platform'].includes(route.screen)) window.ArvenaPlatform.loadCatalogue();
        document.title = route.title;
        if (route.screen === 'platform') window.ArvenaPlatform.render(routePath);
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        closeMenu();

        if (route.screen === 'result') {
            const reference = sessionStorage.getItem(CONFIRMATION_KEY);
            if (confirmationReference) confirmationReference.textContent = reference || 'Not available';
        }

        const shouldMoveFocus = moveFocus && hasHandledInitialRoute;
        hasHandledInitialRoute = true;
        if (shouldMoveFocus) {
            focusRouteHeading(activeScreen);
        }
    }

    function getInitialTheme() {
        const stored = localStorage.getItem(THEME_KEY);
        if (stored === 'light' || stored === 'dark') return stored;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function applyTheme(theme) {
        document.documentElement.dataset.theme = theme;
        if (themeToggle) {
            themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
            themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Use light theme' : 'Use dark theme');
        }
    }

    function toggleTheme() {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
    }

    function toggleMenu() {
        if (!menuToggle || !primaryNav) return;
        const open = menuToggle.getAttribute('aria-expanded') === 'true';
        menuToggle.setAttribute('aria-expanded', String(!open));
        const menuLabel = menuToggle.querySelector('.sr-only');
        if (menuLabel) menuLabel.textContent = open ? 'Open navigation' : 'Close navigation';
        primaryNav.classList.toggle('is-open', !open);
        document.body.classList.toggle('nav-open', !open);
        syncNavigationAccessibility(!open);
        if (!open) {
            const firstLink = primaryNav.querySelector('a');
            if (firstLink) firstLink.focus();
        }
    }

    function setFormStatus(message, state = '') {
        if (!formStatus) return;
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
        if (!requestsAreEnabled()) {
            applyRequestAvailability();
            return;
        }
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
            const enabled = requestsAreEnabled();
            submitButton.disabled = !enabled;
            submitButton.textContent = enabled ? 'Send sourcing request' : 'Requests not open';
        }
    }

    window.ArvenaKnowledge.init();
    renderStructuredContent();
    setupExplore();
    applyTheme(getInitialTheme());
    applyRequestAvailability();
    syncNavigationAccessibility(false);
    showRoute({ moveFocus: false });

    window.addEventListener('arvena:catalogue', () => {
        const values = [exploreDomainFilter.value, exploreTypeFilter.value];
        const data = getData();
        populateFilter(exploreDomainFilter, [...new Set(data.discoveryRecords.map(r => r.domainSlug))].map(value => ({value, label: data.domains.find(d => d.slug === value)?.title || value})), 'All published domains');
        populateFilter(exploreTypeFilter, [...new Set([...data.discoveryRecords.map(r => r.recordType), 'offer'])].map(value => ({value, label: recordTypeLabel(value)})), 'All record types');
        [exploreDomainFilter, exploreTypeFilter].forEach((e,i) => { e.value=values[i]; });
        renderExploreResults();
    });
    window.addEventListener('hashchange', () => showRoute());
    if (skipLink) skipLink.addEventListener('click', skipToMainContent);
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
    if (menuToggle) menuToggle.addEventListener('click', toggleMenu);
    if (primaryNav) primaryNav.addEventListener('click', (event) => {
        if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && primaryNav?.classList.contains('is-open')) {
            closeMenu({ restoreFocus: true });
        }
    });
    mobileNavigationQuery.addEventListener('change', () => closeMenu());
    if (notesField) notesField.addEventListener('input', () => {
        if (notesCount) notesCount.textContent = String(notesField.value.length);
    });
    if (form) form.addEventListener('submit', submitRequest);
})();
