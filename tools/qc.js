/** End-to-end static quality checks for the AssureOne Help Center. */
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'..');let failures=0;
const ok=m=>console.log('  ok  '+m),fail=m=>{failures++;console.error(' FAIL '+m)},read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
function section(s){console.log('\n'+s)}
function compileInline(file){const h=read(file);for(const [i,m] of [...h.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].entries()){try{new Function(m[1])}catch(e){fail(`${file}: inline script ${i+1} does not compile — ${e.message}`)}}}
// getElementById on an id the page markup no longer has is not a syntax error —
// it compiles fine and throws at runtime instead, silently killing every line
// of the handler after it. This happened once already: a leftover call to a
// removed #product-tiles container stopped the topic grid from ever rendering.
function checkDomRefs(file){const h=read(file);const ids=new Set([...h.matchAll(/\bid=["']([\w-]+)["']/g)].map(m=>m[1]));for(const m of h.matchAll(/getElementById\(['"]([\w-]+)['"]\)/g)){if(!ids.has(m[1]))fail(`${file}: getElementById('${m[1]}') has no matching id in the page — it will throw at runtime and abort the rest of the script`)}}
function loadArticles(){const ctx={window:{}};for(let i=1;i<=6;i++)vm.runInNewContext(read(`questions-${i}.js`),ctx,{filename:`questions-${i}.js`});return ctx.window.ASSUREONE_ARTICLES||[]}
const pages=['index.html','category.html','article.html'],articles=loadArticles(),ids=new Set(articles.map(a=>a.id));

section('1. Build and page structure');
for(const p of pages){if(!fs.existsSync(path.join(ROOT,p)))fail(`${p} is missing`);else{compileInline(p);checkDomRefs(p);const h=read(p);if(!h.includes('assets/css/help-center.css'))fail(`${p}: shared design system missing`);if(!h.includes('assets/js/help-center.js'))fail(`${p}: shared interactions missing`);if(!/support-copy/.test(h))fail(`${p}: Contact support copy control missing`);if(!/mailto:support@assureone\.ai/.test(h))fail(`${p}: support email fallback missing`);ok(`${p} uses the shared layout and support route`)}}
for(const p of ['assets/css/help-center.css','assets/js/help-center.js'])if(!fs.existsSync(path.join(ROOT,p)))fail(`${p} is missing`);else ok(`${p} present`);

section('2. AssurePro content integrity');
if(articles.length!==166)fail(`expected 166 published AssurePro articles, found ${articles.length}`);else ok('166 AssurePro articles loaded');
if(ids.size!==articles.length)fail('article ids are not unique');else ok('all article ids are unique');
for(const a of articles){if(a.product!=='pro')fail(`${a.id}: unpublished product content entered the shared index`);if(!a.title?.trim())fail(`${a.id}: title missing`);if(!a.answer?.trim())fail(`${a.id}: answer missing`);if(!a.category?.trim())fail(`${a.id}: category missing`);if(!a.search?.trim())fail(`${a.id}: search text missing`)}
ok('every article has a title, answer, category, search text, and published product');

section('3. Approved source synchronization');
const source=read('assurepro/index.html');
const grab=(re,name)=>{const m=source.match(re);if(!m){fail(`AssurePro source: ${name} is unreadable`);return null}return vm.runInNewContext('('+m[1]+')')};
const faqs=grab(/const FAQS=(\[[\s\S]*?\n\]);/,'FAQS')||[],details=grab(/const DETAILS=(\{[\s\S]*?\n\});/,'DETAILS')||{},map=grab(/const ARTICLE_IDS=(\{.*?\});/s,'ARTICLE_IDS')||{};
for(const f of faqs){const id=map[f.q],a=articles.find(x=>x.id===id);if(!id)fail(`no stable id for “${f.q}”`);else if(!a)fail(`${id}: no matching article`);else{if(a.title!==f.q)fail(`${id}: question differs from approved source`);if(a.answer!==f.a)fail(`${id}: answer differs from approved source`);if(JSON.stringify(a.steps||[])!==JSON.stringify(f.steps||[]))fail(`${id}: steps differ from approved source`);const want=Array.isArray(details[f.q])?details[f.q]:details[f.q]?[details[f.q]]:[];if(JSON.stringify(a.more||[])!==JSON.stringify(want))fail(`${id}: supporting explanation differs from approved source`)}}
if(faqs.length!==articles.length)fail(`approved source has ${faqs.length} questions but index has ${articles.length}`);else ok('questions, answers, supporting explanations, and steps match the approved source');

