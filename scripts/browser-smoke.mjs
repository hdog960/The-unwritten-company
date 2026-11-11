import assert from 'node:assert/strict';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';

const root = process.cwd();
const appPath = '/The-unwritten-company/';
const contentTypes = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webmanifest':'application/manifest+json','.svg':'image/svg+xml'};
function handler(request,response){
  const pathname=new URL(request.url,'http://127.0.0.1').pathname;
  if(!pathname.startsWith(appPath)){response.writeHead(404).end();return}
  let relative=decodeURIComponent(pathname.slice(appPath.length));
  if(!relative || relative.endsWith('/'))relative+='index.html';
  const absolute=path.resolve(root,relative);
  if(!absolute.startsWith(root+path.sep)){response.writeHead(403).end();return}
  const content=fs.createReadStream(absolute);
  content.once('error',()=>{if(!response.headersSent)response.writeHead(404);response.end()});
  response.setHeader('Content-Type',contentTypes[path.extname(absolute)]??'application/octet-stream');
  response.setHeader('Cache-Control','no-store');
  content.pipe(response);
}
const server=http.createServer(handler);
let chrome,ws;
let pending=new Map(),messageId=0;
async function main(){
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  const url=origin+appPath;
  const chromeBin=process.env.CHROME_BIN ||
    ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(candidate=>fs.existsSync(candidate));
  assert.ok(chromeBin,'A Chromium browser is required for the real browser smoke');
  const profile=await fsp.mkdtemp(path.join(os.tmpdir(),'tuc-chrome-'));
  try{
    chrome=spawn(chromeBin,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
    let port=null;
    for(let attempt=0;attempt<100;attempt++){
      if(chrome.exitCode!==null)throw new Error('Chrome stopped before its CDP socket became available');
      try{
        const active=await fsp.readFile(path.join(profile,'DevToolsActivePort'),'utf8');
        port=Number(active.split('\n')[0]);break;
      }catch{await delay(100)}
    }
    assert.ok(port,'Chrome debugging socket timed out');
    let endpoint=null;
    for(let attempt=0;attempt<50;attempt++){
      try{
        const tabs=await (await fetch('http://127.0.0.1:'+port+'/json/list')).json();
        endpoint=tabs.find(item=>item.type==='page')?.webSocketDebuggerUrl;
        if(endpoint)break;
      }catch{}
      await delay(100);
    }
    assert.ok(endpoint,'No Chrome page debugging endpoint');
    ws=new WebSocket(endpoint);
    await new Promise((resolve,reject)=>{
      ws.addEventListener('open',resolve,{once:true});
      ws.addEventListener('error',reject,{once:true});
    });
    ws.addEventListener('message',ev=>{
      const data=JSON.parse(ev.data);
      if(!data.id || !pending.has(data.id))return;
      const {resolve,reject}=pending.get(data.id);pending.delete(data.id);
      if(data.error)reject(new Error(data.error.message));
      else resolve(data.result??{});
    });
    const cdp=(method,params={})=>new Promise((resolve,reject)=>{
      const id=++messageId;pending.set(id,{resolve,reject});
      ws.send(JSON.stringify({id,method,params}));
    });
    const run=async (expression,awaitPromise=false)=>{
      const result=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise});
      if(result.exceptionDetails)throw new Error('Browser JS evaluation: '+JSON.stringify(result.exceptionDetails));
      return result.result?.value;
    };
    const ready=async ()=>{
      for(let attempt=0;attempt<100;attempt++){
        const state=await run("document.readyState==='complete' && document.documentElement.dataset.release==='0.02'");
        if(state)return;
        await delay(100);
      }
      throw new Error('v0.02 page did not initialize');
    };
    await cdp('Runtime.enable');
    await cdp('Page.enable');
    const sizes=[[667,375],[844,390],[932,430]];
    for(const [width,height] of sizes){
      await cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:2,mobile:true});
      await cdp('Page.navigate',{url});
      await ready();
      const metrics=await run(`(()=>{
        const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
        return {version:document.documentElement.dataset.release,
          width:window.innerWidth,scrollWidth:document.documentElement.scrollWidth,
          left:rect('.left-rail'),center:rect('.stage'),right:rect('.right-rail'),
          manifest:!!document.querySelector('link[rel="manifest"]'),
          loaded:!!document.querySelector('#preview-form')};
      })()`);
      assert.equal(metrics.width,width);
      assert.ok(metrics.manifest&&metrics.loaded);
      assert.ok(metrics.scrollWidth<=metrics.width+2,'horizontal overflow at '+width+'x'+height);
      assert.ok(metrics.center.width>=220,'center stage too narrow at '+width+'x'+height);
      assert.ok(metrics.left.right<=metrics.center.left+1,'left panel overlaps stage');
      assert.ok(metrics.center.right<=metrics.right.left+1,'right panel overlaps stage');
      const preview=await run(`(()=>{
        const input=document.querySelector('#seed'); input.value='Sable-777';
        document.querySelector('#preview-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
        return document.querySelector('#preview').textContent;
      })()`);
      assert.ok(preview.includes('CONTRACT GLIMPSE')&&preview.includes('The'),'seed interaction failed in Chrome');
      if(width===844){
        await fsp.mkdir('artifacts',{recursive:true});
        const shot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
        await fsp.writeFile('artifacts/preview-844x390.png',Buffer.from(shot.data,'base64'));
      }
      console.log('Browser PASS',width+'x'+height,'stage='+Math.round(metrics.center.width)+'px','preview=active');
    }
    await cdp('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:2,mobile:true});
    await cdp('Page.navigate',{url});
    await ready();
    const swReady=await run(`(async()=>{
      if(!('serviceWorker' in navigator))return 'unsupported';
      const reg=await Promise.race([navigator.serviceWorker.ready,new Promise(resolve=>setTimeout(()=>resolve(null),10000))]);
      if(!reg)return 'timeout';
      for(let n=0;n<50&&!navigator.serviceWorker.controller;n++)await new Promise(resolve=>setTimeout(resolve,100));
      return navigator.serviceWorker.controller?'controlled':'uncontrolled';
    })()`,true);
    assert.equal(swReady,'controlled','service worker never controlled the browser');
    await cdp('Network.enable');
    await cdp('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
    await cdp('Page.navigate',{url});
    await ready();
    assert.equal(await run("document.querySelector('#stage-heading')?.textContent"),'Every adventure becomes a legend.');
    console.log('Browser PASS offline cached launch with service worker');
    await cdp('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
    console.log('Browser smoke complete: 3 iPhone landscape sizes, functional preview, service-worker offline launch');
  }finally{
    try{ws?.close()}catch{}
    try{chrome?.kill('SIGTERM')}catch{}
    await fsp.rm(profile,{recursive:true,force:true});
  }
}
try{
  await main();
}catch(error){console.error('Browser smoke FAILED:',error.stack??error);process.exitCode=1}
finally{await new Promise(resolve=>server.close(resolve))}
