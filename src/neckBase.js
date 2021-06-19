import { RIGHT, DOWN } from './constants';
export default function (part) {
  let {
    Point,
    Path,
    points,
    paths,
    complete,
    sa,
    paperless,
    measurements,
    store
  } = part.shorthand()

  const { neck, chest, shoulderSlope } = measurements;
  const hbw = chest / 20;

  // Base neck measurements
  let backNeckDepth = hbw * 0.5;
  let frontNeckDepth = hbw * 2 - chest * 0.01;
  let neckWidth = hbw * 1.5;

  let target = neck / 2;
  let tweak = 1;
  let delta;

  points.origin = new Point(0, 0);

  do {
    backNeckDepth *= tweak;
    frontNeckDepth *= tweak;
    neckWidth *= tweak;

    points.n = points.origin.shift(DOWN, backNeckDepth);
    points.nCp = points.n.shift(RIGHT, hbw * 0.5);

    points.m = points.origin.shift(DOWN, frontNeckDepth);
    points.mCp = points.m.shift(RIGHT, hbw);

    points.s = points.origin.shift(RIGHT, neckWidth);
    points.sCp = points.s.shift(DOWN - shoulderSlope, hbw * 0.5)

    paths.neck = new Path()
      .move(points.m)
      .curve(points.mCp, points.sCp, points.s)
      .curve(points.sCp, points.nCp, points.n)

    delta = paths.neck.length() - target;
    tweak = delta > 0 ? tweak * 0.99 : tweak * 1.01;
  } while (Math.abs(delta) > 1);

  store.set("frontNeckDepth", frontNeckDepth + chest * 0.01)
  store.set("backNeckDepth", backNeckDepth)
  store.set("neckWidth", neckWidth)

  // Delete all the points and paths again, because all we need is these measurements.
  for (let p in paths) delete paths[p];
  for (let p in points) delete points[p];

  return part
}
