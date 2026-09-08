(function(){
  const EMAIL='support@assureone.ai';
  const PRODUCT_LABEL={pro:'AssurePro'};
  const q=(s,root=document)=>root.querySelector(s);
  const qa=(s,root=document)=>[...root.querySelectorAll(s)];
  const articles=()=>window.ASSUREONE_ARTICLES||[];
  const proArticles=()=>articles().filter(a=>a.product==='pro');
  const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const slug=(s='')=>s.toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  const articleUrl=id=>`article.html?id=${encodeURIComponent(id)}`;
  const categoryUrl=category=>`category.html?topic=${encodeURIComponent(slug(category))}`;
  const categoryOfSlug=s=>[...new Set(proArticles().map(a=>a.category))].find(c=>slug(c)===s);

  function iconCopy(){return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M6.5 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1.5" stroke="currentColor" stroke-width="1.8"/></svg>'}
  // A small stroke-based icon set (matches the search/copy icon style: 24x24,
  // fill:none, currentColor) so cards read at a glance instead of relying on
  // a number or a title alone.
  const ICONS={
    compass:'<circle cx="12" cy="12" r="9"/><path d="m14.5 9.5-1.8 4.8-4.8 1.8 1.8-4.8z"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 13a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V19a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 17.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 13 1.65 1.65 0 0 0 3.09 12H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 7a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 2.6a1.65 1.65 0 0 0 1-1.51V1a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 2.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 7a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    briefcase:'<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    chart:'<path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="13" y="8" width="3" height="10"/><rect x="19" y="5" width="3" height="13"/>',
    plug:'<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M6 8h12a1 1 0 0 1 1 1v3a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V9a1 1 0 0 1 1-1z"/>',
    flag:'<path d="M4 22V4"/><path d="M4 4h13l-2 4 2 4H4"/>',
    grid:'<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
    file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    flow:'<circle cx="5" cy="6" r="2.5"/><circle cx="19" cy="18" r="2.5"/><circle cx="19" cy="6" r="2.5"/><path d="M7.5 6h9"/><path d="M19 8.5v7"/>',
    check:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8 12 3 3 5-6"/>',
    signature:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 15c1-1.5 2-1.5 2.5 0s1.5 1.5 2.5 0 2-1.5 3 0"/>',
    sparkle:'<path d="M12 3v4"/><path d="M12 17v4"/><path d="M3 12h4"/><path d="M17 12h4"/><path d="m5.6 5.6 2.8 2.8"/><path d="m15.6 15.6 2.8 2.8"/><path d="m18.4 5.6-2.8 2.8"/><path d="m8.4 15.6-2.8 2.8"/>',
    shield:'<path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/>',
    wrench:'<path d="M14.7 6.3a4 4 0 0 0-5.6 5.2L3 17.6V21h3.4l6.1-6.1a4 4 0 0 0 5.2-5.6l-2.7 2.7-2.6-.6-.6-2.6z"/>',
    percent:'<circle cx="6.5" cy="6.5" r="3.5"/><circle cx="17.5" cy="17.5" r="3.5"/><path d="M19 5 5 19"/>',
    book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    receipt:'<path d="M5 2h14v19l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21z"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h5"/>',
    edit:'<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/><path d="m15 5 4 4"/>',
    idcard:'<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="11" r="2.2"/><path d="M6 17c.5-2 2-3 3-3s2.5 1 3 3"/><path d="M14 9h5"/><path d="M14 13h5"/>',
    chevron:'<path d="m6 9 6 6 6-6"/>',
  };
  function icon(name){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]||ICONS.file}</svg>`}
  // Matched to AssurePro's own sidebar iconography where a topic has a direct
  // counterpart there (Overview, Clients, Documents, Workflow, Engagement
  // Letter, Billing, AI Agent, Team & Roles), so the same concept looks the
  // same in the product and in its help center. Shared so every page that
  // lists topics — the category browser, an article's sidebar — uses the
  // same icon for the same topic. Keyed by collection/guide id (not label)
  // so a wording change to a label can never silently break the lookup.
  const TOPIC_ICONS={
    'start-here':'flag','prospects-clients':'idcard','engagements-workflows-tasks':'flow','documents-client-requests':'file',
    'engagement-letters':'signature','client-communications':'users','time-services-billing':'receipt','overview-reports':'chart',
    'ai-automation':'sparkle','firm-setup-administration':'settings','connect-your-tools':'plug','security-data':'shield',
    'help-troubleshooting':'wrench','product-updates':'grid',
    'gs-intro':'flag','gs-account':'idcard','gs-navigate':'compass','gs-admin-checklist':'check','team-setup-checklist':'edit',
    'prospects':'users','prospect-pipeline':'flow','convert-prospects':'check','clients':'idcard','client-contacts':'edit','client-workspace':'briefcase','client-portal':'grid',
    'engagements':'briefcase','workflow':'flow','workflow-tasks':'check','tasks':'edit','sops':'book',
    'doc-workspace':'file','folders':'grid','document-types':'edit','work-types':'flag','upload-import':'plug','document-requests':'receipt',
    'el-getting-started':'flag','el-setup':'settings','el-services-pricing':'percent','el-agreement-terms':'file','el-review-send':'edit','el-signing':'signature','el-status-audit':'check',
    'comms-inbox':'users','email':'plug','portal-messages':'grid','sms':'flag','calls':'check','email-templates':'edit','email-log':'book','automated-reminders':'sparkle',
    'time-tracking':'edit','billing':'receipt','service-catalog':'briefcase','service-types-pricing':'percent','manage-services':'grid','service-sops':'book',
    'reports-overview':'chart','overview-by-role':'idcard','reports':'file','dashboards':'grid','key-reports':'flag','report-alerts':'check',
    'ai-agent':'sparkle','daily-briefing':'flag','ai-credits':'percent',
    'settings-overview':'settings','firm-profile':'briefcase','client-portal-settings':'grid','team-roles':'users','engagement-types':'signature','tags':'flag','onboarding-defaults':'edit','notifications-email':'plug','templates':'book','workload-capacity':'chart','platform-subscription':'percent','mycpeone-referrals':'compass',
    'integrations-getting-started':'flag','email-integrations':'plug','calendars-scheduling':'grid','document-storage':'file','payments-integration':'percent','quickbooks':'book','twilio':'compass','prodaff':'briefcase','tax-connector':'signature',
    'account-security':'shield','firm-user-access':'users','client-access':'idcard','credentials':'edit','data-security':'grid','compliance':'check','data-retention-export':'file',
    'account-issues':'idcard','portal-issues':'grid','communication-issues':'users','integration-issues':'plug','billing-issues':'receipt','get-support':'wrench',
    'release-notes':'grid',
  };
  function topicIcon(id){return icon(TOPIC_ICONS[id]||'file')}
  function fallbackCopy(text){const t=document.createElement('textarea');t.value=text;t.setAttribute('readonly','');t.style.cssText='position:fixed;opacity:0';document.body.append(t);t.select();let ok=false;try{ok=document.execCommand('copy')}catch(e){}t.remove();return ok}
  function bindSupport(){qa('.support-copy').forEach(btn=>btn.addEventListener('click',async()=>{let ok=fallbackCopy(EMAIL);if(!ok&&navigator.clipboard){try{await navigator.clipboard.writeText(EMAIL);ok=true}catch(e){}}const label=q('.support-label',btn);btn.classList.toggle('copied',ok);if(label)label.textContent=ok?'Email copied':'Contact support';btn.setAttribute('aria-label',ok?`${EMAIL} copied`:`Copy ${EMAIL} to clipboard`);setTimeout(()=>{btn.classList.remove('copied');if(label)label.textContent='Contact support';btn.setAttribute('aria-label',`Copy ${EMAIL} to clipboard`)},3200)}))}
  function bindCopyLink(){qa('.copy-link').forEach(btn=>btn.addEventListener('click',async()=>{let ok=fallbackCopy(location.href);if(!ok&&navigator.clipboard){try{await navigator.clipboard.writeText(location.href);ok=true}catch(e){}}const text=q('span',btn);if(text)text.textContent=ok?'Link copied':'Copy link';setTimeout(()=>{if(text)text.textContent='Copy link'},1600)}))}
  function resultMarkup(a){return `<a class="search-result" href="${articleUrl(a.id)}"><strong>${esc(a.title)}</strong><small>AssurePro · ${esc(a.category)}</small></a>`}
  function bindSearch(){qa('[data-search]').forEach(input=>{const panel=input.parentElement.querySelector('.search-panel');if(!panel)return;const run=()=>{const term=input.value.trim().toLowerCase();if(term.length<2){panel.hidden=true;panel.innerHTML='';return}const words=term.split(/\s+/);const hits=proArticles().map((a,order)=>{const title=a.title.toLowerCase(),category=a.category.toLowerCase(),haystack=(a.title+' '+a.search+' '+a.category).toLowerCase();if(!words.every(w=>haystack.includes(w)))return null;let score=title.includes(term)?100:0;for(const w of words){if(title.includes(w))score+=12;else if(category.includes(w))score+=5;else score+=1}return{a,score,order}}).filter(Boolean).sort((x,y)=>y.score-x.score||x.order-y.order).slice(0,8).map(x=>x.a);panel.innerHTML=hits.map(resultMarkup).join('')||'<div class="search-empty">No matching AssurePro articles found.</div>';panel.hidden=false};input.addEventListener('input',run);input.addEventListener('focus',run);input.addEventListener('keydown',e=>{if(e.key==='Escape')panel.hidden=true;if(e.key==='Enter'){const first=q('a',panel);if(first)location.href=first.href}})});document.addEventListener('click',e=>{if(!e.target.closest('.top-search,.hero-search'))qa('.search-panel').forEach(p=>p.hidden=true)});document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();(q('.hero-search input')||q('.top-search input'))?.focus()}})}
  function bindComingSoon(){qa('[data-coming-soon]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();el.animate([{transform:'translateY(0)'},{transform:'translateY(-2px)'},{transform:'translateY(0)'}],{duration:280});el.setAttribute('title','Coming soon')}))}
  // The permanent feature-based nav: collections collapsed to their name,
  // expanding to their guides. The collection holding the current guide (or
  // the current collection page itself) auto-expands and highlights, so a
  // reader always sees where they are without hunting for a breadcrumb.
  function renderSidebarTree(container, activeGuideId, activeCollectionId) {
    const T = window.HelpCenterTaxonomy;
    if (!T || !container) return;
    const counts = {};
    for (const a of proArticles()) { const g = T.guideOfArticle(a.id); if (g) counts[g] = (counts[g] || 0) + 1; }
    const activeCollection = activeGuideId ? T.collectionOfGuide(activeGuideId) : (activeCollectionId ? T.TAXONOMY.find((c) => c.id === activeCollectionId) : null);
    container.innerHTML = T.TAXONOMY.map((c) => {
      const isOpen = activeCollection && activeCollection.id === c.id;
      const guidesHtml = c.guides.map((g) => {
        const n = counts[g.id] || 0;
        const cls = g.id === activeGuideId ? 'active' : '';
        return `<a href="${T.guideUrl(g.id)}" class="${cls}"><span>${esc(g.label)}</span>${n ? '' : '<small class="soon">Soon</small>'}</a>`;
      }).join('');
      return `<div class="nav-collection${isOpen ? ' open' : ''}">
        <button type="button" class="nav-collection-toggle${c.id === (activeCollectionId || (activeCollection && activeCollection.id)) ? ' active' : ''}" aria-expanded="${isOpen ? 'true' : 'false'}">
          <a href="${T.collectionUrl(c.id)}">${esc(c.label)}</a>
          <span class="nav-caret">${icon('chevron')}</span>
        </button>
        <div class="nav-guides">${guidesHtml}</div>
      </div>`;
    }).join('');
    container.querySelectorAll('.nav-collection-toggle').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        if (e.target.closest('a')) return; // let the collection link navigate
        e.preventDefault();
        const row = btn.closest('.nav-collection');
        const wasOpen = row.classList.contains('open');
        container.querySelectorAll('.nav-collection.open').forEach((el) => { if (el !== row) el.classList.remove('open'); });
        row.classList.toggle('open', !wasOpen);
        btn.setAttribute('aria-expanded', String(!wasOpen));
      });
    });
  }
  function boot(){bindSupport();bindCopyLink();bindSearch();bindComingSoon()}
  window.HelpCenter={articles,proArticles,esc,slug,articleUrl,categoryUrl,categoryOfSlug,boot,PRODUCT_LABEL,iconCopy,icon,topicIcon,renderSidebarTree};
  document.addEventListener('DOMContentLoaded',boot);
})();
