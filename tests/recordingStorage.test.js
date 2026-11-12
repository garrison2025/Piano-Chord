import test from 'node:test';
import assert from 'node:assert/strict';
import {saveLatestTake,loadLatestTake,clearLatestTake} from '../src/lib/recordingStorage.mjs';

function simulatedIdb(){
  const previous=globalThis.indexedDB;
  let tx,req,op,closed=false;
  const db={close(){closed=true;},transaction(_name,mode){
    tx={mode,error:null,abort(){this.onabort?.()},objectStore(){
      return {
        put(){op='put';req={result:101};return req;},
        get(){op='get';req={result:{take:{events:[{type:'on',midi:60,t:0}]}}};return req;},
        delete(){op='delete';req={result:undefined};return req;}
      };
    }};return tx;
  }};
  globalThis.indexedDB={open(){
    const opening={result:db};
    queueMicrotask(()=>opening.onsuccess?.());
    return opening;
  }};
  return {
    async ready(){for(let i=0;i<10&&!tx;i++)await new Promise(r=>setImmediate(r));assert.ok(tx);},
    requestSuccess(){req.onsuccess?.()},
    commit(){tx.oncomplete?.()},
    abort(){tx.error=new Error('simulated late abort');tx.onabort?.()},
    get operation(){return op;},
    get closed(){return closed;},
    restore(){if(previous===undefined)delete globalThis.indexedDB;else globalThis.indexedDB=previous;}
  };
}
async function scenario(kind,commit){
  const h=simulatedIdb();
  try{
    const pending=kind==='put'?saveLatestTake({events:[{type:'on',midi:60,t:0}]},'test'):
      kind==='delete'?clearLatestTake():loadLatestTake();
    await h.ready();
    assert.equal(h.operation,kind);
    let settled=false;
    pending.finally(()=>{settled=true;}).catch(()=>{});
    h.requestSuccess();
    await new Promise(r=>setImmediate(r));
    assert.equal(settled,false,kind+' resolved before transaction completion');
    if(commit){h.commit();await pending;}
    else{h.abort();await assert.rejects(pending,/simulated late abort/);}
    assert.equal(h.closed,true,'database closed after completion or abort');
  }finally{h.restore();}
}
test('save resolves on transaction commit, not request success; abort rejects',async()=>{
  await scenario('put',true);
  await scenario('put',false);
});
test('clear resolves on transaction commit, not request success; abort rejects',async()=>{
  await scenario('delete',true);
  await scenario('delete',false);
});
test('load also waits for transaction completion',async()=>{
  await scenario('get',true);
  await scenario('get',false);
});
