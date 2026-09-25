'use strict';
(function () {
    const config = window.ARVENA_SUPABASE_CONFIG;
    const client = window.ArvenaSupabase.createClient(config.url, config.publishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }
    });
    let user = null, offers = [], providers = [], ready = false, generation = 0, catalogueState = 'loading', catalogueRequest = null;
    const el = (tag, text, attrs = {}) => {
        const node = document.createElement(tag);
        if (text !== undefined && text !== null) node.textContent = String(text);
        for (const [key, value] of Object.entries(attrs)) {
            if (key === 'class') node.className = value;
            else node.setAttribute(key, value);
        }
        return node;
    };
    const link = (text, href) => el('a', text, { href });
    const button = (text, action) => {
        const b = el('button', text, { type: 'button', class: 'button button-secondary' });
        b.addEventListener('click', async () => {
            b.disabled = true;
            try { await action(); } catch (e) { status(e.message, true); }
            finally { b.disabled = false; }
        });
        return b;
    };
    const field = (form, label, name, type = 'text', value = '', required = true) => {
        const wrap = el('label', label, { class: 'platform-field' });
        const input = el(type === 'textarea' ? 'textarea' : 'input', null, { name });
        if (type !== 'textarea') input.type = type;
        input.value = value; input.required = required;
        wrap.append(input); form.append(wrap); return input;
    };
    const select = (form, label, name, options, value = '') => {
        const wrap = el('label', label, { class: 'platform-field' }), node = el('select', null, { name, 'aria-label': label });
        options.forEach(([v,t]) => node.append(el('option',t,{value:v})));
        node.value=value; wrap.append(node); form.append(wrap); return node;
    };
    const submit = (form, text, action) => {
        const b = el('button',text,{type:'submit',class:'button button-primary'});
        const feedback=el('p','',{role:'status','aria-live':'polite',class:'platform-form-status',tabindex:'-1'});
        form.append(b,feedback);
        form.addEventListener('submit',async e => {
            e.preventDefault(); b.disabled=true; status('Saving…');feedback.textContent='Saving…';feedback.classList.remove('platform-error');
            try {
                await action(new FormData(form));
                if(form.isConnected) feedback.textContent=document.getElementById('platform-status').textContent;
                else { const notice=document.getElementById('platform-status');notice.tabIndex=-1;notice.focus(); }
            } catch(error) {
                const message=error instanceof SyntaxError ? 'Claim sources must be a valid JSON array. Correct the source data and save again.' : error.message;
                status(message,true);feedback.textContent=message;feedback.classList.add('platform-error');feedback.focus();
            } finally { b.disabled=false; }
        });
    };
    function status(text = '', error = false) {
        const node=document.getElementById('platform-status');
        node.textContent=text; node.classList.toggle('platform-error',error);
    }
    async function result(query) { const {data,error}=await query; if(error) throw new Error(error.message); return data; }
    const table = name => client.from('arvena_'+name);
    function safeURL(value) { try { const url=new URL(value); return url.protocol==='https:' ? url.href : null; } catch { return null; } }
    function offerCard(o) {
        const card=el('article',null,{class:'discovery-card'});
        card.append(el('p',o.offer_type.replaceAll('-',' '),{class:'discovery-card-type'}),el('h3',o.title),el('p',o.publication.need),link('View offer','#/offers/'+o.slug));
        return card;
    }
    function notifyCatalogue() {
        window.dispatchEvent(new Event('arvena:catalogue'));
        const readyNow = catalogueState === 'ready';
        document.querySelector('.provider-empty-state').hidden = !readyNow || providers.length > 0;
        document.getElementById('provider-count').textContent = readyNow ? providers.length : 'Unknown';
        const notice = document.getElementById('provider-catalogue-status');
        notice.replaceChildren();
        if (!readyNow) {
            notice.append(el('p', catalogueState === 'loading' ? 'Checking published providers…' : 'Provider catalogue unavailable. Availability could not be checked.'));
            if (catalogueState !== 'loading') notice.append(button('Retry catalogue', loadCatalogue));
        }
        document.getElementById('published-providers').replaceChildren(...providers.map(p => {
            const n=el('article',null,{class:'discovery-card'}); n.append(el('h3',p.name),el('p',p.summary),link('View provider','#/providers/'+p.slug)); return n;
        }));
    }
    function loadCatalogue() {
        if (catalogueRequest) return catalogueRequest;
        offers=[]; providers=[]; ready=false;
        catalogueState=window.ARVENA_PLATFORM_ENABLED === true ? 'loading' : 'unavailable';
        notifyCatalogue();
        if (window.ARVENA_PLATFORM_ENABLED !== true) return Promise.resolve();
        catalogueRequest=(async () => {
            try {
                const [nextOffers,nextProviders]=await Promise.all([
                    result(table('offers').select('*').eq('status','published').order('title')),
                    result(table('providers').select('*').eq('status','published').order('name'))
                ]);
                // Defence in depth; RLS remains the authority for access.
                offers=nextOffers.filter(o=>o.status==='published');
                providers=nextProviders.filter(p=>p.status==='published');
                ready=true; catalogueState='ready';
            } catch { offers=[];providers=[];ready=false;catalogueState='unavailable'; }
            finally { catalogueRequest=null;notifyCatalogue(); }
        })();
        return catalogueRequest;
    }
    const init=window.ARVENA_PLATFORM_ENABLED !== true ? Promise.resolve() : client.auth.getSession().then(({data,error}) => { if(error) throw error; user=data.session?.user || null; }).catch(()=>{ user=null; }).then(loadCatalogue);
    client.auth.onAuthStateChange((event, session)=>{
        user=session?.user || null;
        if(event==='PASSWORD_RECOVERY') location.hash='/cabinet/account';
        if(['SIGNED_IN','SIGNED_OUT','PASSWORD_RECOVERY'].includes(event)) setTimeout(()=> { if(matches(location.hash.slice(1))) render(location.hash.slice(1)); },0);
    });
    function matches(path) { return /^\/(cabinet(?:\/(interests|account))?|login|provider-space|editorial(?:\/.*)?|offers\/[a-z0-9-]+|providers\/[a-z0-9-]+)$/.test(path); }
    async function render(path) {
        const epoch=++generation, root=document.getElementById('platform-content'), heading=document.getElementById('platform-title');
        root.replaceChildren(); status('Loading…');
        document.querySelector('[data-editor-link]').hidden=true;
        document.querySelector('[data-provider-link]').hidden=true;
        await init;
        if (catalogueRequest) await catalogueRequest;
        if(epoch!==generation) return;
        status();
        const title=path.startsWith('/offers/')?'Offer':path.startsWith('/providers/')?'Provider':path.startsWith('/editorial')?'Editorial desk':path==='/provider-space'?'Provider space':path==='/cabinet/interests'?'Your interests':path==='/cabinet/account'?'Your account':'Your Cabinet';
        heading.textContent=title; document.title=title+' | Arvena';
        document.querySelector('.platform-nav').hidden=path.startsWith('/offers/')||path.startsWith('/providers/');
        if(!ready) {
            root.append(el('p','Account and catalogue services are not available in this environment yet. Public guides remain available.'),button('Try again',async()=>{await loadCatalogue();await render(path);}),link('Explore public guides','#/explore')); return;
        }
        try {
            if(path.startsWith('/offers/')) return await renderOffer(root,path.split('/')[2]);
            if(path.startsWith('/providers/')) return renderProvider(root,path.split('/')[2]);
            if(!user) return renderLogin(root);
            const [editors,members]=await Promise.all([result(table('editors').select('user_id')),result(table('provider_members').select('*').eq('user_id',user.id))]);
            if(epoch!==generation) return;
            document.querySelector('[data-editor-link]').hidden=!editors.length;
            document.querySelector('[data-provider-link]').hidden=!members.length;
            if(path.startsWith('/editorial')) {
                if(!editors.length) return root.append(el('p','Editorial access requires an explicit assignment.'));
                return await window.ArvenaEditorial.render(root,path);
            }
            if(path==='/provider-space') return await renderProviderSpace(root,members);
            if(path==='/cabinet/interests') return await renderInterests(root);
            if(path==='/cabinet/account') return renderAccount(root);
            const saves=await result(table('saved_offers').select('offer_id,created_at').order('created_at',{ascending:false}));
            root.append(el('p','Keep useful offers together. Your saved list is private.'));
            if(!saves.length) root.append(el('div','No saved offers yet. Explore the catalogue and save an offer when one is relevant to you.',{class:'platform-empty'}),link('Explore','#/explore'));
            saves.forEach(s=> {
                const o=offers.find(o=>o.id===s.offer_id),row=el('article',null,{class:'platform-row'});
                row.append(o?link(o.title,'#/offers/'+o.slug):el('p','This offer is no longer published.'),button('Remove save',async()=>{await result(table('saved_offers').delete().eq('user_id',user.id).eq('offer_id',s.offer_id));await render(path);}));root.append(row);
            });
        } catch(e) { if(epoch===generation) status(e.message,true); }
    }
    function renderLogin(root) {
        const emailReady=window.ARVENA_EMAIL_DELIVERY_ENABLED === true;
        root.append(el('p','Sign in to save offers and choose your interests. Posting and provider access require separate approval.'));
        const form=el('form',null,{class:'platform-form'});
        const email=field(form,'Email','email','email');email.autocomplete='email';
        const password=field(form,'Password','password','password');password.minLength=10;password.autocomplete='current-password';
        select(form,'Account action','action',emailReady?[['login','Sign in'],['signup','Create account']]:[['login','Sign in']],'login');
        submit(form,'Continue',async data=>{
            if(data.get('action')==='signup'&&!emailReady)throw new Error('New account registration is not open yet.');
            const credentials={email:data.get('email'),password:data.get('password')};
            const response=data.get('action')==='signup'?await client.auth.signUp({...credentials,options:{emailRedirectTo:location.origin+location.pathname}}):await client.auth.signInWithPassword(credentials);
            if(response.error) throw response.error;
            if(!response.data.session) status('Check your email to confirm your account, then sign in.');
            else {user=response.data.user;await render('/cabinet');location.hash='/cabinet';}
        });
        root.append(form);
        if(emailReady)root.append(button('Send password reset email',async()=>{
            if(!email.reportValidity()) return;
            const {error}=await client.auth.resetPasswordForEmail(email.value,{redirectTo:location.origin+location.pathname});if(error)throw error;
            status('If an account exists, check its email for a reset link.');
        }));
        else root.append(el('p','New account registration and password reset are not open yet. Existing confirmed accounts can sign in.'));
        root.append(el('p','Your email and sign-in session are handled by Supabase Auth. Arvena stores only your selected interests, broad region and saved offers.'));
    }
    function renderAccount(root) {
        root.append(el('p','Signed in as '+user.email),el('p','Your account identifier: '+user.id),el('p','You may share this identifier with an Arvena editor when requesting an approved provider or contribution association. It grants no access by itself.'));
        const form=el('form',null,{class:'platform-form'}),input=field(form,'New password','password','password');input.minLength=10;input.autocomplete='new-password';
        submit(form,'Update password',async data=>{const {error}=await client.auth.updateUser({password:data.get('password')});if(error)throw error;form.reset();status('Password updated.');});
        root.append(form,button('Sign out',async()=>{const {error}=await client.auth.signOut();if(error)throw error;user=null;await render('/cabinet');}));
    }
    async function renderInterests(root) {
        const [profiles,interests,domains]=await Promise.all([result(table('profiles').select('region')),result(table('interests').select('domain_slug')),result(table('domains').select('*').order('title'))]);
        root.append(el('p','Choose only what is useful to you. These preferences are private and do not generate recommendations.'));
        const form=el('form',null,{class:'platform-form'}), group=el('fieldset');group.append(el('legend','Solution areas'));
        domains.forEach(d=>{const label=el('label',null,{class:'platform-check'}),input=el('input',null,{type:'checkbox',name:'domains',value:d.slug});input.checked=interests.some(i=>i.domain_slug===d.slug);label.append(input,document.createTextNode(d.title));group.append(label);});
        form.append(group);const region=field(form,'Country or broad region (optional)','region','text',profiles[0]?.region||'',false);region.maxLength=100;
        submit(form,'Save preferences',async data=>{
            await result(client.rpc('arvena_save_preferences',{p_region:data.get('region'),p_domains:data.getAll('domains')}));status('Preferences saved.');
        });root.append(form);
    }
    async function event(offer,kind) {
        try {
            let id=sessionStorage.getItem('arvena-metrics-session');if(!id){id=crypto.randomUUID();sessionStorage.setItem('arvena-metrics-session',id);}
            await client.rpc('arvena_record_event',{p_offer:offer.id,p_kind:kind,p_session:id});
        } catch { /* Measurement must not prevent access. */ }
    }
    async function renderOffer(root,slug) {
        const offer=offers.find(o=>o.slug===slug);if(!offer){document.getElementById('platform-title').textContent='Offer not found';return root.append(el('p','This offer is not currently published.'),link('Explore','#/explore'));}
        document.getElementById('platform-title').textContent=offer.title;document.title=offer.title+' | Arvena';
        const p=offer.publication,provider=providers.find(x=>x.id===offer.provider_id);
        root.append(el('p',p.need,{class:'platform-lead'}));if(provider)root.append(link(provider.name,'#/providers/'+provider.slug));
        const actions=el('div',null,{class:'button-row'});
        if(!user) actions.append(link('Sign in to save','#/cabinet'));
        else {
            const saves=await result(table('saved_offers').select('offer_id').eq('offer_id',offer.id));let saved=saves.length>0;
            const save=button(saved?'Remove save':'Save offer',async()=>{
                if(saved)await result(table('saved_offers').delete().eq('user_id',user.id).eq('offer_id',offer.id));
                else await result(table('saved_offers').upsert({user_id:user.id,offer_id:offer.id},{onConflict:'user_id,offer_id',ignoreDuplicates:true}));
                saved=!saved;save.textContent=saved?'Remove save':'Save offer';status(saved?'Saved privately.':'Save removed.');
            });actions.append(save);
        }
        const access=safeURL(p.access_url);if(access){const a=link('Visit provider / access offer',access);a.rel='noopener noreferrer';a.target='_blank';a.addEventListener('click',()=>event(offer,'outbound'));actions.append(a);}root.append(actions);
        if(p.media && /^\/assets\/[\w.-]+$/.test(p.media))root.append(el('img',null,{src:p.media,alt:offer.title,class:'platform-offer-image'}));
        const labels={suitability:'Suitability',selection_rationale:'Why Arvena selected it',mechanism:'How it works',specifications:'Specifications',manufacturer_claims:'Manufacturer statements',editorial_conclusion:'Arvena editorial conclusion',unknowns:'What remains unknown',strengths:'Strengths',limitations:'Limitations',safety:'Safety',materials:'Materials',environment:'Environmental considerations',lifetime:'Lifetime',maintenance:'Maintenance',alternatives:'Alternatives',geography:'Availability and geography',price:'Price',implementation:'Implementation requirements',commercial_disclosure:'Commercial disclosure',last_review_date:'Last editorial review'};
        Object.entries(labels).forEach(([key,label])=>{if(p[key]){const section=el('section',null,{class:'platform-detail'});section.append(el('h2',label),el('p',typeof p[key]==='string'?p[key]:JSON.stringify(p[key])));root.append(section);}});
        if(p.claims?.length){const section=el('section',null,{class:'platform-detail'});section.append(el('h2','Claims and sources'));
            p.claims.forEach(c=>{const article=el('article',null,{class:'platform-row'});article.append(el('h3',c.claim),el('p','Source type: '+c.source_type),el('p','Conditions: '+c.conditions),el('p','Checked: '+c.checked_on),el('p','Limitations: '+c.limitations),el('p','Arvena conclusion: '+c.editorial_conclusion));const url=safeURL(c.source);if(url){const a=link('Read source',url);a.rel='noopener noreferrer';a.target='_blank';article.append(a);}section.append(article);});root.append(section);}
        await renderDiscussion(root,offer);void event(offer,'view');
    }
    async function renderDiscussion(root,offer) {
        const area=el('section',null,{class:'platform-detail'});area.append(el('h2','Questions and perspectives'),el('p','Moderated contributions provide context. They are not scientific evidence or a certification.'));
        const items=await result(table('public_contributions').select('*').eq('offer_id',offer.id).order('published_at'));
        if(!items.length)area.append(el('p','No contributions have been published.'));
        items.forEach(i=>{const row=el('article',null,{class:'platform-row'});row.append(el('h3',i.kind.replaceAll('_',' ')),el('p',i.body));area.append(row);});
        if(user){
            const [permissions,members,editors]=await Promise.all([result(table('contribution_permissions').select('*').eq('user_id',user.id)),result(table('provider_members').select('*').eq('user_id',user.id)),result(table('editors').select('*'))]);
            const scoped=permissions.filter(p=>p.offer_id===offer.id||p.domain_slug===offer.domain_slug),provider=members.some(m=>m.provider_id===offer.provider_id);
            let types=[];
            if(scoped.length)types.push('question','practical_observation','user_experience');
            if(scoped.some(p=>p.capability==='specialist'))types.push('specialist_explanation');
            if(provider)types.push('question','provider_statement');if(editors.length)types=['question','practical_observation','user_experience','specialist_explanation','provider_statement','editorial_response'];
            types=[...new Set(types)];
            if(types.length){const form=el('form',null,{class:'platform-form'});select(form,'Contribution type','kind',types.map(t=>[t,t.replaceAll('_',' ')]),types[0]);const body=field(form,'Your contribution','body','textarea');body.minLength=10;body.maxLength=5000;submit(form,'Submit for review',async data=>{await result(table('contributions').insert({offer_id:offer.id,kind:data.get('kind'),body:data.get('body')}));body.value='';status('Submitted for editorial review. It is not public yet.');});area.append(form);}
            else area.append(el('p','Posting requires explicit permission from the editorial team. Signing in alone does not grant it.'));
            const own=await result(table('contributions').select('kind,body,status').eq('user_id',user.id).eq('offer_id',offer.id));
            if(own.length){area.append(el('h3','Your submissions'));own.forEach(i=>area.append(el('p',i.status.replaceAll('_',' ')+': '+i.body)));}
        }else area.append(el('p','Approved contributors can sign in to submit for review.'));
        root.append(area);
    }
    function renderProvider(root,slug) {
        const provider=providers.find(p=>p.slug===slug);if(!provider)return root.append(el('p','This provider is not currently published.'));
        document.getElementById('platform-title').textContent=provider.name;
        root.append(el('p',provider.summary,{class:'platform-lead'}),el('h2','Relationship with Arvena'),el('p',provider.relationship));
        if(safeURL(provider.website))root.append(link('Provider website',safeURL(provider.website)));
        root.append(el('h2','Published offers'));offers.filter(o=>o.provider_id===provider.id).forEach(o=>root.append(offerCard(o)));
    }
    async function renderProviderSpace(root,members) {
        if(!members.length)return root.append(el('p','No approved provider association is assigned to this account. Registration does not establish provider ownership.'));
        const own=offers.filter(o=>members.some(m=>m.provider_id===o.provider_id));
        root.append(el('p','View your associated listings and send corrections for editorial review. Public content is edited by Arvena.'));
        const [identities,metrics,corrections]=await Promise.all([result(table('providers').select('*').in('id',members.map(m=>m.provider_id))),result(table('listing_metrics').select('*').order('day',{ascending:false})),result(table('corrections').select('*').order('created_at',{ascending:false}))]);
        identities.forEach(p=>root.append(el('h2',p.name),el('p',p.relationship)));
        root.append(el('p','Daily measurements start when events occur. Views are not unique people; outbound clicks are not purchases. Repeat events from one browser session are limited to one per offer and event type per 30 minutes. Signed-in representatives and editors are excluded. These are approximate activity counts, not audited audience totals.'));
        if(!own.length)root.append(el('p','No associated listings are currently published.'));
        own.forEach(o=>{const row=offerCard(o),data=metrics.filter(m=>m.offer_id===o.id);if(!data.length)row.append(el('p','No measured events yet.'));data.forEach(m=>row.append(el('p',`${m.day}: ${m.views} views · ${m.outbound_clicks} outbound clicks`)));root.append(row);});
        if(own.length){const form=el('form',null,{class:'platform-form'});form.append(el('h2','Submit a correction'));select(form,'Listing','offer_id',own.map(o=>[o.id,o.title]),own[0].id);const body=field(form,'Correction or updated information','body','textarea');body.minLength=10;body.maxLength=10000;field(form,'Documentation URL (optional, HTTPS)','url','url','',false);submit(form,'Send for editorial review',async data=>{const url=data.get('url');if(url&&!safeURL(url))throw new Error('Use an HTTPS documentation URL.');await result(table('corrections').insert({offer_id:data.get('offer_id'),body:data.get('body'),documentation_url:url||null}));await render('/provider-space');status('Correction submitted.');});root.append(form);}
        root.append(el('h2','Your correction submissions'));if(!corrections.length)root.append(el('p','No corrections submitted.'));corrections.forEach(c=>root.append(el('article',c.status+': '+c.body+(c.editorial_note?' · '+c.editorial_note:''),{class:'platform-row'})));
    }
    window.ArvenaPlatform={client,table,result,el,link,button,field,select,submit,status,safeURL,render,matches,loadCatalogue,offerCard,
        get catalogueState(){return catalogueState;},
        get user(){return user;},get offers(){return offers;},get providers(){return providers;},
        discoveryRecords:()=>offers.map(o=>({recordType:'offer',slug:o.slug,title:o.title,domainSlug:o.domain_slug,publicationStatus:'published',description:o.publication.need}))};
})();
