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
    inbox:'<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
    mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
    phone:'<path d="M6.6 10.8a11 11 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 8 8 0 0 0 2.5.4 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A16 16 0 0 1 3 6a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 8 8 0 0 0 .4 2.5 1 1 0 0 1-.25 1z"/>',
    history:'<path d="M3 3v5h5"/><path d="M3.05 13a9 9 0 1 0 2.13-6.36L3 8"/><path d="M12 7v5l3 2"/>',
    link:'<path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 1 1 0 10h-2"/><path d="M8 12h8"/>',
    lock:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    layout:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    folder:'<path d="M4 6a2 2 0 0 1 2-2h4l2 3h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>',
    upload:'<path d="M12 21V9"/><path d="m7 13 5-5 5 5"/><path d="M4 21h16"/>',
    download:'<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 21h16"/>',
    chat:'<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
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
    // Branch (learning module) headers — assets/js/branches.js. Keyed by
    // header id so a wording change to a header label can never silently
    // break the lookup, matching the taxonomy icon convention above.
    'fa-core-concepts-firm-setup':'settings','fa-complete-your-firm-setup':'check','fa-get-your-prospect-pipeline-running':'compass','fa-get-your-first-workflow-running':'flow','fa-get-ready-to-invite-clients':'idcard','fa-import-your-client-data':'download','fa-migrate-documents':'file','fa-quick-start-tutorials':'flag',
    'tm-core-concepts-account-setup':'layout','tm-find-your-way-around-assurepro':'target','tm-work-with-assigned-clients':'target','tm-manage-your-assigned-work':'users','tm-work-with-client-documents':'upload','tm-communicate-with-clients':'users','tm-record-and-review-time':'history','tm-plan-your-day':'percent','tm-manage-notifications':'inbox','tm-use-ai-responsibly':'lock','tm-quick-start-tutorials':'book',
    'pc-add-and-manage-prospects':'compass','pc-find-and-organize-prospects':'settings','pc-work-with-the-prospect-pipeline':'flow','pc-record-prospect-activity':'users','pc-convert-prospects-to-clients':'check','pc-add-clients':'idcard','pc-organize-client-records':'briefcase','pc-manage-contacts-and-relationships':'chart','pc-work-with-the-client-workspace':'plug','pc-invite-clients-to-the-portal':'grid','pc-guide-clients-through-portal-activiti':'flag',
    'dw-work-with-engagements':'compass','dw-manage-recurring-work':'history','dw-work-with-workflow-views':'flow','dw-progress-work-through-a-workflow':'settings','dw-work-with-tasks':'check','dw-monitor-workload-and-deadlines':'chart','dw-work-with-client-documents':'idcard','dw-organize-client-folders':'folder','dw-add-client-documents':'file','dw-request-documents-from-clients':'inbox','dw-work-with-engagement-letters':'signature','dw-create-an-engagement-letter':'users','dw-add-services-and-pricing':'percent','dw-configure-agreement-content':'briefcase','dw-review-and-send-the-package':'plug','dw-complete-the-signing-process':'book','dw-track-engagement-letter-status':'flag','dw-review-package-history':'grid','dw-work-with-client-communications':'chat','dw-start-client-conversations':'sparkle','dw-manage-active-conversations':'shield','dw-send-portal-messages':'mail','dw-send-email':'wrench','dw-send-sms':'phone','dw-record-calls':'receipt','dw-collaborate-with-firm-users':'edit','dw-follow-up-with-clients':'bell','dw-work-with-calendar':'calendar','dw-manage-deadlines':'link','dw-complete-client-work':'lock',
    'rf-track-time':'receipt','rf-manage-services-and-pricing':'percent','rf-manage-billing':'signature','rf-manage-teams-and-roles':'users','rf-standardize-firm-processes':'book','rf-use-overview':'grid','rf-review-reports':'chart','rf-set-up-your-firm':'settings','rf-configure-work-standards':'edit','rf-configure-firm-communications':'settings','rf-connect-your-tools':'plug','rf-manage-security-and-credentials':'shield','rf-manage-your-assureone-plan':'briefcase','rf-manage-referrals':'flag',
    'ai-get-started-with-ai':'compass','ai-work-with-the-ai-agent':'sparkle','ai-complete-work-with-the-ai-agent':'check','ai-manage-ai-memory':'book','ai-use-the-daily-briefing':'flag','ai-automate-follow-up':'bell','ai-manage-ai-credits':'percent','ai-use-ai-responsibly':'shield','ai-troubleshoot-ai-features':'wrench',
  };
  function topicIcon(id){return icon(TOPIC_ICONS[id]||'file')}
  function fallbackCopy(text){const t=document.createElement('textarea');t.value=text;t.setAttribute('readonly','');t.style.cssText='position:fixed;opacity:0';document.body.append(t);t.select();let ok=false;try{ok=document.execCommand('copy')}catch(e){}t.remove();return ok}
  function bindSupport(){qa('.support-copy').forEach(btn=>btn.addEventListener('click',async()=>{let ok=fallbackCopy(EMAIL);if(!ok&&navigator.clipboard){try{await navigator.clipboard.writeText(EMAIL);ok=true}catch(e){}}const label=q('.support-label',btn);btn.classList.toggle('copied',ok);if(label)label.textContent=ok?'Email copied':'Contact support';btn.setAttribute('aria-label',ok?`${EMAIL} copied`:`Copy ${EMAIL} to clipboard`);setTimeout(()=>{btn.classList.remove('copied');if(label)label.textContent='Contact support';btn.setAttribute('aria-label',`Copy ${EMAIL} to clipboard`)},3200)}))}
  function resultMarkup(a){return `<a class="search-result" href="${articleUrl(a.id)}"><strong>${esc(a.title)}</strong><small>AssurePro · ${esc(a.category)}</small></a>`}
  function bindSearch(){qa('[data-search]').forEach(input=>{const panel=input.parentElement.querySelector('.search-panel');if(!panel)return;const run=()=>{const term=input.value.trim().toLowerCase();if(term.length<2){panel.hidden=true;panel.innerHTML='';return}const words=term.split(/\s+/);const hits=proArticles().map((a,order)=>{const title=a.title.toLowerCase(),category=a.category.toLowerCase(),haystack=(a.title+' '+a.search+' '+a.category).toLowerCase();if(!words.every(w=>haystack.includes(w)))return null;let score=title.includes(term)?100:0;for(const w of words){if(title.includes(w))score+=12;else if(category.includes(w))score+=5;else score+=1}return{a,score,order}}).filter(Boolean).sort((x,y)=>y.score-x.score||x.order-y.order).slice(0,8).map(x=>x.a);panel.innerHTML=hits.map(resultMarkup).join('')||'<div class="search-empty">No matching AssurePro articles found.</div>';panel.hidden=false};input.addEventListener('input',run);input.addEventListener('focus',run);input.addEventListener('keydown',e=>{if(e.key==='Escape')panel.hidden=true;if(e.key==='Enter'){const first=q('a',panel);if(first)location.href=first.href}})});document.addEventListener('click',e=>{if(!e.target.closest('.top-search,.hero-search'))qa('.search-panel').forEach(p=>p.hidden=true)});document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();(q('.hero-search input')||q('.top-search input'))?.focus()}})}
  function bindComingSoon(){qa('[data-coming-soon]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();el.animate([{transform:'translateY(0)'},{transform:'translateY(-2px)'},{transform:'translateY(0)'}],{duration:280});el.setAttribute('title','Coming soon')}))}
  // The permanent feature-based nav: collections collapsed to their name,
  // expanding to their guides. The collection holding the current guide (or
  // the current collection page itself) auto-expands and highlights, so a
  // reader always sees where they are without hunting for a breadcrumb.
  function renderSidebarTree(container, activeGuideId, activeCollectionId, activeArticleId, contextQuery='') {
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
        const guideHref = T.guideUrl(g.id) + (contextQuery && g.id === activeGuideId ? `&${contextQuery}` : '');
        const articleItems = g.id === activeGuideId && activeArticleId
          ? proArticles().filter(a => T.guideOfArticle(a.id) === g.id).map(a => `<a class="nav-article${a.id === activeArticleId ? ' current' : ''}" href="${articleUrl(a.id)}${contextQuery ? `&${contextQuery}` : ''}"${a.id === activeArticleId ? ' aria-current="page"' : ''}>${esc(a.title)}</a>`).join('')
          : '';
        return `<div class="nav-guide${cls ? ' active' : ''}"><a href="${guideHref}" class="nav-guide-link ${cls}"><span class="nav-topic-group"><span class="nav-topic-icon">${topicIcon(g.id)}</span><span>${esc(g.label)}</span></span>${n ? `<small>${n}</small>` : '<small class="soon">Soon</small>'}</a>${articleItems ? `<div class="nav-articles">${articleItems}</div>` : ''}</div>`;
      }).join('');
      return `<div class="nav-collection${isOpen ? ' open' : ''}">
        <div class="nav-collection-toggle${c.id === (activeCollectionId || (activeCollection && activeCollection.id)) ? ' active' : ''}">
          <a href="${T.collectionUrl(c.id)}">${esc(c.label)}</a>
          <button type="button" class="nav-caret" aria-label="${isOpen ? 'Collapse' : 'Expand'} ${esc(c.label)}" aria-expanded="${isOpen ? 'true' : 'false'}">${icon('chevron')}</button>
        </div>
        <div class="nav-guides">${guidesHtml}</div>
      </div>`;
    }).join('');
    container.querySelectorAll('.nav-caret').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const row = btn.closest('.nav-collection');
        const wasOpen = row.classList.contains('open');
        container.querySelectorAll('.nav-collection.open').forEach((el) => { if (el !== row) { el.classList.remove('open'); const caret=el.querySelector('.nav-caret');caret?.setAttribute('aria-expanded','false');caret?.setAttribute('aria-label',`Expand ${el.querySelector('.nav-collection-toggle a')?.textContent||'topic'}`); } });
        row.classList.toggle('open', !wasOpen);
        btn.setAttribute('aria-expanded', String(!wasOpen));
        btn.setAttribute('aria-label',`${wasOpen ? 'Expand' : 'Collapse'} ${row.querySelector('.nav-collection-toggle a')?.textContent||'topic'}`);
      });
    });
  }
  function renderBranchTree(container, moduleId, activeHeaderId, activeArticleId, showAllTopics = true) {
    const B = window.AssureProBranches;
    if (!B || !container) return;
    const module = B.moduleById(moduleId);
    if (!module) return;
    const all = proArticles();
    container.innerHTML = `<a class="branch-module-link" href="${B.moduleUrl(module.id)}">${esc(module.label)}</a><div class="branch-headers">${module.headers.map(header => {
      const items = B.headerArticles(header.id, all);
      const active = header.id === activeHeaderId;
      const listId = `branch-${header.id}`;
      const children = items.map(article => `<a class="nav-article${article.id === activeArticleId ? ' current' : ''}" href="${articleUrl(article.id)}"${article.id === activeArticleId ? ' aria-current="page"' : ''}>${esc(article.title)}</a>`).join('');
      return `<div class="branch-header${active ? ' open active' : ''}${items.length ? '' : ' unavailable'}"><button class="branch-header-toggle" type="button" aria-expanded="${active ? 'true' : 'false'}" aria-controls="${listId}"${items.length ? '' : ' disabled'}><span class="nav-topic-group"><span class="nav-topic-icon">${topicIcon(header.id)}</span><span>${esc(header.label)}</span></span><small>${items.length || 'Soon'}</small><span class="branch-caret" aria-hidden="true">${icon('chevron')}</span></button>${items.length ? `<div class="nav-articles branch-article-drawer" id="${listId}">${children}</div>` : ''}</div>`;
    }).join('')}</div>${showAllTopics ? '<a class="branch-all-link" href="category.html">Browse all AssurePro topics</a>' : ''}`;
    container.querySelectorAll('.branch-header-toggle:not(:disabled)').forEach((button) => {
      button.addEventListener('click', () => {
        const row = button.closest('.branch-header');
        const opening = !row.classList.contains('open');
        container.querySelectorAll('.branch-header.open').forEach((other) => {
          if (other === row) return;
          other.classList.remove('open');
          other.querySelector('.branch-header-toggle')?.setAttribute('aria-expanded', 'false');
        });
        row.classList.toggle('open', opening);
        button.setAttribute('aria-expanded', String(opening));
      });
    });
  }
  function boot(){bindSupport();bindSearch();bindComingSoon()}
  window.HelpCenter={articles,proArticles,esc,slug,articleUrl,categoryUrl,categoryOfSlug,boot,bindComingSoon,PRODUCT_LABEL,icon,topicIcon,renderSidebarTree,renderBranchTree};
  document.addEventListener('DOMContentLoaded',boot);
})();
