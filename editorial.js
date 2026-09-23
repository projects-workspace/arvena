'use strict';
(function () {
    const A=window.ArvenaPlatform, {el,link,button,field,select,submit,result,table,status}=A;
    const command=(command,payload)=>result(A.client.rpc('arvena_editor_command',{command,payload}));
    const fields={slug:'Public URL slug',title:'Exact offer identity',provider_id:'Provider identifier',offer_type:'Offer type',domain_slug:'Solution domain',solution_class_slug:'Solution class (optional)',need:'Need addressed',suitability:'Suitability',selection_rationale:'Selection rationale',mechanism:'How it works',specifications:'Specifications',manufacturer_claims:'Manufacturer statements',editorial_conclusion:'Arvena conclusion',unknowns:'Unknowns',strengths:'Strengths',limitations:'Limitations',safety:'Safety',materials:'Materials',environment:'Environmental considerations',lifetime:'Lifetime',maintenance:'Maintenance',alternatives:'Alternatives',geography:'Availability / geography',price:'Verified price or explicit unknown',access_url:'Access URL (HTTPS)',implementation:'Implementation requirements',commercial_disclosure:'Commercial disclosure',last_review_date:'Last review date',media:'Approved local image path',media_rights:'Media rights basis'};
    const required=new Set(['slug','title','provider_id','offer_type','domain_slug','need','selection_rationale','editorial_conclusion','unknowns','limitations','safety','price','commercial_disclosure','last_review_date']);
    async function render(root,path) {
        const nav=el('nav',null,{class:'platform-tabs','aria-label':'Editorial tools'});
        [['packages','Research packages'],['providers','Providers'],['access','Access permissions'],['moderation','Contributions'],['corrections','Corrections'],['analytics','Analytics']].forEach(([s,t])=>nav.append(link(t,'#/editorial/'+s)));root.append(nav);
        const section=path.split('/')[2]||'packages';
        if(section==='packages')return packages(root);
        if(section==='providers')return providers(root);
        if(section==='access')return access(root);
        if(section==='moderation')return moderation(root);
        if(section==='corrections')return corrections(root);
        if(section==='analytics')return analytics(root);
        root.append(el('p','Editorial page not found.'));
    }
    async function packages(root) {
        root.append(el('p','Research and evaluation are performed by the Arvena team and relevant specialists. This desk stores their work and publishes explicitly approved copy. It does not research products or generate recommendations.'));
        const rows=await result(table('research_packages').select('*').order('updated_at',{ascending:false}));
        const chooser=el('div',null,{class:'platform-row'}),editor=el('div');
        chooser.append(button('New research package',()=>editPackage(editor,null)));
        rows.forEach(p=>chooser.append(button(p.title+' · '+p.status.replaceAll('_',' '),()=>editPackage(editor,p))));
        root.append(chooser,editor);
        if(!rows.length)root.append(el('p','No research packages have been supplied. Create a package only from real human-prepared material.'));
        if(rows.length)await editPackage(editor,rows[0]);
    }
    async function editPackage(root,p) {
        root.replaceChildren();
        root.append(el('h2',p?p.title:'New research package'));
        const [providers,domains,classes]=await Promise.all([result(table('providers').select('*').order('name')),result(table('domains').select('*').order('title')),result(table('solution_classes').select('*').order('title'))]);
        const form=el('form',null,{class:'platform-form platform-form-wide'});
        field(form,'Internal package title','package_title','text',p?.title||'');
        const dossier=field(form,'Private research dossier and review notes','dossier','textarea',p?.dossier||'',false);dossier.maxLength=100000;
        form.append(el('p','The dossier is visible only to editors. Only the approved public fields below are published. Saving changes returns the package to draft and clears its approval.'));
        const copy=p?.public_copy||{};
        Object.entries(fields).forEach(([key,label])=>{
            if(key==='provider_id')select(form,label,key,[['','Select a provider'],...providers.map(x=>[x.id,x.name+' ('+x.status+')'])],copy[key]||'');
            else if(key==='domain_slug')select(form,label,key,[['','Select a domain'],...domains.map(x=>[x.slug,x.title])],copy[key]||'');
            else if(key==='solution_class_slug')select(form,label,key,[['','Not applicable'],...classes.map(x=>[x.slug,x.title])],copy[key]||'');
            else if(key==='offer_type')select(form,label,key,[['','Select a type'],...['product','handmade','technology','service','installed-product','building','integrated-system','turnkey'].map(x=>[x,x])],copy[key]||'');
            else field(form,label+(required.has(key)?' · required for publication':''),key,key==='last_review_date'?'date':['slug','title','access_url','media'].includes(key)?'text':'textarea',copy[key]||'',false);
        });
        const claims=field(form,'Claim-level sources (JSON array)','claims','textarea',JSON.stringify(copy.claims||[],null,2),true);claims.rows=10;
        form.append(el('p','Each claim requires claim, source (HTTPS URL), source_type, conditions, checked_on, limitations and editorial_conclusion. Keep manufacturer statements distinct. An empty array means no source-linked claims have been entered.'));
        submit(form,'Save draft',async data=>{
            const public_copy={};Object.keys(fields).forEach(k=>{if(data.get(k))public_copy[k]=data.get(k);});public_copy.claims=JSON.parse(data.get('claims'));
            await command('save_package',{id:p?.id,revision:p?.revision,title:data.get('package_title'),dossier:data.get('dossier'),public_copy});await A.render('/editorial/packages');status('Draft saved. Previous public copy is unchanged.');
        });root.append(form);
        if(!p)return;
        root.append(el('h3','Review and publication'),el('p','Revision '+p.revision+' · '+p.status.replaceAll('_',' ')),el('p',p.review_note));
        const review=el('form',null,{class:'platform-form'});field(review,'Human review rationale','note','textarea','',false);
        const transitions=p.status==='draft'||p.status==='rejected'?['under_review']:p.status==='under_review'?['approved','rejected']:[];
        if(transitions.length){select(review,'Review decision','status',transitions.map(t=>[t,t.replaceAll('_',' ')]),transitions[0]);submit(review,'Record review decision',async data=>{await command('review_package',{id:p.id,revision:p.revision,status:data.get('status'),note:data.get('note')});await A.render('/editorial/packages');status('Review decision recorded.');});root.append(review);}
        if(p.status==='approved')root.append(button('Publish approved revision',async()=>{await command('publish_package',{id:p.id,revision:p.revision});await A.loadCatalogue();await A.render('/editorial/packages');status('Approved revision published.');}));
        if(p.offer_id)root.append(button('Hide public offer',async()=>{await command('hide_offer',{id:p.offer_id});await A.loadCatalogue();status('Offer hidden from public access.');}));
        root.append(el('p','Review and publish act on the saved revision. Save any field changes first. Publication never includes the private dossier.'));
        const history=await result(table('editorial_events').select('action,revision,note,recorded_at').in('entity_id',[p.id,...(p.offer_id?[p.offer_id]:[])]).order('recorded_at',{ascending:false}));
        const log=el('details');log.append(el('summary','Editorial decision history'));history.forEach(e=>log.append(el('p',e.recorded_at+' · '+e.action.replaceAll('_',' ')+' · revision '+(e.revision||'not applicable')+(e.note?' · '+e.note:''))));root.append(log);
    }
    async function providers(root) {
        const rows=await result(table('providers').select('*').order('name'));
        root.append(el('p','Create only real provider identities from approved material. Published status does not imply a commercial partnership.'));
        const editor=el('div');root.append(button('New provider',()=>edit(null)),editor);
        rows.forEach(p=>root.append(button(p.name+' · '+p.status,()=>edit(p))));
        function edit(p){editor.replaceChildren();const form=el('form',null,{class:'platform-form'});
            field(form,'Name','name','text',p?.name||'');field(form,'URL slug','slug','text',p?.slug||'');field(form,'Public summary','summary','textarea',p?.summary||'');field(form,'Website (optional, HTTPS)','website','url',p?.website||'',false);field(form,'Relationship and commercial disclosure','relationship','textarea',p?.relationship||'');select(form,'Publication status','status',['draft','published','hidden'].map(v=>[v,v]),p?.status||'draft');
            submit(form,'Save provider',async data=>{const value=Object.fromEntries(data);value.website=value.website||null;if(p)value.id=p.id;await result(table('providers').upsert(value));await A.loadCatalogue();await A.render('/editorial/providers');status('Provider saved.');});editor.append(form);
        }
    }
    async function access(root) {
        const [members,permissions,providers,domains,offers]=await Promise.all([result(table('provider_members').select('*')),result(table('contribution_permissions').select('*')),result(table('providers').select('*')),result(table('domains').select('*')),result(table('offers').select('id,title'))]);
        root.append(el('p','Use the account identifier supplied by the person after verifying their role. Approval is explicit and revocable. This desk cannot create editors; a trusted database operator assigns editorial access.'));
        const member=el('form',null,{class:'platform-form'});member.append(el('h2','Provider association'));field(member,'Account identifier','user_id');select(member,'Provider','provider_id',providers.map(p=>[p.id,p.name]),providers[0]?.id||'');submit(member,'Grant provider association',async data=>{await result(table('provider_members').upsert(Object.fromEntries(data),{onConflict:'user_id,provider_id'}));await A.render('/editorial/access');status('Provider association granted.');});root.append(member);
        members.forEach(m=>{const row=el('div',null,{class:'platform-row'});row.append(el('p',m.user_id+' · '+(providers.find(p=>p.id===m.provider_id)?.name||m.provider_id)),button('Revoke provider association',async()=>{await result(table('provider_members').delete().eq('user_id',m.user_id).eq('provider_id',m.provider_id));await A.render('/editorial/access');}));root.append(row);});
        const form=el('form',null,{class:'platform-form'});form.append(el('h2','Contribution permission'));field(form,'Account identifier','user_id');select(form,'Capability','capability',[['contributor','Contributor'],['specialist','Reviewed specialist']],'contributor');select(form,'Authorized scope','scope',[...domains.map(d=>['domain:'+d.slug,d.title+' (domain)']),...offers.map(o=>['offer:'+o.id,o.title+' (offer)'])],'domain:water');submit(form,'Grant scoped permission',async data=>{const [type,id]=data.get('scope').split(':');await result(table('contribution_permissions').insert({user_id:data.get('user_id'),capability:data.get('capability'),domain_slug:type==='domain'?id:null,offer_id:type==='offer'?id:null}));await A.render('/editorial/access');status('Permission granted.');});root.append(form);
        permissions.forEach(p=>{const row=el('div',null,{class:'platform-row'});row.append(el('p',p.user_id+' · '+p.capability+' · '+(p.domain_slug||p.offer_id)),button('Revoke contribution permission',async()=>{await result(table('contribution_permissions').delete().eq('id',p.id));await A.render('/editorial/access');}));root.append(row);});
        const classes=el('form',null,{class:'platform-form'});classes.append(el('h2','Add a solution-class relationship'));field(classes,'Slug','slug');field(classes,'Title','title');field(classes,'Need addressed','need');select(classes,'Domain','domain_slug',domains.map(d=>[d.slug,d.title]),'water');submit(classes,'Save solution class',async data=>{await result(table('solution_classes').upsert(Object.fromEntries(data)));status('Solution class saved.');});root.append(classes);
    }
    async function moderation(root) {
        const rows=await result(table('contributions').select('*').order('created_at',{ascending:false}));
        if(!rows.length)root.append(el('p','No contributions awaiting review.'));
        rows.forEach(c=>{const row=el('section',null,{class:'platform-detail'});row.append(el('h2',c.kind.replaceAll('_',' ')+' · '+c.status.replaceAll('_',' ')),el('p',c.body));
            const options=c.status==='submitted'?['under_review','rejected']:c.status==='under_review'?['published','rejected']:c.status==='published'?['hidden']:c.status==='hidden'?['under_review']:[];
            if(options.length){const form=el('form',null,{class:'platform-form'});field(form,'Public text (editorial correction where needed)','body','textarea',c.public_body||c.body);select(form,'Decision','status',options.map(t=>[t,t.replaceAll('_',' ')]),options[0]);submit(form,'Record moderation decision',async data=>{await command('moderate',{id:c.id,status:data.get('status'),body:data.get('body')});await A.render('/editorial/moderation');status('Moderation recorded.');});row.append(form);}root.append(row);
        });
    }
    async function corrections(root) {
        const rows=await result(table('corrections').select('*').order('created_at',{ascending:false}));
        if(!rows.length)root.append(el('p','No corrections submitted.'));
        rows.forEach(c=>{const form=el('form',null,{class:'platform-form platform-detail'});form.append(el('h2',c.status.replaceAll('_',' ')),el('p',c.body));if(A.safeURL(c.documentation_url))form.append(link('Submitted documentation',A.safeURL(c.documentation_url)));field(form,'Editorial response / resolution','note','textarea',c.editorial_note||'',false);select(form,'Decision','status',['under_review','resolved','rejected'].map(t=>[t,t.replaceAll('_',' ')]),'under_review');submit(form,'Record correction review',async data=>{await command('review_correction',{id:c.id,status:data.get('status'),note:data.get('note')});await A.render('/editorial/corrections');status('Correction review recorded. Public offer changes require a reviewed package.');});root.append(form);});
    }
    async function analytics(root) {
        root.append(el('p','Daily measured activity. Views are not unique people; clicks are not purchases. No visitor identities are collected by this analytics feature.'));
        const rows=await result(table('listing_metrics').select('*').order('day',{ascending:false}));
        if(!rows.length)root.append(el('p','No measured events yet.'));
        rows.forEach(m=>root.append(el('p',`${m.day} · ${A.offers.find(o=>o.id===m.offer_id)?.title||m.offer_id} · ${m.views} views · ${m.outbound_clicks} outbound clicks`,{class:'platform-row'})));
    }
    window.ArvenaEditorial={render};
})();
