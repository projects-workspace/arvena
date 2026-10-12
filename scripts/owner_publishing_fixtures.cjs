/* Deterministic browser HTTP fixtures, never evidence of service or RLS behaviour.
   The service-backed suite remains available without ARVENA_HTTP_FIXTURES=1. */
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
module.exports.create=(accounts,base)=>{
 const scope={window:{}};vm.runInNewContext(fs.readFileSync('arvena-data.js','utf8'),scope);
 const db={
  providers:[],offers:[],research_packages:[],provider_drafts:[],editorial_events:[],
  domains:scope.window.ARVENA_DATA.domains.map(d=>({slug:d.slug,title:d.title})),
  solution_classes:[{slug:'point-of-use-filtration',domain_slug:'water',title:'Point-of-use filtration'}]
 },media=new Map();
 const actor=req=>{try{return JSON.parse(Buffer.from((req.headers().authorization||'').split('.')[1],'base64url')).sub;}catch{return null;}};
 const install=async context=>context.route(base+'/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname,who=actor(req),owner=who===accounts.credentials.editor.id;
  const json=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
  const deny=()=>json({message:'Fixture permission denied'},403);
  if(path.startsWith('/storage/v1/object/public/arvena-public-media/')){
   const item=media.get(path.split('/').pop());return item?route.fulfill({status:200,contentType:item.type,body:item.bytes}):json({message:'Fixture image not found'},404);
  }
  if(path.startsWith('/storage/v1/object/arvena-public-media/')&&req.method()==='POST'){
   if(!owner)return deny();
   const name=path.split('/').pop(),body=req.postDataBuffer(),header=req.headers()['content-type'];
   let bytes=body,type=header;
   if(header.includes('multipart/form-data')){
    const boundary=header.split('boundary=')[1].replace(/^"|"$/g,'');
    const part=body.toString('latin1').split('--'+boundary).find(p=>p.includes('filename='));
    const split=part.indexOf('\r\n\r\n');
    type=/Content-Type:\s*([^\r\n]+)/i.exec(part)?.[1]||'image/jpeg';
    bytes=Buffer.from(part.slice(split+4).replace(/\r\n$/,''),'latin1');
    // Browser protocol interception can omit multipart binary file bytes.
    // Serve only the exact repository fixtures selected by this test.
    const filename=/filename="(arvena-material-study\.jpg|arvena-craft-process\.jpg)"/.exec(part)?.[1];
    if(filename)bytes=fs.readFileSync('assets/'+filename);
   }
   media.set(name,{bytes,type});return json({Key:'arvena-public-media/'+name,Id:crypto.randomUUID()});
  }
  if(path.endsWith('/rpc/arvena_record_event'))return json(null);
  if(path.endsWith('/rpc/arvena_owner_command')){
   if(!owner)return deny();
   const {action,payload}=req.postDataJSON(),kind=action.endsWith('provider')?'provider':'offer';
   const rows=db[kind==='provider'?'provider_drafts':'research_packages'];
   let row=rows.find(r=>r.id===payload.id);
   if(action.startsWith('save_')){
    if(row&&row.revision!==payload.revision)return json({message:'This draft changed. Reload it before saving'},400);
    if(!row){row={id:crypto.randomUUID(),revision:0,offer_id:null,provider_id:null};rows.unshift(row);}
    Object.assign(row,{title:payload.public_copy.title,public_copy:structuredClone(payload.public_copy),revision:row.revision+1,status:'draft',updated_at:new Date().toISOString()});
   }else{
    if(!row||row.revision!==payload.revision)return json({message:'This draft changed. Reload the preview'},400);
    const items=db[kind==='provider'?'providers':'offers'],key=kind+'_id';
    let publicRow=items.find(r=>r.id===row[key]);
    if(action.startsWith('publish_')){
     if(payload.confirmed!==true)return json({message:'Confirm publication'},400);
     if(!publicRow){publicRow={id:crypto.randomUUID()};items.push(publicRow);row[key]=publicRow.id;}
     const c=structuredClone(row.public_copy);
     Object.assign(publicRow,kind==='provider'?c:{slug:c.slug,title:c.title,domain_slug:c.domain_slug,solution_class_slug:c.solution_class_slug,provider_id:c.provider_id,offer_type:c.offer_type,publication:c});
     publicRow.status='published';row.status='published';
    }else if(action.startsWith('unpublish_')){
     publicRow.status='hidden';row.status='draft';row.revision++;
    }else return json({message:'Unsupported HTTP fixture action'},400);
   }
   db.editorial_events.unshift({entity_id:row.id,revision:row.revision,action:'owner_'+action,recorded_at:new Date().toISOString()});
   return json({id:row.id,revision:row.revision,entity_id:row[kind+'_id']});
  }
  if(path.startsWith('/rest/v1/arvena_')&&req.method()==='GET'){
   const name=path.split('/arvena_')[1];
   if(name==='editors')return json(owner?[{user_id:who}]:[]);
   let rows=structuredClone(db[name]||[]);
   if(['research_packages','provider_drafts','editorial_events'].includes(name)&&!owner)return json([]);
   if(['offers','providers'].includes(name)&&!owner)rows=rows.filter(r=>r.status==='published');
   for(const [key,value]of url.searchParams){
    if(value.startsWith('eq.'))rows=rows.filter(r=>String(r[key])===value.slice(3));
    if(value.startsWith('in.('))rows=rows.filter(r=>value.slice(4,-1).split(',').includes(String(r[key])));
   }
   const sort=url.searchParams.get('order');
   if(sort){const [key,direction]=sort.split('.');rows.sort((a,b)=>String(a[key]||'').localeCompare(String(b[key]||''))*(direction==='desc'?-1:1));}
   return json(rows);
  }
  return json({message:'Unhandled HTTP fixture endpoint: '+path},400);
 });
 return {install};
};
