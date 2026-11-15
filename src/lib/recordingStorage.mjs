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
      // The request may succeed even when the enclosing transaction later aborts.
      // Only transaction.oncomplete confirms a committed write or deletion.
      let request;
      transaction.oncomplete=()=>resolve(request?.result);
      transaction.onabort=()=>reject(transaction.error||new Error('Storage transaction aborted'));
      transaction.onerror=()=>reject(transaction.error||new Error('Storage transaction failed'));
      try{
        request=run(transaction.objectStore(STORE));
        request.onerror=()=>reject(request.error||new Error('Draft storage failed'));
      }catch(error){
        try{transaction.abort();}catch{}
        reject(error);
      }
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

const LEGACY_INTERRUPTED_KEY='piano-chord-explorer-interrupted-v1';
const INTERRUPTED_PREFIX=LEGACY_INTERRUPTED_KEY+':';
const interruptedKey=id=>id==='legacy'?LEGACY_INTERRUPTED_KEY:INTERRUPTED_PREFIX+id;

// Keep unrelated sessions independent, including during synchronous pagehide saves.
export function saveInterruptedTake(id,take,title){
  const value=JSON.stringify({take,title:String(title||'').slice(0,60),updatedAt:Date.now()});
  localStorage.setItem(interruptedKey(id),value);
}
export function loadInterruptedTakes(){
  const drafts=[];
  for(let index=0;index<localStorage.length;index++){
    const key=localStorage.key(index);
    if(!key||(key!==LEGACY_INTERRUPTED_KEY&&!key.startsWith(INTERRUPTED_PREFIX)))continue;
    const value=localStorage.getItem(key);
    if(!value)continue;
    try{
      const saved=JSON.parse(value);
      if(!Array.isArray(saved?.take?.events)||!saved.take.events.length)continue;
      const id=key===LEGACY_INTERRUPTED_KEY?'legacy':key.slice(INTERRUPTED_PREFIX.length);
      drafts.push({id,value,take:saved.take,title:saved.title,updatedAt:Number(saved.updatedAt)||0});
    }catch{
      // A malformed checkpoint must not block recovery of other takes.
    }
  }
  return drafts.sort((a,b)=>b.updatedAt-a.updatedAt||a.id.localeCompare(b.id));
}
export function clearInterruptedTake(id,expectedValue){
  const key=interruptedKey(id);
  if(expectedValue!==undefined&&localStorage.getItem(key)!==expectedValue)return false;
  localStorage.removeItem(key);
  return true;
}
