'use strict';
(function () {
    const data = window.ARVENA_KNOWLEDGE;
    const domainBySlug = new Map(window.ARVENA_DATA.domains.map(d => [d.slug, d]));
    const node = (tag, text, className) => {
        const n = document.createElement(tag);
        if (text) n.textContent = text;
        if (className) n.className = className;
        return n;
    };
    const link = (text, route) => { const a = node('a', text); a.href = '#' + route; return a; };
    const list = (items, ordered = false) => {
        const n = node(ordered ? 'ol' : 'ul');
        items.forEach(text => n.append(node('li', text))); return n;
    };
    data.domains.forEach(d => { d.title = domainBySlug.get(d.slug).title; });
    const topics = [...data.domains, ...data.contexts];
    const classTopic = {id:'class:point-of-use-filtration',title:'Point-of-use filtration',recordType:'solution-class',slug:'point-of-use-filtration',route:'/solution-classes/point-of-use-filtration'};
    const find = id => id===classTopic.id ? classTopic : topics.find(t => t.id === id);
    const atRoute = path => topics.find(t => t.route === path && !t.reuse);
    const catalogueURL = topic => '/offers?topic=' + encodeURIComponent(topic.id);
    function matchesOffer(offer, topic) {
        if (offer.status !== 'published') return false;
        if (!topic) return true;
        if (topic.recordType === 'solution-class') return offer.solution_class_slug === topic.slug;
        if (topic.recordType === 'direction') return offer.domain_slug === topic.slug;
        // Narrow contexts need editorially approved links, never inferred keywords.
        return (data.offerLinks[topic.id] || []).includes(offer.slug);
    }
    function catalogueState() { return window.ArvenaPlatform?.catalogueState || 'unavailable'; }
    function relatedOffers(topic) { return (window.ArvenaPlatform?.offers || []).filter(o => matchesOffer(o, topic)); }
    function renderRelated(container, topic) {
        const heading=node('h2', 'Related offers');
        if(container.hasAttribute('aria-labelledby')) heading.id=container.getAttribute('aria-labelledby');
        container.replaceChildren(heading);
        const state = catalogueState();
        if (state === 'ready') {
            const offers = relatedOffers(topic);
            container.append(node('p', offers.length ? `${offers.length} published ${offers.length === 1 ? 'offer' : 'offers'} linked to this topic.` : 'No approved offers are currently published for this topic.'));
            const ul = node('ul', '', 'knowledge-links');
            offers.forEach(o => {const li=node('li');li.append(link(o.title, '/offers/'+o.slug));ul.append(li);});
            container.append(ul);
        } else {
            container.append(node('p', state === 'loading' ? 'Checking published offers…' : 'Catalogue unavailable. Offer availability could not be checked; the knowledge on this page remains available.'));
            if (state !== 'loading') container.append(window.ArvenaPlatform.button('Retry catalogue', () => window.ArvenaPlatform.loadCatalogue()));
        }
        container.append(link('Browse this topic in the catalogue', catalogueURL(topic)));
    }
    function section(title) { const s=node('section', '', 'knowledge-section');s.append(node('h2',title));return s; }
    function render(path) {
        const topic=atRoute(path); if(!topic) return;
        const root=document.getElementById('knowledge-content');root.replaceChildren();
        const heading=document.getElementById('knowledge-title');heading.textContent=topic.title;
        document.getElementById('knowledge-description').textContent=topic.description;
        document.getElementById('knowledge-status').textContent=topic.knowledgeStatus;
        if(topic.recordType==='direction') {
            const scope=section('What belongs here');scope.append(list(topic.sections));root.append(scope);
            const approaches=section('Approaches to investigate');approaches.append(node('p','These are classes of solutions for comparison, not findings that each approach is suitable or effective.'),list(topic.approaches));root.append(approaches);
        } else {
            const body=section(topic.id==='clothing-footwear-textiles' ? 'Read the whole item' : topic.id==='electronics-fields-measurement' ? 'Different questions, different measurements' : 'A practical way into the topic');
            const dl=node('dl','','knowledge-ledger');
            topic.sections.forEach(([title,text])=>{const row=node('div');row.append(node('dt',title),node('dd',text));dl.append(row);});body.append(dl);root.append(body);
        }
        const questions=section('Questions for research');questions.append(list(topic.questions));root.append(questions);
        const connected=section(topic.slug==='homes-buildings-and-land-systems'?'The connected home':'Connected areas');
        const links=node('ul','','knowledge-links');
        (topic.relatedDomains || topic.domainSlugs).forEach(slug=>{const d=data.domains.find(d=>d.slug===slug),li=node('li');li.append(link(d.title,d.route));links.append(li);});
        data.contexts.filter(c=>c.route!==topic.route && !(topic.relatedDomains || []).some(slug=>'/solutions/'+slug===c.route) && c.domainSlugs.some(slug=>topic.domainSlugs.includes(slug))).forEach(c=>{const li=node('li');li.append(link(c.title,c.route));links.append(li);});
        connected.append(links);
        if(topic.slug==='homes-buildings-and-land-systems') root.prepend(connected); else root.append(connected);
        const reading=section('Read now');
        topic.recordSlugs.forEach(slug=>{const r=window.ARVENA_DATA.discoveryRecords.find(r=>r.slug===slug);if(r)reading.append(link(r.title,r.recordType==='guide'?'/solutions/clean-water':'/solution-classes/'+r.slug));});
        reading.append(link('How we select','/how-we-select'),link('Start without unnecessary purchases','/contexts/start-without-buying'));
        reading.append(node('p','This initial map defines the scope and questions. Detailed comparisons and research notes will be added after human review; creating this page does not mean that the subject has been fully researched.'));root.append(reading);
        const first=section('Start with the conditions');first.append(node('p','Define the need, understand the existing setup and consider care, repair and changes that do not require a purchase. Then compare any proposed change, its full cost, availability and implementation requirements. Use qualified help where the task requires it.'));root.append(first);
        const offers=section('');offers.dataset.relatedTopic=topic.id;renderRelated(offers,topic);root.append(offers);
        const participate=section('Contribute or correct');participate.append(node('p','A source, a specific correction or a clearly framed unmet need can help future review. A general public intake channel is being prepared; no public submission is available here. Existing provider corrections remain limited to assigned representatives and their own listings.'),link('Participation and current channels','/participate'),link('Methodology and review','/how-we-select'));root.append(participate);
        const history=section('Sources and editorial history');history.append(node('p',`Version ${data.version} · Edited ${data.editedAt}. Adapted from Arvena’s research and collaboration framework v1.0 and initial directions map v0.1 (24 September 2026), within the implementation scope approved by the project owner. This is an editorial date, not a scientific evidence-review date.`),node('p','Initial publication: topic boundaries, research questions and links. The source documents are internal working material; this page contains only the selected public adaptation. No new product research or reviewer endorsement is claimed.'));root.append(history);
    }
    function renderCatalogue() {
        const params=new URLSearchParams(location.hash.split('?')[1] || '');
        const topicId=params.get('topic'),domain=params.get('domain'),classSlug=params.get('class');
        const topic=topicId ? find(topicId) : null;
        const valid=(!topicId||!!topic)&&(!domain||domainBySlug.has(domain))&&(!classSlug||window.ARVENA_DATA.discoveryRecords.some(r=>r.recordType==='solution-class'&&r.slug===classSlug));
        const filtered=(window.ArvenaPlatform?.offers||[]).filter(o=>valid&&matchesOffer(o,topic)&&(!domain||o.domain_slug===domain)&&(!classSlug||o.solution_class_slug===classSlug));
        const state=catalogueState(),status=document.getElementById('offer-catalogue-status');
        const label=topic?.title || domainBySlug.get(domain)?.title || (classSlug?'Point-of-use filtration':'All topics');
        status.replaceChildren(node('h2',label));
        const ready=state==='ready';
        status.append(node('p',!valid?'Unknown catalogue filter. Choose a topic or clear the filter.':ready?`${filtered.length} published ${filtered.length===1?'offer':'offers'}`:state==='loading'?'Checking published offers…':'Catalogue unavailable. We could not check published offers. This is not a zero-result count.'));
        if(!ready&&state!=='loading')status.append(window.ArvenaPlatform.button('Retry catalogue',()=>window.ArvenaPlatform.loadCatalogue()));
        if(topicId||domain||classSlug)status.append(link('Clear catalogue filter','/offers'));
        status.append(link(topic?'Return to '+topic.title:'Browse knowledge',topic?.route || (domain?'/solutions/'+domain:'/solutions')));
        document.getElementById('published-offers').replaceChildren(...filtered.map(window.ArvenaPlatform.offerCard));
        document.querySelector('.offer-empty-state').hidden=!ready || filtered.length>0 || !valid;
        document.getElementById('offer-count').textContent=ready?filtered.length:'Unknown';
        document.getElementById('offer-empty-title').textContent='No approved offers are currently published'+(topicId||domain||classSlug?' for this filter':'');
    }
    function refresh() {
        document.querySelectorAll('[data-related-topic]').forEach(n=>{const t=find(n.dataset.relatedTopic);if(t)renderRelated(n,t);});
        renderCatalogue();
        const access=document.getElementById('class-access');
        if(access) access.textContent=catalogueState()==='ready' ? (relatedOffers(classTopic).length ? 'Related published offers are available below' : 'No specific offer is currently published for this class') : 'Offer availability could not yet be confirmed';
    }
    function init() {
        const index=document.getElementById('context-index');
        data.contexts.forEach(c=>{const li=node('li');li.append(link(c.title,c.route));index.append(li);});
        const craft=document.querySelector('#screen-craft .craft-offers');craft.dataset.relatedTopic='craft-local';
        document.querySelector('#screen-craft h1').after(node('p','Context overview available','status-badge'));
        [['screen-clean-water','domain:water'],['screen-solution-class','class:point-of-use-filtration']].forEach(([id,topic])=>{
            const s=section('Related offers');
            s.dataset.relatedTopic=topic;
            renderRelated(s,find(topic));
            document.querySelector('#'+id+' .screen-inner').append(s);
        });
        refresh();
    }
    function records() {
        return topics.filter(t=>!t.reuse || t.id==='craft-local').map(t=>({recordType:t.recordType,slug:t.id,title:t.title,description:t.description || 'Materials, process, provenance and permission.',searchTerms:[...(t.sections||[]).flat(),...(t.approaches||[]),...(t.questions||[]),...data.contexts.filter(c=>c.route===t.route).map(c=>c.title)].join(' '),domainSlug:t.domainSlugs[0],domainSlugs:t.domainSlugs,publicationStatus:'published',publicationLabel:t.knowledgeStatus,route:'#'+t.route}));
    }
    window.ArvenaKnowledge={atRoute,render,renderCatalogue,refresh,init,records,matchesOffer};
    window.addEventListener('arvena:catalogue',refresh);
}());
