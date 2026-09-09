/* AssurePro learning branches. Articles keep one canonical home and URL. */
(function () {
  const MODULES = [
    { id:'firm-admin', icon:'settings', label:'Get Started as a Firm Administrator', objective:'Configure the firm, team, client experience, and launch essentials.', headers:[
      ['fa-understand','Understand AssureOne and AssurePro','Understand the platform, its scope, and the people who use it.'],
      ['fa-firm','Set Up Your Firm','Establish the firm profile, branding, portal, and core preferences.'],
      ['fa-team','Set Up Your Team','Plan teams, roles, permissions, invitations, and access testing.'],
      ['fa-prospects','Set Up Your Prospect Process','Prepare the pipeline, stages, follow-up, and conversion process.'],
      ['fa-client-work','Set Up Client Work','Prepare engagement types, workflows, tasks, and recurring work.'],
      ['fa-client-experience','Prepare the Client Experience','Prepare onboarding, folders, requests, letters, and communication.'],
      ['fa-billing','Prepare Services and Billing','Configure services, pricing, invoices, payments, and client payment testing.'],
      ['fa-data','Bring Your Data into AssurePro','Plan and verify client, contact, and document migration.'],
      ['fa-launch','Test and Launch AssurePro','Validate the complete firm-user and client experience before rollout.'],
    ]},
    { id:'team-member', icon:'compass', label:'Get Started as a Team Member', objective:'Activate your account, find assigned work, and complete daily activities.', headers:[
      ['tm-activate','Activate Your Account','Accept your invitation, sign in, and secure your firm-user account.'],
      ['tm-find','Find Your Way Around','Use navigation, Global Search, and the + New menu confidently.'],
      ['tm-day','Plan Your Day','Use Overview, Daily Briefing, Calendar, deadlines, and notifications.'],
      ['tm-clients','Work with Assigned Clients','Open client records and review connected work, documents, and activity.'],
      ['tm-work','Complete Assigned Work','Work through engagement stages, tasks, notes, and supporting documents.'],
      ['tm-documents','Work with Documents','Find, upload, organize, request, and review client documents.'],
      ['tm-communicate','Communicate with Clients','Use portal messages, email, SMS, calls, and communication history.'],
      ['tm-time','Record Your Time','Use the timer or manual entry and review your Time Sheet.'],
      ['tm-help','Get Help','Search the Help Center, gather issue details, and contact support.'],
    ]},
    { id:'prospects-clients', icon:'idcard', label:'Work with Prospects and Clients', objective:'Manage the relationship from first prospect contact through ongoing client service.', headers:[
      ['pc-prospects','Work with Prospects','Add, assign, update, and track prospect information and activity.'],
      ['pc-pipeline','Manage the Prospect Pipeline','Move prospects through configurable stages and track follow-up.'],
      ['pc-convert','Convert Prospects into Clients','Convert won opportunities while preserving useful prospect information.'],
      ['pc-clients','Add and Organize Clients','Create clients, manage contacts, assignments, tags, and record status.'],
      ['pc-workspace','Work in the Client Workspace','Review the complete connected picture for a client.'],
      ['pc-portal-access','Manage Client Portal Access','Invite client users and manage their portal access.'],
      ['pc-portal-guide','Guide Clients Through Portal Activities','Help clients complete common portal activities successfully.'],
    ]},
    { id:'deliver-work', icon:'flow', label:'Deliver Client Work', objective:'Create, progress, communicate, and complete client engagements.', headers:[
      ['dw-engagements','Work with Engagements','Create, assign, update, complete, archive, and reopen engagements.'],
      ['dw-recurring','Manage Recurring Work','Configure and maintain work that repeats on a schedule.'],
      ['dw-workflows','Work with Workflows','Use boards, lists, stages, requirements, and progress views.'],
      ['dw-tasks','Work with Tasks','Create, assign, prioritize, link, complete, and reopen tasks.'],
      ['dw-workload','Manage Workload and Deadlines','Find overloaded, overdue, blocked, and unassigned work.'],
      ['dw-documents','Manage Client Documents','Organize, upload, import, move, and control client documents.'],
      ['dw-requests','Request Documents from Clients','Create, send, track, review, and complete document requests.'],
      ['dw-letters','Prepare Engagement Letters','Build, price, preview, and send engagement-letter packages.'],
      ['dw-signing','Manage Engagement Letter Signing','Track signing, follow up, and review package history.'],
      ['dw-communicate','Communicate During Client Work','Keep client and firm conversations connected to the work.'],
      ['dw-complete','Complete Client Work','Finish review, delivery, billing, closure, and the next recurring period.'],
    ]},
    { id:'run-firm', icon:'briefcase', label:'Run Your Firm', objective:'Manage time, billing, people, processes, reporting, integrations, and security.', headers:[
      ['rf-time','Track Time','Configure, record, review, and use firm time data.'],
      ['rf-services','Manage Services and Pricing','Build and maintain the firm’s service catalog and pricing.'],
      ['rf-billing','Manage Billing and Payments','Create invoices, collect payments, manage recurring billing, and monitor receivables.'],
      ['rf-team','Manage Your Team','Manage users, roles, permissions, workload, and access changes.'],
      ['rf-processes','Standardize Firm Processes','Use templates and SOPs to make work consistent.'],
      ['rf-reports','Use Overview and Reports','Review performance, create dashboards, configure alerts, and export information.'],
      ['rf-configure','Configure Your Firm','Maintain the firm profile, portal, engagement types, tags, and defaults.'],
      ['rf-communications','Configure Firm Communications','Configure notifications, templates, email logs, and phone numbers.'],
      ['rf-connect','Connect Your Tools','Connect and maintain email, calendars, storage, payments, accounting, and tax tools.'],
      ['rf-security','Manage Security and Credentials','Control account security, permissions, credentials, retention, and exports.'],
      ['rf-plan','Manage Your AssureOne Plan','Review subscriptions, purchases, capacity, and referrals.'],
    ]},
    { id:'ai-automation', icon:'sparkle', label:'Use AI and Automation', objective:'Use AI assistance, briefing, memory, reminders, and credits responsibly.', headers:[
      ['ai-start','Get Started with AI','Understand AI features, access, responsibilities, and rollout preparation.'],
      ['ai-agent','Work with the AI Agent','Ask questions, add context, summarize information, and prepare next steps.'],
      ['ai-actions','Complete Work with the AI Agent','Review, approve, revise, and audit supported AI actions.'],
      ['ai-memory','Manage AI Memory','Review, correct, disable, or clear saved AI memory.'],
      ['ai-briefing','Use the Daily Briefing','Review priorities and open briefing items for action.'],
      ['ai-reminders','Automate Follow-up','Configure and control reminders without excessive client follow-up.'],
      ['ai-credits','Manage AI Credits','Review usage, limits, allocations, purchases, and unexpected consumption.'],
      ['ai-responsible','Use AI Responsibly','Review output, protect confidential information, and report issues.'],
    ]},
  ].map(module => ({ ...module, headers: module.headers.map(([id,label,objective]) => ({ id,label,objective })) }));

  const GUIDE_HOME = {
    'gs-intro':'fa-understand','gs-admin-checklist':'fa-firm','gs-account':'tm-activate','gs-navigate':'tm-find','get-support':'tm-help',
    'prospects':'pc-prospects','prospect-pipeline':'pc-pipeline','convert-prospects':'pc-convert','clients':'pc-clients','client-contacts':'pc-clients','client-workspace':'pc-workspace','client-portal':'pc-portal-access',
    'engagements':'dw-engagements','workflow':'dw-workflows','workflow-tasks':'dw-tasks','tasks':'dw-tasks','workload-capacity':'dw-workload',
    'doc-workspace':'dw-documents','folders':'dw-documents','document-types':'dw-documents','work-types':'dw-documents','upload-import':'dw-documents','document-requests':'dw-requests',
    'el-getting-started':'dw-letters','el-setup':'dw-letters','el-services-pricing':'dw-letters','el-agreement-terms':'dw-letters','el-review-send':'dw-letters','el-signing':'dw-signing','el-status-audit':'dw-signing',
    'comms-inbox':'dw-communicate','portal-messages':'dw-communicate','sms':'dw-communicate',
    'time-tracking':'rf-time','billing':'rf-billing','service-catalog':'rf-services','service-types-pricing':'rf-services','manage-services':'rf-services','service-sops':'rf-services',
    'team-roles':'rf-team','sops':'rf-processes','templates':'rf-processes','reports-overview':'rf-reports','reports':'rf-reports','dashboards':'rf-reports','key-reports':'rf-reports','report-alerts':'rf-reports',
    'settings-overview':'rf-configure','firm-profile':'rf-configure','client-portal-settings':'rf-configure','engagement-types':'rf-configure','tags':'rf-configure','onboarding-defaults':'rf-configure',
    'notifications-email':'rf-communications','email-templates':'rf-communications','email-log':'rf-communications',
    'integrations-getting-started':'rf-connect','email-integrations':'rf-connect','calendars-scheduling':'rf-connect','document-storage':'rf-connect','payments-integration':'rf-connect','quickbooks':'rf-connect','twilio':'rf-connect','prodaff':'rf-connect','tax-connector':'rf-connect',
    'account-security':'rf-security','firm-user-access':'rf-security','client-access':'rf-security','credentials':'rf-security','data-security':'rf-security','compliance':'rf-security','data-retention-export':'rf-security',
    'platform-subscription':'rf-plan','mycpeone-referrals':'rf-plan',
    'ai-agent':'ai-agent','daily-briefing':'ai-briefing','ai-credits':'ai-credits','automated-reminders':'ai-reminders',
  };

  const ARTICLE_HOME = {
    'pro-can-an-engagement-repeat-72':'dw-recurring',
    'pro-what-does-auto-approve-low-risk-actions-do-150':'ai-actions',
    'pro-can-an-ai-agent-action-be-undone-and-is-there-an-audit-trail-of-what-i-159':'ai-actions',
    'pro-what-is-ai-agent-memory-and-how-can-i-control-it-149':'ai-memory',
    'pro-can-we-control-what-data-the-ai-agent-retains-158':'ai-memory',
    'pro-how-do-i-configure-a-firm-phone-number-for-sms-127':'rf-communications',
    'pro-what-phone-number-does-a-client-see-when-the-firm-sends-an-sms-128':'rf-communications',
  };

  const RECOMMENDED_GUIDES = {
    'fa-firm':['settings-overview','firm-profile','client-portal-settings'],
    'fa-team':['team-roles'], 'fa-prospects':['prospects','prospect-pipeline','convert-prospects'],
    'fa-client-work':['engagement-types','workflow','workflow-tasks','tasks'],
    'fa-client-experience':['client-portal-settings','onboarding-defaults','folders','document-requests','templates','comms-inbox'],
    'fa-billing':['service-catalog','service-types-pricing','billing','payments-integration'],
    'fa-data':['clients','upload-import'],
    'tm-day':['reports-overview','daily-briefing','notifications-email'], 'tm-clients':['client-workspace'],
    'tm-work':['engagements','workflow','tasks'], 'tm-documents':['doc-workspace','upload-import','document-requests'],
    'tm-communicate':['comms-inbox','portal-messages','sms'], 'tm-time':['time-tracking'],
    'pc-portal-guide':['client-portal','document-requests','el-signing','portal-messages','billing'],
    'ai-start':['ai-agent','daily-briefing','ai-credits'], 'ai-responsible':['ai-agent','ai-credits'],
  };

  function moduleById(id) { return MODULES.find(module => module.id === id) || null; }
  function headerById(id) { for (const module of MODULES) { const header = module.headers.find(item => item.id === id); if (header) return { module, header }; } return null; }
  function articleHome(articleId) {
    const T = window.HelpCenterTaxonomy;
    const headerId = ARTICLE_HOME[articleId] || GUIDE_HOME[T?.guideOfArticle(articleId)];
    return headerById(headerId);
  }
  function canonicalArticles(headerId, articles) { return articles.filter(article => articleHome(article.id)?.header.id === headerId); }
  function headerArticles(headerId, articles) {
    const canonical = canonicalArticles(headerId, articles);
    const guideIds = RECOMMENDED_GUIDES[headerId] || [];
    const recommended = articles.filter(article => guideIds.includes(window.HelpCenterTaxonomy?.guideOfArticle(article.id)) && !canonical.includes(article));
    return canonical.concat(recommended);
  }
  function moduleUrl(id) { return `category.html?module=${encodeURIComponent(id)}`; }
  function headerUrl(id) { return `category.html?header=${encodeURIComponent(id)}`; }
  window.AssureProBranches = { MODULES, moduleById, headerById, articleHome, canonicalArticles, headerArticles, moduleUrl, headerUrl };
})();
