/** Best-effort single local performance draft. No server, upload or account. */
const DATABASE='piano-chord-explorer-local-v1';
const STORE='drafts';
function database(){
  return new Promise((resolve,reject)=>{
    if(typeof indexedDB==='undefined'){reject(new Error('IndexedDB unavailable'));return;}
    const request=indexedDB.open(DATABASE,1);
    request.onupgradeneeded=()=>request.result.createObjectStore(STORE);
    request.onerror=()=>reject(request.error||new Error('Database open failed'));
    request.onblocked=()=>reject(new Error('Database is blocked'));
    request.onsuccess=()=>resolve(request.result);
  });
}
async function useStore(mode,run){
  const db=await database();
  try{
    return await new Promise((resolve,reject)=>{
      const transaction=db.transaction(STORE,mode);
      const request=run(transaction.objectStore(STORE));
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error||new Error('Draft storage failed'));
      transaction.onabort=()=>reject(transaction.error||new Error('Storage transaction aborted'));
    });
  }finally{db.close();}
}
export async function saveLatestTake(take,title){
  if(!take||!Array.isArray(take.events)||!take.events.length)throw new Error('Cannot save an empty take');
  return useStore('readwrite',store=>store.put({take,title:String(title||'').slice(0,60)},'latest'));
}
export async function loadLatestTake(){
  return useStore('readonly',store=>store.get('latest'));
}
export async function clearLatestTake(){
  return useStore('readwrite',store=>store.delete('latest'));
}
