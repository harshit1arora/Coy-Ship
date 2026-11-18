import express from "express";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { profiles, incomingLikes } from "./seed.mjs";
const root = path.dirname(fileURLToPath(import.meta.url));
export function createApp(file = ":memory:") {
  if (file !== ":memory:") mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(
    "PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS swipes(profile TEXT PRIMARY KEY, decision TEXT NOT NULL CHECK(decision IN ('like','pass')), mutual INTEGER NOT NULL CHECK(mutual IN (0,1)))",
  );
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "4kb" }));
  app.use(["/feed", "/matches", "/swipe"], (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  const lookup = new Map(profiles.map((p) => [p.id, p]));
  app.get("/feed", (_req, res) => {
    const seen = new Set(
      db
        .prepare("SELECT profile FROM swipes")
        .all()
        .map((row) => row.profile),
    );
    res.json(profiles.filter((p) => !seen.has(p.id)));
  });
  app.get("/matches", (_req, res) =>
    res.json(
      db
        .prepare(
          "SELECT profile FROM swipes WHERE mutual=1 ORDER BY rowid DESC",
        )
        .all()
        .map((r) => lookup.get(r.profile)),
    ),
  );
  app.post("/swipe", (req, res) => {
    const { profileId, decision } = req.body ?? {};
    if (!["like", "pass"].includes(decision) || typeof profileId !== "string")
      return res
        .status(400)
        .json({ error: "Send a profileId and a like or pass decision." });
    if (!lookup.has(profileId))
      return res.status(404).json({ error: "Profile unavailable." });
    const mutual = decision === "like" && incomingLikes.has(profileId);
    const result = db
      .prepare(
        "INSERT INTO swipes VALUES (?,?,?) ON CONFLICT(profile) DO NOTHING",
      )
      .run(profileId, decision, Number(mutual));
    if (!result.changes) {
      const prior = db
        .prepare("SELECT decision FROM swipes WHERE profile=?")
        .get(profileId);
      if (prior.decision !== decision)
        return res.status(409).json({ error: "Profile already swiped." });
    }
    res
      .status(result.changes ? 201 : 200)
      .json({ createdMatch: Boolean(result.changes && mutual) });
  });
  app.use(express.static(path.join(root, "dist"), { dotfiles: "deny" }));
  app.use((err, _req, res, _next) =>
    res
      .status(err.status || 500)
      .json({
        error: err.status === 400 ? "Invalid JSON." : "Request failed.",
      }),
  );
  return { app, close: () => db.close() };
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const port = Number(process.env.PORT || 3000);
  createApp(
    process.env.DB_PATH || path.join(root, "data", "coy.sqlite"),
  ).app.listen(port, "127.0.0.1", () =>
    console.log("Coy running at http://127.0.0.1:" + port),
  );
}
