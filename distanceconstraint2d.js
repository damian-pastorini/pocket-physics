var v2 = require('./v2');
var debug = require('debug')('pocket-physics:distanceconstraint');

module.exports = function distanceConstraint2d(p1, p1mass, p2, p2mass, goal) {
  var imass1 = 1/(p1mass || 1);
  var imass2 = 1/(p2mass || 1);
  var imass = imass1 + imass2

  // Current relative vector
  var delta = v2.sub(v2(), p2.cpos, p1.cpos);
  var deltaMag = v2.magnitude(delta);

  debug('goal', goal)
  debug('delta', delta)

  // Difference between current distance and goal distance
  var diff = (deltaMag - goal) / deltaMag;

  debug('delta mag', deltaMag)
  debug('diff', diff)

  // approximate mass
  v2.scale(delta, delta, diff / imass);

  debug('delta diff/imass', delta)

  var p1correction = v2.scale(v2(), delta, imass1);
  var p2correction = v2.scale(v2(), delta, imass2);

  debug('p1correction', p1correction)
  debug('p2correction', p2correction)

  if (p1mass) v2.add(p1.cpos, p1.cpos, p1correction);
  if (p2mass) v2.sub(p2.cpos, p2.cpos, p2correction);
}
