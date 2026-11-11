import test from 'node:test';
import assert from 'node:assert/strict';
import {measureBoard,cellRect,hitTestBoard,logicalPointFromClient,getTile,BOARD_MAX_COLS,BOARD_MAX_ROWS} from '../src/board/geometry.js';

for(const [width,height] of [[328,270],[435,286],[483,326],[250,202],[700,460]]){
  test('board fits center stage '+width+'x'+height+' with valid cells',()=>{
    const board=measureBoard(width,height);
    assert.ok(board.columns<=BOARD_MAX_COLS&&board.rows<=BOARD_MAX_ROWS);
    assert.ok(board.columns>=4&&board.rows>=3);
    assert.ok(board.tile>=38,'tiles must be usable even at smallest supported stage');
    assert.ok(board.x>=8&&board.y>=8);
    assert.ok(board.x+board.mapWidth<=width-8+1e-6);
    assert.ok(board.y+board.mapHeight<=height-8+1e-6);
    for(let r=0;r<board.rows;r++)for(let c=0;c<board.columns;c++){
      const rect=cellRect(board,c,r);
      assert.ok(rect);
      assert.ok(rect.x>=board.x-1e-6&&rect.y>=board.y-1e-6);
      assert.ok(rect.x+rect.width<=board.x+board.mapWidth+1e-6);
      assert.ok(rect.y+rect.height<=board.y+board.mapHeight+1e-6);
      assert.deepEqual(hitTestBoard(board,rect.x+rect.width*.5,rect.y+rect.height*.5),{column:c,row:r});
      assert.ok(['stone','moss','water','rubble','glyph'].includes(getTile(r,c)));
    }
    assert.equal(hitTestBoard(board,board.x-1,board.y),null);
    assert.equal(hitTestBoard(board,board.x,board.y+board.mapHeight),null);
    assert.equal(hitTestBoard(board,board.x+board.mapWidth,board.y),null);
  });
}
test('board point client translation is exact and supports fractional offsets',()=>{
  assert.deepEqual(logicalPointFromClient({left:11.25,top:24.5},55.5,47),{x:44.25,y:22.5});
});
test('geometry rejects invalid dimensions and coordinates',()=>{
  assert.throws(()=>measureBoard(0,230),RangeError);
  assert.throws(()=>measureBoard(NaN,230),RangeError);
  assert.throws(()=>measureBoard(15,230),RangeError);
  const b=measureBoard(340,250);
  assert.equal(cellRect(b,-1,0),null);
  assert.equal(cellRect(b,b.columns,0),null);
  assert.equal(hitTestBoard(b,Infinity,0),null);
  assert.equal(hitTestBoard(b,b.x-1,b.y+5),null);
});
test('tile geometry is monotonic under space expansion',()=>{
  const small=measureBoard(328,270),large=measureBoard(483,326);
  assert.ok(large.columns>=small.columns);
  assert.ok(large.rows>=small.rows);
  assert.ok(large.tile>=small.tile);
});
