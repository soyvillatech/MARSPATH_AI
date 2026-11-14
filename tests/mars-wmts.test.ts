import { test } from 'node:test';
import assert from 'node:assert/strict';
import { visibleTiles, contains, type Capabilities } from '../src/services/marsWmts.ts';

const cap: Capabilities = {
  template: 'https://trek.nasa.gov/tiles/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png',
  style: 'default', set: 'example', bounds: [77.2229331,18.3067994,77.583964,18.669315],
  matrices: [{id:'10',width:2048,height:1024,tileWidth:256,tileHeight:256,origin:[-180,90],scale:272683}],
};
test('Jezero selects the independently verified NASA row 407, column 1464', () => {
  const tiles=visibleTiles(cap,[77.44,18.43,77.46,18.45],2048*256/360);
  assert.equal(tiles.length,1);
  assert.match(tiles[0].url,/\/10\/407\/1464.png$/);
});
test('no requests outside dataset coverage', () => {
  assert.deepEqual(visibleTiles(cap,[0,0,1,1],1000),[]);
});
test('matrix limits exclude a visible but unavailable tile', () => {
  const limited={...cap,matrices:[{...cap.matrices[0],limits:[0,100,0,100]}]};
  assert.deepEqual(visibleTiles(limited,[77.44,18.43,77.46,18.45],1000),[]);
});
test('overzoom keeps valid matrix identifiers and enlarges available imagery', () => {
  const tiles=visibleTiles(cap,[77.44,18.43,77.46,18.45],10000);
  assert.match(tiles[0].url,/\/10\//);
  assert.ok(tiles[0].width>256);
});
test('coverage fallback considers entire viewport, not just its center', () => {
  assert.equal(contains(cap.bounds,[77.4,18.4,77.5,18.5]),true);
  assert.equal(contains(cap.bounds,[77.2,18.4,77.5,18.5]),false);
});
