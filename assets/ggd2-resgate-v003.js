/* DWELL RESGATE v0.3.0 | UI somente GET. OAuth appdata não é um escopo read-only. */
"use strict";
(() => {
 const CLIENT="929754651774-eddoa119kht0d6lfdnk7a9fkf85dv0bl.apps.googleusercontent.com";
 const EXPECTED="6872d99752288cf5cfce95177ffbaa0fb7bf81c77aa4b5a85bbe0f94b0e7900d";
 const SCOPE="https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.email";
 const API="https://www.googleapis.com/drive/v3/files";
 const FOLDER="application/vnd.google-apps.folder";
 const state={token:null,client:null,paths:[],files:[],tree:new Map(),busy:false,expiry:null,epoch:0,controller:new AbortController()};
 const $=id=>document.getElementById(id);
 const text=(id,t)=>{$(id).textContent=t;};
 const status=(t,error=false)=>{text("ggd-status",t);$("ggd-status").className="ggd-status "+(error?"is-error":state.token?"is-ok":"");};
 const digest=async data=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",data))).map(x=>x.toString(16).padStart(2,"0")).join("");
 function size(value){let n=Number(value);if(!Number.isFinite(n)||n<0)return "Tamanho não informado";const u=["B","KiB","MiB","GiB","TiB"];let i=0;while(n>=1024&&i<4){n/=1024;i++;}return n.toLocaleString("pt-BR",{maximumFractionDigits:i?2:0})+" "+u[i];}
 function controls(){const logged=Boolean(state.token);$("ggd-connect").disabled=logged||state.busy;$("ggd-exit").disabled=!logged;$("ggd-refresh").disabled=!logged||state.busy;$("ggd-search").disabled=!logged||state.busy;}
 function reset(reason){state.epoch++;state.controller.abort();state.controller=new AbortController();state.token=null;state.paths=[];state.files=[];state.tree.clear();$("ggd-tree").replaceChildren();state.busy=false;if(state.expiry)clearTimeout(state.expiry);state.expiry=null;$("ggd-files").replaceChildren();text("ggd-crumbs","GGD2");text("ggd-account","Não conectado");text("ggd-count","—");text("ggd-bytes","—");text("ggd-check","Nenhum arquivo conferido nesta sessão.");controls();status(reason);}
 function fail(err){if(err?.name==="AbortError")return;status(String(err?.message||err),true);}
 async function waitGIS(){for(let i=0;i<100;i++){if(window.google?.accounts?.oauth2)return;await new Promise(r=>setTimeout(r,120));}throw Error("A biblioteca de autenticação Google não carregou. Recarregue a página.");}
 async function response(url){if(!state.token)throw Error("Conecte sua conta Google.");const r=await fetch(url,{method:"GET",headers:{Authorization:"Bearer "+state.token},cache:"no-store",credentials:"omit",referrerPolicy:"no-referrer",signal:state.controller.signal});if(!r.ok){let detail="";try{detail=(await r.json()).error?.message||"";}catch{}if(r.status===401){reset("Sessão Google expirada. Conecte novamente.");throw Error("Sessão Google expirada.");}throw Error("Google Drive: HTTP "+r.status+(detail?" · "+detail:""));}return r;}
 async function get(url){return (await response(url)).json();}
 async function connect(){try{await waitGIS();if(!state.client)state.client=google.accounts.oauth2.initTokenClient({client_id:CLIENT,scope:SCOPE,include_granted_scopes:false,error_callback:e=>fail(Error(e.type==="popup_closed"?"Autenticação não concluída; a janela foi fechada.":"Não foi possível abrir a autenticação Google.")),callback:async r=>{try{if(r.error)throw Error(r.error_description||r.error);if(!google.accounts.oauth2.hasGrantedAllScopes(r,...SCOPE.split(" ")))throw Error("As duas permissões solicitadas são necessárias para o resgate.");state.token=r.access_token;state.controller=new AbortController();const epoch=++state.epoch;const u=await get("https://www.googleapis.com/oauth2/v3/userinfo");const hash=await digest(new TextEncoder().encode(String(u.email||"").trim().toLowerCase()));if(epoch!==state.epoch)return;if(hash!==EXPECTED||u.email_verified===false){reset("Conta incorreta. Selecione a conta Google da DWËLL.");return;}text("ggd-account",u.email);state.expiry=setTimeout(()=>reset("Sessão expirada. Reconecte para continuar."),Math.max(1,Number(r.expires_in)||3600)*1000);controls();state.paths=[];await openFolder("appDataFolder","GGD2");}catch(e){if(state.token)reset("Autenticação não concluída.");fail(e);}}});state.client.requestAccessToken({prompt:"select_account"});}catch(e){fail(e);}}
 async function list(id){let results=[],token="";do{const q="'"+id.replace(/'/g,"\\'")+"' in parents and trashed = false";const p=new URLSearchParams({spaces:"appDataFolder",q,pageSize:"1000",fields:"nextPageToken,files(id,name,mimeType,size,modifiedTime,md5Checksum,sha256Checksum)"});if(token)p.set("pageToken",token);const d=await get(API+"?"+p);results.push(...(d.files||[]));token=d.nextPageToken||"";}while(token);return results;}
 function crumbs(){const el=$("ggd-crumbs");el.replaceChildren();state.paths.forEach((p,i)=>{const b=document.createElement("button");b.className="ggd-crumb";b.textContent=p.name;b.onclick=()=>openFolder(p.id,p.name,i);b.disabled=state.busy;el.append(b);});}
 const TREE_ROOT = "appDataFolder";
 function ingest(id, name, rows) {
   let node = state.tree.get(id);
   if (!node) {
     node = {id, name, parent: null, expanded: true, children: null};
     state.tree.set(id, node);
   }
   node.name = name || node.name;
   const folders = rows.filter((item) => item.mimeType === FOLDER && typeof item.id === "string");
   node.children = folders.map((item) => item.id);
   for (const folder of folders) {
     const previous = state.tree.get(folder.id);
     if (previous) {
       previous.name = folder.name;
       previous.parent = id;
     } else {
       state.tree.set(folder.id, {
         id: folder.id, name: folder.name, parent: id, expanded: false, children: null
       });
     }
   }
   node.expanded = true;
 }
 function pathTo(id) {
   const chain = [], seen = new Set();
   let current = state.tree.get(id);
   while (current && !seen.has(current.id) && chain.length < 32) {
     seen.add(current.id);
     chain.unshift({id: current.id, name: current.name});
     current = current.parent ? state.tree.get(current.parent) : null;
   }
   return chain.length && chain[0].id === TREE_ROOT ? chain : null;
 }
 function renderTree() {
   const out = $("ggd-tree");
   out.replaceChildren();
   if (!state.token) {
     out.textContent = "Conecte sua conta para consultar a hierarquia.";
     return;
   }
   const visit = (id, depth, seen) => {
     if (depth > 20 || seen.has(id)) return;
     const node = state.tree.get(id);
     if (!node) return;
     const visited = new Set(seen);
     visited.add(id);
     const line = document.createElement("div");
     line.className = "ggd-tree-line";
     line.style.paddingInlineStart = String(Math.min(depth, 15) * 13) + "px";
     line.setAttribute("role", "treeitem");
     line.setAttribute("aria-level", String(depth + 1));
     line.setAttribute("aria-expanded", String(node.expanded));
     const toggle = document.createElement("button");
     toggle.type = "button";
     toggle.className = "ggd-tree-toggle";
     toggle.textContent = node.expanded ? "▾" : "▸";
     toggle.disabled = state.busy;
     toggle.setAttribute("aria-label", (node.expanded ? "Recolher " : "Expandir ") + node.name);
     toggle.onclick = () => void toggleTree(node.id);
     const open = document.createElement("button");
     open.type = "button";
     open.className = "ggd-tree-open";
     open.textContent = node.name;
     open.disabled = state.busy;
     if (state.paths.at(-1)?.id === id) open.setAttribute("aria-current", "true");
     open.onclick = () => void openFolder(id, node.name);
     line.append(toggle, open);
     out.append(line);
     if (node.expanded && Array.isArray(node.children)) {
       for (const child of node.children) visit(child, depth + 1, visited);
     }
   };
   visit(TREE_ROOT, 0, new Set());
 }
 async function toggleTree(id) {
   if (state.busy || !state.token) return;
   const node = state.tree.get(id);
   if (!node) return;
   if (node.expanded) {
     node.expanded = false;
     renderTree();
     return;
   }
   if (Array.isArray(node.children)) {
     node.expanded = true;
     renderTree();
     return;
   }
   state.busy = true;
   controls();
   const epoch = state.epoch;
   status("Consultando subpastas de " + node.name + "…");
   try {
     const rows = await list(id);
     if (epoch !== state.epoch) return;
     ingest(id, node.name, rows);
     status("Subpastas carregadas. Expanda outros níveis quando necessário.");
   } catch (error) {
     fail(error);
   } finally {
     if (epoch === state.epoch) {
       state.busy = false;
       controls();
       renderTree();
     }
   }
 }
 async function openFolder(id, name, index) {
   if (state.busy || !state.token) return;
   state.busy = true;
   controls();
   const epoch = state.epoch;
   status("Consultando " + name + " diretamente no Google Drive…");
   try {
     const rows = await list(id);
     if (epoch !== state.epoch) return;
     ingest(id, name, rows);
     const knownPath = pathTo(id);
     state.paths = knownPath || (index === undefined
       ? [...state.paths, {id, name}] : state.paths.slice(0, index + 1));
     state.files = rows;
     $("ggd-search").value = "";
     render();
     status("Consulta concluída. Pastas com conteúdo interno não são contadas como 0 B.");
   } catch (error) {
     fail(error);
   } finally {
     if (epoch === state.epoch) {
       state.busy = false;
       controls();
       crumbs();
       renderTree();
     }
   }
 }
 function render() {
   const out = $("ggd-files");
   out.replaceChildren();
   const search = $("ggd-search").value.toLocaleLowerCase("pt-BR");
   const rows = state.files.filter((f) => String(f.name).toLocaleLowerCase("pt-BR").includes(search))
     .sort((a, b) => Number(b.mimeType === FOLDER) - Number(a.mimeType === FOLDER) ||
       a.name.localeCompare(b.name, "pt-BR"));
   text("ggd-count", rows.length.toLocaleString("pt-BR"));
   // This number is for direct children only, never sum nested folders as zero.
   const directFiles = state.files.filter((f) => f.mimeType !== FOLDER);
   if (directFiles.length) {
     text("ggd-bytes", size(directFiles.reduce((sum, f) => sum + (Number(f.size) || 0), 0)));
   } else if (state.files.some((f) => f.mimeType === FOLDER)) {
     text("ggd-bytes", "Não calculado");
   } else {
     text("ggd-bytes", "0 B");
   }
   if (!rows.length) {
     const empty = document.createElement("p");
     empty.className = "ggd-empty";
     empty.textContent = search ? "Nenhum item corresponde ao filtro nesta pasta."
       : "Esta pasta não retornou arquivos ou subpastas.";
     out.append(empty);
     return;
   }
   for (const f of rows) {
     const folder = f.mimeType === FOLDER;
     const row = document.createElement("div");
     row.className = "ggd-file";
     const icon = document.createElement("span");
     icon.className = "ggd-file-icon";
     icon.textContent = folder ? "▣" : "▤";
     icon.setAttribute("aria-hidden", "true");
     const details = document.createElement("div");
     details.className = "ggd-file-text";
     const label = document.createElement("strong");
     label.textContent = f.name;
     const meta = document.createElement("small");
     meta.textContent = folder ? "Pasta · tamanho interno não calculado" :
       size(f.size) + (f.modifiedTime ? " · " + new Date(f.modifiedTime).toLocaleString("pt-BR") : "");
     details.append(label, meta);
     const actions = document.createElement("div");
     actions.className = "ggd-file-actions";
     const button = document.createElement("button");
     button.className = "ggd-button ggd-secondary";
     button.textContent = folder ? "Abrir" : "Baixar";
     button.onclick = () => folder ? openFolder(f.id, f.name) : download(f);
     actions.append(button);
     if (!folder && Number(f.size) <= 8388608 && f.size !== undefined) {
       const check = document.createElement("button");
       check.className = "ggd-button ggd-quiet";
       check.textContent = "Conferir leitura";
       check.onclick = () => checkSmall(f);
       actions.append(check);
     }
     row.append(icon, details, actions);
     out.append(row);
   }
 }
 async function checkSmall(f){if(state.busy||!state.token)return;state.busy=true;controls();const epoch=state.epoch;try{status("Conferindo leitura do arquivo selecionado…");const r=await response(API+"/"+encodeURIComponent(f.id)+"?alt=media");const bytes=await r.arrayBuffer();if(epoch!==state.epoch)return;if(bytes.byteLength!==Number(f.size))throw Error("Tamanho lido divergente. Não homologar este arquivo.");const sha=await digest(bytes);if(f.sha256Checksum&&f.sha256Checksum.toLowerCase()!==sha)throw Error("SHA-256 divergente do informado pelo Drive.");text("ggd-check",f.name+" · "+size(bytes.byteLength)+" · SHA-256 "+sha+" · "+(f.sha256Checksum?"hash conferido com o Google Drive.":"leitura e tamanho conferidos; hash calculado nesta sessão, sem hash remoto comparável."));status("Leitura real concluída sem gravar no SSD. Confira o registro abaixo.");}catch(e){fail(e);}finally{if(epoch===state.epoch){state.busy=false;controls();}}}
 async function download(f){if(state.busy||!state.token)return;const name=(f.name||"arquivo").replace(/[\\/\x00-\x1f]/g,"_");let handle;if(window.showSaveFilePicker){try{handle=await window.showSaveFilePicker({suggestedName:name});}catch(e){if(e.name!=="AbortError")fail(e);return;}}else if(Number(f.size)>104857600){fail(Error("Para arquivos acima de 100 MiB, utilize Chrome ou Edge atualizado com gravação em fluxo. Nenhum download foi iniciado."));return;}state.busy=true;controls();const epoch=state.epoch;let writer;try{status("Baixando "+name+"…");const r=await response(API+"/"+encodeURIComponent(f.id)+"?alt=media");let total=0;if(handle){writer=await handle.createWritable();const reader=r.body.getReader();while(true){const {done,value}=await reader.read();if(done)break;if(epoch!==state.epoch)throw new DOMException("Sessão encerrada","AbortError");await writer.write(value);total+=value.byteLength;if(total%16777216<value.byteLength)status("Recebidos "+size(total)+" / "+size(f.size)+" · "+name);}if(f.size!==undefined&&total!==Number(f.size))throw Error("Tamanho recebido divergente; arquivo não confirmado.");await writer.close();writer=null;}else{const blob=await r.blob();total=blob.size;if(epoch!==state.epoch)return;if(f.size!==undefined&&total!==Number(f.size))throw Error("Tamanho recebido divergente.");const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}if(epoch===state.epoch)status("Transferência concluída: "+name+" · tamanho conferido, "+size(total)+". Não equivale a teste funcional da aplicação.");}catch(e){if(writer)try{await writer.abort();}catch{}fail(e);}finally{if(epoch===state.epoch){state.busy=false;controls();}}}
 $("ggd-connect").onclick=connect;
 // Encerrar esta aba NÃO revoga o consentimento do projeto Google nem os tokens do backup.
 $("ggd-exit").onclick=()=>reset("Sessão encerrada neste navegador. A rotina de backup não foi interrompida.");
 $("ggd-refresh").onclick=()=>{const p=state.paths.at(-1);if(p)openFolder(p.id,p.name,state.paths.length-1);};
 $("ggd-search").oninput=render;
 const menu=$("ggd-menu-button");if(menu)menu.onclick=()=>{const expanded=menu.getAttribute("aria-expanded")==="true";menu.setAttribute("aria-expanded",String(!expanded));$("ggd-area-menu").hidden=expanded;};
 document.addEventListener("keydown",ev=>{if(ev.key==="Escape"&&menu){menu.setAttribute("aria-expanded","false");$("ggd-area-menu").hidden=true;}});
 window.addEventListener("pagehide",()=>{state.token=null;state.controller.abort();});controls();
})();
