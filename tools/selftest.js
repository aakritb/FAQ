/** Prove the current QC catches regressions without touching the working site. */
const fs=require('fs'),os=require('os'),path=require('path'),{execFileSync}=require('child_process');
const ROOT=path.resolve(__dirname,'..');
const files=['index.html','category.html','article.html','assets/css/help-center.css','assets/js/help-center.js','assets/js/taxonomy.js','assets/js/branches.js','assets/js/reviewed-content.js','tools/qc.js','assurepro/index.html',...Array.from({length:6},(_,i)=>`questions-${i+1}.js`)];
const cases=[
 ['removed shared stylesheet','index.html',s=>s.replace('assets/css/help-center.css','missing.css'),'shared design system missing'],
 ['approved homepage heading changed','index.html',s=>s.replace('Get to know AssurePro','Learning modules'),'approved homepage heading changed'],
 ['vague destination wording','questions-1.js',s=>s.replace('Use the global search in AssurePro','Use the destination window in AssurePro'),'unclear or incorrect wording'],
 ['missing screenshot support','article.html',s=>s.replace('media?.steps','media.steps'),'article template is not ready'],
 ['duplicate support control','index.html',s=>s.replace('</main>','<button class="support-copy">Duplicate</button></main>'),'redundant support'],
 ['icon left without a pixel size','assets/css/help-center.css',s=>s.replace('.journey-icon svg{width:24px;height:24px;overflow:visible}',''),'render oversized'],
 ['related articles no longer filtered','article.html',s=>s.split('exclude.has(a.id)').join('false'),'not filtered against'],
 ['dangling getElementById after markup removed','index.html',s=>s.replace('<div class="journey-grid" id="journey-grid">','<div class="journey-grid" id="journey-grid-renamed">'),'no matching id in the page'],
 ['taxonomy not loaded on a page','category.html',s=>s.replace('src="assets/js/taxonomy.js">',''),'taxonomy.js is not loaded'],
 ['article no longer mapped to a guide','assets/js/taxonomy.js',s=>s.replace('"pro-what-is-assurepro-1": \'gs-intro\',',''),'not mapped to any guide'],
 ['internal numbering leaks into a reader-facing label','assets/js/taxonomy.js',s=>s.replace("label: 'Start Here', guides:","label: '1.1 Start Here', guides:"),'internal numbering is exposed'],
 ['homepage card loses its canonical module','index.html',s=>s.replace("['firm-admin','settings',","['nonexistent-module','settings',"),'does not link its six cards'],
 ['an article loses its canonical branch home','assets/js/branches.js',s=>s.replace("'gs-intro':'fa-understand'","'gs-intro':'nonexistent-header'"),'no canonical learning-branch home'],
 ['reviewed Word content loses an answer','assets/js/reviewed-content.js',s=>s.replace('"pro-what-is-assurepro-1":','"deleted-review-answer":'),'missing their reviewed Word answer']
];
function make(){const d=fs.mkdtempSync(path.join(os.tmpdir(),'assureone-qc-'));for(const rel of files){const to=path.join(d,rel);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(path.join(ROOT,rel),to)}return d}
let failed=0;
for(const [name,file,change,expected] of cases){const d=make(),target=path.join(d,file);fs.writeFileSync(target,change(fs.readFileSync(target,'utf8')));let output='',caught=false;try{execFileSync(process.execPath,[path.join(d,'tools/qc.js')],{cwd:d,encoding:'utf8',stdio:['ignore','pipe','pipe']})}catch(e){output=(e.stdout||'')+(e.stderr||'');caught=output.includes(expected)}if(caught)console.log('  ok  '+name);else{failed++;console.error(' FAIL '+name+' was not detected\n'+output)}fs.rmSync(d,{recursive:true,force:true})}
if(failed)process.exit(1);console.log(`\nPASS — ${cases.length}/${cases.length} regression scenarios detected.`)
