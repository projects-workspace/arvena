'use strict';
(function () {
    const A = window.ArvenaPlatform;
    const {el, link, button, field, select, result, table, status} = A;
    const bucket = 'arvena-public-media';
    const selected = {offer: null, provider: null};
    let dirty = false;
    async function command(action, payload) {
        const {data,error}=await A.client.rpc('arvena_owner_command',{action,payload});
        if(!error)return data;
        if(error.code==='23505')throw new Error('That public URL slug is already in use. Choose a different slug.');
        if(error.code==='23503')throw new Error('A selected provider or category is no longer available. Reload the draft and choose again.');
        if(error.code==='57014')throw new Error('The operation timed out. Reload to check the saved state before trying again.');
        throw new Error(error.message);
    }
    const discard = () => !dirty || window.confirm('Leave without saving these changes?');
    const markDirty = () => { dirty = true; };
    const types = ['product','handmade','technology','service','installed-product','building','integrated-system','turnkey'];
    const optional = {
        suitability:'Suitable uses', mechanism:'How it works', specifications:'Specifications',
        materials:'Materials', strengths:'Strengths', limitations:'Limitations', safety:'Safety and use',
        maintenance:'Care and maintenance', lifetime:'Lifetime', environment:'Environmental information',
        implementation:'Installation or implementation', alternatives:'Alternatives'
    };
    function group(form, title, description) {
        const block = el('fieldset', null, {class:'publishing-group'});
        block.append(el('legend', title));
        if (description) block.append(el('p', description, {class:'publishing-help'}));
        form.append(block);
        return block;
    }
    function textField(form, label, key, value = '', type = 'text', required = false) {
        const input = field(form, label, key, type, value, required);
        input.maxLength = key === 'slug' ? 160 : ['title','name'].includes(key) ? 180 : 10000;
        return input;
    }
    function imageEditor(form, initial, invalidate) {
        const images = structuredClone(initial || []);
        const block = group(form, 'Images', 'Upload only images cleared for public use. Uploaded files are public before the listing is published. Keep private documents outside this upload.');
        const list = el('div', null, {class:'publishing-image-list'});
        block.append(list);
        function draw() {
            list.replaceChildren();
            images.forEach((img, index) => {
                const row = el('div', null, {class:'publishing-image-row'});
                const url = A.mediaURL(img.path);
                if (url) row.append(el('img', null, {src:url, alt:img.alt, loading:'lazy'}));
                const fields = el('div');
                textField(fields, 'Image '+(index+1)+' description', 'image-alt-'+index, img.alt).addEventListener('input', e => {img.alt=e.target.value;});
                textField(fields, 'Image '+(index+1)+' rights', 'image-rights-'+index, img.rights).addEventListener('input', e => {img.rights=e.target.value;});
                fields.append(button('Remove image '+(index+1), () => {images.splice(index,1);invalidate();draw();}));
                row.append(fields); list.append(row);
            });
        }
        draw();
        const file = field(block, 'Image file', 'image-file', 'file', '', false);
        file.accept = 'image/jpeg,image/png,image/webp';
        const alt = textField(block, 'Description of the new image', 'new-image-alt');
        alt.maxLength = 300;
        const rights = textField(block, 'Permission or rights to use the new image', 'new-image-rights');
        rights.maxLength = 1000;
        const feedback = el('p', '', {role:'status', 'aria-live':'polite'});
        let uploading = false;
        block.append(button('Upload public image', async () => {
            if (images.length >= 6) throw new Error('Use at most six images per listing.');
            const item = file.files[0];
            const extension = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[item?.type];
            if (!item || !extension || item.size > 5*1024*1024) throw new Error('Choose a JPEG, PNG or WebP image up to 5 MB.');
            if (!alt.value.trim() || !rights.value.trim()) throw new Error('Add an image description and its rights or permission before uploading.');
            uploading = true; feedback.textContent = 'Uploading image…'; invalidate();
            try {
                const bitmap = await createImageBitmap(item); bitmap.close();
                const path = crypto.randomUUID()+'.'+extension;
                const {error} = await A.client.storage.from(bucket).upload(path, item, {contentType:item.type, upsert:false});
                if (error) throw new Error('Image upload failed. Check your connection and publishing access, then try again.');
                images.push({path,alt:alt.value.trim(),rights:rights.value.trim()});
                file.value='';alt.value='';rights.value='';draw();
                feedback.textContent='Image uploaded. Save the draft to include it.';
            } catch (error) {
                feedback.textContent='The image was not added. '+error.message;
                throw error;
            } finally { uploading=false; }
        }), feedback, el('p', 'JPEG, PNG or WebP · up to 5 MB each · six images maximum. Removing an image here does not delete an earlier publication’s file.', {class:'publishing-help'}));
        return {
            read() {
                if (uploading) throw new Error('Wait for the image upload to finish.');
                if (file.files.length) throw new Error('Upload the selected image, or clear the file selection before saving.');
                if (images.some(i=>!i.alt.trim()||!i.rights.trim()||i.alt.length>300||i.rights.length>1000)) throw new Error('Each image needs a description (up to 300 characters) and rights (up to 1000 characters).');
                return images;
            }
        };
    }
    function sourceEditor(form, sources = []) {
        const block = group(form, 'Sources and reading (optional)', 'Add useful public references or existing research. A source link does not imply that Arvena performed a test.');
        const rows = el('div');
        const entries = [];
        const add = (source={title:'',url:''}) => {
            const row=el('div',null,{class:'publishing-source'});
            const title=textField(row,'Source title','source-title',source.title);
            title.maxLength=300;
            const url=textField(row,'Source URL (HTTPS)','source-url',source.url,'url');
            const entry={row,title,url}; entries.push(entry);
            row.append(button('Remove source',()=>{entries.splice(entries.indexOf(entry),1);row.remove();form.dispatchEvent(new Event('input',{bubbles:true}));}));
            rows.append(row);
        };
        sources.forEach(add);
        block.append(rows,button('Add source',()=>{
            if(entries.length>=20)throw new Error('Use at most twenty source links.');
            add();form.dispatchEvent(new Event('input',{bubbles:true}));
        }));
        return () => entries.filter(e=>e.title.value.trim()||e.url.value.trim()).map(e=>{
            if(!e.title.value.trim()||!A.safeURL(e.url.value))throw new Error('Each source needs a title and an HTTPS URL.');
            return {title:e.title.value.trim(),url:e.url.value.trim()};
        });
    }
    async function render(root, section) {
        dirty=false;
        const kind=section==='providers'?'provider':'offer';
        const nav=el('nav',null,{class:'platform-tabs','aria-label':'Publishing tools'});
        [['packages','Offers'],['providers','Providers'],['access','Access permissions'],['moderation','Contributions'],['corrections','Corrections'],['analytics','Analytics']].forEach(([path,title])=>{
            const a=link(title,'#/editorial/'+path);
            if(path===section)a.setAttribute('aria-current','page');
            nav.append(a);
        });
        root.append(nav,el('p','Prepare a listing, preview the saved copy, then publish when it is ready. Research and product selection happen outside this form.'));
        const layout=el('div',null,{class:'publishing-layout'}),chooser=el('aside',null,{class:'publishing-list'}),editor=el('div',null,{class:'publishing-editor'});
        layout.append(chooser,editor);root.append(layout);
        let rows, providers, domains=[], classes=[];
        try {
            [rows,providers,domains,classes]=await Promise.all([
                result(table(kind==='offer'?'research_packages':'provider_drafts').select(kind==='offer'?'id,title,offer_id,public_copy,status,revision,updated_at':'*').order('updated_at',{ascending:false})),
                result(table('providers').select('*').order('name')),
                kind==='offer'?result(table('domains').select('*').order('title')):[],
                kind==='offer'?result(table('solution_classes').select('*').order('title')):[]
            ]);
        } catch {
            editor.append(el('p','Publishing is not ready in this environment. Its database migration and media storage must be configured before editing listings.'),button('Retry publishing',()=>A.render('/editorial/'+section)));
            return;
        }
        const open=async row=>{
            if(!discard())return;
            dirty=false;status();selected[kind]=row?.id||null;
            await edit(editor,kind,row,{providers,domains,classes});
        };
        chooser.append(button(kind==='offer'?'New offer':'New provider',()=>open(null)));
        rows.forEach(row=>{
            const entity=kind==='offer'?A.offers.find(o=>o.id===row.offer_id):providers.find(p=>p.id===row.provider_id);
            const state=entity?.status==='published'?(row.status==='published'?'Published':'Published · draft changes'):entity?'Unpublished':row.status==='published'?'Unpublished':'Draft';
            chooser.append(button((row.public_copy.title||row.public_copy.name||row.title||'Untitled')+' · '+state,()=>open(row)));
        });
        if(kind==='provider') providers.filter(p=>!rows.some(d=>d.provider_id===p.id)).forEach(p=>{
            chooser.append(button(p.name+' · '+p.status,async()=>{
                if(!discard())return;
                const draft=await command('open_provider',{provider_id:p.id});
                dirty=false;selected.provider=draft.id;await A.render('/editorial/providers');
            }));
        });
        if(!rows.length)chooser.append(el('p',kind==='offer'?'No offer drafts yet.':'No provider drafts yet.',{class:'publishing-help'}));
        if(layout.isConnected)await edit(editor,kind,rows.find(r=>r.id===selected[kind])||null,{providers,domains,classes});
    }
    async function edit(root,kind,record,lookups) {
        const contentRoot=el('div');
        root.replaceChildren(contentRoot);root=contentRoot;
        const copy=structuredClone(record?.public_copy||{});
        const isOffer=kind==='offer';
        const titleKey=isOffer?'title':'name';
        const heading=el('h2',record?(copy[titleKey]||record.title):(isOffer?'New offer':'New provider'),{tabindex:'-1'});
        root.append(heading);
        const form=el('form',null,{class:'platform-form publishing-form'});
        const preview=el('section',null,{class:'publishing-preview',hidden:true,'aria-label':'Saved publication preview'});
        const invalidate=()=>{markDirty();status();preview.hidden=true;preview.replaceChildren();};
        form.addEventListener('input',invalidate);form.addEventListener('change',invalidate);
        const identity=group(form,'Identity');
        const title=textField(identity,isOffer?'Offer name':'Provider name',titleKey,copy[titleKey]||record?.title||'','text',true);
        const slug=textField(identity,'Public URL slug','slug',copy.slug||'');
        if(record?.offer_id||record?.provider_id)slug.readOnly=true;
        else {
            let customSlug=!!copy.slug;
            slug.addEventListener('input',()=>{customSlug=true;});
            title.addEventListener('input',()=>{
                if(!customSlug)slug.value=title.value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
            });
        }
        const controls=new Map([[titleKey,title],['slug',slug]]);
        if(isOffer){
            controls.set('provider_id',select(identity,'Provider','provider_id',[['','Choose a provider'],...lookups.providers.map(p=>[p.id,p.name+' ('+p.status+')'])],copy.provider_id||''));
            identity.append(link('Manage providers','#/editorial/providers'));
            controls.set('offer_type',select(identity,'Offer type','offer_type',[['','Choose a type'],...types.map(t=>[t,t.replaceAll('-',' ')])],copy.offer_type||''));
            const domain=select(identity,'Category','domain_slug',[['','Choose a category'],...lookups.domains.map(d=>[d.slug,d.title])],copy.domain_slug||'');
            controls.set('domain_slug',domain);
            const cls=select(identity,'Solution class (optional)','solution_class_slug',[],'');
            const populate=()=>{
                cls.replaceChildren(el('option','Not specified',{value:''}),...lookups.classes.filter(c=>c.domain_slug===domain.value).map(c=>el('option',c.title,{value:c.slug})));
            };
            populate();cls.value=copy.solution_class_slug||'';
            domain.addEventListener('change',populate);controls.set('solution_class_slug',cls);
            const placementDetails=el('details',null,{class:'publishing-more'});placementDetails.append(el('summary','Related areas and contexts (optional)'));form.append(placementDetails);
            const placements=group(placementDetails,'Where this offer appears','Choose only relevant associations. Each placement points to this one canonical offer. Changes remain private until the saved copy is published.');
            const domainGroup=el('fieldset');domainGroup.append(el('legend','Additional solution areas'));
            const contextGroup=el('fieldset');contextGroup.append(el('legend','Everyday contexts'));
            const associationChecks={domain_slugs:[],context_ids:[]};
            const choices=(target,key,values)=>values.forEach(([value,title])=>{const label=el('label',null,{class:'platform-check'}),input=el('input',null,{type:'checkbox',name:key,value});input.checked=(copy[key]||[]).includes(value);label.append(input,document.createTextNode(title));target.append(label);associationChecks[key].push(input);});
            choices(domainGroup,'domain_slugs',lookups.domains.map(d=>[d.slug,d.title]));
            choices(contextGroup,'context_ids',window.ARVENA_KNOWLEDGE.contexts.map(c=>[c.id,c.title]));
            placements.append(domainGroup,contextGroup);
            form.readAssociations=()=>Object.fromEntries(Object.entries(associationChecks).map(([key,inputs])=>[key,inputs.filter(i=>i.checked).map(i=>i.value)]));

        }
        const content=group(form,'Description');
        const descriptionKey=isOffer?'need':'summary';
        controls.set(descriptionKey,textField(content,'Description',descriptionKey,copy[descriptionKey]||'','textarea'));
        const media=imageEditor(form,copy.images,invalidate);
        let keepLegacyImage=null,keepLegacyClaims=null;
        if(copy.media){
            const label=el('label',null,{class:'platform-check'});keepLegacyImage=el('input',null,{type:'checkbox'});keepLegacyImage.checked=true;
            label.append(keepLegacyImage,document.createTextNode('Keep the existing local image and its rights information'));form.append(label);
        }
        const access=group(form,isOffer?'Availability and access':'Website and relationship');
        const fields=isOffer?{geography:'Availability / region (optional)',price:'Price information (optional)',access_url:'External access URL (HTTPS, optional)',commercial_disclosure:'Commercial relationship / disclosure'}:{website:'Website (HTTPS, optional)',relationship:'Relationship with Arvena / disclosure'};
        for(const [key,label]of Object.entries(fields))controls.set(key,textField(access,label,key,copy[key]||'',key==='access_url'||key==='website'?'url':'textarea'));
        let sources=()=>copy.sources;
        if(isOffer){
            const notes=group(form,'Selection and context (optional)');
            controls.set('selection_rationale',textField(notes,'Why this offer is included','selection_rationale',copy.selection_rationale||'','textarea'));
            const more=el('details',null,{class:'publishing-more'});more.append(el('summary','More details (optional)'));form.append(more);
            for(const [key,label]of Object.entries(optional))controls.set(key,textField(more,label,key,copy[key]||'','textarea'));
            sources=sourceEditor(form,copy.sources);
            if(copy.claims?.length || copy.editorial_conclusion || copy.unknowns || copy.last_review_date){
                const retained=el('details',null,{class:'publishing-more'});retained.append(el('summary','Existing research information'));
                retained.append(el('p','Previous conclusions, source-linked claims and review dates are retained. They are not required for a new listing.'));
                for(const key of ['editorial_conclusion','unknowns','manufacturer_claims','last_review_date']){
                    if(copy[key])controls.set(key,textField(retained,key.replaceAll('_',' '),key,copy[key],key==='last_review_date'?'date':'textarea'));
                }
                if(copy.claims?.length){
                    const label=el('label',null,{class:'platform-check'});keepLegacyClaims=el('input',null,{type:'checkbox'});keepLegacyClaims.checked=true;
                    label.append(keepLegacyClaims,document.createTextNode('Include the '+copy.claims.length+' existing claim records unchanged'));
                    retained.append(label,el('p','Unchecking removes them from the next public copy. Earlier publication history and private notes are retained.'));
                }
                form.append(retained);
            }
        }
        const actions=el('div',null,{class:'button-row'});
        const save=el('button','Save draft',{type:'submit',class:'button button-secondary',value:'save'});
        const show=el('button','Save and preview',{type:'submit',class:'button button-primary',value:'preview'});
        actions.append(save,show);
        const feedback=el('p','',{role:'status','aria-live':'polite',tabindex:'-1'});
        form.append(actions,feedback);root.append(form,preview);
        let current=record, saving=false;
        form.addEventListener('submit',async event=>{
            event.preventDefault();if(saving)return;
            saving=true;save.disabled=true;show.disabled=true;feedback.classList.remove('platform-error');feedback.textContent='Saving draft…';
            try {
                const publicCopy={...copy};
                controls.forEach((input,key)=>{if(input.value.trim())publicCopy[key]=input.value.trim();else delete publicCopy[key];});
                if(keepLegacyImage&&!keepLegacyImage.checked){delete publicCopy.media;delete publicCopy.media_rights;}
                if(keepLegacyClaims&&!keepLegacyClaims.checked)publicCopy.claims=[];
                publicCopy.images=media.read();
                if(isOffer){publicCopy.sources=sources();Object.assign(publicCopy,form.readAssociations());}
                const saved=await command('save_'+kind,{id:current?.id,revision:current?.revision,public_copy:publicCopy});
                current=(await result(table(isOffer?'research_packages':'provider_drafts').select(isOffer?'id,title,offer_id,public_copy,status,revision':'*').eq('id',saved.id)))[0];
                if(!current)throw new Error('The draft was saved, but could not be reloaded. Reload this page before publishing.');
                selected[kind]=current.id;dirty=false;Object.assign(copy,publicCopy);
                feedback.textContent='Draft saved. Public content has not changed.';
                if(event.submitter===show)await showPreview();
                else {preview.hidden=true;preview.replaceChildren();}
            } catch(error) {
                feedback.textContent=error.message;feedback.classList.add('platform-error');feedback.focus();
            } finally {saving=false;save.disabled=false;show.disabled=false;}
        });
        async function showPreview(){
            preview.replaceChildren();preview.hidden=false;
            const p=current.public_copy;
            const h=el('h2','Saved preview',{tabindex:'-1'});
            preview.append(h,el('p','Revision '+current.revision+'. Review this saved copy before publishing. Editing the form closes this preview.'));
            const surface=el('article',null,{class:'publishing-preview-content'});
            surface.append(el('h3',p[titleKey]));
            if(isOffer){
                surface.append(el('p',p.need||'Description not yet supplied.',{class:'platform-lead'}));
                const associations=el('p',[...(p.domain_slugs||[]).map(s=>lookups.domains.find(d=>d.slug===s)?.title||s),...(p.context_ids||[]).map(id=>window.ARVENA_KNOWLEDGE.contexts.find(c=>c.id===id)?.title||id)].join(' · '));if(associations.textContent)surface.append(associations);
                const provider=lookups.providers.find(x=>x.id===p.provider_id);
                surface.append(el('p',provider?.name||'Provider not yet selected.'));
                if(A.safeURL(p.access_url)){const a=link('External access: '+p.access_url,A.safeURL(p.access_url));a.target='_blank';a.rel='noopener noreferrer';surface.append(a);}
                A.appendOfferDetails(surface,p,p.title);
            }else A.appendProviderDetails(surface,p);
            preview.append(surface);
            const confirm=el('label',null,{class:'platform-check'});
            const check=el('input',null,{type:'checkbox'});
            confirm.append(check,document.createTextNode('I approve this saved copy for public publication.'));
            const publicationFeedback=el('p','',{role:'alert',tabindex:'-1',class:'platform-error'});
            const publish=button('Publish saved preview',async()=>{
                try {
                    if(dirty||!check.checked)throw new Error('Save and approve the current preview before publishing.');
                    await command('publish_'+kind,{id:current.id,revision:current.revision,confirmed:true});
                    dirty=false;await A.loadCatalogue({force:true});await A.render('/editorial/'+(isOffer?'packages':'providers'));status('Published. The saved copy is now public.');
                    window.scrollTo({top:0,left:0,behavior:'auto'});document.getElementById('platform-title').focus({preventScroll:true});
                } catch(error) {publicationFeedback.textContent=error.message;publicationFeedback.focus();throw error;}
            });
            publish.disabled=true;check.addEventListener('change',()=>{publish.disabled=!check.checked;});
            preview.append(confirm,publish,publicationFeedback);h.focus();
        }
        if(record){
            const entityId=isOffer?record.offer_id:record.provider_id;
            const entity=isOffer?A.offers.find(x=>x.id===entityId):lookups.providers.find(x=>x.id===entityId);
            if(entity?.status==='published'){
                const published=el('div',null,{class:'publishing-current'});
                published.append(link('View current public '+kind,'#/'+(isOffer?'offers':'providers')+'/'+entity.slug));
                published.append(button('Unpublish '+kind,async()=>{
                    if(dirty)throw new Error('Save your draft or reload it before unpublishing.');
                    await command('unpublish_'+kind,{id:current.id,revision:current.revision});
                    await A.loadCatalogue({force:true});await A.render('/editorial/'+(isOffer?'packages':'providers'));status('Unpublished. The draft and history are retained.');
                    window.scrollTo({top:0,left:0,behavior:'auto'});document.getElementById('platform-title').focus({preventScroll:true});
                }));root.append(published);
            }
            const history=el('details',null,{class:'publishing-more'});history.append(el('summary','Publication history'));
            const events=await result(table('editorial_events').select('action,revision,recorded_at').in('entity_id',[record.id,...(entityId?[entityId]:[])]).order('recorded_at',{ascending:false}));
            events.forEach(e=>history.append(el('p',e.recorded_at+' · '+e.action.replaceAll('_',' ')+' · revision '+(e.revision||'not recorded'))));
            if(!events.length)history.append(el('p','No recorded publication events yet.'));
            root.append(history);
        }
    }
    window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
    window.ArvenaPublishing={render,canLeave(){if(!discard())return false;dirty=false;return true;}};
}());
