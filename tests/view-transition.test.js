import assert from "node:assert/strict";
import test from "node:test";
import { runViewTransition } from "../src/ui/view-transition.js";

function createDocument({
  visibilityState = "visible",
  transitionError = null,
  ready = Promise.resolve(),
  updateCallbackDone = Promise.resolve(),
  finished = Promise.resolve()
} = {}) {
  let transitionCalls = 0;
  return {
    documentRef: {
      visibilityState,
      startViewTransition(update) {
        transitionCalls += 1;
        if (transitionError) throw transitionError;
        update();
        return { ready, updateCallbackDone, finished };
      }
    },
    get transitionCalls() { return transitionCalls; }
  };
}

test("skips view transitions when the document is hidden or motion is reduced", () => {
  for (const options of [{ visibilityState: "hidden" }, { reducedMotion: true }]) {
    const harness = createDocument(options);
    const reports = [];
    assert.equal(runViewTransition(() => {}, {
      documentRef: harness.documentRef,
      reducedMotion: options.reducedMotion,
      reportError: (...entry) => reports.push(entry)
    }), false);
    assert.equal(harness.transitionCalls, 0);
    assert.equal(reports.length, 0);
  }
});

test("runs a visible transition and reports unexpected failures", async () => {
  const failure = new Error("transition failed");
  const harness = createDocument({
    ready: Promise.reject(failure),
    updateCallbackDone: Promise.reject(failure),
    finished: Promise.reject(failure)
  });
  const reports = [];
  let updated = false;

  assert.equal(runViewTransition(() => { updated = true; }, {
    documentRef: harness.documentRef,
    reducedMotion: false,
    reportError: (...entry) => reports.push(entry)
  }), true);
  await Promise.resolve();
  assert.equal(updated, true);
  assert.equal(reports.length, 1);
  assert.equal(reports[0][1], failure);
});

test("falls back synchronously when the browser rejects transition startup", () => {
  const failure = Object.assign(new Error("document hidden"), { name: "InvalidStateError" });
  const harness = createDocument({ transitionError: failure });
  const reports = [];

  assert.equal(runViewTransition(() => {}, {
    documentRef: harness.documentRef,
    reducedMotion: false,
    reportError: (...entry) => reports.push(entry)
  }), false);
  assert.equal(reports.length, 1);
  assert.equal(reports[0][1], failure);
});

test("does not report an aborted transition", async () => {
  const harness = createDocument({
    ready: Promise.reject(Object.assign(new Error("superseded"), { name: "AbortError" })),
    updateCallbackDone: Promise.reject(Object.assign(new Error("superseded"), { name: "AbortError" })),
    finished: Promise.reject(Object.assign(new Error("superseded"), { name: "AbortError" }))
  });
  const reports = [];
  runViewTransition(() => {}, {
    documentRef: harness.documentRef,
    reducedMotion: false,
    reportError: (...entry) => reports.push(entry)
  });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(reports.length, 0);
});
