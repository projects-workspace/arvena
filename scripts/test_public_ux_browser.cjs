/* M3 public UX acceptance. Isolated loopback HTTP fixtures, never service/RLS proof.
   Reuses the installed Playwright runtime; no signed-in browser or production writes. */
const {chromium}=require(process.env.ARVENA_BROWSER_MODULES+'/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.ARVENA_PREVIEW_URL||'http://127.0.0.1:8002';
assert.equal(new URL(base).hostname,'127.0.0.1');
const provider={id:'m3-maker',slug:'local-m3-maker',name:'LOCAL M3 maker',summary:'Synthetic technical fixture.',status:'published',relationship:'No partnership.',website:'https://example.com'};
const offer={id:'m3-offer',slug:'local-m3-offer',title:'LOCAL M3 product',status:'published',provider_id:provider.id,domain_slug:'water',offer_type:'product',publication:{need:'Synthetic public UX fixture, not a recommendation.',commercial_disclosure:'No sale.',access_url:'https://example.com',limitations:'Fixture limitation',specifications:'Fixture technical detail',sources:[{title:'Fixture reference',url:'https://example.com'}]}};
(async()=>{
 let checks=0;const ok=(v,label)=>{assert.ok(v,label);checks++;};
 const browser=await chromium.launch({headless:true});
 try {
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  await context.route(/https:\/\/(fonts.googleapis.com|fonts.gstatic.com)\//,r=>r.abort());
  await context.route('https://*.supabase.co/**',async r=>{
   const table=new URL(r.request().url()).pathname.split('/').pop();
   if(table==='arvena_record_event')return r.fulfill({status:200,contentType:'application/json',body:'null'});
   assert.equal(r.request().method(),'GET','Public UX performs no listing/account writes');
   await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(table==='arvena_offers'?[offer]:table==='arvena_providers'?[provider]:[])});
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const goto=async path=>{
   console.log('Checking '+path);
   await page.goto(base+'/#'+path,{waitUntil:'domcontentloaded',timeout:90000});
   await page.waitForFunction(()=>!!window.ArvenaDiscovery&&!!window.ArvenaPlatform);
   try {await page.locator('.screen:not([hidden]) h1').waitFor();}
   catch(error) {console.error('Page diagnostics',await page.evaluate(()=>({url:location.href,title:document.title,headings:[...document.querySelectorAll('h1')].map(n=>({id:n.id,text:n.textContent,hidden:n.closest('.screen')?.hidden,box:n.getBoundingClientRect().toJSON()}))})),errors);throw error;}
  };
  const dir='/private/tmp/arvena-m3-review';fs.mkdirSync(dir,{recursive:true});
  for(const theme of ['light','dark']) {
   await goto('/home');await page.evaluate(t=>localStorage.setItem('arvena-theme',t),theme);
   for(const [width,height] of [[1440,900],[390,844],[320,740]]) {
    await page.setViewportSize({width,height});await goto('/home');
    ok(await page.locator('#home-context-index a').count()===8,'Eight existing contexts '+theme+width);
    ok(await page.locator('#home-domain-preview article').count()===4,'Compact preview '+theme+width);
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Home fits '+theme+width);
    const action=await page.getByRole('link',{name:'Explore the catalogue',exact:true}).boundingBox();
    ok(action.y+action.height<=height,'Catalogue action in first viewport '+theme+width);
    if ((theme==='light'&&width!==390)||(theme==='dark'&&width===390)) await page.screenshot({path:dir+'/home-'+theme+'-'+width+'.png',fullPage:false,timeout:90000});
    await page.getByRole('link',{name:'Understand the options',exact:true}).click();
    ok(page.url().endsWith('/explore?view=knowledge'),'Knowledge entry stays separate');
    await goto('/home');await page.locator('#home-context-index a').first().click();
    ok(!page.url().endsWith('/home'),'Context entry opens real page');
    await goto('/solutions');ok(await page.locator('#solutions-domain-grid article').count()===10,'All ten areas retained');
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Solutions fits '+theme+width);
    ok(!await page.locator('#developing-domain-list').isVisible(),'Map development is progressively disclosed');
    await page.getByText('How these topic maps develop',{exact:true}).click();ok(await page.locator('#developing-domain-list').isVisible(),'Map notes accessible');
    if(width<=900) {
     await page.locator('.menu-toggle').click();
     ok(await page.locator('#main-content').evaluate(n=>n.inert),'Menu makes underlying content inert');
     ok(await page.locator('.site-footer').evaluate(n=>n.inert),'Footer excluded while menu open');
     ok(await page.evaluate(()=>document.activeElement===document.querySelector('#primary-navigation a')),'Menu focuses first action');
     await page.locator('#primary-navigation a').last().press('Tab');
     ok(await page.evaluate(()=>document.activeElement===document.querySelector('.menu-toggle')),'Tab wraps to close control');
     await page.locator('.menu-toggle').press('Shift+Tab');
     ok(await page.evaluate(()=>document.activeElement===document.querySelector('#primary-navigation a:last-child')),'Shift Tab wraps inside menu');
     await page.keyboard.press('Escape');
     ok(await page.evaluate(()=>!document.querySelector('#main-content').inert&&document.activeElement===document.querySelector('.menu-toggle')),'Escape restores page and toggle focus');
     await page.locator('.menu-toggle').click();await page.getByRole('navigation',{name:'Primary navigation',exact:true}).getByRole('link',{name:'About',exact:true}).click();
     ok(await page.evaluate(()=>!document.querySelector('#main-content').inert&&document.activeElement.tagName==='H1'),'Route selection closes menu and focuses heading');
    }
    await goto('/offers/local-m3-offer');
    await page.getByRole('heading',{name:offer.title,exact:true}).waitFor();
    const access=page.getByRole('link',{name:'View external offer (opens in a new tab)',exact:true});
    ok(await access.getAttribute('href')==='https://example.com/'&&await access.getAttribute('target')==='_blank','External access without registration');
    ok((await page.locator('.public-offer').innerText()).includes('Fixture limitation'),'Visible limitations retained');
    await page.getByText('Sources, claims and what remains unknown',{exact:true}).click();
    ok(await page.getByRole('link',{name:'Fixture reference (opens in a new tab)',exact:true}).count()===1,'Source announces new tab');
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Offer fits '+theme+width);
    if(theme==='light'&&width===390) await page.screenshot({path:dir+'/offer-'+theme+'-'+width+'.png',fullPage:false,timeout:90000});
    await goto('/providers/local-m3-maker');await page.getByRole('heading',{name:provider.name,exact:true}).waitFor();
    ok(await page.getByRole('link',{name:'Visit provider website (opens in a new tab)',exact:true}).count()===1,'Provider external action labelled');
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Provider fits '+theme+width);
   }
  }
  await page.setViewportSize({width:390,height:400});await goto('/home');await page.locator('.menu-toggle').click();
  ok(await page.locator('#primary-navigation').evaluate(n=>n.scrollHeight>n.clientHeight&&getComputedStyle(n).overflowY==='auto'),'Short viewport menu scrolls');
  await page.locator('#primary-navigation a').last().press('Tab');
  await page.setViewportSize({width:1440,height:900});
  ok(await page.evaluate(()=>document.activeElement===document.querySelector('#primary-navigation a')),'Resize transfers focus from disappearing toggle');
  ok(await page.evaluate(()=>!document.querySelector('#main-content').inert&&!document.body.classList.contains('nav-open')),'Desktop resize restores page');
  ok(errors.length===0,'No browser runtime errors: '+errors.join('\n'));
  console.log('PASS: '+checks+' M3 public UX assertions. Local HTTP fixtures only.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
