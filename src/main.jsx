import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

async function api(url, options) {
  const r = await fetch(url, options);
  if (!r.ok) throw new Error("Request failed");
  return r.json();
}
function Icon({ name }) {
  const paths = {
    heart:
      "M20.8 4.7a5.4 5.4 0 0 0-7.6 0L12 6l-1.2-1.3a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.7a5.4 5.4 0 0 0 0-7.6Z",
    cross: "m6 6 12 12M18 6 6 18",
    pin: "M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0ZM12 8v4",
    home: "m3 11 9-8 9 8v10h-6v-7H9v7H3Z",
    discover: "m3 8 5-5 12 3 1 13-13 2Z M15 8l-2 6-5 2 2-6Z",
  };
  return (
    <svg
      aria-hidden="true"
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}
function App() {
  const [tab, T] = useState("Discover"),
    [view, V] = useState("People"),
    [feed, F] = useState(null),
    [matches, M] = useState([]),
    [match, Q] = useState(null),
    [error, E] = useState(false),
    [offset, X] = useState(0),
    [decision, D] = useState(""),
    [notice, N] = useState("");
  const origin = useRef(null),
    busy = useRef(false),
    dialog = useRef(null);
  async function load() {
    E(false);
    try {
      const [f, m] = await Promise.all([api("/feed"), api("/matches")]);
      F(f);
      M(m);
    } catch {
      E(true);
    }
  }
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    if (match) dialog.current?.showModal();
  }, [match]);
  const p = feed?.[0];
  async function swipe(choice) {
    if (!p || busy.current || error) return;
    busy.current = true;
    D(choice);
    X(choice === "like" ? 130 : -130);
    try {
      const [result] = await Promise.all([
        api("/swipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileId: p.id, decision: choice }),
        }),
        new Promise((r) => setTimeout(r, 230)),
      ]);
      F((f) => f.filter((row) => row.id !== p.id));
      N(choice === "like" ? "Liked " + p.name : "Passed on " + p.name);
      if (result.createdMatch) {
        M((m) => [p, ...m.filter((row) => row.id !== p.id)]);
        Q(p);
      }
    } catch {
      E(true);
    } finally {
      busy.current = false;
      D("");
      X(0);
    }
  }
  function endDrag(e) {
    if (origin.current === null) return;
    const dx = e.clientX - origin.current;
    origin.current = null;
    if (Math.abs(dx) > 64) swipe(dx > 0 ? "like" : "pass");
    else X(0);
  }
  return (
    <>
      <header>
        <div className="top">
          <span className="logo" aria-label="Coy">
            coy
            <i />
          </span>
          <nav aria-label="Main navigation">
            {["Home", "Discover"].map((t) => (
              <button
                key={t}
                aria-current={tab === t ? "page" : undefined}
                onClick={() => T(t)}
              >
                <Icon name={t.toLowerCase()} />
                {t}
              </button>
            ))}
          </nav>
        </div>
      </header>
      {tab === "Discover" && (
        <main>
          <div className="heading">
            <div>
              <h1>
                Discover<span>.</span>
              </h1>
              <p>Find someone you’d like to know.</p>
            </div>
            <div className="switch" aria-label="Discover views">
              {["People", "Matches"].map((v) => (
                <button aria-pressed={view === v} key={v} onClick={() => V(v)}>
                  {v}
                  {v === "Matches" && <small>{matches.length}</small>}
                </button>
              ))}
            </div>
          </div>
          {error ? (
            <section className="state">
              <h2>Couldn’t load your deck.</h2>
              <button onClick={load}>Try again</button>
            </section>
          ) : !feed ? (
            <p role="status">Loading profiles…</p>
          ) : view === "Matches" ? (
            <section>
              <h2>Your matches</h2>
              {matches.length ? (
                <ul>
                  {matches.map((m) => (
                    <li key={m.id}>
                      <img src={m.photo} alt="" />
                      <div>
                        <strong>
                          {m.name}, {m.age}
                        </strong>
                        <p>{m.city}</p>
                      </div>
                      <Icon name="heart" />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="state">
                  <Icon name="heart" />
                  <h3>No matches yet</h3>
                  <p>When you both like each other, you’ll see them here.</p>
                  <button onClick={() => V("People")}>Explore people</button>
                </div>
              )}
            </section>
          ) : p ? (
            <>
              <article
                key={p.id}
                style={{
                  transform:
                    "translateX(" +
                    offset / 4 +
                    "px) rotate(" +
                    offset / 70 +
                    "deg)",
                  opacity: decision ? 0.45 : 1,
                }}
                onPointerDown={(e) => {
                  if (!busy.current) {
                    origin.current = e.clientX;
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }
                }}
                onPointerMove={(e) => {
                  if (origin.current !== null) X(e.clientX - origin.current);
                }}
                onPointerUp={endDrag}
                onPointerCancel={() => {
                  origin.current = null;
                  X(0);
                }}
              >
                <div className="portrait">
                  <img src={p.photo} alt={p.name} draggable="false" />
                  {Math.abs(offset) > 25 && (
                    <b className="stamp">{offset > 0 ? "Like" : "Pass"}</b>
                  )}
                </div>
                <div className="details">
                  <div className="count">
                    PROFILE {String(33 - feed.length).padStart(2, "0")} / 32
                  </div>
                  <h2>
                    {p.name}, {p.age}
                  </h2>
                  <div className="city">
                    <Icon name="pin" />
                    {p.city}
                  </div>
                  <hr />
                  <h3>About me</h3>
                  <p>{p.bio}</p>
                  <h3>Interests</h3>
                  <div className="chips">
                    {p.interests.map((i) => (
                      <span key={i}>{i}</span>
                    ))}
                  </div>
                </div>
              </article>
              <div className="actions">
                <button disabled={!!decision} onClick={() => swipe("pass")}>
                  <Icon name="cross" />
                  Pass
                </button>
                <button
                  className="pink"
                  disabled={!!decision}
                  onClick={() => swipe("like")}
                >
                  <Icon name="heart" />
                  Like
                </button>
              </div>
              <p className="privacy">
                Your likes stay private until you both match.
              </p>
            </>
          ) : (
            <section className="state">
              <h2>You’re all caught up.</h2>
              <p>You’ve seen everyone in this deck.</p>
              <button onClick={() => V("Matches")}>View matches</button>
            </section>
          )}
          <span className="sr" role="status">
            {notice}
          </span>
        </main>
      )}
      {match && (
        <dialog ref={dialog} onClose={() => Q(null)}>
          <div className="match">
            <img src={match.photo} alt="" />
            <h2>It’s a match!</h2>
            <p>You and {match.name} liked each other.</p>
            <button className="pink" onClick={() => dialog.current.close()}>
              Keep discovering
            </button>
            <button
              onClick={() => {
                V("Matches");
                dialog.current.close();
              }}
            >
              View matches
            </button>
          </div>
        </dialog>
      )}
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