section('4. Language and product boundaries');
const body=articles.map(a=>[a.title,a.answer,...(a.steps||[]),...(a.more||[]).map(x=>typeof x==='string'?x:JSON.stringify(x))].join(' ')).join('\n');
for(const phrase of ['same destination form','destination window','start common work','AssureOne is the firm\'s internal'])if(body.toLowerCase().includes(phrase.toLowerCase()))fail(`unclear or incorrect wording remains: “${phrase}”`);
if(!body.includes('Firm users')&&!body.includes('firm users'))fail('firm-user terminology is missing');else ok('firm-user and client-user wording remains explicit');
const hub=read('index.html');for(const product of ['AssureTax','AssureAudit','AssureBooks']){const re=new RegExp(`<button[^>]+data-coming-soon[^>]*>[\\s\\S]{0,400}?${product}[\\s\\S]{0,200}?</button>`);if(!re.test(hub))fail(`${product} must remain a non-navigating Coming soon control on the approved homepage`)}
if(!hub.includes('<h2 id="journey-heading">Get to know AssurePro</h2>'))fail('approved homepage heading changed');else ok('approved homepage product controls and heading remain intact');

section('5. Search, navigation, and media readiness');
const app=read('assets/js/help-center.js'),articlePage=read('article.html'),categoryPage=read('category.html');
if(!app.includes("e.key==='Enter'"))fail('search does not open the first result with Enter');else ok('search supports keyboard selection');
if(!articlePage.includes('B.articleHome(article.id)')||!articlePage.includes('renderBranchTree'))fail('article breadcrumb/sidebar is not connected to the six-branch learning structure');else ok('article breadcrumbs and branch navigation are connected');
if(!articlePage.includes('media?.steps')||!articlePage.includes('media?.overview'))fail('article template is not ready for screenshots and overview media');else ok('article schema supports overview and step-specific media');
if(!articlePage.includes("block.type==='list'")||!articlePage.includes("block.type==='steps'"))fail('reviewed bullets and numbered procedures are not rendered');else ok('reviewed bullets and numbered procedures are preserved');
if(articlePage.includes('back-link')||!articlePage.includes('renderBranchTree(document.getElementById(\'category-nav\'),module.id,header.id,article.id,false)'))fail('article pages still expose redundant back or browse navigation');else ok('article pages use one clear breadcrumb and module-tree journey');
if(/Article tools|save-pdf|Save as PDF/i.test(articlePage)||/\.save-pdf|\.article-save/.test(read('assets/css/help-center.css')))fail('Article Tools remains in the shared article experience');else ok('Article Tools is removed from every article');
if(/article-tools-card|article-toc|On this page|quick-answer|Quick answer|copy-link|Copy article link/i.test(articlePage))fail('removed article chrome remains in the shared article template');else ok('On this page, Quick answer cards, and article Copy link are removed everywhere');
if(!app.includes('branch-header-toggle')||!app.includes("row.classList.toggle('open', opening)"))fail('branch headers do not expand and collapse their article lists');else ok('branch headers expand and collapse their article lists');
if(!app.includes('bindComingSoon,PRODUCT_LABEL'))fail('dynamically rendered Coming soon controls are not bound');else ok('dynamic Coming soon controls are bound');
if(/<button[^>]*>[\s\S]{0,300}<a\s/i.test(app))fail('sidebar markup nests a link inside a button');else ok('sidebar controls avoid invalid nested interactions');
if((hub.match(/class="support-copy"/g)||[]).length!==1)fail('homepage has a redundant support card or control');else ok('homepage has one always-available support control');

