/* Run after test_platform.cjs on the isolated local stack. Never a remote target.
   ARVENA_TEST_MODULES=/private/tmp/arvena-platform-deps/node_modules node scripts/test_owner_publishing.cjs */
const assert=require('node:assert/strict'), fs=require('node:fs'), crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {createClient}=require(process.env.ARVENA_TEST_MODULES+'/@supabase/supabase-js');
const cfg=JSON.parse(fs.readFileSync('/private/tmp/arvena-local-config.json','utf8'));
assert.equal(new URL(cfg.url).hostname,'127.0.0.1');
const fixture=JSON.parse(fs.readFileSync('/private/tmp/arvena-browser-fixtures.json','utf8'));
const make=()=>createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:false,autoRefreshToken:false}});
const anon=make(),editor=make(),buyer=make(),provider=make();
const get=async q=>{const r=await q;if(r.error)throw r.error;return r.data;};
const command=(client,action,payload)=>client.rpc('arvena_owner_command',{action,payload});
let checks=0;
const ok=(v,label)=>{assert.ok(v,label);checks++;};
const denied=async(q,label)=>{
 const r=await q;
 if(r.error){
  const code=r.error.code||'',status=Number(r.error.statusCode||r.error.status||0);
  const expected=['42501','P0001','23502','23503','23505','22P02'].includes(code)||[400,401,403,409,413,415,422].includes(status);
  assert.ok(expected,label+' failed for an unexpected reason: '+r.error.message);
 }
 ok(!!r.error||Array.isArray(r.data)&&!r.data.length,label);
};
const t=(client,name)=>client.from('arvena_'+name);
const row=async(name,id)=>(await get(t(editor,name).select('*').eq('id',id)))[0];
(async()=>{
 for(const [c,name]of [[editor,'editor'],[buyer,'a'],[provider,'providerA']])await get(c.auth.signInWithPassword(fixture.credentials[name]));
 const code=fs.readFileSync('supabase/migrations/20261012095731_simple_owner_publishing.sql','utf8');
 ok(!code.includes('arvena_mvp_requests'),'M1 does not reference sourcing');
 await denied(command(anon,'save_offer',{public_copy:{title:'forged'}}),'anonymous publishing denied');
 await denied(command(buyer,'save_offer',{public_copy:{title:'forged'}}),'buyer publishing denied');
 await denied(command(provider,'save_provider',{public_copy:{name:'forged'}}),'representative publishing denied');
 await denied(t(buyer,'provider_drafts').select('*'),'buyer private provider drafts denied');
 await denied(t(provider,'provider_drafts').select('*'),'provider private provider drafts denied');
 await denied(t(buyer,'provider_drafts').insert({public_copy:{name:'forged'}}),'direct private draft insert denied');
 const stamp=crypto.randomUUID().slice(0,8);
 const pub={name:'LOCAL M1 Provider '+stamp,slug:'local-m1-provider-'+stamp,summary:'Synthetic local fixture only.',relationship:'No real commercial relationship.',website:'https://example.com'};
 let d=await get(command(editor,'save_provider',{public_copy:pub}));
 await denied(command(editor,'publish_provider',{id:d.id,revision:1}),'explicit approval required');
 await get(command(editor,'publish_provider',{id:d.id,revision:1,confirmed:true}));
 let pd=await row('provider_drafts',d.id);const pid=pd.provider_id;
 ok(!!pid,'provider published');console.log('M1 provider draft/publication checks');
 await denied(command(editor,'publish_provider',{id:d.id,revision:1,confirmed:true}),'duplicate publication refused');
 const pp=(await get(t(anon,'providers').select('*').eq('id',pid)))[0];
 ok(pp.name===pub.name,'public provider copy');
 d=await get(command(editor,'save_provider',{id:d.id,revision:1,public_copy:{...pub,summary:'PRIVATE NEW PROVIDER DRAFT'}}));
 ok((await get(t(anon,'providers').select('summary').eq('id',pid)))[0].summary===pub.summary,'provider edits remain private');
 await denied(command(editor,'publish_provider',{id:d.id,revision:1,confirmed:true}),'stale provider preview refused');
 await get(command(editor,'publish_provider',{id:d.id,revision:2,confirmed:true}));
 const storage=editor.storage.from('arvena-public-media'),path=crypto.randomUUID()+'.jpg';
 const bytes=fs.readFileSync('assets/arvena-material-study.jpg');
 // Exercise RLS with a bounded body. The local Storage gateway can stall while
 // rejecting a large streamed upload; successful uploads below still use the
 // complete image, and infrastructure errors never count as access denials.
 const permissionProbe=bytes.subarray(0,1024);
 await denied(buyer.storage.from('arvena-public-media').upload(crypto.randomUUID()+'.jpg',permissionProbe,{contentType:'image/jpeg'}),'buyer image upload denied');
 await denied(provider.storage.from('arvena-public-media').upload(crypto.randomUUID()+'.jpg',permissionProbe,{contentType:'image/jpeg'}),'provider image upload denied');
 await denied(storage.upload(crypto.randomUUID()+'.svg',Buffer.from('<svg/>'),{contentType:'image/svg+xml'}),'SVG upload denied');
 await denied(storage.upload('private-notes.txt',Buffer.from('PRIVATE'),{contentType:'text/plain'}),'private document upload denied');
 await get(storage.upload(path,bytes,{contentType:'image/jpeg',upsert:false}));
 await denied(storage.upload(path,permissionProbe,{contentType:'image/jpeg',upsert:true}),'published image overwrite denied');
 await denied(buyer.storage.from('arvena-public-media').remove([path]),'buyer cannot delete public image');
 console.log('M1 image permission checks');
 const image={path,alt:'Synthetic fixture: material study',rights:'Existing Arvena image used for local testing only'};
 const base={slug:'local-m1-offer-'+stamp,title:'LOCAL M1 Offer '+stamp,provider_id:pid,offer_type:'product',domain_slug:'water',
  need:'Synthetic local fixture without a research dossier.',commercial_disclosure:'Local test only.',images:[image],
  sources:[{title:'Synthetic reference',url:'https://example.com'}],access_url:'https://example.com'};
 let offer=await get(command(editor,'save_offer',{public_copy:base}));
 const privateDraft=await row('research_packages',offer.id);
 ok(privateDraft.dossier===''&&!('claims' in privateDraft.public_copy),'research fields are not required');
 ok(!(await get(t(anon,'offers').select('id').eq('slug',base.slug))).length,'draft not public');
 await denied(command(editor,'publish_offer',{id:offer.id,revision:2,confirmed:true}),'stale/nonexistent revision refused');
 await denied(command(editor,'save_offer',{public_copy:{...base,dossier:'PRIVATE LEAK'}}),'private key cannot enter publication');
 await denied(command(editor,'save_offer',{public_copy:{...base,sources:[{title:'bad',url:'javascript:alert(1)'}]}}),'unsafe source link denied');
 await denied(command(editor,'save_offer',{public_copy:{...base,images:[{...image,rights:''}]}}),'missing image rights denied');
 await denied(command(editor,'save_offer',{public_copy:{...base,images:[{...image,path:crypto.randomUUID()+'.jpg'}]}}),'unknown image denied');
 await get(command(editor,'publish_offer',{id:offer.id,revision:1,confirmed:true}));
 const published=(await get(t(anon,'offers').select('*').eq('slug',base.slug)))[0];
 ok(published.publication.need===base.need&&published.publication.images[0].path===path,'minimal listing publishes');
 ok(!('dossier' in published)&&!('dossier' in published.publication),'no dossier projection');
 const asset=await fetch(cfg.url+'/storage/v1/object/public/arvena-public-media/'+path);
 ok(asset.status===200,'rights-cleared uploaded image is served');
 await denied(command(editor,'unpublish_provider',{id:d.id,revision:2}),'provider cannot disappear under public offers');
 console.log('M1 minimal public offer checks');
 const old=await row('research_packages',fixture.offer.package_id);
 const keep=old.dossier;
 const {id:legacyId,package_id:legacyPackage,...legacyCopy}=old.public_copy;
 await get(command(editor,'save_offer',{id:old.id,revision:old.revision,public_copy:legacyCopy}));
 ok((await row('research_packages',old.id)).dossier===keep&&!!keep,'legacy private dossier retained');
 await denied(command(editor,'save_offer',{id:old.id,revision:old.revision,public_copy:legacyCopy}),'stale save refused');
 const afterLegacy=await row('research_packages',old.id);
 await get(editor.rpc('arvena_editor_command',{command:'save_package',payload:{id:old.id,revision:afterLegacy.revision,title:old.title,dossier:old.dossier,public_copy:old.public_copy}}));
 offer=await get(command(editor,'save_offer',{id:offer.id,revision:1,public_copy:{...base,need:'Edited local description'}}));
 ok((await get(t(anon,'offers').select('publication').eq('id',published.id)))[0].publication.need===base.need,'live copy isolated from edits');
 await denied(command(editor,'publish_offer',{id:offer.id,revision:1,confirmed:true}),'old approval cannot publish changes');
 await get(command(editor,'publish_offer',{id:offer.id,revision:2,confirmed:true}));
 await get(command(editor,'unpublish_offer',{id:offer.id,revision:2}));
 ok(!(await get(t(anon,'offers').select('*').eq('id',published.id))).length,'unpublished offer disappears');
 ok((await row('research_packages',offer.id)).revision===3,'withdrawal invalidates outstanding previews');
 await denied(command(editor,'publish_offer',{id:offer.id,revision:2,confirmed:true}),'pre-withdrawal preview cannot republish');
 await get(command(editor,'unpublish_provider',{id:d.id,revision:2}));
 ok(!(await get(t(anon,'providers').select('*').eq('id',pid))).length,'provider unpublishes');
 const history=await get(t(editor,'editorial_events').select('*').eq('entity_id',offer.id));
 ok(history.some(e=>e.action==='owner_publish_offer'&&e.public_snapshot?.images?.length),'publication history contains approved snapshot');
 await denied(t(buyer,'editorial_events').select('*'),'private publication history denied to buyer');
 const editorId=fixture.credentials.editor.id;
 const sql=q=>execFileSync('docker',['exec','supabase_db_arvena-platform-test','psql','-U','postgres','-v','ON_ERROR_STOP=1','-c',q]);
 sql("delete from public.arvena_editors where user_id='"+editorId+"'");
 try {await denied(command(editor,'save_offer',{public_copy:{title:'revoked'}}),'editor revocation takes effect immediately');}
 finally {sql("insert into public.arvena_editors(user_id) values('"+editorId+"')");}
 console.log('PASS: '+checks+' M1 local publication, privacy, revision, image, provider and revocation assertions.');
})().catch(e=>{console.error('FAIL after '+checks+' checks:',e.message);process.exitCode=1;});
