/* M2 placements through the actual local owner UI; real Auth/Data API/RLS.
   Start owner preview on 8003 and run after test_platform.cjs. No remote target. */
const {chromium}=require(process.env.ARVENA_BROWSER_MODULES+'/playwright');
const {createClient}=require(process.env.ARVENA_TEST_MODULES+'/@supabase/supabase-js');
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const cfg=JSON.parse(fs.readFileSync('/private/tmp/arvena-local-config.json')),fixtures=JSON.parse(fs.readFileSync('/private/tmp/arvena-browser-fixtures.json'));assert.equal(new URL(cfg.url).hostname,'127.0.0.1');
const stamp=crypto.randomUUID().slice(0,8),slug='local-m2-ui-'+stamp,title='LOCAL M2 placement fixture '+stamp;
const get=async q=>{const r=await q;if(r.error)throw r.error;return r.data;};let checks=0;const ok=(v,label)=>{assert.ok(v,label);checks++;};
(async()=>{const owner=createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:false,autoRefreshToken:false}}),anon=createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const{data,error}=await owner.auth.signInWithPassword(fixtures.credentials.editor);if(error)throw error;await require('./wait_local_auth.cjs')(owner,cfg.url);
 const providers=await get(owner.from('arvena_providers').select('id').eq('slug','test-provider-a'));
 const browser=await chromium.launch({headless:true});try{const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 await context.route('https://*.supabase.co/**',r=>r.abort());await context.route(/https:\/\/(fonts.googleapis.com|fonts.gstatic.com)\//,r=>r.abort());
 await context.addInitScript(session=>localStorage.setItem('sb-127-auth-token',JSON.stringify(session)),data.session);
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8003/#/editorial/packages');await page.getByRole('button',{name:'New offer',exact:true}).click();
 await page.getByLabel('Offer name',{exact:true}).fill(title);await page.getByLabel('Public URL slug',{exact:true}).fill(slug);await page.getByLabel('Provider',{exact:true}).selectOption(providers[0].id);await page.getByLabel('Offer type',{exact:true}).selectOption('product');await page.getByLabel('Category',{exact:true}).selectOption('water');
 await page.getByLabel('Description',{exact:true}).fill('Synthetic UI association acceptance. No real offer or endorsement.');await page.getByLabel('Commercial relationship / disclosure',{exact:true}).fill('Local technical fixture only.');
 await page.getByText('Related areas and contexts (optional)',{exact:true}).click();await page.locator('input[name="domain_slugs"][value="household-materials"]').check();await page.locator('input[name="context_ids"][value="home-as-a-system"]').check();await page.locator('input[name="context_ids"][value="kitchen-and-storage"]').check();
 await page.getByRole('button',{name:'Save and preview',exact:true}).click();await page.getByRole('heading',{name:'Saved preview',exact:true}).waitFor();
 ok((await page.locator('.publishing-preview-content').innerText()).includes('Kitchen and storage'),'Saved preview names placements');ok((await get(anon.from('arvena_offers').select('id').eq('slug',slug))).length===0,'Saved associations are private');
 await page.reload();await page.getByRole('button',{name:new RegExp(title+' .*Draft')}).click();await page.getByText('Related areas and contexts (optional)',{exact:true}).click();ok(await page.locator('input[name="context_ids"][value="kitchen-and-storage"]').isChecked(),'Association persists after reload');
 await page.getByRole('button',{name:'Save and preview',exact:true}).click();await page.getByLabel('I approve this saved copy for public publication.').check();await page.getByRole('button',{name:'Publish saved preview',exact:true}).click();await page.getByText('Published. The saved copy is now public.',{exact:true}).waitFor();
 const row=(await get(anon.from('arvena_offers').select('id,publication').eq('slug',slug)))[0];ok(row.publication.context_ids.length===2&&row.publication.domain_slugs[0]==='household-materials','UI publishes explicit associations');
 const visitor=await browser.newContext({viewport:{width:390,height:950},reducedMotion:'reduce'});await visitor.route('https://*.supabase.co/**',r=>r.abort());const publicPage=await visitor.newPage();
 for(const route of ['/offers?domain=household-materials','/offers?context=home-as-a-system','/offers?context=kitchen-and-storage']){await publicPage.goto('http://127.0.0.1:8003/#'+route);await publicPage.locator('.screen:not([hidden]) [data-offer-id="'+row.id+'"] h3').waitFor();ok(await publicPage.locator('.screen:not([hidden]) [data-offer-id="'+row.id+'"]').count()===1,'Same canonical UI offer in '+route);}
 await page.getByText('Related areas and contexts (optional)',{exact:true}).click();await page.locator('input[name="context_ids"][value="kitchen-and-storage"]').uncheck();await page.locator('input[name="context_ids"][value="sleep-and-rest"]').check();await page.getByRole('button',{name:'Save draft',exact:true}).click();await page.getByText('Draft saved. Public content has not changed.',{exact:true}).waitFor();
 ok((await get(anon.from('arvena_offers').select('publication').eq('id',row.id)))[0].publication.context_ids.includes('kitchen-and-storage'),'Saved placement change stays private');
 await page.getByRole('button',{name:'Save and preview',exact:true}).click();await page.getByLabel('I approve this saved copy for public publication.').check();await page.getByRole('button',{name:'Publish saved preview',exact:true}).click();await page.getByText('Published. The saved copy is now public.',{exact:true}).waitFor();
 ok((await get(anon.from('arvena_offers').select('id,publication').eq('slug',slug)))[0].id===row.id,'Placement update keeps canonical ID');
 await page.getByRole('button',{name:'Unpublish offer',exact:true}).click();await page.getByText('Unpublished. The draft and history are retained.',{exact:true}).waitFor();await publicPage.reload();await publicPage.waitForFunction(()=>window.ArvenaPlatform.catalogueState==='ready');ok(await publicPage.locator('[data-offer-id="'+row.id+'"]').count()===0,'Withdrawal removes discovery placements');ok(errors.length===0,'No owner runtime errors');
 console.log('PASS: '+checks+' M2 owner/browser association checks with real local Auth/Data API.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
