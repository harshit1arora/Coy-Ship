import fs from "node:fs";
import path from "node:path";
import {profiles,incomingLikes} from "../seed.mjs";
const source = process.argv[2] || "client-build";
const assets={};
const types={".html":"text/html",".css":"text/css",".js":"text/javascript",".jpg":"image/jpeg"};
for(const file of fs.readdirSync(source,{recursive:true})){
  const name=path.join(source,file);
  if(fs.statSync(name).isFile()) assets["/"+file.replaceAll("\\","/")]=[types[path.extname(file)],fs.readFileSync(name).toString("base64")];
}
fs.mkdirSync("dist/server",{recursive:true});
fs.writeFileSync("dist/server/index.js","const profiles="+JSON.stringify(profiles)+";\nconst incomingLikes=new Set("+JSON.stringify([...incomingLikes])+");\nconst assets="+JSON.stringify(assets)+";\n"+fs.readFileSync("hosted/worker.mjs","utf8"));
fs.mkdirSync("dist/.openai",{recursive:true});
fs.copyFileSync(".openai/hosting.json","dist/.openai/hosting.json");
