import { test } from "node:test";
import assert from "node:assert/strict";
import { press, START } from "../js/ui/minigames/calculator.js";

const run = (keys) => [...keys].reduce((s, k) => press(s, k), { ...START }).display;

test("the calculator does change math to the cent", () => {
  assert.equal(run("20−13.47="), "6.53");
  assert.equal(run("50−0.01="), "49.99");
  assert.equal(run("0.1+0.2="), "0.3");
  assert.equal(run("5.5×3="), "16.5");
});

test("the calculator chains, corrects and clears", () => {
  assert.equal(run("10+5−3="), "12");
  assert.equal(run("10+−4="), "6");
  assert.equal(run("12⌫5="), "15");
  assert.equal(run("20−7=+1="), "14");
  assert.equal(run("99C4+4="), "8");
  assert.equal(run("1..5+1="), "2.5");
});

test("dividing by zero shows Error until cleared", () => {
  assert.equal(run("5÷0="), "Error");
  assert.equal(run("5÷0=7"), "Error");
  assert.equal(run("5÷0=C3"), "3");
});
