/** v0.09: hand-inked trajectory under the battlefield miniatures.
 * This is a *preview* of existing command validation: never resolves rolls,
 * costs AP, occupies a tile, reads the network, or paints floating UI text.
 */
import {cellRect} from './geometry.js';
export const QUILL_PALETTE=Object.freeze({ready:'#f2d8a0',invalid:'#ef9c85',ward:'#a4e6d2'});
const center=(board,point)=>{
 const rect=point&&cellRect(board,point.column,point.row);
 return rect?{x:rect.x+rect.width*.5,y:rect.y+rect.height*.5,s:rect.width}:null;
};
function line(ctx,pts,color,width){
 ctx.beginPath();ctx.moveTo(...pts[0]);
 for(let i=1;i<pts.length;i++)ctx.lineTo(...pts[i]);
 ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke();
}
export function paintQuillPreview(ctx,board,overlay){
 if(!ctx||!board||overlay?.mode!=='ability'||!overlay.target)return false;
 const a=center(board,overlay.origin),b=center(board,overlay.target);
 if(!a||!b)return false;
 const valid=overlay.evaluation?.valid===true;
 const ward=overlay.command?.id==='ward';
 const ink=ward?QUILL_PALETTE.ward:valid?QUILL_PALETTE.ready:QUILL_PALETTE.invalid;
 const s=b.s;
 ctx.save();ctx.beginPath();ctx.rect(board.x,board.y,board.mapWidth,board.mapHeight);ctx.clip();
 if(a.x===b.x&&a.y===b.y){
   // Enamel shield pip for self-Ward: no nonsensical projectile arrow.
   const y=b.y+s*.31;
   line(ctx,[[b.x,y-s*.08],[b.x+s*.08,y],[b.x,y+s*.08],[b.x-s*.08,y],[b.x,y-s*.08]],
     ink,Math.max(1,s*.029));
 }else{
   // A single broken, slightly arcing quill stroke with a nib pointed at
   // the destination. It runs under characters rather than across their faces.
   const dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy)||1;
   const ux=dx/dist,uy=dy/dist,nx=-uy,ny=ux;
   const bend=Math.min(s*.23,dist*.11)*(dx>=0?1:-1);
   const start=[a.x+dx*.19,a.y+dy*.19],end=[b.x-dx*.20,b.y-dy*.20];
   ctx.save();ctx.globalAlpha=valid?.67:.58;
   ctx.setLineDash(valid?[s*.08,s*.10]:[s*.033,s*.11]);
   ctx.beginPath();ctx.moveTo(...start);
   ctx.bezierCurveTo(a.x+dx*.37+nx*bend,a.y+dy*.37+ny*bend,
     a.x+dx*.65+nx*bend,a.y+dy*.65+ny*bend,...end);
   ctx.strokeStyle=ink;ctx.lineWidth=Math.max(.9,s*.023);ctx.stroke();
   ctx.setLineDash([]);ctx.restore();
   const nib=[b.x-dx*.15,b.y-dy*.15];
   line(ctx,[[nib[0]-ux*s*.08-nx*s*.05,nib[1]-uy*s*.08-ny*s*.05],
     nib,[nib[0]-ux*s*.08+nx*s*.05,nib[1]-uy*s*.08+ny*s*.05]],ink,Math.max(1,s*.028));
 }
 // Under-figure bookplate corners replace the old opaque target tile fill.
 ctx.save();ctx.globalAlpha=valid?.95:.65;
 if(!valid)ctx.setLineDash([s*.05,s*.06]);
 ctx.strokeStyle=ink;ctx.lineWidth=Math.max(1.1,s*.032);
 const side=s*.35;
 ctx.strokeRect(b.x-side,b.y-side,side*2,side*2);
 ctx.restore();ctx.restore();return true;
}
