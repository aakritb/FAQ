/**
 * Show clean URLs on the web without breaking the local copy.
 *
 * The pages link to each other as "index.html", "../index.html" and
 * "../article.html?id=…" so that the downloadable copy works when opened
 * straight from disk, where those files are what actually exist. On the web
 * that put ".../index.html" in the address bar and made every internal click
 * take a redirect hop.
 *
 * vercel.json turns on cleanUrls, which handles anyone arriving at a .html
 * address. This adds a small script that rewrites internal links in the page
 * itself, so the address bar is clean from the first click and there is no
 * redirect. It does nothing when the protocol is file:, where the .html paths
 * are the real ones.
 *
 * Idempotent.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PAGES = ["index.html", "article.html", "assurepro/index.html",
  "assureaudit/index.html", "assurebooks/index.html", "assuretax/index.html"];

const OPEN = "<!-- clean-links:start -->";
const CLOSE = "<!-- clean-links:end -->";

const SCRIPT = `${OPEN}<script>
(function(){
  // Opened from disk, the .html files are what exist, so leave links alone.
  if(location.protocol==='file:') return;

  function clean(href){
    var u;
    try{u=new URL(href,location.href);}catch(e){return href;}
    if(u.origin!==location.origin) return href;
    var p=u.pathname.replace(/\\/index\\.html$/,'/').replace(/\\.html$/,'');
    if(p!=='/') p=p.replace(/\\/$/,'');
    return p+u.search+u.hash;
  }

  function fix(root){
    if(!root||!root.querySelectorAll) return;
    var links=root.querySelectorAll?root.querySelectorAll('a[href]'):[];
    for(var i=0;i<links.length;i++){
      var a=links[i], h=a.getAttribute('href');
      if(!h||/^(?:[a-z][a-z0-9+.-]*:|\\/\\/|#)/i.test(h)) continue;
      var c=clean(h);
      if(c!==h) a.setAttribute('href',c);
    }
    if(root.matches&&root.matches('a[href]')) fix({querySelectorAll:function(){return [root];}});
  }

  function fixAll(){fix(document);}

  function enable(){
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fixAll);
    else fixAll();
    watch();
  }

  // Only rewrite if this host actually serves the clean paths. A plain static
  // server may not, and rewritten links would 404. If the page we are on is
  // already at a clean address the host clearly does; otherwise ask it.
  var here=location.pathname+location.search+location.hash;
  if(clean(here)===here){
    enable();
  }else if(window.fetch){
    fetch(clean(location.pathname),{method:'HEAD'}).then(function(r){
      if(r&&r.ok) enable();
    },function(){});
  }

  // The hub rebuilds its article list as the reader searches and filters, and
  // sets some hrefs from script, so watch for both.
  function watch(){
  if(window.MutationObserver){
    new MutationObserver(function(records){
      for(var i=0;i<records.length;i++){
        var r=records[i];
        if(r.type==='attributes'){
          var t=r.target, h=t.getAttribute&&t.getAttribute('href');
          if(h&&!/^(?:[a-z][a-z0-9+.-]*:|\\/\\/|#)/i.test(h)){
            var c=clean(h);
            // Rewriting to the same value would not fire again, so this ends.
            if(c!==h) t.setAttribute('href',c);
          }
        }else{
          for(var j=0;j<r.addedNodes.length;j++) fix(r.addedNodes[j]);
        }
      }
    }).observe(document.documentElement,
      {childList:true,subtree:true,attributes:true,attributeFilter:['href']});
  }
  }
})();
</script>${CLOSE}`;

let changed = 0;
for (const page of PAGES) {
  const file = path.join(ROOT, page);
  let html = fs.readFileSync(file, "utf8");
  const before = html;

  // strip any previous copy so edits here always propagate
  html = html.replace(new RegExp("\\n*" + OPEN + "[\\s\\S]*?" + CLOSE, "g"), "");
  html = html.replace(/\n*<\/body>/, "\n</body>");

  if (html.split("</body>").length !== 2) throw new Error(`${page}: body anchor`);
  html = html.replace("</body>", SCRIPT + "\n</body>");

  if (html !== before) { fs.writeFileSync(file, html); changed++; console.log(`  ok  ${page}`); }
  else console.log(`  --  ${page}: unchanged`);
}

/* ------------------------------------------------------------- checks */
const problems = [];
for (const page of PAGES) {
  const html = fs.readFileSync(path.join(ROOT, page), "utf8");
  const copies = (html.match(new RegExp(OPEN, "g")) || []).length;
  if (copies !== 1) problems.push(`${page}: ${copies} copies of the script, expected 1`);
  if (!html.includes("location.protocol==='file:'")) problems.push(`${page}: missing the file: guard`);
  if (!html.includes("method:'HEAD'")) problems.push(`${page}: missing the clean-URL support probe`);
  // an absolute /index.html href would break the local copy
  if (/href="\/[^"]*\.html"/.test(html)) problems.push(`${page}: absolute .html href would break the local copy`);
}
if (problems.length) throw new Error("checks failed:\n  " + problems.join("\n  "));
console.log(`  ok  ${PAGES.length} pages carry one copy, guarded for file://`);