section('6. Local asset links');
for(const p of pages){const h=read(p),dir=path.dirname(path.join(ROOT,p));for(const m of h.matchAll(/(?:href|src)="([^"?#]+\.(?:html|css|js))[^" ]*"/g)){if(/^https?:/.test(m[1]))continue;const target=path.resolve(dir,m[1]);if(!fs.existsSync(target))fail(`${p}: missing local asset ${m[1]}`)}}

section('7. Icons and related articles');
const css=read('assets/css/help-center.css'),homepage=read('index.html');
if(!app.includes('function icon(')||!app.includes('const ICONS='))fail('shared icon set is missing from help-center.js');
else ok('shared icon set is available to every page');
if(!homepage.includes('H.icon('))fail('homepage goal cards render a number or bare text instead of an icon');
else ok('goal cards render an icon, not just a number');
// An inline <svg> with no CSS-constrained size renders at its intrinsic
// ~300x150 default and blows up the card around it — this happened once
// already while building the icon set, so it is checked for directly.
for(const sel of ['.journey-icon svg']){const re=new RegExp(sel.replace(/[.]/g,'\\.')+'\\{[^}]*width:\\d+px[^}]*height:\\d+px');if(!re.test(css))fail(`${sel}: no explicit pixel size — an icon here would render oversized`)}
ok('card icons have an explicit pixel size, so they cannot render oversized');
if(!articlePage.includes('related-list')||!articlePage.includes('Related articles'))fail('article template no longer offers related articles');
else if(!articlePage.includes('exclude.has(a.id)'))fail('related articles are not filtered against the current and paged articles');
else ok('every article suggests related articles instead of dead-ending');

section('8. Learning branches and canonical article homes');
function loadTaxonomy(){const ctx={window:{}};vm.runInNewContext(read('assets/js/taxonomy.js'),ctx,{filename:'assets/js/taxonomy.js'});return ctx.window.HelpCenterTaxonomy}
const T=loadTaxonomy();
function loadBranches(){const ctx={window:{HelpCenterTaxonomy:T}};vm.runInNewContext(read('assets/js/branches.js'),ctx,{filename:'assets/js/branches.js'});return ctx.window.AssureProBranches}
function loadReviewed(){const ctx={window:{}};vm.runInNewContext(read('assets/js/reviewed-content.js'),ctx,{filename:'assets/js/reviewed-content.js'});return ctx.window.ASSUREPRO_REVIEWED_CONTENT}
const B=loadBranches(),reviewed=loadReviewed();
const taxonomyPages=['category.html','article.html'];
for(const p of taxonomyPages)if(!read(p).includes('assets/js/taxonomy.js'))fail(`${p}: taxonomy.js is not loaded, so guide and collection navigation will not work`);
if(!T)fail('assets/js/taxonomy.js did not export window.HelpCenterTaxonomy');
else{
  ok('taxonomy.js is loaded on every page that renders guide/collection navigation and exports HelpCenterTaxonomy');
  const guideIds=new Set(),labels=[];
  for(const c of T.TAXONOMY){labels.push(c.label);for(const g of c.guides){if(guideIds.has(g.id))fail(`guide id '${g.id}' is used by more than one guide`);guideIds.add(g.id);labels.push(g.label)}}
  const numbering=/\b\d+(\.\d+){1,}\b/;
  const numbered=labels.filter(l=>numbering.test(l));
  if(numbered.length)fail(`internal numbering is exposed in a reader-facing label: ${numbered.join(', ')}`);
  else ok('no collection or guide label exposes internal numbering to the reader');
  const orphanArticles=articles.filter(a=>!T.guideOfArticle(a.id));
  if(orphanArticles.length)fail(`${orphanArticles.length} article(s) are not mapped to any guide: ${orphanArticles.slice(0,5).map(a=>a.id).join(', ')}${orphanArticles.length>5?', …':''}`);
  else ok('every published article is mapped to a guide in the taxonomy');
  const danglingGuideRefs=Object.entries(T.ARTICLE_GUIDE).filter(([,gid])=>!guideIds.has(gid));
  if(danglingGuideRefs.length)fail(`ARTICLE_GUIDE points at a guide id that does not exist: ${danglingGuideRefs.slice(0,5).map(([,gid])=>gid).join(', ')}`);
  else ok('every guide id referenced by ARTICLE_GUIDE exists in TAXONOMY');
  const danglingArticleRefs=Object.keys(T.ARTICLE_GUIDE).filter(id=>!ids.has(id));
  if(danglingArticleRefs.length)fail(`ARTICLE_GUIDE maps an article id that no longer exists: ${danglingArticleRefs.slice(0,5).join(', ')}`);
  else ok('every article id referenced by ARTICLE_GUIDE is a real, published article');
  if(!B||B.MODULES.length!==6)fail(`expected exactly six homepage learning modules, found ${B?.MODULES?.length||0}`);else ok('exactly six learning modules are defined');
  const moduleIds=new Set(B?.MODULES.map(module=>module.id)||[]),headerIds=new Set((B?.MODULES||[]).flatMap(module=>module.headers.map(header=>header.id)));
  const homepageModuleIds=[...homepage.matchAll(/\['([\w-]+)','[\w-]+','/g)].map(match=>match[1]);
  const badHomepageModules=homepageModuleIds.filter(id=>!moduleIds.has(id));
  if(homepageModuleIds.length!==6||badHomepageModules.length)fail('approved homepage does not link its six cards to the six canonical modules');else ok('approved homepage cards connect to the six canonical branch modules');
  if(!categoryPage.includes("params.get('module')")||!categoryPage.includes("params.get('header')"))fail('category page does not support module and header routes');else ok('module and header routes are available');
  const unmapped=articles.filter(article=>!B.articleHome(article.id));
  if(unmapped.length)fail(`${unmapped.length} article(s) have no canonical learning-branch home: ${unmapped.slice(0,5).map(a=>a.id).join(', ')}`);else ok('all 166 articles have one canonical learning-branch home');
  const badHomes=articles.map(article=>B.articleHome(article.id)).filter(Boolean).filter(home=>!moduleIds.has(home.module.id)||!headerIds.has(home.header.id));
  if(badHomes.length)fail('one or more canonical article homes point outside the branch structure');else ok('all canonical homes resolve to a real module and header');
  if(Object.keys(reviewed||{}).length!==articles.length)fail(`reviewed Word content covers ${Object.keys(reviewed||{}).length}/${articles.length} articles`);else ok('reviewed Word content covers all 166 articles');
  const missingReviewed=articles.filter(article=>!reviewed?.[article.id]);
  if(missingReviewed.length)fail(`${missingReviewed.length} article(s) are missing their reviewed Word answer: ${missingReviewed.slice(0,5).map(a=>a.id).join(', ')}`);else ok('each article id resolves to its reviewed Word answer');
  const unstructured=Object.entries(reviewed||{}).filter(([,entry])=>!Array.isArray(entry.blocks));
  if(unstructured.length)fail(`${unstructured.length} reviewed answers do not contain structured blocks`);else ok('reviewed answer structure is available to the article template');
  const publishedReviewedText=JSON.stringify(reviewed||{});
  if(/\d+ questions? in this category/i.test(publishedReviewedText))fail('editorial category totals leaked into published answer content');else ok('editorial category totals are excluded from answers');
  // A header id missing from TOPIC_ICONS doesn't throw — topicIcon() just
  // falls back to the generic file icon, so every card on a module page can
  // go silently identical. This happened once already, after branches.js
  // introduced its own header ids alongside the older taxonomy guide ids.
  const iconMap=vm.runInNewContext('({'+(app.match(/const TOPIC_ICONS=\{([\s\S]*?)\n  \};/)?.[1]||'')+'})');
  const headerIconGaps=B.MODULES.flatMap(module=>module.headers.filter(header=>!iconMap[header.id]).map(header=>`${module.id}/${header.id}`));
  if(headerIconGaps.length)fail(`these branch headers have no icon mapping and silently render the generic file icon: ${headerIconGaps.slice(0,6).join(', ')}${headerIconGaps.length>6?', …':''}`);
  else ok('every branch header has its own icon mapping');
  const duplicateIconModules=B.MODULES.filter(module=>{const seen=new Set();for(const header of module.headers){const i=iconMap[header.id];if(!i)continue;if(seen.has(i))return true;seen.add(i)}return false});
  if(duplicateIconModules.length)fail(`these modules show the same icon on more than one header card: ${duplicateIconModules.map(m=>m.id).join(', ')}`);
  else ok('no module repeats an icon across its own header cards');
  // A section's numbered steps are commonly interrupted by a nested bullet list (e.g.
  // "Filter by product:" followed by the product options) — that list is supporting detail
  // for the step before it, not a new procedure. If article.html always starts a fresh <ol>
  // at 1, a reader sees "1, 2 … 1, 2 … 1" instead of one continuous 6-step walkthrough. This
  // affects 19 real articles (found via reviewed-content.js), so it is checked directly.
  if(!articlePage.includes('data-step="${stepNumber+itemIndex}"')||!articlePage.includes("listBlock(nested,'step-details')")||!css.includes('content:attr(data-step)'))fail('numbered steps interrupted by nested detail are not rendered as one continuous procedure');
  else ok('split procedures keep continuous numbering and nested supporting pointers');
  const multiStepSections=[];
  for(const [articleId,entry] of Object.entries(reviewed||{})){const blocks=entry.blocks||[];let stepsInSection=0;for(const block of blocks){if(block.type==='heading')stepsInSection=0;else if(block.type==='steps'){stepsInSection++;if(stepsInSection>1)multiStepSections.push(articleId)}}}
  if(!multiStepSections.length)fail('no reviewed article exercises the multi-block numbered-steps case, so the continuation fix above has no real coverage');
  else ok(`${new Set(multiStepSections).size} article(s) exercise a section with more than one numbered-steps block`);
  // .steps li .step-details and .detail-list.level-1 have equal CSS specificity, so whichever
  // rule is declared LAST in the stylesheet wins regardless of intent — a nested step's detail
  // list silently kept the standalone lavender-box look instead of blending into the step. This
  // happened once already (found in "Select the reporting period" and the AI Credits article),
  // so the higher-specificity selector is checked directly rather than trusting declaration order.
  if(!css.includes('.steps li .step-details'))fail('a nested step-details list is not styled with enough specificity to beat .detail-list.level-1, so it renders as a disconnected floating box instead of part of the step');
  else ok('nested step-details reliably overrides the standalone detail-list box styling');
  // A short paragraph that is just a bare "X > Y" navigation path, sitting between two other
  // paragraphs, reads as an orphaned fragment with no visual connection to the sentence
  // introducing it (e.g. "Administrators can manage pending invitations under:" / "Team & Roles
  // > Invitations" / "From there, they can..." as three disconnected lines). This happened
  // twice already from docx paragraphs that should have been merged into one sentence.
  const bareBreadcrumbs=[];
  for(const [articleId,entry] of Object.entries(reviewed||{})){const blocks=entry.blocks||[];for(const block of blocks){if(block.type==='paragraph'&&/^[\w &]+( > [\w &]+){1,3}$/.test(block.text.trim()))bareBreadcrumbs.push(articleId)}}
  if(bareBreadcrumbs.length)fail(`these articles have a bare navigation-path paragraph that reads as an orphaned fragment instead of part of a sentence: ${[...new Set(bareBreadcrumbs)].slice(0,5).join(', ')}`);
  else ok('no reviewed article has a bare navigation-path paragraph floating on its own');
}

if(!failures)console.log('\nPASS — Help Center QC completed with no failures.');else{console.error(`\n${failures} QC failure${failures===1?'':'s'}.`);process.exit(1)}
