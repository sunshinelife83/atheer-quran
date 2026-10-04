import assert from "node:assert/strict";
import test from "node:test";
import { RadioRecovery } from "../src/audio/radio-recovery.js";

class FakeMedia extends EventTarget {
  constructor() {
    super();
    this.src = "";
    this.loads = 0;
    this.plays = 0;
    this.playError = null;
  }

  load() { this.loads += 1; }

  play() {
    this.plays += 1;
    return this.playError ? Promise.reject(this.playError) : Promise.resolve();
  }

  emit(name) { this.dispatchEvent(new Event(name)); }
}

function createHarness(options = {}) {
  const media = new FakeMedia();
  const statuses = [];
  const timers = new Map();
  let nextTimerId = 0;
  const recovery = new RadioRecovery(media, (status, attempt) => statuses.push([status, attempt]), {
    retryDelays: [1_000, 2_000, 4_000],
    stallGracePeriod: 12_000,
    setTimeout(callback, delay) {
      const id = ++nextTimerId;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
    ...options
  });
  return {
    media,
    statuses,
    timers,
    recovery,
    runTimer(id = timers.keys().next().value) {
      const timer = timers.get(id);
      assert.ok(timer, "expected a scheduled timer");
      timers.delete(id);
      timer.callback();
      return timer.delay;
    }
  };
}

test("stalled radio reconnects after a grace period without saving a position", () => {
  const h = createHarness();
  h.recovery.start("https://radio.example/live");
  h.media.emit("waiting");
  h.media.emit("stalled");
  assert.equal(h.timers.size, 1);
  assert.equal(h.runTimer(), 12_000);
  assert.equal(h.media.loads, 1);
  assert.equal(h.media.plays, 1);
  assert.equal(h.media.src, "https://radio.example/live");
  assert.deepEqual(h.statuses.at(-1), ["retrying", 1]);
  h.recovery.destroy();
});

test("failure retries use bounded exponential backoff and reset after playback resumes", () => {
  const h = createHarness();
  h.recovery.start("https://radio.example/live");
  h.media.emit("error");
  assert.equal(h.runTimer(), 1_000);
  h.media.emit("error");
  assert.equal(h.runTimer(), 2_000);
  h.media.emit("playing");
  h.media.emit("error");
  assert.equal(h.runTimer(), 1_000);
  assert.equal(h.media.plays, 3);
  h.recovery.destroy();
});

test("manual pause and stop cancel pending retries", () => {
  const h = createHarness();
  h.recovery.start("https://radio.example/live");
  h.media.emit("error");
  h.recovery.pause();
  assert.equal(h.timers.size, 0);
  h.media.emit("error");
  assert.equal(h.timers.size, 0);
  h.recovery.resume();
  h.media.emit("error");
  h.recovery.stop();
  assert.equal(h.timers.size, 0);
  h.recovery.destroy();
});

test("autoplay denial waits for a user gesture instead of retrying forever", async () => {
  const h = createHarness();
  h.recovery.start("https://radio.example/live");
  h.media.playError = Object.assign(new Error("gesture required"), { name: "NotAllowedError" });
  h.media.emit("error");
  h.runTimer();
  await Promise.resolve();
  assert.deepEqual(h.statuses.at(-1), ["interaction-required", 1]);
  assert.equal(h.timers.size, 0);
  h.recovery.destroy();
});
