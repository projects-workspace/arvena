const {chromium}=require(process.env.ARVENA_BROWSER_MODULES+'/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const fixture=JSON.parse(fs.readFileSync('/private/tmp/arvena-browser-fixtures.json'));
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const goto=async path=>{await page.goto('http://127.0.0.1:8001/#'+path);await page.waitForFunction(()=>window.ArvenaPlatform);if(/^\/(cabinet|editorial|provider-space|offers\/|providers\/)/.test(path))await page.waitForFunction(()=>document.getElementById('platform-status').textContent!=='Loading…');};
 const login=async name=>{await goto('/cabinet');await page.locator('#platform-content').getByLabel('Email',{exact:true}).fill(fixture.credentials[name].email);await page.getByLabel('Password',{exact:true}).fill(fixture.credentials[name].password);await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByText('Keep useful offers together.').waitFor();};
 const logout=async()=>{await goto('/cabinet/account');await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.locator('#platform-content').getByLabel('Email',{exact:true}).waitFor();};
 await goto('/home');await page.waitForFunction(()=>document.querySelector('#published-offers')?.children.length>0);
 const routes=['/home','/explore','/solutions','/solutions/clean-water','/solution-classes/point-of-use-filtration','/offers','/providers','/integrated-solutions','/how-we-select','/craft-local','/about','/development','/participate','/participate/producers','/participate/work','/contact','/request','/result','/products/certified-point-of-use-filter','/methodology','/not-a-route'];
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:950});
  for(const route of routes){await goto(route);assert.equal(await page.locator('.screen:visible').count(),1,route);assert.ok(await page.locator('.screen:visible h1').innerText(),route);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width} overflow ${route}`);}
 }
 await page.setViewportSize({width:1440,height:1000});await goto('/explore');
 await page.locator('#explore-search').fill('LOCAL TEST ONLY');await page.locator('#explore-search').press('Enter');assert.equal(await page.locator('#explore-results .discovery-card').count(),1);
 await page.locator('#explore-clear').click();assert.equal(await page.locator('#explore-results .discovery-card').count(),3);
 await login('a');await goto('/offers/'+fixture.offer.slug);await page.getByRole('button',{name:'Save offer',exact:true}).click();await page.getByRole('button',{name:'Remove save',exact:true}).waitFor();
 await goto('/cabinet');await page.getByRole('link',{name:fixture.offer.title,exact:true}).waitFor();await page.reload();await page.getByRole('link',{name:fixture.offer.title,exact:true}).waitFor();
 fs.mkdirSync('/private/tmp/arvena-review',{recursive:true});await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,0);});await page.screenshot({path:'/private/tmp/arvena-review/desktop.png',fullPage:true});
 await goto('/cabinet/interests');await page.getByLabel('Water',{exact:true}).check();await page.getByLabel('Country or broad region (optional)').fill('Central Europe');await page.getByRole('button',{name:'Save preferences'}).click();await page.locator('#platform-status').filter({hasText:'Preferences saved.'}).waitFor();await page.reload();await page.getByLabel('Country or broad region (optional)').waitFor();assert.equal(await page.getByLabel('Country or broad region (optional)').inputValue(),'Central Europe');
 await page.setViewportSize({width:390,height:900});await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,0);});await page.screenshot({path:'/private/tmp/arvena-review/mobile.png',fullPage:true});
 await page.setViewportSize({width:320,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.getByRole('button',{name:/Use dark theme/}).click();await page.waitForFunction(()=>getComputedStyle(document.querySelector('.platform-nav a')).color==='rgb(216, 208, 193)');await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,0);});await page.screenshot({path:'/private/tmp/arvena-review/mobile-dark.png',fullPage:true});
 await goto('/editorial');await page.getByText('Editorial access requires an explicit assignment.').waitFor();await logout();
 await login('providerA');await goto('/provider-space');await page.getByRole('heading',{name:fixture.provider.name,exact:true}).waitFor();await page.getByLabel('Correction or updated information').fill('Browser verified local correction only.');await page.getByRole('button',{name:'Send for editorial review'}).click();await page.getByText('Correction submitted.',{exact:true}).waitFor();
 await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,0);});await page.screenshot({path:'/private/tmp/arvena-review/provider.png',fullPage:true});await logout();
 await login('contributor');await goto('/offers/'+fixture.offer.slug);await page.getByLabel('Your contribution',{exact:true}).fill('Browser verified local question for moderation.');await page.getByRole('button',{name:'Submit for review',exact:true}).click();await page.locator('#platform-status').filter({hasText:'Submitted for editorial review.'}).waitFor();await logout();
 await login('editor');await goto('/editorial/moderation');
 const item=page.locator('.platform-detail').filter({hasText:'Browser verified local question for moderation.'});
 await item.getByRole('button',{name:'Record moderation decision'}).click();await page.getByText('Moderation recorded.',{exact:true}).waitFor();
 await item.getByLabel('Decision',{exact:true}).selectOption('published');await item.getByRole('button',{name:'Record moderation decision'}).click();await page.getByText('Moderation recorded.',{exact:true}).waitFor();
 await goto('/editorial/packages');await page.getByRole('heading',{name:'Updated test package',exact:true}).waitFor();await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,0);});await page.screenshot({path:'/private/tmp/arvena-review/editorial.png',fullPage:true});
 await page.setViewportSize({width:320,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'editorial mobile overflow');
 await goto('/editorial/access');await page.getByRole('heading',{name:'Contribution permission',exact:true}).waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'access mobile overflow');
 await logout();await goto('/offers/'+fixture.offer.slug);await page.getByText('Browser verified local question for moderation.',{exact:true}).waitFor();
 await goto('/home');await page.getByRole('button',{name:/Open menu|Open navigation|Menu/}).click();await page.keyboard.press('Escape');assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
 assert.deepEqual(errors,[],'browser console/runtime errors');
 console.log('PASS: desktop / 390px / 320px routes, aliases, not-found, discovery, auth, session persistence, saves, preferences, provider corrections, contribution moderation, themes and navigation; zero console/runtime errors.');
 await browser.close();
})().catch(e=>{console.error('FAIL:',e.message);process.exit(1);});
