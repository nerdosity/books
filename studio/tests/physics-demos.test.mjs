import test from 'node:test';
import assert from 'node:assert/strict';
import {physicsDemoValue,physicsDemoHTML,PHYSICS_DEMOS} from '../lib/physics-demos.js';
test('interactive diagrams obey signed pressure, orientation and attenuation limits',()=>{
  assert.deepEqual(physicsDemoValue('manometer',0),{difference:0,absolute:100000});
  assert.equal(physicsDemoValue('manometer',12).difference,1176);
  assert.equal(physicsDemoValue('manometer',-12).absolute,98824);
  assert.equal(physicsDemoValue('flux',0).flux,2);
  assert.ok(Math.abs(physicsDemoValue('flux',90).flux)<1e-12);
  assert.equal(physicsDemoValue('flux',180).flux,-2);
  assert.deepEqual(physicsDemoValue('attenuation',0),{transmitted:100,removed:0});
  const half=physicsDemoValue('attenuation',Math.log(2)/.2);
  assert.ok(Math.abs(half.transmitted-50)<1e-9);
  for(const demo of PHYSICS_DEMOS){
    const markup=physicsDemoHTML(demo);
    assert.match(markup,/<svg/);assert.match(markup,/aria-label=/);
    assert.doesNotMatch(markup,/<script|https?:\/\//);
  }
});
