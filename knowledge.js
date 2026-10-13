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
    const find = id => id===classTopic.id ? classTopic : topics.find(t => t.id === id) || (id?.startsWith('class:') ? window.ArvenaPlatform.classes.find(c=>'class:'+c.slug===id) && {...window.ArvenaPlatform.classes.find(c=>'class:'+c.slug===id),id,recordType:'solution-class',route:'/solution-classes/'+id.slice(6)} : null);
    const atRoute = path => topics.find(t => t.route === path && !t.reuse);
    const catalogueURL = topic => '/offers?topic=' + encodeURIComponent(topic.id);
    function matchesOffer(offer, topic) {
        if (offer.status !== 'published') return false;
        if (!topic) return true;
        if (topic.recordType === 'solution-class') return offer.solution_class_slug === topic.slug;
        if (topic.recordType === 'direction') return (window.ArvenaDiscovery?.domainSlugs(offer)||[offer.domain_slug]).includes(topic.slug) || data.contexts.some(c=>c.reuse&&c.route===topic.route&&(offer.publication?.context_ids||[]).includes(c.id));
        // Narrow contexts need editorially approved links, never inferred keywords.
        return (offer.publication?.context_ids || []).includes(topic.id) || (data.offerLinks[topic.id] || []).includes(offer.slug);
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
        if(/^\/solution-classes\/[a-z0-9-]+$/.test(path))return renderClass(path.split('/')[2]);
        const topic=atRoute(path); if(!topic) return;
        const root=document.getElementById('knowledge-content');root.replaceChildren();
        const heading=document.getElementById('knowledge-title');heading.textContent=topic.title;
        document.getElementById('knowledge-description').textContent=topic.description;
        document.getElementById('knowledge-status').textContent=topic.knowledgeStatus;
        const actions=node('nav','','knowledge-actions');actions.setAttribute('aria-label','Next steps for this topic');actions.append(link('View related offers',catalogueURL(topic)));const next=node('button','Explore connected topics','button button-secondary');next.type='button';next.addEventListener('click',()=>{const section=document.getElementById('connected-topics');section.tabIndex=-1;section.focus();section.scrollIntoView({block:'start'});});actions.append(next);root.append(actions);
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
        connected.id='connected-topics';
        const links=node('ul','','knowledge-links');
        (topic.relatedDomains || topic.domainSlugs).forEach(slug=>{const d=data.domains.find(d=>d.slug===slug),li=node('li');li.append(link(d.title,d.route));links.append(li);});
        data.contexts.filter(c=>c.route!==topic.route && !(topic.relatedDomains || []).some(slug=>'/solutions/'+slug===c.route) && c.domainSlugs.some(slug=>topic.domainSlugs.includes(slug))).forEach(c=>{const li=node('li');li.append(link(c.title,c.route));links.append(li);});
        connected.append(links);
        if(topic.slug==='homes-buildings-and-land-systems') root.prepend(connected); else root.append(connected);
        const approaches=window.ArvenaPlatform.classes.filter(c=>topic.domainSlugs.includes(c.domain_slug));
        if(approaches.length){const classes=section('Solution classes');classes.append(node('p','Understand an approach before comparing specific offers.'));approaches.forEach(c=>classes.append(link(c.title,'/solution-classes/'+c.slug)));root.append(classes);}
        const reading=section('Read now');
        topic.recordSlugs.forEach(slug=>{const r=window.ARVENA_DATA.discoveryRecords.find(r=>r.slug===slug);if(r)reading.append(link(r.title,r.recordType==='guide'?'/solutions/clean-water':'/solution-classes/'+r.slug));});
        reading.append(link('How we select','/how-we-select'),link('Start without unnecessary purchases','/contexts/start-without-buying'));
        reading.append(node('p','This initial map defines the scope and questions. Detailed comparisons and research notes will be added after human review; creating this page does not mean that the subject has been fully researched.'));root.append(reading);
        const first=section('Start with the conditions');first.append(node('p','Define the need, understand the existing setup and consider care, repair and changes that do not require a purchase. Then compare any proposed change, its full cost, availability and implementation requirements. Use qualified help where the task requires it.'));root.append(first);
        const offers=section('');offers.dataset.relatedTopic=topic.id;renderRelated(offers,topic);root.append(offers);
        const participate=section('Contribute or correct');participate.append(node('p','A source, a specific correction or a clearly framed unmet need can help future review. A general public intake channel is being prepared; no public submission is available here. Existing provider corrections remain limited to assigned representatives and their own listings.'),link('Participation and current channels','/participate'),link('Methodology and review','/how-we-select'));root.append(participate);
        const history=section('Sources and editorial history');history.append(node('p',`Version ${data.version} · Edited ${data.editedAt}. Adapted from Arvena’s research and collaboration framework v1.0 and initial directions map v0.1 (24 September 2026), within the implementation scope approved by the project owner. This is an editorial date, not a scientific evidence-review date.`),node('p','Initial publication: topic boundaries, research questions and links. The source documents are internal working material; this page contains only the selected public adaptation. No new product research or reviewer endorsement is claimed.'));root.append(history);
    }
    function renderClass(slug) {
        const root=document.getElementById('knowledge-content'),heading=document.getElementById('knowledge-title'),description=document.getElementById('knowledge-description'),status=document.getElementById('knowledge-status');
        root.replaceChildren();const c=window.ArvenaPlatform.classes.find(c=>c.slug===slug),state=catalogueState();
        if(state!=='ready'){heading.textContent='Solution class';description.textContent=state==='loading'?'Loading the approach…':'This solution class could not be checked.';status.textContent='';if(state!=='loading')root.append(window.ArvenaPlatform.button('Retry catalogue',()=>window.ArvenaPlatform.loadCatalogue()));root.append(link('Browse knowledge','/explore?view=knowledge'));return;}
        if(!c){heading.textContent='Solution class unavailable';description.textContent='No public solution class exists at this address.';status.textContent='';root.append(link('Browse knowledge','/explore?view=knowledge'));return;}
        heading.textContent=c.title;description.textContent=c.need;status.textContent='Solution class · an approach, not a product';document.title=c.title+' | Arvena';
        const intro=section('Compare the approach');intro.append(node('p','Suitability depends on the need and conditions. A class link alone does not establish the performance or suitability of a particular offer.'),link('Understand the solution area','/solutions/'+c.domain_slug));root.append(intro);
        const related=section('Related offers');related.dataset.relatedTopic='class:'+c.slug;renderRelated(related,{...c,id:'class:'+c.slug,recordType:'solution-class'});root.append(related,link('How we select','/how-we-select'));
    }
    function renderCatalogue() { window.ArvenaDiscovery?.renderCatalogue(); }
    function refresh() {
        const path=location.hash.slice(1).split('?')[0];if(atRoute(path)||(/^\/solution-classes\/[a-z0-9-]+$/.test(path)&&path!='/solution-classes/point-of-use-filtration'))render(path);
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
    window.ArvenaKnowledge={find,atRoute,render,renderCatalogue,refresh,init,records,matchesOffer};
    window.addEventListener('arvena:catalogue',refresh);
}());
