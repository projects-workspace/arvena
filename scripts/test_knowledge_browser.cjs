/* Local, isolated HTTP fixtures. No requests reach Supabase and no remote writes occur.
   ARVENA_BROWSER_MODULES=/path/to/node_modules node scripts/test_knowledge_browser.cjs
   Start scripts/serve_preview.py --port 8002 first. */
const {chromium}=require(process.env.ARVENA_BROWSER_MODULES+'/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const base=process.env.ARVENA_PREVIEW_URL || 'http://127.0.0.1:8002';
assert.equal(new URL(base).hostname,'127.0.0.1');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('knowledge-data.js','utf8'),ctx);
const map=ctx.window.ARVENA_KNOWLEDGE;
const offer=(slug,status,domain='water')=>({id:slug,slug,status,title:'FIXTURE '+slug,domain_slug:domain,solution_class_slug:domain==='water'?'point-of-use-filtration':null,offer_type:'product',provider_id:'fixture-provider',publication:{need:'Synthetic local test only',claims:[]}});
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 let inventory=[offer('published','published'),offer('draft','draft'),offer('withdrawn','hidden'),offer('air','published','air-and-indoor-environment')],fail=false,checks=0;
 const errors=[],requests=[];
 await context.route('https://*.supabase.co/**',async route=>{
  const url=new URL(route.request().url());requests.push(url.pathname);
  assert.equal(route.request().method(),'GET','Public browsing must not write');
  const body=url.pathname.endsWith('/arvena_offers')?inventory:url.pathname.endsWith('/arvena_providers')?[{id:'fixture-provider',slug:'fixture-provider',name:'FIXTURE provider',status:'published',summary:'Local fixture'}]:[];
  // Return a successful HTTP response with an SDK error shape to exercise errors without browser network noise.
  await route.fulfill({status:fail?503:200,contentType:'application/json',body:JSON.stringify(fail?{message:'Local injected outage'}:body)});
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const ok=(v,label)=>{assert.ok(v,label);checks++;};
 const goto=async path=>{await page.goto(base+'/#'+path);await page.waitForFunction(()=>window.ArvenaKnowledge&&window.ArvenaPlatform.catalogueState!=='loading');};
 const routes=[...new Set([...map.domains,...map.contexts].map(t=>t.route)), '/home','/solutions','/explore','/how-we-select','/methodology','/solutions/clean-water','/solution-classes/point-of-use-filtration','/products/certified-point-of-use-filter','/about','/development','/participate','/participate/producers','/participate/work','/contact','/request','/result','/offers','/providers','/not-real'];
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:950});
  for(const path of routes){
   await goto(path);
   ok(await page.locator('h1:visible').count()===1,'one heading '+path);
   ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow '+width+' '+path);
   ok(await page.locator('img:visible').evaluateAll(async imgs=>{await Promise.all(imgs.map(i=>{i.loading='eager';return i.decode().catch(()=>{});}));return imgs.every(i=>i.complete&&i.naturalWidth>0);}), 'images '+path);
  }
 }
 await goto('/solutions');ok(await page.locator('#context-index a').count()===8,'eight visible context entrances');
 await page.getByRole('link',{name:'Clothing, footwear and textiles',exact:true}).click();
 await page.waitForURL('**/contexts/clothing-footwear-textiles');
 await page.locator('#knowledge-title').filter({hasText:'Clothing, footwear and textiles'}).waitFor();
 ok(await page.locator('#knowledge-content').innerText().then(t=>t.includes('sewing thread')&&t.includes('elastic')),'whole garment composition');
 await goto('/solutions/homes-buildings-and-land-systems');
 for(const slug of ['water','air-and-indoor-environment','household-materials','energy-and-resource-efficiency','environmental-monitoring'])ok(await page.locator('#knowledge-content a[href="#/solutions/'+slug+'"]').count()>0,'home crosslink '+slug);
 await goto('/solutions/water');
 const related=page.locator('#knowledge-content [data-related-topic]');
 ok((await related.innerText()).includes('1 published offer'),'published only related count');
 ok(!(await related.innerText()).includes('FIXTURE draft')&&!(await related.innerText()).includes('FIXTURE withdrawn'),'private statuses excluded');
 await related.getByRole('link',{name:'Browse this topic in the catalogue'}).click();
 await page.waitForFunction(()=>!document.getElementById('screen-offers').hidden&&window.ArvenaPlatform.catalogueState==='ready');
 ok(page.url().includes('topic=domain%3Awater'),'topic filter preserved');
 ok(await page.locator('#published-offers article').count()===1,'water filter excludes air');
 await page.reload();await page.waitForFunction(()=>window.ArvenaPlatform.catalogueState==='ready');
 ok(await page.locator('#published-offers article').count()===1,'filter survives refresh');
 await goto('/offers?class=point-of-use-filtration');ok(await page.locator('#published-offers article').count()===1,'class filter');
 await goto('/offers?topic=invalid');ok((await page.locator('#offer-catalogue-status').innerText()).includes('Unknown catalogue filter'),'invalid filter does not show all offers');
 await goto('/explore');await page.locator('#explore-type-filter').selectOption('offer');
 ok(await page.locator('#explore-results article').count()===2,'offer-only search');
 await page.locator('#explore-search').fill('published');ok(await page.locator('#explore-results article').count()===1,'existing text search works');
 await page.getByRole('button',{name:'Clear filters',exact:true}).first().click();await page.locator('#explore-search').fill('clothing');
 ok((await page.locator('#explore-results').innerText()).includes('Clothing, footwear and textiles'),'contexts searchable');
 // One offer can be explicitly linked to several contexts without a new record.
 await page.evaluate(()=>{window.ARVENA_KNOWLEDGE.offerLinks['clothing-footwear-textiles']=['published'];window.ARVENA_KNOWLEDGE.offerLinks['sleep-and-rest']=['published'];});
 for(const id of ['clothing-footwear-textiles','sleep-and-rest']){
  await page.evaluate(id=>{location.hash='/contexts/'+id;},id);await page.waitForFunction(id=>document.querySelector('#knowledge-content [data-related-topic]')?.dataset.relatedTopic===id&&window.ArvenaPlatform.catalogueState==='ready',id);
  ok(await page.locator('#knowledge-content a[href="#/offers/published"]').count()===1,'shared record '+id);
 }
 inventory=inventory.map(o=>o.slug==='published'?{...o,status:'hidden'}:o);
 await page.evaluate(()=>window.ArvenaPlatform.loadCatalogue());
 ok(await page.locator('#knowledge-content a[href="#/offers/published"]').count()===0,'withdrawal removes context record');
 await goto('/offers/published');ok((await page.locator('#platform-content').innerText()).includes('not currently published'),'withdrawn detail unavailable');
 inventory=[];await goto('/solutions/water');ok((await related.innerText()).includes('No approved offers'),'honest zero');
 fail=true;await page.evaluate(()=>window.ArvenaPlatform.loadCatalogue());
 ok((await related.innerText()).includes('Catalogue unavailable'),'outage distinct from zero');
 ok(!(await related.innerText()).includes('No approved offers'),'outage not empty');
 fail=false;await related.getByRole('button',{name:'Retry catalogue'}).click();await page.waitForFunction(()=>window.ArvenaPlatform.catalogueState==='ready');
 ok((await related.innerText()).includes('No approved offers'),'retry recovers');
 await goto('/cabinet');ok(await page.getByRole('button',{name:'Continue',exact:true}).count()===1,'login retained');
 ok(await page.getByRole('button',{name:/Create account|Reset password|Sign up/i}).count()===0,'email controls disabled');
 for(const route of ['/provider-space','/editorial']){await goto(route);ok(await page.locator('#platform-content input[type="password"]').count()===1,'anonymous gated '+route);}
 await goto('/result');ok(page.url().endsWith('#/request'),'direct result is disabled');
 ok(await page.locator('#request-submit').isDisabled(),'sourcing disabled');
 await goto('/solutions');await page.setViewportSize({width:320,height:950});
 await page.locator('.menu-toggle').click();ok(await page.locator('.menu-toggle').getAttribute('aria-expanded')==='true','menu opens');
 await page.keyboard.press('Escape');ok(await page.locator('.menu-toggle').getAttribute('aria-expanded')==='false','menu closes');
 await page.locator('.theme-toggle').click();ok(await page.locator('html').getAttribute('data-theme')==='dark','dark theme');
 await page.getByRole('link',{name:'Clothing, footwear and textiles',exact:true}).click();
 await page.waitForFunction(()=>document.activeElement===document.getElementById('knowledge-title'));
 ok(await page.locator('#knowledge-title').evaluate(n=>document.activeElement===n),'route heading receives focus');
 await page.keyboard.press('Tab');ok(await page.evaluate(()=>document.activeElement.tagName==='A'),'keyboard continues to link');
 fs.mkdirSync('/private/tmp/arvena-knowledge-review',{recursive:true});
 for(const [width,route,name,theme] of [[1440,'/how-we-select','methodology','light'],[1440,'/solutions/homes-buildings-and-land-systems','home','light'],[390,'/contexts/clothing-footwear-textiles','clothing','light'],[320,'/contexts/electronics-fields-measurement','fields-dark','dark']]){
  await page.setViewportSize({width,height:950});await goto(route);await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.waitForFunction(()=>getComputedStyle(document.body).color===getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim() || document.getAnimations().filter(a=>a.playState==='running').length===0);await page.screenshot({path:'/private/tmp/arvena-knowledge-review/'+name+'.png',fullPage:true});
 }
 ok(requests.every(p=>/\/rest\/v1\/arvena_(offers|providers)$/.test(p)),'no private tables requested anonymously');
 for(const path of ['/docs/RESEARCH_PUBLICATION_HANDOFF.md','/PROJECT_STATE.md','/supabase/migrations/20260923073824_marketplace_platform.sql','/.git/config','/scripts/test_knowledge_browser.cjs']){
  const r=await page.request.get(base+path);ok(r.status()===404,'private path denied '+path);
 }
 ok(errors.length===0,'no runtime errors: '+errors.join('; '));
 console.log(`PASS: ${checks} local browser assertions; ${routes.length} routes at desktop, 390px and 320px; published/draft/hidden, shared links, withdrawal, filtering, search, failure/retry, gates, navigation and privacy. No remote writes; not a remote RLS audit.`);
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
