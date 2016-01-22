var v2 = require('./v2');
var debug = require('debug')('pocket-physics:collide-circle-circle');

// Preallocations!
var vel1 = { x: 0, y: 0 };
var vel2 = { x: 0, y: 0 };
var diff = { x: 0, y: 0 };
var move = { x: 0, y: 0 };

// It's very important that this function not do any distance checking.
// It is assumed that if this function is called, then the points are
// definitely colliding, and that after being called with preserveInertia
// === false, another call with === true should be made, even if the first
// calculation has moved the points away from physically touching.

module.exports = function(p1, p1radius, p1mass, p2, p2radius, p2mass, preserveInertia, damping) {

  debug('p1 cpos %o, mass %d, radius %d',
    p1.cpos, p1mass, p1radius);
  debug('p2 cpos %o, mass %d, radius %d',
    p2.cpos, p2mass, p2radius);

  var dist2 = v2.distance2(p1.cpos, p2.cpos);
  var target = p1radius + p2radius;
  var min2 = target * target;

  v2.sub(vel1, p1.cpos, p1.ppos);
  v2.sub(vel2, p2.cpos, p2.ppos);

  v2.sub(diff, p1.cpos, p2.cpos);
  var dist = Math.sqrt(dist2);
  var factor = (dist - target) / dist;

  debug('point dist %d, edge dist %d, factor %d',
    dist, dist - target, factor);
  debug('diff %o', diff);

  var mass1 = p1mass === undefined ? 1 : p1mass;
  var mass2 = p2mass === undefined ? 1 : p2mass;
  var massT = mass1 + mass2;

  debug('massT %d, mass1 %d, mass2 %d', massT, mass1, mass2);

  // Move a away
  move.x = diff.x * factor * (mass2 / massT);
  move.y = diff.y * factor * (mass2 / massT);
  if (mass1 > 0) {
    debug('moving p1', move);
    v2.sub(p1.cpos, p1.cpos, move);
  }

  // Move b away
  move.x = diff.x * factor * (mass1 / massT);
  move.y = diff.y * factor * (mass1 / massT);
  if (mass2 > 0) {
    debug('moving p2', move);
    v2.add(p2.cpos, p2.cpos, move);
  }

  debug('p1.cpos %o', p1.cpos);
  debug('p2.cpos %o', p2.cpos);

  if (!preserveInertia) return;

  damping = damping || 1;

  var f1 = (damping * (diff.x * vel1.x + diff.y * vel1.y)) / dist2;
  var f2 = (damping * (diff.x * vel2.x + diff.y * vel2.y)) / dist2;
  debug('inertia. f1 %d, f2 %d', f1, f2);

  vel1.x += (f2 * diff.x - f1 * diff.x) / (mass1 || 1) // * (mass2 / massT);
  vel2.x += (f1 * diff.x - f2 * diff.x) / (mass2 || 1) // * (mass1 / massT);
  vel1.y += (f2 * diff.y - f1 * diff.y) / (mass1 || 1) // * (mass2 / massT);
  vel2.y += (f1 * diff.y - f2 * diff.y) / (mass2 || 1) // * (mass1 / massT);

  debug('velocity. p1 %o, p2 %o', vel1, vel2);

  v2.set(p1.ppos, p1.cpos.x - vel1.x, p1.cpos.y - vel1.y);
  v2.set(p2.ppos, p2.cpos.x - vel2.x, p2.cpos.y - vel2.y);

  debug('p1.ppos %o', p1.ppos);
  debug('p2.ppos %o', p2.ppos);
}
