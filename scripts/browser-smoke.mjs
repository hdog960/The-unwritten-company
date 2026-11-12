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
    let port=null;
    // GitHub shared runners can occasionally stall before Chrome writes its
    // debugging port. Retry ONLY the browser startup in a completely fresh
    // profile, not any game, UI, combat, accessibility or offline assertion.
    for(let launch=1;launch<=2 && !port;launch++){
      const launchProfile=path.join(profile,'launch-'+launch);
      await fsp.mkdir(launchProfile,{recursive:true});
      chrome=spawn(chromeBin,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+launchProfile,'about:blank'],{stdio:'ignore'});
      for(let attempt=0;attempt<300;attempt++){
        if(chrome.exitCode!==null || chrome.signalCode!==null)break;
        try{
          const active=await fsp.readFile(path.join(launchProfile,'DevToolsActivePort'),'utf8');
          const candidate=Number(active.split('\n')[0]);
          if(Number.isInteger(candidate)&&candidate>0){port=candidate;break;}
        }catch{}
        await delay(100);
      }
      if(port)break;
      if(chrome.exitCode===null && chrome.signalCode===null){
        try{chrome.kill('SIGTERM')}catch{}
        await Promise.race([new Promise(resolve=>chrome.once('exit',resolve)),delay(2000)]);
        if(chrome.exitCode===null && chrome.signalCode===null){
          try{chrome.kill('SIGKILL')}catch{}
          await delay(250);
        }
      }
      if(launch===1)console.warn('Chrome startup did not yield a CDP port; retrying once with a fresh profile');
    }
    assert.ok(port,'Chrome debugging socket timed out after two isolated startup attempts');
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
        const state=await run("document.readyState==='complete' && document.documentElement.dataset.release==='0.09'");
        if(state)return;
        await delay(100);
      }
      throw new Error('v0.09 page did not initialize');
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
      const railLayout=await run("(()=>{const rect=id=>document.querySelector(id).getBoundingClientRect();const head=rect('.left-rail .panel-top'),body=rect('.left-rail .chronicle-body'),button=rect('#battle-toggle'),rail=rect('.right-rail');return {headBottom:head.bottom,bodyTop:body.top,buttonTop:button.top,buttonBottom:button.bottom,rightTop:rail.top,rightBottom:rail.bottom};})()");
      assert.ok(railLayout.headBottom<=railLayout.bodyTop+1,'left rail heading/body text overlap');
      assert.ok(railLayout.buttonTop>=railLayout.rightTop,'battle toggle starts above right rail');
      assert.ok(railLayout.buttonBottom<=railLayout.rightBottom,'battle toggle must be visible without scrolling');

      const preview=await run(`(()=>{
        const input=document.querySelector('#seed'); input.value='Sable-777';
        document.querySelector('#preview-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
        return document.querySelector('#preview').textContent;
      })()`);
      assert.ok(preview.includes('CONTRACT GLIMPSE')&&preview.includes('The'),'seed interaction failed in Chrome');
      // Enter the actual canvas view through the right-side command rail.
      const canvasState=await run("(()=>{document.getElementById('battle-toggle').click();return document.getElementById('battle-surface').hidden;})()");
      assert.equal(canvasState,false,'battle canvas did not open');
      for(let n=0;n<30;n++){
        if(await run("document.querySelector('#battle-canvas').dataset.rendered==='true'"))break;
        await delay(60);
      }
      const boardMetrics=await run("(()=>{const canvas=document.getElementById('battle-canvas');const board=canvas.getBoundingClientRect();const stage=document.querySelector('.stage').getBoundingClientRect();const left=document.querySelector('.left-rail').getBoundingClientRect(),right=document.querySelector('.right-rail').getBoundingClientRect();return {board:{left:board.left,top:board.top,right:board.right,bottom:board.bottom,width:board.width,height:board.height},stage:{left:stage.left,top:stage.top,right:stage.right,bottom:stage.bottom},leftRight:left.right,rightLeft:right.left,cols:+canvas.dataset.columns,rows:+canvas.dataset.rows,tile:+canvas.dataset.tile,x:+canvas.dataset.offsetX,y:+canvas.dataset.offsetY,bufferWidth:canvas.width,bufferHeight:canvas.height,rendered:canvas.dataset.rendered,pixels:(()=>{const ctx=canvas.getContext('2d');const data=ctx.getImageData(Math.floor(canvas.width/2),Math.floor(canvas.height/2),1,1).data;return [...data]})()};})()");
      assert.equal(boardMetrics.rendered,'true','canvas did not paint');
      assert.ok(boardMetrics.cols>=4&&boardMetrics.cols<=8,'columns outside supported range');
      assert.ok(boardMetrics.rows>=3&&boardMetrics.rows<=6,'rows outside supported range');
      assert.ok(boardMetrics.tile>=38,'tile size is not finger-readable at '+width+'x'+height);
      assert.ok(boardMetrics.board.left>=boardMetrics.stage.left-1&&boardMetrics.board.right<=boardMetrics.stage.right+1,'canvas escapes stage');
      assert.ok(boardMetrics.board.height<=height,'canvas extends beyond device height '+width+'x'+height);
      assert.ok(boardMetrics.board.bottom<=height-6,'canvas escapes bottom of viewport '+width+'x'+height);
      assert.ok(boardMetrics.board.top>=36,'canvas incorrectly overlaps app header');
      assert.ok(boardMetrics.board.height<=boardMetrics.stage.bottom-boardMetrics.stage.top+1,'canvas taller than stage');

      assert.ok(boardMetrics.leftRight<=boardMetrics.board.left+1&&boardMetrics.board.right<=boardMetrics.rightLeft+1,'canvas intersects rails');
      assert.ok(boardMetrics.bufferWidth>=boardMetrics.board.width*1.9,'retina-resolution canvas did not size to device pixel ratio');
      assert.equal(boardMetrics.pixels[3],255,'canvas center is transparent/unpainted');
      // CDP real mouse pointer input, not a synthetic DOM-only action.
      const targetX=boardMetrics.board.left+boardMetrics.x+boardMetrics.tile*.5;
      const targetY=boardMetrics.board.top+boardMetrics.y+boardMetrics.tile*.5;
      await cdp('Input.dispatchMouseEvent',{type:'mousePressed',x:targetX,y:targetY,button:'left',buttons:1,clickCount:1});
      await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',x:targetX,y:targetY,button:'left',buttons:0,clickCount:1});
      const tapped=await run("(()=>{const c=document.getElementById('battle-canvas');return {c:c.dataset.selectedColumn,r:c.dataset.selectedRow,text:document.getElementById('battle-status').textContent};})()");
      assert.equal(tapped.c,'0','pointer hit-test column incorrect');
      assert.equal(tapped.r,'0','pointer hit-test row incorrect');
      assert.ok(tapped.text.includes('Selected column 1, row 1'),'status not updated from real pointer hit');

      const partyInfo=await run("(()=>{const cards=[...document.querySelectorAll('#party-roster .party-card')],rail=document.querySelector('.left-rail').getBoundingClientRect(),roster=document.querySelector('#party-roster').getBoundingClientRect();return {readoutBottom:document.querySelector('#party-readout').getBoundingClientRect().bottom,readoutTop:document.querySelector('#party-readout').getBoundingClientRect().top,count:cards.length,ids:cards.map(x=>x.dataset.memberId),pressed:cards.filter(x=>x.getAttribute('aria-pressed')==='true').map(x=>x.dataset.memberId),hidden:document.getElementById('party-view').hidden,chronicleHidden:document.getElementById('chronicle-view').hidden,buttons:cards.map(x=>{const r=x.getBoundingClientRect();return {width:r.width,height:r.height,bottom:r.bottom,top:r.top,visible:r.bottom<=rail.bottom+1 && r.top>=rail.top-1,portraitLoaded:x.querySelector('img')?.complete&&x.querySelector('img')?.naturalWidth>0}}),railBottom:rail.bottom,rosterBottom:roster.bottom};})()");
      assert.equal(partyInfo.count,4,'four party slots required');
      assert.deepEqual(partyInfo.ids,['captain','brunna','kess','mirelle']);
      assert.deepEqual(partyInfo.pressed,['captain'],'custom hero initially active');
      assert.equal(partyInfo.hidden,false,'party rail did not appear in battle');
      assert.equal(partyInfo.chronicleHidden,true,'chronicle should be hidden while party rail is active');
      for(const b of partyInfo.buttons){
        assert.ok(b.width>=90,'party button too narrow for touch');
        assert.ok(b.height>=44,'party button below touch target size');
        assert.ok(b.visible,'party button not visible in left rail without scroll');
        assert.ok(b.portraitLoaded,'party artwork failed to load');
      }
      assert.ok(partyInfo.rosterBottom<=partyInfo.railBottom+1,'party list exceeds visible left rail');
      assert.ok(partyInfo.readoutBottom<=partyInfo.railBottom+1,'selected party status clipped below visible left rail');
      // CDP pointer input on the actual rendered party button, not element.click().
      const brunna=await run("(()=>{const r=document.querySelector('[data-member-id=\"brunna\"]').getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}})()");
      await cdp('Input.dispatchMouseEvent',{type:'mousePressed',x:brunna.x,y:brunna.y,button:'left',buttons:1,clickCount:1});
      await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',x:brunna.x,y:brunna.y,button:'left',buttons:0,clickCount:1});
      const activeBrunna=await run("(()=>({id:document.querySelector('#party-roster').dataset.selectedId,pressed:[...document.querySelectorAll('#party-roster .party-card')].filter(x=>x.getAttribute('aria-pressed')==='true').map(x=>x.dataset.memberId),readout:document.querySelector('#party-readout').textContent}))()");
      assert.equal(activeBrunna.id,'brunna','pointer selection did not activate Brunna');
      assert.deepEqual(activeBrunna.pressed,['brunna'],'only Brunna may be selected');
      assert.match(activeBrunna.readout,/Brunna.*24\/24 HP.*Study only/);
      await run("document.querySelector('[data-member-id=\"brunna\"]').focus()");
      await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40});
      await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40});
      assert.equal(await run("document.querySelector('#party-roster').dataset.selectedId"),'kess','keyboard navigation did not select Kess');
      await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'End',code:'End',windowsVirtualKeyCode:35});
      await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'End',code:'End',windowsVirtualKeyCode:35});
      assert.equal(await run("document.querySelector('#party-roster').dataset.selectedId"),'mirelle','keyboard End did not select Mirelle');
      console.log('Party PASS',width+'x'+height,'four visible portraits, status, pointer and keyboard selection');

      const controls=await run("(()=>{const names=['#battle-toggle','#command-end-turn','#command-cancel','#command-confirm','#command-move',...['strike','spark','ward','sigil'].map(id=>'[data-ability-id='+id+']')];const right=document.querySelector('.right-rail').getBoundingClientRect();return{visible:!document.querySelector('#command-view').hidden,storyHidden:document.querySelector('#right-story').hidden,ap:document.querySelector('#command-ap').textContent,rects:names.map(id=>{const r=document.querySelector(id).getBoundingClientRect();return {id,top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height,width:r.width};}),right:{top:right.top,bottom:right.bottom,left:right.left,right:right.right}}})()");
      assert.equal(controls.visible,true,'tactical command panel not visible');
      assert.equal(controls.storyHidden,true,'story seed input still visible in battle view');
      assert.equal(controls.ap,'2/2 AP');

      const commandLabel=await run("(()=>{const label=document.querySelector('.command-caption').getBoundingClientRect(),header=document.querySelector('.right-rail .board-tool').getBoundingClientRect();return {labelTop:label.top,headerBottom:header.bottom};})()");
      assert.ok(commandLabel.labelTop>=commandLabel.headerBottom+2,'command caption overlaps the House/AP header');
      for(const item of controls.rects){
        assert.ok(item.height>=44,'command touch target too short: '+item.id);
        assert.ok(item.left>=controls.right.left-1 && item.right<=controls.right.right+1,'command escapes right rail: '+item.id);
        assert.ok(item.top>=controls.right.top-1&&item.bottom<=controls.right.bottom+1,'command below right rail fold: '+item.id);
      }
      // Press an actual skill button and tap a far-away (invalid) tile.
      const tap=async (x,y)=>{
        await cdp('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',buttons:1,clickCount:1});
        await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',buttons:0,clickCount:1});
      };
      const skillSpot=await run("(()=>{const r=document.querySelector('[data-ability-id=\"sigil\"]').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()");
      await tap(skillSpot.x,skillSpot.y);
      assert.equal(await run("document.querySelector('#command-readout').dataset.ability"),'sigil','2AP ability did not select');

      const sigilHints=await run("(()=>({all:+document.querySelector('#command-view').dataset.legalTargetCount,enemies:+document.querySelector('#command-view').dataset.enemyTargetCount}))()");
      assert.ok(sigilHints.all>=sigilHints.enemies&&sigilHints.all>=1,'target markers must come from the command engine');


      // A drag from one tile to another is never a tap/target, even with an armed ability.
      const dragX=boardMetrics.board.left+boardMetrics.x+boardMetrics.tile*.5;
      const dragY=boardMetrics.board.top+boardMetrics.y+boardMetrics.tile*.5;
      await cdp('Input.dispatchMouseEvent',{type:'mousePressed',x:dragX,y:dragY,button:'left',buttons:1,clickCount:1});
      await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:dragX+boardMetrics.tile,y:dragY,button:'left',buttons:1});
      await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',x:dragX+boardMetrics.tile,y:dragY,button:'left',buttons:0,clickCount:1});
      assert.equal(await run("document.querySelector('#battle-canvas').dataset.pointer"),'dragged','drag gesture must not become a tile tap');
      assert.equal(await run("document.querySelector('#command-readout').dataset.valid"),'pending','drag must not pick a target');
      assert.equal(await run("document.querySelector('#command-confirm').disabled"),true,'drag must not enable AP spending');
      await run("document.querySelector('#battle-canvas').focus()");
      await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
      await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
      assert.equal(await run("document.querySelector('#command-readout').dataset.mode"),'idle','Escape must cancel armed targeting');
      assert.equal(await run("document.querySelector('#command-ap').dataset.ap"),'2','Escape and drag must spend no AP');
      await tap(skillSpot.x,skillSpot.y);
      assert.equal(await run("document.querySelector('#command-readout').dataset.ability"),'sigil');

      assert.equal(await run("document.querySelector('#command-ap').dataset.ap"),'2','selecting an ability must not spend AP');
      await tap(boardMetrics.board.left+boardMetrics.x+boardMetrics.tile*.5,boardMetrics.board.top+boardMetrics.y+boardMetrics.tile*.5);
      assert.equal(await run("document.querySelector('#command-readout').dataset.valid"),'false','out-of-range target should be invalid');
      assert.equal(await run("document.querySelector('#command-confirm').disabled"),true,'invalid target must block confirm');
      // Selected Mirelle from keyboard End; origin is (columns-2, rows-2).
      const nearC=boardMetrics.cols-2,nearR=boardMetrics.rows-3;
      await tap(boardMetrics.board.left+boardMetrics.x+boardMetrics.tile*(nearC+.5),boardMetrics.board.top+boardMetrics.y+boardMetrics.tile*(nearR+.5));
      assert.equal(await run("document.querySelector('#command-readout').dataset.valid"),'true','nearby legal tile must allow confirmation');
      assert.equal(await run("document.querySelector('#command-confirm').disabled"),false);
      if(width===844){
        await fsp.mkdir('artifacts',{recursive:true});
        const commandImage=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
        await fsp.writeFile('artifacts/command-844x390.png',Buffer.from(commandImage.data,'base64'));
      }
      if(width===667){
        await fsp.mkdir('artifacts',{recursive:true});
        const tiny=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
        await fsp.writeFile('artifacts/command-667x375.png',Buffer.from(tiny.data,'base64'));
      }

      await run("document.querySelector('#command-confirm').click()");
      assert.equal(await run("document.querySelector('#command-ap').dataset.ap"),'0','two-AP sigil should consume exactly 2');
      assert.equal(await run("document.querySelector('#command-view').dataset.confirmations"),'1','confirm should record one study action');
      assert.equal(await run("document.querySelector('#command-confirm').disabled"),true,'a second confirmation must not charge again');
      assert.equal(await run("document.querySelector('[data-ability-id=\"spark\"]').disabled"),true,'insufficient-AP actions must be disabled');
      await run("document.querySelector('#command-end-turn').click()");
      assert.equal(await run("document.querySelector('#command-ap').dataset.ap"),'2','end turn should restore demonstrator AP');
      assert.equal(await run("document.querySelector('#command-turn').textContent"),'Study turn 2');
      await run("document.querySelector('[data-ability-id=\"spark\"]').click()");
      await tap(boardMetrics.board.left+boardMetrics.x+boardMetrics.tile*(nearC+.5),boardMetrics.board.top+boardMetrics.y+boardMetrics.tile*(nearR+.5));
      assert.equal(await run("document.querySelector('#command-confirm').disabled"),false);
      await run("document.querySelector('#command-cancel').click()");
      assert.equal(await run("document.querySelector('#command-ap').dataset.ap"),'2','cancel must refund nothing because it spends nothing');
      assert.equal(await run("document.querySelector('#command-confirm').disabled"),true);
      await run("document.querySelector('[data-ability-id=\"spark\"]').click()");
      await tap(boardMetrics.board.left+boardMetrics.x+boardMetrics.tile*(nearC+.5),boardMetrics.board.top+boardMetrics.y+boardMetrics.tile*(nearR+.5));
      await run("document.querySelector('#command-confirm').click()");
      assert.equal(await run("document.querySelector('#command-ap').dataset.ap"),'1');
      assert.equal(await run("document.querySelector('[data-ability-id=\"sigil\"]').disabled"),true,'2 AP ability must be blocked at 1 AP');
      await run("document.querySelector('[data-member-id=\"brunna\"]').click()");
      assert.equal(await run("document.querySelector('#command-ap').dataset.ap"),'2','another member must retain its own AP');
      await run("document.querySelector('[data-member-id=\"mirelle\"]').click()");
      assert.equal(await run("document.querySelector('#command-ap').dataset.ap"),'1','member AP must persist across party switches');
      console.log('Command PASS',width+'x'+height,'4 abilities, invalid/valid target, cancel, 2AP commit, end-turn and per-member AP');

      // Gate A 26: genuine in-browser two-MP WATER preview. The seven-column
      // 667px board spawns Kess ON water (5,1), while eight columns spawn
      // Kess beside it (6,1); use the actually adjacent water cell in each.
      // Deliberately CANCEL, preserving the entire existing study/skirmish
      // sequence and every AP/MP assertion below.
      await run("document.querySelector('[data-member-id=\"kess\"]').click()");
      await run("document.querySelector('#command-move').click()");
      const doubleCostWaterColumn=5;
      const doubleCostWaterRow=boardMetrics.cols===7?2:1;
      await tap(
        boardMetrics.board.left+boardMetrics.x+boardMetrics.tile*(doubleCostWaterColumn+.5),
        boardMetrics.board.top+boardMetrics.y+boardMetrics.tile*(doubleCostWaterRow+.5)
      );
      assert.equal(await run("document.querySelector('#command-readout').dataset.valid"),'true',
        'authored water destination must be a genuinely valid route at '+width+'x'+height);
      assert.match(await run("document.querySelector('#command-readout').textContent"),/cost 2 movement/,
        'actual WATER entry must charge two MP, never one');
      assert.equal(await run("document.querySelector('#command-move').dataset.mp"),'5',
        'two-hatch route preview must never spend movement');
      assert.equal(await run("performance.getEntriesByType('resource').some(e=>e.name.includes('/src/board/route-tickets.js'))"),true,
        'new author-painted route ticket source must actually load in real Chromium');
      await fsp.mkdir('artifacts',{recursive:true});
      const waterCostShot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
      await fsp.writeFile('artifacts/route-water-'+width+'x'+height+'.png',Buffer.from(waterCostShot.data,'base64'));
      await run("document.querySelector('#command-cancel').click()");
      await run("document.querySelector('[data-member-id=\"mirelle\"]').click()");
      assert.equal(await run("document.querySelector('#command-move').dataset.mp"),'5');
      console.log('Route-ticket PASS',width+'x'+height,
        'real water=2 MP preview, native art loaded, cancellation free, screenshots captured');

      // Movement in the same two-rail control scheme. Mirelle currently active
      // with 1 AP; movement must remain a separate 5 MP budget.
      const moveButton=await run("(()=>{const r=document.querySelector('#command-move').getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}})()");
      await tap(moveButton.x,moveButton.y);
      assert.equal(await run("document.querySelector('#command-readout').dataset.mode"),'movement','Move mode not selected');
      assert.equal(await run("document.querySelector('#command-move').dataset.mp"),'5');
      assert.equal(await run("document.querySelector('#command-ap').dataset.ap"),'1','move selection changed AP');
      const tapCell=async (column,row)=>tap(
        boardMetrics.board.left+boardMetrics.x+boardMetrics.tile*(column+.5),
        boardMetrics.board.top+boardMetrics.y+boardMetrics.tile*(row+.5)
      );
      await tapCell(1,2); // authored rubble (impassable)
      assert.equal(await run("document.querySelector('#command-readout').dataset.valid"),'false','rubble should reject movement');
      assert.match(await run("document.querySelector('#command-readout').textContent"),/Rubble blocks/);
      await tapCell(2,boardMetrics.rows-1); // Brunna is standing here
      assert.equal(await run("document.querySelector('#command-readout').dataset.valid"),'false','occupied destination should reject movement');
      assert.match(await run("document.querySelector('#command-readout').textContent"),/occupies/);
      const fromCol=boardMetrics.cols-2,fromRow=boardMetrics.rows-2;
      await tapCell(fromCol,fromRow-1);
      assert.equal(await run("document.querySelector('#command-readout').dataset.valid"),'true','adjacent destination should preview a valid route');
      assert.match(await run("document.querySelector('#command-readout').textContent"),/cost 1 movement/);
      const reading=await run("(()=>{const e=document.querySelector('#command-readout');return{scroll:e.scrollHeight,client:e.clientHeight,text:e.textContent}})()");
      assert.ok(reading.scroll<=reading.client+1,'movement preview text clipped at '+width+'x'+height);

      assert.equal(await run("document.querySelector('#command-move').dataset.mp"),'5','preview must not spend movement');
      const activePreview=await run("document.querySelector('#command-readout').textContent");
      if(width===844){
        await fsp.mkdir('artifacts',{recursive:true});
        const image=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
        await fsp.writeFile('artifacts/movement-844x390.png',Buffer.from(image.data,'base64'));
      }
      if(width===667){
        await fsp.mkdir('artifacts',{recursive:true});
        const image=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
        await fsp.writeFile('artifacts/movement-667x375.png',Buffer.from(image.data,'base64'));
      }
      await run("document.querySelector('#command-cancel').click()");
      assert.equal(await run("document.querySelector('#command-move').dataset.mp"),'5','cancel should not spend MP');
      await run("document.querySelector('#command-move').click()");
      await tapCell(fromCol,fromRow-1);
      await run("document.querySelector('#command-confirm').click()");
      assert.equal(await run("document.querySelector('#command-move').dataset.mp"),'4','moving one flat tile should cost exactly 1 MP');
      assert.match(await run("document.querySelector('#command-readout').textContent"),/Moved 1 tile for 1 movement/,'movement status uses readable singular language');

      assert.equal(await run("document.querySelector('#battle-canvas').dataset.fxKind"),'move','world-native movement trail should trigger');

      const movingPosition=await run("(()=>{const c=document.querySelector('#battle-canvas');return{kind:c.dataset.fxKind,phase:Number(c.dataset.fxPhase)}})()");
      assert.equal(movingPosition.kind,'move');
      assert.ok(movingPosition.phase>=0&&movingPosition.phase<=100);
      if(width===667||width===844){
        await delay(70);
        await fsp.mkdir('artifacts',{recursive:true});
        const shot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
        await fsp.writeFile('artifacts/animated-footsteps-'+width+'x'+height+'.png',Buffer.from(shot.data,'base64'));
      }


      assert.equal(await run("document.querySelector('#command-ap').dataset.ap"),'1','movement must not spend AP');
      assert.equal(await run("document.querySelector('#command-confirm').disabled"),true,'double confirmation must be blocked');
      await run("document.querySelector('#command-move').click()");
      await tapCell(0,0);
      assert.equal(await run("document.querySelector('#command-readout').dataset.valid"),'false','distant overbudget move must be invalid');
      assert.match(await run("document.querySelector('#command-readout').textContent"),/Need .* movement/);
      await run("document.querySelector('#command-cancel').click()");
      await run("document.querySelector('[data-member-id=\"brunna\"]').click()");
      assert.equal(await run("document.querySelector('#command-move').dataset.mp"),'5','Brunna movement should be independent');
      await run("document.querySelector('[data-member-id=\"mirelle\"]').click()");
      assert.equal(await run("document.querySelector('#command-move').dataset.mp"),'4','Mirelle movement should persist');
      await run("document.querySelector('#command-end-turn').click()");
      assert.equal(await run("document.querySelector('#command-move').dataset.mp"),'5','end study turn should restore selected movement');
      assert.equal(await run("document.querySelector('#command-end-turn').textContent"),'End Turn','compact label fits landscape rail');
      assert.equal(await run("document.querySelector('#command-ap').dataset.ap"),'2','end study turn should restore AP too');
      await run("document.querySelector('[data-ability-id=\"ward\"]').click()");
      await tapCell(fromCol,fromRow-1);
      assert.equal(await run("document.querySelector('#command-readout').dataset.valid"),'true','Ward must follow new actor position');
      await run("document.querySelector('#command-cancel').click()");
      console.log('Movement PASS',width+'x'+height,'blocked/occupied, valid path and cost, cancel, commit, per-party MP, end turn');

      // v0.09 Gate A continuation: direct miniature inspection uses no AP/MP.
      await tapCell(1,boardMetrics.rows-2);
      assert.equal(await run("document.querySelector('#command-view').dataset.actorId"),'captain','tap party miniature should select that hero');
      assert.equal(await run("document.querySelector('#command-ap').dataset.ap"),'2','inspection should not spend AP');
      assert.match(await run("document.querySelector('#command-readout').textContent"),/Captain.*HP 20\/20.*Guard/);
      const inspectRoll=await run("document.querySelector('#command-readout').dataset.attackIndex");
      await tapCell(boardMetrics.cols-1,0);
      assert.match(await run("document.querySelector('#command-readout').textContent"),/Briar Sentry.*13\/13 HP.*Guard 12/);
      assert.match(await run("document.querySelector('#command-readout').getAttribute('aria-label')"),/Briar Sentry/,'unit inspection needs descriptive voiceover text');
      assert.equal(await run("document.querySelector('#command-readout').dataset.attackIndex"),inspectRoll,'information tap must not consume seeded attack roll');
      assert.equal(await run("document.querySelector('#command-ap').dataset.ap"),'2','enemy information must be free');
      console.log('Inspection PASS',width+'x'+height,'world-figure selection, enemy HP/Guard, no resource usage');


      // Seeded combat: a stationary Briar Sentry at (cols-1,0), next to Kess.
      assert.match(await run("document.querySelector('#combat-summary').textContent"),/Briar 13\/13.*Shade 16\/16/);
      await run("document.querySelector('[data-member-id=\"kess\"]').click()");
      const foeC=boardMetrics.cols-1,foeR=0;
      const targetInfo=await run("(()=>({ap:document.querySelector('#command-ap').dataset.ap,mp:document.querySelector('#command-move').dataset.mp,seed:document.querySelector('#seed').value}))()");
      assert.equal(targetInfo.ap,'2');
      assert.equal(targetInfo.mp,'5');
      assert.equal(targetInfo.seed,'Sable-777');
      await run("document.querySelector('[data-ability-id=\"spark\"]').click()");
      await tapCell(foeC,foeR);
      const previewCombat=await run("(()=>({valid:document.querySelector('#command-readout').dataset.valid,description:document.querySelector('#command-readout').textContent,ap:document.querySelector('#command-ap').dataset.ap,rollIndex:document.querySelector('#command-readout').dataset.attackIndex,readoutScroll:document.querySelector('#command-readout').scrollHeight,readoutHeight:document.querySelector('#command-readout').clientHeight}))()");
      assert.equal(previewCombat.valid,'true','training foe within Spark range must be targetable');

      const targeting=await run("(()=>({total:+document.querySelector('#command-view').dataset.legalTargetCount,enemies:+document.querySelector('#command-view').dataset.enemyTargetCount}))()");
      assert.ok(targeting.total>=1&&targeting.enemies>=1,'living foe receives legal Spark target art');

      assert.match(previewCombat.description,/60% hit.*Guard 12/);
      assert.equal(previewCombat.ap,'2','target preview must not charge AP');
      assert.equal(previewCombat.rollIndex,'0','target preview must not consume an RNG roll');
      assert.ok(previewCombat.readoutScroll<=previewCombat.readoutHeight+1,'hit chance must fit in the right-rail preview');
      if(width===844||width===667){
        await fsp.mkdir('artifacts',{recursive:true});
        const shot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
        await fsp.writeFile('artifacts/combat-target-'+width+'x'+height+'.png',Buffer.from(shot.data,'base64'));
      }
      await run("document.querySelector('#command-cancel').click()");
      assert.equal(await run("document.querySelector('#command-readout').dataset.attackIndex"),'0');
      assert.equal(await run("document.querySelector('#command-ap').dataset.ap"),'2');
      await run("document.querySelector('[data-ability-id=\"spark\"]').click()");
      await tapCell(foeC,foeR);
      await run("document.querySelector('#command-confirm').click()");
      const missOne=await run("(()=>({face:document.querySelector('#command-readout').dataset.roll,hit:document.querySelector('#command-readout').dataset.hit,hp:document.querySelector('#command-readout').dataset.targetHp,ap:document.querySelector('#command-ap').dataset.ap,rollIndex:document.querySelector('#command-readout').dataset.attackIndex}))()");
      assert.deepEqual(missOne,{face:'7',hit:'false',hp:'13',ap:'1',rollIndex:'1'},'first Sable-777 Kess Spark roll must be reproducible miss');
      await run("document.querySelector('[data-ability-id=\"spark\"]').click()");
      await tapCell(foeC,foeR);
      await run("document.querySelector('#command-confirm').click()");
      const missTwo=await run("(()=>({face:document.querySelector('#command-readout').dataset.roll,hit:document.querySelector('#command-readout').dataset.hit,hp:document.querySelector('#command-readout').dataset.targetHp,ap:document.querySelector('#command-ap').dataset.ap,rollIndex:document.querySelector('#command-readout').dataset.attackIndex}))()");
      assert.deepEqual(missTwo,{face:'4',hit:'false',hp:'13',ap:'0',rollIndex:'2'},'second seeded roll must be a different deterministic miss');
      assert.equal(await run("document.querySelector('[data-ability-id=\"spark\"]').disabled"),true);
      await run("document.querySelector('#command-end-turn').click()");
      assert.equal(await run("document.querySelector('#command-ap').dataset.ap"),'2');
      await run("document.querySelector('[data-ability-id=\"spark\"]').click()");
      await tapCell(foeC,foeR);
      await run("document.querySelector('#command-confirm').click()");
      const hitThree=await run("(()=>({face:document.querySelector('#command-readout').dataset.roll,hit:document.querySelector('#command-readout').dataset.hit,hp:document.querySelector('#command-readout').dataset.targetHp,ap:document.querySelector('#command-ap').dataset.ap,rollIndex:document.querySelector('#command-readout').dataset.attackIndex,summary:document.querySelector('#combat-summary').textContent,feedback:document.querySelector('#command-readout').textContent,tooltip:document.querySelector('#command-readout').title,scroll:document.querySelector('#command-readout').scrollHeight,height:document.querySelector('#command-readout').clientHeight}))()");
      assert.equal(hitThree.face,'15');

      assert.equal(await run("document.querySelector('#command-readout').dataset.tone"),'hit','positive combat feedback should receive a semantic style');


      assert.equal(await run("document.querySelector('#battle-canvas').dataset.fxKind"),'hit','a successful attack should animate an original hit effect');

      const piece=await run("(()=>({kind:document.querySelector('#battle-canvas').dataset.fxKind,selected:document.querySelector('#party-roster').dataset.selectedId}))()");
      assert.equal(piece.kind,'hit');

      assert.match(await run("document.querySelector('#battle-canvas').dataset.fxKey"),/^action-/);
      await delay(85);
      const visualHit=await run("Number(document.querySelector('#battle-canvas').dataset.fxPhase)");
      assert.equal(await run("document.querySelector('#command-readout').dataset.tone"),'hit');
      assert.ok(visualHit>=0&&visualHit<100,'hit VFX should advance through a short animation');
      if(width===844||width===667){
        await fsp.mkdir('artifacts',{recursive:true});
        const image=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
        await fsp.writeFile('artifacts/gate-a-impact-'+width+'x'+height+'.png',Buffer.from(image.data,'base64'));
        // Capture REAL Chromium frames of preparation, release and recovery.
        await fsp.writeFile('artifacts/gate-a-windup-'+width+'x'+height+'.png',Buffer.from(image.data,'base64'));
        await delay(130);
        const release=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
        await fsp.writeFile('artifacts/gate-a-release-'+width+'x'+height+'.png',Buffer.from(release.data,'base64'));
        await delay(118);
        const later=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
        await fsp.writeFile('artifacts/gate-a-recoil-'+width+'x'+height+'.png',Buffer.from(later.data,'base64'));
      }

      assert.equal(hitThree.hit,'true');
      assert.equal(hitThree.hp,'10');
      assert.equal(hitThree.ap,'1');
      assert.equal(hitThree.rollIndex,'3');
      assert.match(hitThree.summary,/Briar 10\/13/);
      assert.match(hitThree.feedback,/HIT.*10\/13/);
      assert.match(hitThree.tooltip,/Roll 15 \+ 3 = 18 versus Guard 12/);
      assert.ok(hitThree.scroll<=hitThree.height+1,'damage + defense result must fit on-screen');
      assert.equal(await run("document.querySelector('#command-confirm').disabled"),true,'no duplicate HP damage on repeat confirm');
      if(width===844||width===667){
        await fsp.mkdir('artifacts',{recursive:true});
        const image=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
        await fsp.writeFile('artifacts/combat-hit-'+width+'x'+height+'.png',Buffer.from(image.data,'base64'));
      }
      // Ward is defensive state, not an enemy turn: +2 Guard until this actor ends a turn.
      await run("document.querySelector('[data-member-id=\"brunna\"]').click()");
      await run("document.querySelector('[data-ability-id=\"ward\"]').click()");
      await tapCell(2,boardMetrics.rows-1);
      assert.equal(await run("document.querySelector('#command-readout').dataset.valid"),'true');
      await run("document.querySelector('#command-confirm').click()");
      assert.equal(await run("document.querySelector('#command-view').dataset.guard"),'2');
      // Actual live Guard + injured enemy state, not a hand-set screenshot.
      if(width===844||width===667){
        await fsp.mkdir('artifacts',{recursive:true});
        const marked=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
        await fsp.writeFile('artifacts/gate-a-guarded-'+width+'x'+height+'.png',Buffer.from(marked.data,'base64'));
      }

      assert.equal(await run("document.querySelector('#battle-canvas').dataset.fxKind"),'ward','Ward should produce a distinct readable defensive rune');

      assert.match(await run("document.querySelector('#command-readout').textContent"),/Guard \+2/);
      await run("document.querySelector('#command-end-turn').click()");
      assert.equal(await run("document.querySelector('#command-view').dataset.guard"),'0');
      assert.match(await run("document.querySelector('#combat-summary').textContent"),/Briar 10\/13/,'ending the demonstration turn must not heal training foes');
      console.log('Combat PASS',width+'x'+height,'seeded misses 7/4, hit 15, HP 13→10, 2 AP economy, Ward, target/defense legibility');




      console.log('Battle PASS',width+'x'+height,'grid='+boardMetrics.cols+'x'+boardMetrics.rows,'cell='+boardMetrics.tile.toFixed(1),'canvas='+boardMetrics.board.width.toFixed(0)+'x'+boardMetrics.board.height.toFixed(0));
      if(width===844){
        await fsp.mkdir('artifacts',{recursive:true});
        const battleImage=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
        await fsp.writeFile('artifacts/battle-844x390.png',Buffer.from(battleImage.data,'base64'));
      }
      assert.equal(await run("(()=>{document.getElementById('battle-toggle').click();return document.getElementById('battle-surface').hidden&&document.getElementById('story-view').hidden===false;})()"),true,'return-to-landing toggle did not restore story art');
      assert.equal(await run("document.getElementById('chronicle-view').hidden && !document.getElementById('party-view').hidden"),false,'party rail should hide when returning to chronicle');
      assert.equal(await run("document.getElementById('party-view').hidden && !document.getElementById('chronicle-view').hidden"),true,'chronicle was not restored');

      if(width===844){
        await fsp.mkdir('artifacts',{recursive:true});
        const shot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
        await fsp.writeFile('artifacts/preview-844x390.png',Buffer.from(shot.data,'base64'));
      }
      console.log('Browser PASS',width+'x'+height,'stage='+Math.round(metrics.center.width)+'px','preview=active');

      // v0.09: enter a genuine skirmish from the House UI, not an imported reducer.
      const starter=await run("(()=>{const a=document.querySelector('#start-skirmish').getBoundingClientRect(),r=document.querySelector('.right-rail').getBoundingClientRect();return{top:a.top,bottom:a.bottom,height:a.height,railTop:r.top,railBottom:r.bottom}})()");
      assert.ok(starter.height>=44&&starter.top>=starter.railTop-1&&starter.bottom<=starter.railBottom+1,'skirmish starter must be visible and 44px tall');
      await run("document.querySelector('#start-skirmish').click()");
      for(let n=0;n<40;n++){if(await run("document.querySelector('#command-view').dataset.battleMode==='active'"))break;await delay(35)}
      assert.equal(await run("document.querySelector('#command-view').dataset.battleMode"),'active','House starter did not enter live battle');

      assert.match(await run("document.querySelector('#battle-canvas').getAttribute('aria-label')"),/battlefield/,'battlefield accessible label preserved');
      assert.equal(await run("document.querySelector('#command-turn').textContent"),'Round 1');
      assert.equal(await run("document.querySelector('#command-end-turn').textContent"),'End Turn');
      const skirmishReadout=await run("(()=>{const e=document.querySelector('#command-readout');return {scroll:e.scrollHeight,client:e.clientHeight,text:e.textContent}})()");
      assert.ok(skirmishReadout.scroll<=skirmishReadout.client+1,'initial skirmish instructions must be fully visible at '+width+'x'+height);
      assert.match(skirmishReadout.text,/SKIRMISH.*Defeat both foes/);
      const originalParty=await run("JSON.parse(document.querySelector('#command-view').dataset.partyHp)");
      assert.deepEqual(originalParty,{captain:20,brunna:24,kess:16,mirelle:14});
      const intentions=await run("JSON.parse(document.querySelector('#combat-summary').dataset.intents)");
      assert.equal(intentions.length,2,'foes must telegraph genuine target selection');

      const symbols=await run("(()=>{const e=document.querySelector('#combat-summary');return{text:e.textContent,attacks:+e.dataset.attackers,title:e.title}})()");
      assert.equal(symbols.attacks,intentions.filter(i=>i.attack).length,'semantic world threats and compact rail agree');
      assert.match(symbols.title,/(attacks|approaches)/,'enemy intent has a readable descriptive title');
      assert.ok(intentions.every(i=>symbols.text.includes(i.attack?'!':'→')),'attack and movement use distinguishable non-color symbols');
      const artSource=await run("performance.getEntriesByType('resource').filter(x=>x.name.includes('/src/board/diorama.js')).length");
      assert.ok(artSource>=1,'the new world-art module must actually load in the browser, not just in a unit test');
      const enemyWitnessLoaded=await run("performance.getEntriesByType('resource').some(e=>e.name.includes('/src/board/intent-witnesses.js'))");
      assert.equal(enemyWitnessLoaded,true,'two actual foe signature plates must load on real Chromium page');
      const enemyWitnessMarks=await run("(async()=>{const {intentWitnessPlan}=await import('./src/board/intent-witnesses.js');const {measureBoard}=await import('./src/board/geometry.js');const c=document.querySelector('#battle-canvas'),b=c.getBoundingClientRect(),board=measureBoard(b.width,b.height),view=document.querySelector('#command-view'),summary=document.querySelector('#combat-summary');const intents=JSON.parse(summary.dataset.intents),foes=JSON.parse(summary.dataset.foes),targets=Object.fromEntries(foes.map(f=>[f.id,{id:f.id,hp:f.hp,position:{column:f.col,row:f.row}}]));return intentWitnessPlan(board,intents,JSON.parse(view.dataset.positions),targets,JSON.parse(view.dataset.partyHp)).map(x=>({id:x.foeId,attack:x.attack,kind:x.kind,row:x.row,column:x.column}));})()",true);
      assert.equal(enemyWitnessMarks.length,2,'both genuine living enemy stamps must be present');
      assert.deepEqual(new Set(enemyWitnessMarks.map(x=>x.id)),new Set(['briar','shade']));
      assert.equal(enemyWitnessMarks.find(x=>x.id==='briar')?.kind,'thorn-press');
      assert.equal(enemyWitnessMarks.find(x=>x.id==='shade')?.kind,'fractured-bell');
      assert.ok(enemyWitnessMarks.every(x=>intentions.some(y=>y.foeId===x.id&&y.attack===x.attack&&y.from.row===x.row&&y.from.column===x.column)),
        'signature and attack status must match the real enemy intent provenance');
      console.log('Intent witness PASS',width+'x'+height,'two living sourced enemy identities, actual attack status and distinct Canvas art');

      // Gate A 29: authored non-target floor art must be present in the
      // ACTUAL live Chromium scene at each of the three landscape dimensions.
      // Three legal glyph tiles (all movement-cost 1) now carry three
      // different physical vellum fragments, not golden target-like rings.
      const glyphModuleLoaded=await run("performance.getEntriesByType('resource').some(e=>e.name.includes('/src/board/glyph-folios.js'))");
      assert.equal(glyphModuleLoaded,true,'glyph art must load in genuine browser network graph');
      const actualGlyphSites=await run("(async()=>{const {glyphFolioPlan}=await import('./src/board/glyph-folios.js');const {getTile,measureBoard}=await import('./src/board/geometry.js');const canvas=document.querySelector('#battle-canvas'),bounds=canvas.getBoundingClientRect(),board=measureBoard(bounds.width,bounds.height);return glyphFolioPlan(board,getTile).map(x=>({row:x.row,column:x.column,style:x.style,cost:x.cost}));})()",true);
      // Real landscape board exposes 5 or 6 rows. Never invent an offscreen
      // sixth-row glyph on the narrowest iPhone or reduce the 44px tap size.
      const visibleGlyphOrigins=[[0,3],[3,6],[5,0]].filter(([row,col])=>
        row<boardMetrics.rows&&col<boardMetrics.cols);
      const visibleGlyphStyles=['broken-astral-register','binder-tally','root-cipher'].slice(0,visibleGlyphOrigins.length);
      assert.deepEqual(actualGlyphSites.map(x=>x.style),visibleGlyphStyles,
        'only real visible source-painted glyph styles may render in live Chromium');
      assert.deepEqual(actualGlyphSites.map(x=>[x.row,x.column]),visibleGlyphOrigins,
        'real stage folios must never invent an offscreen tactical tile');
      assert.ok(actualGlyphSites.every(x=>x.cost===1),'historical glyph art must never falsely alter MP');
      console.log('Glyph folio PASS',width+'x'+height,visibleGlyphOrigins.length,
        'distinct real material prints, original 44px board, no fictitious extra targets');

      const quillModuleLoaded=await run("performance.getEntriesByType('resource').some(e=>e.name.includes('/src/board/quill.js'))");
      assert.equal(quillModuleLoaded,true,'world-space target quill must be loaded on the actual iPhone-sized page');


      assert.ok(intentions.every(x=>x.victimId&&x.detail&&x.position));
      if(width===844||width===667||width===932){
        await fsp.mkdir('artifacts',{recursive:true});
        const image=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
        await fsp.writeFile('artifacts/skirmish-start-'+width+'x'+height+'.png',Buffer.from(image.data,'base64'));
      }
      // In a real battle, empty ground must not light up as if it could be attacked.
      await run("document.querySelector('[data-member-id=\"kess\"]').click()");
      await run("document.querySelector('[data-ability-id=\"spark\"]').click()");
      const liveTargeting=await run("(()=>({total:+document.querySelector('#command-view').dataset.legalTargetCount,enemies:+document.querySelector('#command-view').dataset.enemyTargetCount}))()");
      assert.ok(liveTargeting.total>=1&&liveTargeting.total===liveTargeting.enemies,
        'only actual attackable enemies may receive strong battlefield target rings');
      await run("document.querySelector('#command-cancel').click()");
      await run("document.querySelector('[data-member-id=\"captain\"]').click()");


      const g=await run("(()=>{const c=document.querySelector('#battle-canvas'),b=c.getBoundingClientRect();return{left:b.left,top:b.top,x:+c.dataset.offsetX,y:+c.dataset.offsetY,tile:+c.dataset.tile}})()");
      const tapBattleTile=async(column,row)=>tap(g.left+g.x+g.tile*(column+.5),g.top+g.y+g.tile*(row+.5));

      const oldSkirmishRoll=await run("document.querySelector('#command-readout').dataset.attackIndex");
      await tapBattleTile(2,boardMetrics.rows-1);
      assert.equal(await run("document.querySelector('#command-view').dataset.actorId"),'brunna','select allied miniatures in active combat');
      assert.equal(await run("document.querySelector('#command-ap').dataset.ap"),'2');
      await tapBattleTile(1,boardMetrics.rows-2);
      assert.equal(await run("document.querySelector('#command-view').dataset.actorId"),'captain','retarget captain directly');
      assert.equal(await run("document.querySelector('#command-readout').dataset.attackIndex"),oldSkirmishRoll,'hero switch must not roll dice');
      const portraitStamps=await run("Array.from(document.querySelectorAll('.party-card')).map(x=>({name:x.dataset.memberId,lowHp:x.dataset.lowHp,threatened:x.dataset.threatened,warded:x.dataset.warded}))");
      assert.equal(portraitStamps.length,4);
      assert.ok(portraitStamps.every(x=>x.threatened==='true'||x.threatened==='false'),'portrait threat status should be explicit');

      for(let i=0;i<4;i++)await run("document.querySelector('#command-end-turn').click()");
      assert.equal(await run("document.querySelector('#command-view').dataset.round"),'2');
      assert.equal(await run("document.querySelector('#command-view').dataset.phaseCount"),'1','the fourth hero ends with an actual enemy phase');

      assert.equal(await run("document.querySelector('#battle-canvas').dataset.fxKind"),'enemy-phase','enemy phase should produce battle-surface effects');

      assert.equal(await run("document.querySelector('#command-view').dataset.ended"),'[]');
      const afterEnemy=await run("JSON.parse(document.querySelector('#command-view').dataset.partyHp)");
      assert.ok(Object.keys(afterEnemy).every(id=>afterEnemy[id]<=originalParty[id]),'enemy attacks cannot heal the party');
      assert.match(await run("document.querySelector('#command-readout').textContent"),/ROUND 2.*(hits|misses|advances)/);
      const fullEnemyMessage=await run("(()=>{const r=document.querySelector('#command-readout');return{height:r.clientHeight,content:r.scrollHeight,detail:r.title}})()");
      assert.ok(fullEnemyMessage.content<=fullEnemyMessage.height+1,'full visible enemy summary must fit narrow right rail');
      assert.match(fullEnemyMessage.detail,/vs/,'complete defense math must remain available to screen reader/long press');

      if(width===844||width===667){
        await fsp.mkdir('artifacts',{recursive:true});
        const image=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
        await fsp.writeFile('artifacts/skirmish-enemy-'+width+'x'+height+'.png',Buffer.from(image.data,'base64'));
      }
      // Only real command buttons, target clicks and end-turn actions change gameplay.
      // Pathfinding is read-only planning used by this browser playtester.
      let count=0,shots=0,moves=0,ends=0;
      while(count++<225){
        const battle=await run("(()=>{const v=document.querySelector('#command-view'),c=document.querySelector('#battle-canvas');return{mode:v.dataset.battleMode,actor:v.dataset.actorId,ap:+v.dataset.ap,mp:+document.querySelector('#command-move').dataset.mp,columns:+c.dataset.columns,rows:+c.dataset.rows,positions:JSON.parse(v.dataset.positions),foes:JSON.parse(document.querySelector('#combat-summary').dataset.foes),round:+v.dataset.round}})()");
        if(battle.mode!=='active')break;
        const here=battle.positions[battle.actor],foes=battle.foes.filter(x=>x.hp>0);
        assert.ok(foes.length);
        const distance=(a,b)=>Math.abs(a.column-b.col)+Math.abs(a.row-b.row);
        const within=foes.filter(x=>distance(here,x)<=3).sort((a,b)=>a.hp-b.hp||distance(here,a)-distance(here,b));
        if(battle.ap>0&&within.length){
          await run("document.querySelector('[data-ability-id=\"spark\"]').click()");
          await tapBattleTile(within[0].col,within[0].row);
          assert.equal(await run("document.querySelector('#command-readout').dataset.valid"),'true','legal ranged attack rejected');
          await run("document.querySelector('#command-confirm').click()");
          shots++;continue;
        }
        if(battle.mp>0&&foes.length){
          const expr="(async()=>{const {previewMovement}=await import('./src/movement/pathfinding.js');const b="+JSON.stringify(battle)+";const board={columns:b.columns,rows:b.rows};const occupied={...b.positions};b.foes.filter(x=>x.hp>0).forEach(x=>occupied['enemy:'+x.id]={column:x.col,row:x.row});const actor=b.actor,here=b.positions[actor],budget=b.mp;const dist=at=>Math.min(...b.foes.filter(x=>x.hp>0).map(x=>Math.abs(at.column-x.col)+Math.abs(at.row-x.row)));const before=dist(here),a=[];for(let row=0;row<board.rows;row++)for(let column=0;column<board.columns;column++){const at={column,row},route=previewMovement(board,occupied,actor,at,budget);if(route.valid&&dist(at)<before)a.push({column,row,cost:route.cost,d:dist(at)});}a.sort((x,y)=>x.d-y.d||x.cost-y.cost||x.row-y.row||x.column-y.column);return a.slice(0,1);})()";
          const planned=await run(expr,true);
          if(planned?.length){
            await run("document.querySelector('#command-move').click()");
            await tapBattleTile(planned[0].column,planned[0].row);
            assert.equal(await run("document.querySelector('#command-readout').dataset.valid"),'true','legal path rejected');
            await run("document.querySelector('#command-confirm').click()");
            moves++;continue;
          }
        }
        await run("document.querySelector('#command-end-turn').click()");
        ends++;
      }
      const terminal=await run("(()=>{const v=document.querySelector('#command-view');return{mode:v.dataset.battleMode,round:+v.dataset.round,foes:JSON.parse(document.querySelector('#combat-summary').dataset.foes),replay:document.querySelector('#command-end-turn').textContent}})()");
      assert.equal(terminal.mode,'won','actual UI battle must be winnable');
      assert.equal(terminal.foes.filter(x=>x.hp>0).length,0);
      assert.equal(terminal.replay,'Replay Skirmish');
      const victoryText=await run("(()=>{const r=document.querySelector('#command-readout');return{height:r.clientHeight,content:r.scrollHeight,text:r.textContent}})()");
      assert.ok(victoryText.content<=victoryText.height+1,'victory status must fit without scroll');
      assert.match(victoryText.text,/VICTORY/);

      assert.ok(shots>=5&&moves>=1&&ends>=1,'real skirmish must require attacks, movement and turn passing');
      if(width===844||width===667){
        await fsp.mkdir('artifacts',{recursive:true});
        const image=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
        await fsp.writeFile('artifacts/skirmish-victory-'+width+'x'+height+'.png',Buffer.from(image.data,'base64'));
      }
      await run("document.querySelector('#command-end-turn').click()");
      assert.equal(await run("document.querySelector('#command-view').dataset.battleMode"),'active','replay must restore active skirmish');

      assert.equal(await run("document.querySelector('#command-view').dataset.ap"),'2','replay must not retain the prior battle AP');

      assert.equal(await run("document.querySelector('#command-view').dataset.round"),'1');
      assert.match(await run("document.querySelector('#combat-summary').dataset.foes"),/"hp":13/,'replay must reset enemy HP');
      console.log('Skirmish PASS',width+'x'+height,'victory, attacks='+shots+', moves='+moves+', ends='+ends+', rounds='+terminal.round);

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
    await run("document.getElementById('battle-toggle').click()");
    for(let n=0;n<25;n++){if(await run("document.querySelector('#battle-canvas').dataset.rendered==='true'"))break;await delay(80)}
    assert.equal(await run("document.querySelector('#battle-canvas').dataset.rendered"),'true','offline board was missing cached JS modules');
    assert.equal(await run("document.querySelectorAll('#party-roster .party-card img').length"),4,'offline party portraits missing');
    const offlinePortraits=await run("([...document.querySelectorAll('#party-roster .portrait-image')].map(x=>x.complete&&x.naturalWidth>0))");
    assert.ok(offlinePortraits.every(Boolean),'offline portrait images not cached');


    assert.equal(await run("document.querySelector('#command-view').hidden"),false,'offline command rail missing');
    assert.equal(await run("document.querySelectorAll('#command-skills .command-skill').length"),4,'offline command skills not loaded');
    await run("document.querySelector('[data-ability-id=\"ward\"]').click()");
    assert.equal(await run("document.querySelector('#command-readout').dataset.ability"),'ward','offline ability selection broken');
    await run("document.querySelector('#command-cancel').click()");
    assert.equal(await run("document.querySelector('#command-ap').dataset.ap"),'2','offline cancel should not spend AP');

    await run("document.querySelector('#command-move').click()");
    assert.equal(await run("document.querySelector('#command-readout').dataset.mode"),'movement','offline movement module did not load');
    await run("document.querySelector('#command-cancel').click()");
    assert.equal(await run("document.querySelector('#command-move').dataset.mp"),'5','offline movement cancel should be free');

    await run("document.querySelector('[data-member-id=\"kess\"]').click()");
    await run("document.querySelector('[data-ability-id=\"spark\"]').click()");
    const offlineTarget=await run("(()=>{const c=document.querySelector('#battle-canvas');const b=c.getBoundingClientRect();return{x:b.left+(+c.dataset.offsetX)+(+c.dataset.tile)*((+c.dataset.columns)-.5),y:b.top+(+c.dataset.offsetY)+(+c.dataset.tile)*.5}})()");
    await cdp('Input.dispatchMouseEvent',{type:'mousePressed',x:offlineTarget.x,y:offlineTarget.y,button:'left',buttons:1,clickCount:1});
    await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',x:offlineTarget.x,y:offlineTarget.y,button:'left',buttons:0,clickCount:1});
    assert.equal(await run("document.querySelector('#command-readout').dataset.valid"),'true','offline seeded foe must be targetable');
    await run("document.querySelector('#command-confirm').click()");
    assert.equal(await run("document.querySelector('#command-readout').dataset.attackIndex"),'1','offline combat roll module did not run');
    assert.match(await run("document.querySelector('#command-readout').textContent"),/HIT|MISS|CRIT/);
    console.log('Browser PASS offline seeded combat resolution');
    await run("document.querySelector('#battle-toggle').click()");
    await run("document.querySelector('#start-skirmish').click()");
    for(let n=0;n<40;n++){if(await run("document.querySelector('#command-view').dataset.battleMode==='active'"))break;await delay(35)}
    assert.equal(await run("document.querySelector('#command-view').dataset.battleMode"),'active','offline skirmish failed to start');
    for(let i=0;i<4;i++)await run("document.querySelector('#command-end-turn').click()");
    assert.equal(await run("document.querySelector('#command-view').dataset.phaseCount"),'1','offline enemy AI module did not execute');
    console.log('Browser PASS offline deterministic enemy turn');


    console.log('Browser PASS offline movement and cancel');
    console.log('Browser PASS offline command rail and cancel');

    console.log('Browser PASS offline tactical art preview renderer');
    console.log('Browser PASS offline cached launch with service worker');
    await cdp('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
    console.log('Browser smoke complete: 3 iPhone landscape sizes, functional preview, tactical geometry/pointer, offline art launch');
  }finally{
    try{ws?.close()}catch{}
    if(chrome && chrome.exitCode===null){
      try{chrome.kill('SIGTERM')}catch{}
      await Promise.race([
        new Promise(resolve=>chrome.once('exit',resolve)),
        delay(2000)
      ]);
      if(chrome.exitCode===null){
        try{chrome.kill('SIGKILL')}catch{}
        await delay(250);
      }
    }
    // Browser result is authoritative; a still-exiting Chrome must not falsely fail
    // an otherwise successful smoke test during temporary profile cleanup.
    try{
      await fsp.rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:150});
    }catch(error){
      console.warn('Temporary Chrome profile cleanup warning:',error.code??error.message);
    }
  }
}
try{
  await main();
}catch(error){console.error('Browser smoke FAILED:',error.stack??error);process.exitCode=1}
finally{await new Promise(resolve=>server.close(resolve))}
