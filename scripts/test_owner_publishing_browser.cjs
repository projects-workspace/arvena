/* Real local Auth/Data API/Storage; synthetic fixtures only. Run after test_platform.cjs.
   Start serve_preview.py --port 8003 --local-platform-config ... --owner-publishing.
   ARVENA_BROWSER_MODULES points to an existing Playwright installation. */
const {chromium}=require(process.env.ARVENA_BROWSER_MODULES+'/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {createClient}=require(process.env.ARVENA_TEST_MODULES+'/@supabase/supabase-js');
const cfg=JSON.parse(fs.readFileSync('/private/tmp/arvena-local-config.json','utf8'));
assert.equal(new URL(cfg.url).hostname,'127.0.0.1');
const httpFixtures=process.env.ARVENA_HTTP_FIXTURES==='1';
const fixtures=httpFixtures?{credentials:{editor:{id:'00000000-0000-4000-8000-000000000001',email:'owner@example.test'},a:{id:'00000000-0000-4000-8000-000000000002',email:'buyer@example.test'}}}:JSON.parse(fs.readFileSync('/private/tmp/arvena-browser-fixtures.json','utf8'));
const intercepted=httpFixtures?require('./owner_publishing_fixtures.cjs').create(fixtures,cfg.url):null;
const base='http://127.0.0.1:8003',suffix=crypto.randomUUID().slice(0,6);
const provider='LOCAL UI provider '+suffix;
const one='LOCAL UI textile '+suffix,two='LOCAL UI service '+suffix;
let checks=0,debugPage,debugPublic;
const ok=(v,name)=>{assert.ok(v,name);checks++;};
(async()=>{
 const sessions={};
 for(const name of ['editor','a']){
  if(process.env.ARVENA_FIXTURE_SESSIONS==='1'||httpFixtures){
   const secret=httpFixtures?'isolated-http-fixture-only':JSON.parse(fs.readFileSync('/private/tmp/arvena-test-secrets.json','utf8')).jwtSecret;
   const account=fixtures.credentials[name],now=Math.floor(Date.now()/1000);
   const user={id:account.id,email:account.email,aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{}};
   const encode=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
   const unsigned=encode({alg:'HS256',typ:'JWT'})+'.'+encode({...user,sub:account.id,iat:now,exp:now+3600,iss:cfg.url+'/auth/v1',aal:'aal1',session_id:crypto.randomUUID()});
   const token=unsigned+'.'+crypto.createHmac('sha256',secret).update(unsigned).digest('base64url');
   sessions[name]={access_token:token,refresh_token:crypto.randomUUID(),token_type:'bearer',expires_in:3600,expires_at:now+3600,user};
   const c=createClient(cfg.url,cfg.publishableKey,{global:{headers:{Authorization:'Bearer '+token}},auth:{persistSession:false,autoRefreshToken:false}});
   if(!httpFixtures){const {data,error}=await c.from('arvena_editors').select('user_id');if(error)throw error;
   assert.equal(data.length,name==='editor'?1:0,'fixture JWT is verified against the actual local role policy');}
  }else{
   const c=createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:false,autoRefreshToken:false}});
   const {data,error}=await c.auth.signInWithPassword(fixtures.credentials[name]);if(error)throw error;sessions[name]=data.session;
  }
 }
 console.log(httpFixtures?'HTTP FIXTURES: no live Auth, database or Storage evidence.':process.env.ARVENA_FIXTURE_SESSIONS==='1'?'SESSION SETUP: signed local fixtures; real database and Storage RLS; not an Auth login test.':'SESSION SETUP: real local Auth sign-in.');
 const storageKey='sb-'+new URL(cfg.url).hostname.split('.')[0]+'-auth-token';
 const browser=await chromium.launch({headless:true});
 try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});if(intercepted)await intercepted.install(context);
 // Reproducible local checks must not depend on the font CDN.
 await context.route(/https:\/\/(fonts.googleapis.com|fonts.gstatic.com)\//,r=>r.abort());
 await context.addInitScript(({key,session})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(session));},{key:storageKey,session:sessions.editor});
 await context.route('https://*.supabase.co/**',r=>r.abort()); // Remote service traffic is never allowed.
 const page=await context.newPage(),errors=[];debugPage=page;page.setDefaultTimeout(60000);page.setDefaultNavigationTimeout(60000);
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)console.log('Local browser HTTP',r.status(),new URL(r.url()).pathname);});
 const goto=async path=>{await page.goto(base+'/#'+path,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.ArvenaPlatform?.catalogueState==='ready');};
 await goto('/cabinet');
 await page.getByText('Keep useful offers together. Your saved list is private.').waitFor();
 await goto('/editorial/providers');
 await page.getByRole('button',{name:'New provider',exact:true}).click();
 await page.getByLabel('Provider name',{exact:true}).fill(provider);
 await page.getByLabel('Public URL slug',{exact:true}).fill('local-ui-provider-'+suffix);
 await page.getByLabel('Description',{exact:true}).fill('Synthetic local provider. Not a real Arvena listing.');
 await page.getByLabel('Relationship with Arvena / disclosure',{exact:true}).fill('Local test fixture; no partnership.');
 await page.getByRole('button',{name:'Save and preview',exact:true}).click();
 await page.getByRole('heading',{name:'Saved preview',exact:true}).waitFor();
 ok(await page.getByRole('button',{name:'Publish saved preview',exact:true}).isDisabled(),'publication needs explicit owner approval');
 await page.getByLabel('I approve this saved copy for public publication.').check();
 await page.getByRole('button',{name:'Publish saved preview',exact:true}).click();
 await page.getByText('Published. The saved copy is now public.',{exact:true}).waitFor();
 const addOffer=async(title,slug,type,category,image)=>{
  await goto('/editorial/packages');
  await page.getByRole('button',{name:'New offer',exact:true}).click();
  await page.getByLabel('Offer name',{exact:true}).fill(title);
  await page.getByLabel('Public URL slug',{exact:true}).fill(slug);
  assert.equal(await page.getByLabel('Public URL slug',{exact:true}).inputValue(),slug,'custom slug is not overwritten or duplicated by title blur');
  await page.getByLabel('Provider',{exact:true}).selectOption({label:provider+' (published)'});
  await page.getByLabel('Offer type',{exact:true}).selectOption(type);
  await page.getByLabel('Category',{exact:true}).selectOption(category);
  await page.getByLabel('Description',{exact:true}).fill('Synthetic '+type+' for local publishing acceptance. No product claim or recommendation.');
  await page.getByLabel('Commercial relationship / disclosure',{exact:true}).fill('Synthetic local fixture only.');
  await page.getByLabel('External access URL (HTTPS, optional)',{exact:true}).fill('https://example.com');
  await page.getByLabel('Image file',{exact:true}).setInputFiles(image);
  await page.getByLabel('Description of the new image',{exact:true}).fill('Synthetic local layout image');
  await page.getByLabel('Permission or rights to use the new image',{exact:true}).fill('Existing public Arvena asset, used only in isolated local tests');
  await page.getByRole('button',{name:'Upload public image',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.publishing-group [role="status"]')?.textContent.includes('Image uploaded.') || document.getElementById('platform-status').classList.contains('platform-error'));
  assert.ok((await page.locator('.publishing-group [role="status"]').innerText()).includes('Image uploaded.'),'Upload error: '+await page.locator('#platform-status').innerText());
  await page.getByRole('button',{name:'Save and preview',exact:true}).click();
  await page.getByRole('heading',{name:'Saved preview',exact:true}).waitFor();
  ok((await page.locator('.publishing-preview img').count())===1,'saved preview contains uploaded image');
  ok(!(await page.locator('.publishing-preview').innerText()).includes('Arvena editorial conclusion'),'no invented research conclusion');
  await page.getByLabel('I approve this saved copy for public publication.').check();
  await page.getByRole('button',{name:'Publish saved preview',exact:true}).click();
  await page.getByText('Published. The saved copy is now public.',{exact:true}).waitFor();
 };
 await addOffer(one,'local-ui-textile-'+suffix,'handmade','personal-everyday-products','assets/arvena-material-study.jpg');
 await addOffer(two,'local-ui-service-'+suffix,'service','air-and-indoor-environment','assets/arvena-craft-process.jpg');
 const publicContext=await browser.newContext({viewport:{width:390,height:950},reducedMotion:'reduce'});if(intercepted)await intercepted.install(publicContext);
 await publicContext.route(/https:\/\/(fonts.googleapis.com|fonts.gstatic.com)\//,r=>r.abort());
 await publicContext.route('https://*.supabase.co/**',r=>r.abort());
 const publicPage=await publicContext.newPage();debugPublic=publicPage;publicPage.setDefaultTimeout(60000);publicPage.setDefaultNavigationTimeout(60000);publicPage.on('pageerror',e=>errors.push(e.message));
 const inspect=async (slug,title)=>{
  await publicPage.goto(base+'/#/offers/'+slug,{waitUntil:'domcontentloaded'});
  await publicPage.getByRole('heading',{level:1,name:title,exact:true}).waitFor();
  ok(await publicPage.locator('.platform-offer-image').count()===1,'public page has its uploaded image');
  ok(await publicPage.locator('.platform-offer-image').evaluateAll(imgs=>Promise.all(imgs.map(async i=>{i.loading='eager';await i.decode();return i.naturalWidth>0;})).then(a=>a.every(Boolean))),'public upload loads');
  ok(await publicPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile public listing fits');
 };
 await inspect('local-ui-textile-'+suffix,one);
 await inspect('local-ui-service-'+suffix,two);
 await goto('/editorial/packages');
 await page.getByRole('button',{name:one+' · Published',exact:true}).click();
 await page.getByLabel('Description',{exact:true}).fill('Revised synthetic description.');
 await page.getByRole('button',{name:'Save and preview',exact:true}).click();
 await page.getByRole('heading',{name:'Saved preview',exact:true}).waitFor();
 // Unsaved edits invalidate the preview instead of publishing an older visible form.
 await page.getByLabel('Description',{exact:true}).fill('Final synthetic description.');
 ok(await page.locator('.publishing-preview').isHidden(),'editing closes the approval preview');
 await page.getByRole('button',{name:'Save and preview',exact:true}).click();
 await page.getByRole('heading',{name:'Saved preview',exact:true}).waitFor();
 await page.getByLabel('I approve this saved copy for public publication.').check();
 await page.getByRole('button',{name:'Publish saved preview',exact:true}).click();
 await page.getByText('Published. The saved copy is now public.',{exact:true}).waitFor();
 await publicPage.goto(base+'/#/offers/local-ui-textile-'+suffix,{waitUntil:'domcontentloaded'});
 await publicPage.locator('#platform-content').getByText('Final synthetic description.',{exact:true}).waitFor();checks++;
 // One visual pass of the owner form at desktop and two mobile widths.
 fs.mkdirSync('/private/tmp/arvena-m1-review',{recursive:true});
 for(const [width,theme]of [[1440,'light'],[390,'light'],[320,'dark']]){
  await page.setViewportSize({width,height:1000});
  await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'owner form fits '+width);
  await page.screenshot({path:'/private/tmp/arvena-m1-review/owner-'+width+'.png',fullPage:true,timeout:60000});
 }
 await publicPage.screenshot({path:'/private/tmp/arvena-m1-review/public-offer.png',fullPage:true,timeout:60000});
 await page.getByRole('button',{name:'Unpublish offer',exact:true}).click();
 await page.getByText('Unpublished. The draft and history are retained.',{exact:true}).waitFor();
 await publicPage.reload({waitUntil:'domcontentloaded'});
 await publicPage.locator('#platform-content').getByText('This offer is not currently published.',{exact:true}).waitFor();checks++;
 // A real buyer session never gets owner controls. Auth itself is tested separately.
 const buyerContext=await browser.newContext();if(intercepted)await intercepted.install(buyerContext);
 await buyerContext.route(/https:\/\/(fonts.googleapis.com|fonts.gstatic.com)\//,r=>r.abort());
 await buyerContext.route('https://*.supabase.co/**',r=>r.abort());
 await buyerContext.addInitScript(({key,session})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(session));},{key:storageKey,session:sessions.a});
 const buyerPage=await buyerContext.newPage();await buyerPage.goto(base+'/#/editorial/packages',{waitUntil:'domcontentloaded'});
 await buyerPage.getByText('Editorial access requires an explicit assignment.',{exact:true}).waitFor();
 ok(await buyerPage.getByRole('button',{name:'New offer',exact:true}).count()===0,'buyer cannot open owner form');
 ok(errors.length===0,'no runtime errors: '+errors.join('; '));
 console.log('PASS: '+checks+' M1 browser checks; provider publication, two different offers with uploads, saved previews, explicit approval, updates, unpublish, mobile/theme and buyer denial. '+(httpFixtures?'Intercepted HTTP fixtures, not service/RLS verification.':'Local services only.'));
 }catch(error){if(debugPage){console.error('Browser status:',await debugPage.locator('#platform-status').innerText().catch(()=>''));console.error('Form tail:',(await debugPage.locator('#platform-content').innerText().catch(()=>'')).slice(-1800));fs.mkdirSync('/private/tmp/arvena-m1-review',{recursive:true});await debugPage.screenshot({path:'/private/tmp/arvena-m1-review/failure.png',timeout:15000}).catch(()=>{});}if(debugPublic)console.error('Public view:',(await debugPublic.locator('main').innerText().catch(()=>'' )).slice(0,2200));throw error;}finally{await browser.close();}
})().catch(e=>{console.error('FAIL:',e.message);process.exitCode=1;});
