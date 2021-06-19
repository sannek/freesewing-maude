import draftNeckBase from './neckBase'
import draftBase from './base'
import { UP, LEFT, DOWN, RIGHT, BEAM, sleeveNotchPercentage, CM_FACTOR } from './constants';

export default function (part) {
  let {
    options,
    Path,
    points,
    paths,
    Snippet,
    snippets,
    complete,
    sa,
    paperless,
    macro,
    measurements,
    store,
    utils
  } = part.shorthand()

  draftNeckBase(part);
  draftBase(part);

  const { chest, shoulderSlope, bustSpan, hpsToBust, highBust, waist } = measurements;
  const { chestEase } = options;
  const chestEaseFactor = 1 + chestEase;
  const HBW = chest / 20;
  const CM = store.get("CM");
  const FB_CM = chest * CM_FACTOR;

  const frontAngle = store.get("frontAngle");
  const veryLargeCup = store.get("veryLargeCup")
  const largeCup = store.get("largeCup");
  // Neckline curve control points
  points.mCp = points.centerFrontNeck.shift(RIGHT - frontAngle, HBW);
  points.sCp = points.hpsFront.shift(DOWN - shoulderSlope - frontAngle, HBW * 0.8)

  // front shoulder dart points
  const frontShoulderWidth = points.hpsFront.dist(points.shoulderFront);

  points.v1 = points.a.shift(RIGHT, bustSpan / 2);
  points.v = points.hpsFront.shiftTowards(points.v1, hpsToBust);
  points.u = points.hpsFront.shiftTowards(points.shoulderFront, frontShoulderWidth / 2)

  let shoulderDartSize = (chest - highBust) / 2;
  if (!veryLargeCup) {
    if (chest * chestEase < 6 * CM) {
      shoulderDartSize += 3 * CM;
    } else if (chest * chestEase < 10 * CM) {
      shoulderDartSize += 1.5 * CM;
    }
  }

  if (shoulderDartSize > 0) {
    const shoulderIntersect = utils.beamIntersectsCircle(points.u, shoulderDartSize, points.hpsFront, points.shoulderFront);
    points.u1a = shoulderIntersect[1]; // lowest and rightmost intersection
  } else {
    points.u1a = points.hpsFront.shiftTowards(points.shoulderFront, frontShoulderWidth / 2)
  }

  points.u1 = points.v.shiftTowards(points.u1a, points.v.dist(points.u));

  const shoulderDartAngle = points.u.angle(points.v) - points.u1.angle(points.v);
  const shoulderCP = 7 * FB_CM * chestEaseFactor * chestEaseFactor;
  points.t = points.u1.shift(RIGHT - shoulderSlope - frontAngle - shoulderDartAngle, frontShoulderWidth / 2);
  points.tCp = points.t.shift(DOWN - shoulderSlope - frontAngle - shoulderDartAngle, shoulderCP);


  // Side dart
  points.f10 = points.v.shift(RIGHT - frontAngle, BEAM)
  // where top leg of side dart crosses side seam
  points.f1 = utils.beamsIntersect(points.v, points.f10, points.underArmSide, points.sideFrontWaist);

  /* with a very large bust size the side dart ends up way too large
  but if the bust point is high there might not be enough space
  between the underside of the armhole and the top leg of the side dart */
  let largeBust = chest > 120 * CM;
  let lowerFrontUnderArm = (largeBust || veryLargeCup) ? 2 * FB_CM : 1 * FB_CM;
  const sideDartToUnderarm = points.f1.dist(points.underArmSide);
  if (sideDartToUnderarm - lowerFrontUnderArm <= 3.5 * CM) {
    lowerFrontUnderArm = Math.max(sideDartToUnderarm - 3.5 * CM, 0)
  }

  points.frontUnderArm = points.underArmSide.shiftTowards(points.sideFrontWaist, lowerFrontUnderArm);
  const underArmCP = 9 * CM * chestEaseFactor * chestEaseFactor;
  points.uCp = points.frontUnderArm.shift(LEFT - frontAngle, underArmCP);

  // Rotate the shoulder dart closed.
  const bustPoint = points.v;
  points.closed_u1 = points.u1.rotate(shoulderDartAngle, bustPoint);
  points.closed_t = points.t.rotate(shoulderDartAngle, bustPoint);
  points.closed_frontUnderArm = points.frontUnderArm.rotate(shoulderDartAngle, bustPoint);
  points.closed_f1 = points.f1.rotate(shoulderDartAngle, bustPoint);
  points.closed_tCp = points.tCp.rotate(shoulderDartAngle, bustPoint);
  points.closed_uCp = points.uCp.rotate(shoulderDartAngle, bustPoint);

  const armhole = new Path().move(points.closed_frontUnderArm).curve(points.closed_uCp, points.closed_tCp, points.closed_t).length();
  store.set("frontArmhole", armhole);

  const backSideSeamLength = store.get("sideSeamLength");
  const sideDartSize = points.sideFrontWaist.dist(points.frontUnderArm) - backSideSeamLength;

  const sideIntersect = utils.circlesIntersect(points.f1, sideDartSize, points.v, points.v.dist(points.f1), "y");
  points.f2 = sideIntersect[1];

  /* 
    True up side dart.
  */

  const sideDartAngle = 360 - points.v.angle(points.f2) + points.v.angle(points.f1);
  points.underArmSideDartClosed = points.frontUnderArm.rotate(-sideDartAngle, points.v);

  points.sideDartSeamIntersect = utils.beamsIntersect(points.underArmSideDartClosed, points.sideFrontWaist, points.v, points.f2)
  points.closed_f1 =
    points.sideDartSeamIntersect
      .rotate(sideDartAngle, points.v)
      .rotate(shoulderDartAngle, bustPoint);
  points.f2 = points.sideDartSeamIntersect.copy()

  // Waist dart
  const finalFrontWaist = store.get("finalFrontWaist");
  const frontDartSize = points.centerFrontWaist.dist(points.sideFrontWaist) - finalFrontWaist;

  points.vDownBeam = points.v.shift(DOWN - frontAngle, BEAM);
  points.dCenter = utils.beamsIntersect(points.centerFrontWaist, points.sideFrontWaist, points.v, points.vDownBeam);
  points.d1 = points.dCenter.shiftTowards(points.centerFrontWaist, frontDartSize / 2);
  points.d2 = points.dCenter.shiftTowards(points.sideFrontWaist, frontDartSize / 2);

  // Move dart points slightly away from bust point
  points.v_side = points.v.shiftTowards(points.f1, 3 * CM)
  points.v_waist = points.v.shift(DOWN - frontAngle, 3 * CM);

  // Rotate points so bodice CF is straight
  const frontBodicePoints = [
    "hpsFront",
    "sCp",
    "mCp",
    "centerFrontNeck",
    "centerFrontWaist",
    "d1",
    "v",
    "v_waist",
    "d2",
    "sideFrontWaist",
    "f2",
    "dCenter",
    "v_side",
    "closed_f1",
    "closed_frontUnderArm",
    "closed_uCp",
    "closed_tCp",
    "closed_t",
    "u"
  ]

  for (let p of frontBodicePoints) {
    points[p] = points[p].rotate(frontAngle, points.a);
  }

  /*
    True waist darts
    - lengthen them by a bit,
    - calculate control points to curve waistline
  */
  const dartSize = points.d1.dist(points.d2)
  points.d1 = points.d1.shiftFractionTowards(points.v_waist, -0.001 * dartSize);
  let leftDartAngle = points.d1.angle(points.v_waist);
  points.d1Cp = points.d1.shift(leftDartAngle + 90, 2 * CM);

  points.d2 = points.d2.shiftFractionTowards(points.v_waist, -0.001 * dartSize);
  let rightDartAngle = points.d2.angle(points.v_waist);
  points.d2Cp = points.d2.shift(rightDartAngle - 90, 2 * CM);

  if (dartSize > 1 * CM) {
    points.waistDartCenter = utils.beamsIntersect(points.d1Cp, points.d1, points.d2, points.d2Cp)
  } else {
    points.waistDartCenter = points.dCenter.copy()
  }

  /*
    The side dart will get pressed down, so we need to find how much extra fabric
    we need to cut to make the dart line up with the sideseam.
  */
  const angle = points.f2.angle(points.sideFrontWaist) - points.f2.angle(points.v_side)
  points.flippedSideWaist = points.sideFrontWaist.rotate(-2 * angle, points.f2)
  points.sideDartCenter = points.closed_f1.shiftFractionTowards(points.f2, 0.5)
  points.sideDartCenter = utils.beamsIntersect(points.f2, points.flippedSideWaist, points.v_side, points.sideDartCenter)

  // Calculate place of sleeve notch
  points.armholeNotch = new Path()
    .move(points.closed_frontUnderArm)
    .curve(points.closed_uCp, points.closed_tCp, points.closed_t)
    .shiftAlong(armhole * sleeveNotchPercentage.front)

  // lower front neckline a bit
  points.centerFrontNeck = points.centerFrontNeck.shift(DOWN, 1.5 * CM);
  points.mCp = points.mCp.shift(DOWN, 1.5 * CM);

  // Shift shoulder seam forward a bit
  points.closed_t = points.closed_t.shiftTowards(points.closed_tCp, 1.2 * CM);
  points.hpsFront = points.hpsFront.shiftTowards(points.sCp, 1.2 * CM);

  // ACTUALLY DRAW FRONT BODICE!!
  paths.saBase = new Path()
    .move(points.centerFrontWaist)
    ._curve(points.d1Cp, points.d1)
    .line(points.waistDartCenter)
    .line(points.d2)
    .curve_(points.d2Cp, points.sideFrontWaist)
    .line(points.f2)
    .line(points.sideDartCenter)
    .line(points.closed_f1)
    .line(points.closed_frontUnderArm)
    .curve(points.closed_uCp, points.closed_tCp, points.closed_t)
    .line(points.hpsFront)
    .curve(points.sCp, points.mCp, points.centerFrontNeck)
    .setRender(false)

  paths.seamLines = new Path()
    .move(points.hpsFront)
    .curve(points.sCp, points.mCp, points.centerFrontNeck)
    .line(points.centerFrontWaist)
    ._curve(points.d1Cp, points.d1)
    .line(points.v_waist)
    .line(points.d2)
    .curve_(points.d2Cp, points.sideFrontWaist)
    .line(points.f2)
    .line(points.v_side)
    .line(points.closed_f1)
    .line(points.closed_frontUnderArm)
    .curve(points.closed_uCp, points.closed_tCp, points.closed_t)
    .line(points.hpsFront)
    .close()
    .attr('class', 'fabric')

  paths.sideDartEdge = new Path()
    .move(points.f2)
    .line(points.sideDartCenter)
    .line(points.closed_f1)
    .attr('class', 'help')

  paths.waistDartEdge = new Path()
    .move(points.d1)
    .line(points.waistDartCenter)
    .line(points.d2)
    .attr('class', 'help')


  // Complete?
  if (complete) {
    snippets.bustPoint = new Snippet('notch', points.v);
    snippets.armholeNotch = new Snippet('notch', points.armholeNotch);

    macro('cutonfold', {
      from: points.centerFrontNeck,
      to: points.centerFrontWaist,
      grainline: true
    });

    points.titleAnchor = points.v.shift(UP, 5 * CM);
    macro('title', {
      at: points.titleAnchor,
      nr: 1,
      title: 'front'
    });

    if (sa) {
      paths.sa = paths.saBase.offset(sa).close().attr('class', 'fabric sa')
    }
  }

  // Paperless?
  if (paperless) {

  }

  return part
}
