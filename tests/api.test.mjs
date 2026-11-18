import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { once } from "node:events";
import { createApp } from "../server.mjs";

async function open(file) {
  const { app, close } = createApp(file);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = "http://127.0.0.1:" + server.address().port;
  return {
    get: async (route) => (await fetch(base + route)).json(),
    swipe: (profileId, decision) =>
      fetch(base + "/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, decision }),
      }),
    stop: async () => {
      await new Promise((r) => server.close(r));
      close();
    },
  };
}
test("feed projects only public fields and starts with private incoming likes", async (t) => {
  const s = await open();
  t.after(s.stop);
  const f = await s.get("/feed");
  assert.equal(f.length, 32);
  assert.equal(new Set(f.map((p) => p.id)).size, 32);
  for (const p of f)
    assert.deepEqual(Object.keys(p).sort(), [
      "age",
      "bio",
      "city",
      "id",
      "interests",
      "name",
      "photo",
    ]);
  assert.deepEqual(await s.get("/matches"), []);
});
test("one-sided like and pass on an admirer have identical match results", async (t) => {
  const s = await open();
  t.after(s.stop);
  for (const [id, d] of [
    ["p2", "like"],
    ["p1", "pass"],
  ])
    assert.deepEqual(await (await s.swipe(id, d)).json(), {
      createdMatch: false,
    });
  assert.deepEqual(await s.get("/matches"), []);
  assert.equal((await s.get("/feed")).length, 30);
});
test("concurrent likes create one match, opposite retry conflicts, invalid input cannot change state", async (t) => {
  const s = await open();
  t.after(s.stop);
  const replies = await Promise.all([
    s.swipe("p1", "like"),
    s.swipe("p1", "like"),
  ]);
  assert.deepEqual(replies.map((r) => r.status).sort(), [200, 201]);
  assert.equal(
    (await Promise.all(replies.map((r) => r.json()))).filter(
      (r) => r.createdMatch,
    ).length,
    1,
  );
  assert.equal((await s.swipe("p1", "pass")).status, 409);
  assert.equal((await s.swipe("p88", "like")).status, 404);
  assert.equal((await s.swipe("p2", "maybe")).status, 400);
  assert.deepEqual(
    (await s.get("/matches")).map((p) => p.id),
    ["p1"],
  );
  assert.equal((await s.get("/feed")).length, 31);
});
test("exhausted deck and mutual match survive a fresh server process connection", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "coy-api-")),
    file = path.join(dir, "test.db");
  let s = await open(file);
  try {
    for (const p of await s.get("/feed"))
      await s.swipe(p.id, p.id === "p1" ? "like" : "pass");
    await s.stop();
    s = await open(file);
    assert.deepEqual(await s.get("/feed"), []);
    assert.deepEqual(
      (await s.get("/matches")).map((p) => p.id),
      ["p1"],
    );
  } finally {
    await s.stop();
    rmSync(dir, { recursive: true, force: true });
  }
});
