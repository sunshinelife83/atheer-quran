import assert from "node:assert/strict";
import test from "node:test";
import { deleteOfflineAudio, getOfflineAudio, listOfflineAudio, saveOfflineAudio } from "../src/storage/offline-audio.js";

function installIndexedDb(testContext, { requestResult, abort = false }) {
  let closed = 0;
  const database = {
    objectStoreNames: { contains: () => true },
    close() { closed++; },
    transaction() {
      const transaction = {};
      const request = {};
      const store = Object.fromEntries(["put", "get", "getAll", "delete"].map((method) => [method, () => {
        queueMicrotask(() => {
          request.result = requestResult;
          request.onsuccess();
          if (abort) {
            transaction.error = new Error("commit failed");
            transaction.onabort();
          } else {
            transaction.oncomplete();
          }
        });
        return request;
      }]));
      transaction.objectStore = () => store;
      return transaction;
    }
  };
  globalThis.indexedDB = {
    open() {
      const request = { result: database };
      queueMicrotask(() => request.onsuccess());
      return request;
    }
  };
  testContext.after(() => { delete globalThis.indexedDB; });
  return () => closed;
}

test("offline audio reads resolve after transaction completion and close the database", async (testContext) => {
  const record = { id: "hafs_1_1" };
  const closed = installIndexedDb(testContext, { requestResult: record });

  assert.equal(await getOfflineAudio(record.id), record);
  assert.equal(closed(), 1);
});

test("offline audio writes and deletes wait for their transaction to commit", async (testContext) => {
  const closed = installIndexedDb(testContext, { requestResult: undefined });

  await saveOfflineAudio({ id: "hafs_1_1" });
  await deleteOfflineAudio("hafs_1_1");
  assert.equal(closed(), 2);
});

test("offline audio listing returns the committed records", async (testContext) => {
  const records = [{ id: "hafs_1_1" }];
  const closed = installIndexedDb(testContext, { requestResult: records });

  assert.equal(await listOfflineAudio(), records);
  assert.equal(closed(), 1);
});

test("offline audio writes reject if the transaction aborts after request success", async (testContext) => {
  const closed = installIndexedDb(testContext, { requestResult: undefined, abort: true });

  await assert.rejects(saveOfflineAudio({ id: "hafs_1_1" }), /commit failed/);
  assert.equal(closed(), 1);
});
