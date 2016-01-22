var v2 = require('./v2');
var collideCircleCircle = require('./collidecirclecircle');
var debug = require('debug')('pocket-physics:collide-circle-edge');

// Preallocations
var edgeDir = v2();
var edge = v2();
var prevEdge = v2();
var hypo = v2();
var epDiff = v2();
var correction = v2();

var ep = {
  cpos: v2(),
  ppos: v2()
}

var epBefore = {
  cpos: v2(),
  ppos: v2()
}

module.exports = function collide(
  point3, radius3, mass3,
  point1, mass1,
  point2, mass2,
  preserveInertia, damping
) {
  debug('point3 %o', point3);
  debug('endpoint1 %o', point1);
  debug('endpoint2 %o', point2);

  // Edge direction (edge in local space)
  v2.sub(edge, point2.cpos, point1.cpos);

  // Normalize collision edge (assume collision axis is edge)
  v2.normalize(edgeDir, edge);

  // Vector from endpoint1 to particle
  v2.sub(hypo, point3.cpos, point1.cpos);

  debug('edge %o', edge);
  debug('hypo %o', hypo);
  debug('edgeDir %o', edgeDir);

  // Where is the particle on the edge, before, after, or on?
  // Also used for interpolation later.
  var projection = v2.dot(edge, hypo);
  var maxDot = v2.dot(edge, edge);
  var edgeMag = Math.sqrt(maxDot);

  debug('projection %d', projection);
  debug('maxDot %d', maxDot);
  debug('edgeMag %d', edgeMag);

  // Colliding beyond the edge...
  //if (projection < 0 || projection > maxDot) return;

  // Create interpolation factor of where point closest
  // to particle is on the line.
  var t = projection / maxDot;
  var u = 1 - t;

  debug('t %d, u %d', t, u);

  // Distribute mass of colliding point into two fake points
  // and use those to collide against each endpoint independently.

  var standinMass1 = t * mass3;
  var standinMass2 = u * mass3;

  debug('standinMass 1,2 %d,%d', standinMass1, standinMass2);

  var standin1 = {
    cpos: v2(),
    ppos: v2()
  };

  var standin2 = {
    cpos: v2(),
    ppos: v2()
  };

  // Slide standin1 along edge to be in front of endpoint1
  v2.scale(standin1.cpos, edgeDir, t * edgeMag);
  v2.sub(standin1.cpos, point3.cpos, standin1.cpos);
  v2.scale(standin1.ppos, edgeDir, t * edgeMag);
  v2.sub(standin1.ppos, point3.ppos, standin1.ppos);

  // Slide standin2 along edge to be in front of endpoint2
  v2.scale(standin2.cpos, edgeDir, u * edgeMag);
  v2.add(standin2.cpos, point3.cpos, standin2.cpos);
  v2.scale(standin2.ppos, edgeDir, u * edgeMag);
  v2.add(standin2.ppos, point3.ppos, standin2.ppos);

  debug('standin1 %o', standin1);
  debug('standin2 %o', standin2);

  var standin1Before = {
    cpos: v2(),
    ppos: v2()
  }

  var standin2Before = {
    cpos: v2(),
    ppos: v2()
  }

  // Stash state of standins
  v2.copy(standin1Before.cpos, standin1.cpos);
  v2.copy(standin1Before.ppos, standin1.ppos);
  v2.copy(standin2Before.cpos, standin2.cpos);
  v2.copy(standin2Before.ppos, standin2.ppos);

  var edgeRadius = 0;

  debug('collide standin1 with endpoint1');

  // Collide standins with endpoints
  collideCircleCircle(
    standin1, radius3, standinMass1,
    point1, edgeRadius, mass1,
    preserveInertia, damping);

  debug('collide standin2 with endpoint2');

  collideCircleCircle(
    standin2, radius3, standinMass2,
    point2, edgeRadius, mass2,
    preserveInertia, damping);

  var standin1Delta = {
    cpos: v2(),
    ppos: v2()
  }

  var standin2Delta = {
    cpos: v2(),
    ppos: v2()
  }

  // Compute standin1 cpos change
  v2.sub(standin1Delta.cpos, standin1.cpos, standin1Before.cpos);

  // Compute standin2 cpos change
  v2.sub(standin2Delta.cpos, standin2.cpos, standin2Before.cpos);

  v2.scale(standin1Delta.cpos, standin1Delta.cpos, t);
  v2.scale(standin2Delta.cpos, standin2Delta.cpos, u);

  debug('standin1Delta cpos %o', standin1Delta.cpos);
  debug('standin2Delta cpos %o', standin2Delta.cpos);

  // Apply cpos changes to point3
  v2.add(point3.cpos, point3.cpos, standin1Delta.cpos);
  v2.add(point3.cpos, point3.cpos, standin2Delta.cpos);

  debug('new endpoint1.cpos %o', point1.cpos);
  debug('new endpoint2.cpos %o', point2.cpos);
  debug('new point3.cpos %o', point3.cpos);

  if (!preserveInertia) return;

  // TODO: instead of adding diff, get magnitude of diff and scale
  // in reverse direction of standin velocity from point3.cpos because
  // that is what circlecircle does.

  // Compute standin1 ppos change
  v2.sub(standin1Delta.ppos, standin1.ppos, standin1Before.ppos);

  // Compute standin2 ppos change
  v2.sub(standin2Delta.ppos, standin2.ppos, standin2Before.ppos);

  v2.scale(standin1Delta.ppos, standin1Delta.ppos, t);
  v2.scale(standin2Delta.ppos, standin2Delta.ppos, u);

  debug('standin1Delta ppos %o', standin1Delta.ppos);
  debug('standin2Delta ppos %o', standin2Delta.ppos);

  // Apply ppos changes to point3
  v2.add(point3.ppos, point3.ppos, standin1Delta.ppos);
  v2.add(point3.ppos, point3.ppos, standin2Delta.ppos);

  debug('new endpoint1.ppos %o', point1.ppos);
  debug('new endpoint2.ppos %o', point2.ppos);
  debug('new point3.ppos %o', point3.ppos);
}