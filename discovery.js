'use strict';
(function () {
    const A = window.ArvenaPlatform;
    const {el, link} = A;
    const domains = window.ARVENA_DATA.domains;
    const contexts = window.ARVENA_KNOWLEDGE.contexts;
    const mounts = new Map();
    const typeNames = {product:'Product',handmade:'Handmade product',technology:'Technology',service:'Service','installed-product':'Product with installation',building:'Home or building','integrated-system':'Integrated system',turnkey:'Turnkey solution'};
    const contentNames = {guide:'Guide','solution-class':'Solution class',direction:'Topic map',context:'Everyday context'};
    const unique = values => [...new Set(values.filter(Boolean))];
    const text = value => typeof value === 'string' ? value : '';
    const normalize = value => text(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('en');
    const domainSlugs = o => unique([o.domain_slug,...(Array.isArray(o.publication?.domain_slugs)?o.publication.domain_slugs:[])]).filter(s=>domains.some(d=>d.slug===s));
    const contextIds = o => unique([...(Array.isArray(o.publication?.context_ids)?o.publication.context_ids:[]),...contexts.filter(c=>(window.ARVENA_KNOWLEDGE.offerLinks[c.id]||[]).includes(o.slug)).map(c=>c.id)]).filter(id=>contexts.some(c=>c.id===id));
    const classes = () => unique([...A.classes.map(c=>c.slug),...A.offers.map(o=>o.solution_class_slug)]).map(slug=>A.classes.find(c=>c.slug===slug)||{slug,title:window.ARVENA_DATA.discoveryRecords.find(r=>r.slug===slug)?.title||slug.replaceAll('-',' ')});
    const className = slug => classes().find(c=>c.slug===slug)?.title || '';
    function searchText(o) {
        const p=o.publication||{}, provider=A.providers.find(v=>v.id===o.provider_id);
        // Only approved public fields. Never index drafts, dossiers or account data.
        return normalize([o.title,p.need,p.suitability,p.selection_rationale,p.mechanism,p.specifications,p.materials,p.strengths,p.limitations,p.geography,typeNames[o.offer_type],provider?.name,className(o.solution_class_slug),...domainSlugs(o).map(s=>domains.find(d=>d.slug===s)?.title),...contextIds(o).map(id=>contexts.find(c=>c.id===id)?.title)].filter(Boolean).join(' '));
    }
    const hasQuery = (haystack,q) => normalize(q).trim().split(/\s+/).filter(Boolean).every(term=>haystack.includes(term));
    function topicMatches(o,id) { return !id || window.ArvenaKnowledge.matchesOffer(o,window.ArvenaKnowledge.find(id)); }
    function matches(o,p) {
        return o.status==='published' && hasQuery(searchText(o),p.get('q')||'') && topicMatches(o,p.get('topic'))
            && (!p.get('domain')||domainSlugs(o).includes(p.get('domain')))
            && (!p.get('context')||contextIds(o).includes(p.get('context')))
            && (!p.get('class')||o.solution_class_slug===p.get('class'))
            && (!p.get('format')||o.offer_type===p.get('format'))
            && (!p.get('provider')||o.provider_id===p.get('provider'))
            && (!p.get('region')||text(o.publication?.geography)===p.get('region'));
    }
    const params = () => new URLSearchParams(location.hash.split('?')[1]||'');
    function update(changes,replace=false) {
        const p=params();p.delete('page');
        Object.entries(changes).forEach(([k,v])=>v?p.set(k,v):p.delete(k));
        const path=location.hash.split('?')[0]||'#/explore';
        history[replace?'replaceState':'pushState'](null,'',path+(p.size?'?'+p.toString():''));
        render();
    }
    function field(form,label,name,id) {
        const wrap=el('div',null,{class:'field'}), control=el(name==='q'?'input':'select',null,{id,name});
        wrap.append(el('label',label,{for:id}),control);form.append(wrap);
        if(name==='q'){control.type='search';control.autocomplete='off';control.placeholder='Search offers, providers or needs';}
        control.addEventListener(name==='q'?'input':'change',()=>update({[name]:control.value},name==='q'));
        return control;
    }
    function setup(root,prefix,existing=false) {
        const form=existing?root.querySelector('.catalogue-controls'):el('form',null,{class:'catalogue-controls',role:'search','aria-label':'Search and filter published offers'});
        if(!existing)root.prepend(form);
        const controls=new Map();
        controls.set('q',existing?document.getElementById('explore-search'):field(form,'Search offers','q',prefix+'-search'));
        controls.set('domain',existing?document.getElementById('explore-domain-filter'):field(form,'Solution area','domain',prefix+'-domain-filter'));
        controls.set('type',existing?document.getElementById('explore-type-filter'):field(form,'Knowledge type','type',prefix+'-type-filter'));
        if(existing){controls.get('q').addEventListener('input',()=>update({q:controls.get('q').value},true));['domain','type'].forEach(k=>controls.get(k).addEventListener('change',()=>update({[k]:controls.get(k).value})));}
        const more=el('details',null,{class:'catalogue-more'}), summary=el('summary','More filters');more.append(summary);
        const extras=el('div',null,{class:'catalogue-extra-fields'});more.append(extras);form.append(more);
        for(const [key,label]of [['context','Everyday context'],['class','Solution class'],['format','Type of offer'],['provider','Provided by'],['region','Availability']])controls.set(key,field(extras,label,key,prefix+'-'+key+'-filter'));
        const clear=existing?document.getElementById('explore-clear'):el('button','Clear filters',{type:'button',class:'button button-secondary',id:prefix+'-clear'});
        if(!existing)form.append(clear);
        clear.addEventListener('click',()=>{reset();controls.get('q').focus();});
        form.addEventListener('submit',e=>{e.preventDefault();update({q:controls.get('q').value});});
        const views=el('nav',null,{class:'discovery-views','aria-label':'Explore offers or knowledge'});
        views.append(link('Offers','#/explore'),link('Knowledge','#/explore?view=knowledge'),link('Providers','#/providers'));form.before(views);
        const active=el('div',null,{class:'catalogue-active','aria-label':'Active filters'});form.after(active);
        const notice=existing?document.getElementById('explore-result-count'):document.getElementById('offer-catalogue-status');
        const feedback=el('div',null,{class:'catalogue-feedback'});notice.after(feedback);
        const results=existing?document.getElementById('explore-results'):document.getElementById('published-offers');
        const empty=existing?document.getElementById('explore-empty'):root.querySelector('.offer-empty-state');
        const pages=el('nav',null,{class:'catalogue-pagination','aria-label':'Catalogue pages'});results.after(pages);
        mounts.set(prefix,{root,form,controls,more,summary,clear,views,active,notice,feedback,results,empty,pages});
    }
    function reset() {
        const p=params(); const view=p.get('view');
        history.pushState(null,'',location.hash.split('?')[0]+(view==='knowledge'?'?view=knowledge':''));render();
    }
    function options(control,values,all,value) {
        control.replaceChildren(el('option',all,{value:''}),...values.map(([v,label])=>el('option',label,{value:v})));
        if(value&&!values.some(([v])=>v===value))control.append(el('option','Unavailable selection',{value}));
        control.value=value||'';
        control.closest('.field').hidden=values.length===0&&!value;
    }
    function knowledgeRecords() {
        const local=[...window.ARVENA_DATA.discoveryRecords,...window.ArvenaKnowledge.records()].filter(r=>r.recordType!=='offer');
        const extra=A.classes.filter(c=>!local.some(r=>r.recordType==='solution-class'&&r.slug===c.slug)).map(c=>({recordType:'solution-class',slug:c.slug,title:c.title,description:c.need,domainSlug:c.domain_slug,route:'#/solution-classes/'+c.slug}));
        return [...local,...extra];
    }
    function knowledgeCard(r) {
        const card=el('article',null,{class:'discovery-card knowledge-card'});
        const href=r.route||(r.recordType==='solution-class'?'#/solution-classes/'+r.slug:'#/solutions/clean-water');
        const h=el('h3');h.append(link(r.title,href));
        card.append(el('p',contentNames[r.recordType]||'Knowledge',{class:'discovery-card-type'}),h,el('p',r.description||r.problem||'',{class:'discovery-card-copy'}));
        if(r.recordType==='direction'||r.recordType==='context')card.append(el('p','Topic overview · not a product recommendation',{class:'discovery-card-note'}));
        card.append(link(r.recordType==='solution-class'?'Understand this approach':'Read more',href));return card;
    }
    function renderCatalogue(prefix='offers') { render(prefix); }
    function render(only) {
        const p=params(), path=location.hash.split('?')[0], prefix=only||(path==='#/offers'?'offers':'explore'), m=mounts.get(prefix);
        if(!m)return;
        if((prefix==='explore'&&path==='#/explore')||(prefix==='offers'&&path==='#/offers')){try{sessionStorage.setItem('arvena-catalogue-return',location.hash);}catch{ /* Browsing must work without storage. */ }}
        const knowledge=prefix==='explore'&&p.get('view')==='knowledge';
        m.form.toggleAttribute('data-knowledge-view',knowledge);
        const state=A.catalogueState, ready=state==='ready';
        const topic=p.get('topic')?window.ArvenaKnowledge.find(p.get('topic')):null;
        const available=A.offers.filter(o=>o.status==='published');
        const facets={domain:unique((knowledge?knowledgeRecords().flatMap(r=>r.domainSlugs||[r.domainSlug]):available.flatMap(domainSlugs))).map(s=>[s,domains.find(d=>d.slug===s)?.title||s]),
            type:Object.entries(contentNames),context:contexts.filter(c=>available.some(o=>contextIds(o).includes(c.id))).map(c=>[c.id,c.title]),
            class:classes().filter(c=>available.some(o=>o.solution_class_slug===c.slug)).map(c=>[c.slug,c.title]),
            format:unique(available.map(o=>o.offer_type)).map(t=>[t,typeNames[t]||t]),
            provider:A.providers.filter(v=>available.some(o=>o.provider_id===v.id)).map(v=>[v.id,v.name]),
            region:unique(available.map(o=>text(o.publication?.geography)).filter(v=>v.length<=80&&!/[\r\n]/.test(v))).map(v=>[v,v])};
        m.views.querySelectorAll('a').forEach(a=>{a.removeAttribute('aria-current');if(a.textContent===(knowledge?'Knowledge':'Offers'))a.setAttribute('aria-current','page');});
        for(const [key,control]of m.controls){
            if(key==='q'){if(document.activeElement!==control)control.value=p.get(key)||'';control.closest('.field').querySelector('label').textContent=knowledge?'Search knowledge':'Search offers';control.placeholder=knowledge?'Search guides, topics or approaches':'Search offers, providers or needs';continue;}
            options(control,facets[key],'All '+({domain:'solution areas',type:'knowledge types',context:'contexts',class:'solution classes',format:'offer types',provider:'providers',region:'availability'}[key]),p.get(key));
            if(key==='type')control.closest('.field').hidden=!knowledge;
            else if(knowledge&&key!=='domain')control.closest('.field').hidden=true;
        }
        const extraKeys=['context','class','format','provider','region'];
        m.more.hidden=knowledge||!extraKeys.some(k=>facets[k].length||p.get(k));
        const extrasCount=extraKeys.filter(k=>p.get(k)).length;m.summary.textContent='More filters'+(extrasCount?' ('+extrasCount+' active)':'');
        m.active.replaceChildren();
        for(const key of ['q','topic','domain','context','class','format','provider','region','type']){
            if(!p.get(key))continue;
            const label=key==='topic'?(topic?.title||'Unknown topic'):key==='q'?'Search: '+p.get(key):facets[key]?.find(([v])=>v===p.get(key))?.[1]||p.get(key);
            const b=el('button','Remove '+label,{type:'button',class:'catalogue-chip'});b.addEventListener('click',()=>update({[key]:''}));m.active.append(b);
        }
        const filteredKeys=['q','topic','domain','context','class','format','provider','region','type'].filter(k=>p.get(k));
        m.clear.disabled=filteredKeys.length===0;
        m.feedback.replaceChildren();m.results.replaceChildren();m.pages.replaceChildren();m.empty.hidden=true;
        m.results.setAttribute('aria-busy',String(!knowledge&&state==='loading'));
        if(!knowledge&&!ready){
            m.notice.textContent=state==='loading'?'Loading published offers…':'Catalogue unavailable. We could not check published offers.';
            m.feedback.append(el('p',state==='loading'?'Checking the catalogue. Knowledge remains available while you wait.':'This is a service error, not an empty catalogue. Try again or explore knowledge.'));
            if(state!=='loading')m.feedback.append(A.button('Retry catalogue',A.loadCatalogue));
            m.feedback.append(link('Explore knowledge','#/explore?view=knowledge'));setCount('Unknown');return;
        }
        const invalid=(p.has('topic')&&!topic)||(p.has('domain')&&!domains.some(d=>d.slug===p.get('domain')))||(p.has('context')&&!contexts.some(c=>c.id===p.get('context')))||(p.has('class')&&!classes().some(c=>c.slug===p.get('class'))&&!window.ARVENA_DATA.discoveryRecords.some(r=>r.recordType==='solution-class'&&r.slug===p.get('class')))||(p.has('format')&&!typeNames[p.get('format')]);
        let records=knowledge?knowledgeRecords().filter(r=>hasQuery(normalize([r.title,r.description,r.problem,r.whyIncluded,r.searchTerms,...(r.approaches||[]).map(a=>typeof a==='string'?a:Object.values(a).join(' '))].join(' ')),p.get('q')||'')&&(!p.get('domain')||(r.domainSlugs||[r.domainSlug]).includes(p.get('domain')))&&(!p.get('type')||r.recordType===p.get('type'))):available.filter(o=>matches(o,p));
        if(invalid)records=[];
        const total=records.length, size=24, page=Math.min(Math.max(1,Number(p.get('page'))||1),Math.max(1,Math.ceil(total/size))), start=(page-1)*size;
        m.notice.textContent=invalid?'Unknown catalogue filter. Choose a topic or clear the filter.':total+' '+(knowledge?'knowledge records':'published '+(total===1?'offer':'offers'))+(topic?' · '+topic.title:'');setCount(knowledge?'Unknown':total);
        if(knowledge&&state==='unavailable')m.feedback.append(el('p','Knowledge is available. The live offer catalogue could not be checked.'),A.button('Retry catalogue',A.loadCatalogue));
        if(total){m.results.append(...records.slice(start,start+size).map(knowledge?knowledgeCard:A.offerCard));
            if(total>size){m.pages.append(el('p',`Showing ${start+1} to ${Math.min(start+size,total)} of ${total}`));for(const [label,next]of [['Previous page',page-1],['Next page',page+1]]){const b=el('button',label,{type:'button',class:'button button-secondary'});b.disabled=next<1||next>Math.ceil(total/size);b.addEventListener('click',()=>{const q=params();q.set('page',next);history.pushState(null,'',path+'?'+q);render(prefix);m.notice.tabIndex=-1;m.notice.focus();});m.pages.append(b);}}
        }else{
            m.empty.hidden=false;m.empty.replaceChildren(el('h2',invalid?'This filter is unavailable':knowledge?'No matching knowledge':available.length&&filteredKeys.length?'No matches for these filters':'The catalogue is taking shape',{id:prefix==='offers'?'offer-empty-title':'explore-empty-title'}));
            m.empty.append(el('p',knowledge?'Try another topic or a broader search.':available.length||filteredKeys.length?'Try a broader search or clear filters.':'No offers are currently published. Start with a topic or everyday context; guides remain useful without buying.'));
            if(filteredKeys.length)m.empty.append(A.button('Clear filters',()=>{reset();m.controls.get('q').focus();}));
            m.empty.append(link('Browse solution areas','#/solutions'),link('Explore knowledge','#/explore?view=knowledge'));
        }
    }
    function setCount(value){document.getElementById('offer-count').textContent=value;}
    function init(){
        setup(document.querySelector('#screen-explore .marketplace-stage'),'explore',true);
        setup(document.getElementById('offer-browser'),'offers');
        document.querySelectorAll('[data-explore-clear]').forEach(b=>b.addEventListener('click',reset));
        render();
    }
    function returnURL(){try{const value=sessionStorage.getItem('arvena-catalogue-return');return /^#\/(explore|offers)(\?|$)/.test(value||'')?value:'#/offers';}catch{return '#/offers';}}
    window.ArvenaDiscovery={returnURL,init,render,renderCatalogue,domainSlugs,contextIds,searchText,matches,typeNames,className,knowledgeRecords};
    window.addEventListener('arvena:catalogue',()=>{if(/^#\/(explore|offers)(\?|$)/.test(location.hash))render();});
    window.addEventListener('popstate',()=>{if(/^#\/(explore|offers)(\?|$)/.test(location.hash))render();});
}());
