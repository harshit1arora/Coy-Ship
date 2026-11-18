export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    const cookie = /(?:^|;\s*)coy_demo=([a-f0-9-]{36})(?:;|$)/.exec(request.headers.get("Cookie") || "");
    const visitor = cookie?.[1] || crypto.randomUUID();
    const headers = {"Cache-Control":"private, no-store","Vary":"Cookie"};
    if (!cookie) headers["Set-Cookie"] = "coy_demo="+visitor+"; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax";
    const json = (data,status=200) => Response.json(data,{status,headers});
    if (request.method === "GET" && (path === "/feed" || path === "/matches")) {
      const {results} = await env.DB.prepare("SELECT profile,mutual FROM swipes WHERE visitor=? ORDER BY rowid DESC").bind(visitor).all();
      const seen = new Set(results.map(r=>r.profile));
      return json(path === "/feed" ? profiles.filter(p=>!seen.has(p.id)) : results.filter(r=>r.mutual).map(r=>profiles.find(p=>p.id===r.profile)));
    }
    if (request.method === "POST" && path === "/swipe") {
      const {profileId,decision} = (await request.json().catch(()=>null)) || {};
      if(typeof profileId!=="string" || !["like","pass"].includes(decision)) return json({error:"Invalid swipe"},400);
      if(!profiles.some(p=>p.id===profileId)) return json({error:"Unknown profile"},404);
      const mutual = decision==="like" && incomingLikes.has(profileId);
      const result = await env.DB.prepare("INSERT INTO swipes VALUES (?,?,?,?) ON CONFLICT(visitor,profile) DO NOTHING").bind(visitor,profileId,decision,Number(mutual)).run();
      if(!result.meta.changes){
        const prior=await env.DB.prepare("SELECT decision FROM swipes WHERE visitor=? AND profile=?").bind(visitor,profileId).first();
        if(prior.decision!==decision) return json({error:"Already swiped"},409);
      }
      return json({createdMatch:Boolean(result.meta.changes && mutual)},result.meta.changes?201:200);
    }
    const asset = assets[path === "/" ? "/index.html" : path];
    if(request.method!=="GET" || !Array.isArray(asset)) return new Response("Not found",{status:404});
    return new Response(Uint8Array.from(atob(asset[1]), c=>c.charCodeAt(0)),{headers:{...(asset[0]==="text/html"?headers:{}),"Content-Type":asset[0]}});
  }
};
