import test from "node:test";
import assert from "node:assert/strict";
import {
  bearingBetween,
  compassPoint,
  distanceMeters,
  formatDistance,
  headingFromOrientation,
  nearestStores,
  normalizeDegrees
} from "../src/geo.js";

test("normalizes degrees into 0..360", () => {
  assert.equal(normalizeDegrees(370), 10);
  assert.equal(normalizeDegrees(-10), 350);
});

test("calculates distance and bearing between Stockholm landmarks", () => {
  const centralStation = { lat: 59.33022, lng: 18.0592 };
  const fieldOversten = { lat: 59.33947, lng: 18.09131 };

  const distance = distanceMeters(centralStation, fieldOversten);
  const bearing = bearingBetween(centralStation, fieldOversten);

  assert.ok(distance > 2000 && distance < 2200);
  assert.ok(bearing > 55 && bearing < 65);
});

test("formats short and long distances", () => {
  assert.equal(formatDistance(126), "126 m");
  assert.equal(formatDistance(1240), "1.2 km");
  assert.equal(formatDistance(15300), "15 km");
});

test("picks compass points", () => {
  assert.equal(compassPoint(0), "N");
  assert.equal(compassPoint(45), "NE");
  assert.equal(compassPoint(181), "S");
});

test("reads iOS and generic browser headings", () => {
  assert.equal(headingFromOrientation({ webkitCompassHeading: 109 }), 109);
  assert.equal(headingFromOrientation({ alpha: 270 }), 90);
});

test("sorts nearest stores", () => {
  const position = { lat: 59.33, lng: 18.06 };
  const stores = [
    { id: "2", name: "Far", lat: 57.7, lng: 11.97 },
    { id: "1", name: "Near", lat: 59.331, lng: 18.061 }
  ];

  assert.equal(nearestStores(position, stores, 1)[0].id, "1");
});
