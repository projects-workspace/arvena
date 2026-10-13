/* Local fixture readiness only. Never changes JWTs, Auth settings or permissions. */
module.exports=async function waitLocalAuth(client,url){
 if(new URL(url).hostname!=='127.0.0.1')throw new Error('Local Auth readiness refuses a remote target');
 // Local Auth/PostgREST intermittently disagree around a newly issued JWT's iat.
 // Let that second elapse, then require the real API to accept the exact session.
 await new Promise(resolve=>setTimeout(resolve,1100));
 const deadline=Date.now()+5000;
 while(true){
  const response=await client.from('arvena_offers').select('id').limit(1);
  if(!response.error)return;
  if(response.error.code!=='PGRST303'||response.error.message!=='JWT issued at future'||Date.now()>=deadline)throw response.error;
  await new Promise(resolve=>setTimeout(resolve,500));
 }
};
