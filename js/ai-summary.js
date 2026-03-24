const CORS_PROXIES = [
	'https://api.allorigins.win/raw?url=',
	'https://corsproxy.io/?url=',
	'https://api.codetabs.com/v1/proxy?quest=',
	'https://thingproxy.freeboard.io/fetch/',
];

const GDELT_URL = 'https://api.gdeltproject.org/api/v2/doc/doc?' +
	'query=israel%20OR%20iran%20OR%20gaza%20OR%20hezbollah%20OR%20lebanon%20OR%20hamas' +
	'&mode=artlist&maxrecords=75&format=json&timespan=24h&sort=hybridrel';

const RSS_FEEDS = [
	
	{ name: 'Al Akhbar',       url: 'https://al-akhbar.com/rss',                                                        flag: '🇱🇧' },
	{ name: 'Al Alam',         url: 'https://www.alalam.ir/rss',                                                        flag: '🇮🇷' },
	{ name: 'Al Arabiya',      url: 'https://www.alarabiya.net/tools/rss',              								flag: '🇸🇦' },
	{ name: 'Al Hadath',       url: 'https://www.alhadath.net/api/syndication/rss',                                     flag: '🇸🇦' },
	{ name: 'Al Hurra',        url: 'https://www.alhurra.com/api/zymcm-_yqg/rss',                   					flag: '🇺🇸' },
	{ name: 'Al Jazeera',      url: 'https://www.aljazeera.com/xml/rss/all.xml',        								flag: '🇶🇦' },
	{ name: 'Al Mayadeen',     url: 'https://english.almayadeen.net/rss.xml',                      					    flag: '🇱🇧' },
	{ name: 'Al Manar',        url: 'https://english.almanar.com.lb/feed',                           					flag: '🇱🇧' },
	{ name: 'AP News',         url: 'https://rss.ap.org/topics/world-news',                          					flag: '🇺🇸' },
	{ name: 'AP News',         url: 'https://rsshub.app/apnews/topics/world-news',                                      flag: '🇺🇸' },
	{ name: 'Al Quds',         url: 'https://www.alquds.com/feed/',                                                     flag: '🇵🇸' },
	{ name: 'Al Quds Arabi',   url: 'https://www.alquds.co.uk/feed/',     												flag: '🇵🇸' },
	{ name: 'BBC World',       url: 'https://feeds.bbci.co.uk/news/world/rss.xml',      								flag: '🇬🇧' },
	{ name: 'CBS News',        url: 'https://www.cbsnews.com/latest/rss/world',                      					flag: '🇺🇸' },
	{ name: 'CNN',             url: 'https://rss.cnn.com/rss/edition_world.rss',         								flag: '🇺🇸' },
	{ name: 'Der Spiegel',     url: 'https://www.spiegel.de/international/index.rss',                                   flag: '🇩🇪' },
	{ name: 'DW News',         url: 'https://rss.dw.com/rdf/rss-en-all',               									flag: '🇩🇪' },
	{ name: 'El País',         url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/english.elpais.com/portada',         flag: '🇪🇸' },
	{ name: 'Euronews',        url: 'https://feeds.feedburner.com/euronews/en/news/',   								flag: '🇪🇺' },
	{ name: 'Fox News',        url: 'https://moxie.foxnews.com/google-publisher/world.xml', 							flag: '🇺🇸' },
	{ name: 'France 24',       url: 'https://www.france24.com/en/rss',                  								flag: '🇫🇷' },
	{ name: 'Globes',          url: 'https://www.globes.co.il/webservice/rss/rssfeeder.asmx/FeederNode?iID=1725',       flag: '🇮🇱' },
	{ name: 'Haaretz',         url: 'https://www.haaretz.com/cmlink/1.628765',          								flag: '🇮🇱' },
	{ name: 'i24 News',        url: 'https://www.i24news.tv/en/rss',                    								flag: '🇮🇱' },
	{ name: 'Jerusalem Post',  url: 'https://www.jpost.com/rss/rssfeedsfrontpage.aspx', 								flag: '🇮🇱' },
	{ name: 'NBC News',        url: 'https://feeds.nbcnews.com/nbcnews/public/world',                					flag: '🇺🇸' },
	{ name: 'New York Times',  url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',        					flag: '🇺🇸' },
	{ name: 'Politico',        url: 'https://www.politico.com/rss/politicopicks.xml',                                   flag: '🇺🇸' },
	{ name: 'Press TV',        url: 'https://www.presstv.ir/rss',                       								flag: '🇮🇷' },
	{ name: 'Reuters',         url: 'https://feeds.reuters.com/reuters/topNews',        								flag: '🌍' },
	{ name: 'Tasnim News',     url: 'https://www.tasnimnews.com/en/rss',                             					flag: '🇮🇷' },
	{ name: 'The Marker',      url: 'https://www.themarker.com/srv/themarker-latest',                                   flag: '🇮🇱' },
	{ name: 'Times of Israel', url: 'https://www.timesofisrael.com/feed/',             									flag: '🇮🇱' },
	{ name: 'TRT World',       url: 'https://www.trtworld.com/rss',                                  					flag: '🇹🇷' },
	{ name: 'Wall St Journal', url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml',                                      flag: '🇺🇸' },
	{ name: 'Walla',           url: 'https://rss.walla.co.il/feed/22',                                                  flag: '🇮🇱' },
	{ name: 'Washington Post', url: 'https://feeds.washingtonpost.com/rss/world',                    					flag: '🇺🇸' },
	{ name: 'Ynet',            url: 'https://www.ynet.co.il/Integration/StoryRss2.xml',                                 flag: '🇮🇱' },
];

const SOURCE_FLAGS = {
	'Al Akhbar':	   'lb',
	'Al Alam':		   'ir',
	'Al Arabiya':      'sa',
	'Al Hadath':	   'sa',
	'Al Hurra':        'us',
	'Al Jazeera':      'qa',
	'Al Manar':        'lb',
	'Al Mayadeen':     'lb',
	'AP News':		   'us',
	'Al Quds':		   'ps',
	'Al Quds Arabi':   'ps',
	'BBC World':       'gb',
	'CBS News':        'us',
	'CNN':             'us',
	'Der Spiegel':     'de',
	'DW News':         'de',
	'El País':		   'es',
	'Euronews':        'eu',
	'Fox News':        'us',
	'France 24':       'fr',
	'Globes':		   'il',
	'Haaretz':         'il',
	'i24 News':        'il',
	'Jerusalem Post':  'il',
	'NBC News':        'us',
	'New York Times':  'us',
	'Politico':		   'us',
	'Press TV':        'ir',
	'Tasnim News':	   'ir',
	'The Marker':	   'il',
	'Times of Israel': 'il',
	'TRT World':	   'tr',
	'Reuters':         'gb',
	'Walla':		   'il',
	'Wall St Journal': 'us',
	'Washington Post': 'us',
	'Ynet':			   'il',
};

function getSourceFlag(sourceName) {
	const code = SOURCE_FLAGS[sourceName];
	if (code) return `<img src="https://flagcdn.com/16x12/${code}.png" style="width:16px;height:12px;border-radius:2px;vertical-align:middle;">`;
	return '🌐';
}

const STOPWORDS = new Set([
	'the','a','an','and','or','but','in','on','at','to','for','of','with','by',
	'from','is','are','was','were','be','been','has','have','had','will','would',
	'can','could','should','may','might','that','this','these','those','it','its',
	'as','up','about','after','before','over','under','into','out','not','no',
	'new','says','say','said','report','reports','amid','more','than','also',
	'what','when','how','who','which','their','they',
	'في','من','إلى','على','عن','مع','هذا','هذه','ذلك','التي','الذي','لا','ما','إن','أن','كان','كانت','قال','قالت',
	'של','את','על','עם','הוא','היא','הם','זה','זאת','כי','אבל','גם','לא','יש',
]);

// Ordered by priority — first match wins
const TOPIC_CATEGORIES = [
	{
		name: '⚔️ Military & Combat',
		keywords: [
			'attack','strike','airstrike','missile','rocket','drone','bomb','explosion',
			'troops','forces','military','army','navy','air force','idf','brigade',
			'war','battle','combat','offensive','operation','invasion','siege','frontline',
			'soldier','commander','general','admiral','fighter','jet','tank','artillery',
			'killed','wounded','casualties','fatalities','dead','destroyed',
			'hamas','hezbollah','jihad','qassam','izz ad-din',
			'captured','prisoner','raid','ambush','ceasefire','truce','hostage',
			'iron dome','air defense','interception','intercepted',
			'gunfire','shooting','sniper','mortar','rpg','explosive'
		]
	},
	{
		name: '🚨 Alerts & Incidents',
		keywords: [
			'alert','alarm','siren','red alert','code red','evacuation','shelter',
			'tzeva','tzofar','oref','pikud','warning','imminent',
			'emergency','incident','crisis','escalation','threat level'
		]
	},
	{
		name: '📡 Intelligence & Security',
		keywords: [
			'intelligence','mossad','cia','shin bet','shabak','mi6','spy','espionage',
			'classified','covert','operation','infiltration','surveillance',
			'cyber','hacking','hack','breach','leak','terror plot','cell','network',
			'arrest','detained','suspected','assassination','targeted'
		]
	},
	{
		name: '🤝 Diplomacy & Talks',
		keywords: [
			'ceasefire deal','peace deal','agreement','negotiations','talks','summit',
			'diplomat','diplomacy','mediation','mediator','proposal','framework',
			'hostage deal','prisoner exchange','release','blinken','sullivan',
			'secretary of state','foreign minister','envoy','delegation','visit',
			'united nations','un resolution','security council','veto',
			'normalization','abraham accords','two-state'
		]
	},
	{
		name: '⚖️ Politics & Law',
		keywords: [
			'election','vote','parliament','knesset','congress','senate',
			'court','law','legal','verdict','ruling','appeal','indictment',
			'corruption','coalition','opposition','party','cabinet','minister',
			'prime minister','president','government','policy','legislation',
			'protest','demonstration','rally','riot','revolution','coup',
			'netanyahu','biden','trump','harris','gantz','lapid','sinwar'
		]
	},
	{
		name: '💰 Economy & Finance',
		keywords: [
			'economy','financial','stock','market','shares','trading',
			'dollar','shekel','euro','currency','exchange rate',
			'inflation','gdp','budget','deficit','debt','surplus',
			'bank','interest rate','fed','central bank',
			'trade','sanction','embargo','export','import',
			'oil','gas','energy','commodity','wheat','grain',
			'investment','fund','billion','million','recession','growth',
			'nasdaq','dow jones','s&p','tel aviv stock exchange','tase'
		]
	},
	{
		name: '➕ Humanitarian',
		keywords: [
			'humanitarian','aid','relief','civilian','refugee','displaced',
			'hospital','medical','doctor','nurse','wounded','injured',
			'food','water','supply','shortage','famine','starvation',
			'children','women','orphan','shelter','camp','unrwa',
			'red cross','red crescent','unicef','who','msf','doctors without borders',
			'evacuation','corridor','safe passage','blockade aid'
		]
	},
	{
		name: '🌍 International',
		keywords: [
			'usa','united states','russia','china','europe','turkey',
			'egypt','jordan','saudi arabia','qatar','kuwait','uae',
			'france','germany','uk','britain','nato','g7','g20',
			'relations','bilateral','foreign policy','alliance','partnership'
		]
	},
	{
		name: '📰 General News',
		keywords: [] // catch-all, always matches last
	}
];

const SPONSORED_SIGNALS = [
	'sponsored','advertisement','advertorial','promoted','paid post',
	'paid content','partner content','brand studio','paid partnership',
	'presented by','brought to you by','in association with',
	'native ad','special advertising','commercial feature',
	'[ad]','[sponsored]','[promoted]'
];

function isSponsored(article) {
	const text = (article.title + ' ' + (article.url || '')).toLowerCase();
	return SPONSORED_SIGNALS.some(s => text.includes(s));
}

function categorizeStory(headline, articles) {
	const text = (headline + ' ' + articles.map(a => a.title).join(' ')).toLowerCase();
	for (const cat of TOPIC_CATEGORIES) {
		if (cat.keywords.length === 0) return cat.name; // catch-all
		if (cat.keywords.some(k => text.includes(k))) return cat.name;
	}
	return '📰 General News';
}

function openAiSum() {
	document.getElementById('aiSumOverlay').classList.add('active');
	document.body.style.overflow = 'hidden';
	document.documentElement.style.overflow = 'hidden';
	if (allArticles.length === 0) setTimeout(fetchAiSum, 200);
}

function closeAiSum() {
	document.getElementById('aiSumOverlay').classList.remove('active');
	if (!document.querySelector('.ai-sum-overlay.active')) {
		document.body.style.overflow = '';
		document.documentElement.style.overflow = '';
	}
}

async function fetchAiSum() {
	const btn      = document.getElementById('aiSumFetchBtn');
	fetchGeneration++;
	const myGeneration = fetchGeneration;
	const loading  = document.getElementById('aiSumLoading');
	const list     = document.getElementById('aiSumList');
	const empty    = document.getElementById('aiSumEmpty');
	const bar      = document.getElementById('aiSumSummaryBar');

	btn.disabled = true;
	document.getElementById('geminiEnhanceBtn').disabled = true;
	loading.classList.add('active');
	list.innerHTML = '';
	empty.classList.remove('active');
	bar.classList.remove('active');
	allArticles = [];
	setProgress('Connecting to GDELT...');

	try {
		const gdelt = await fetchGDELT();
		if (myGeneration !== fetchGeneration) return;
		allArticles.push(...gdelt);
		setProgress(`GDELT: ${gdelt.length} articles. Fetching RSS...`);
	} catch(e) {
		if (myGeneration !== fetchGeneration) return;
		setProgress('GDELT failed, continuing with RSS...');
	}

	const rssResults = await Promise.allSettled(RSS_FEEDS.map(f => fetchRSS(f)));
	if (myGeneration !== fetchGeneration) return;
	rssResults.forEach(r => { if (r.status === 'fulfilled') allArticles.push(...r.value); });

	// Deduplicate by URL
	const seen = new Set();
	allArticles = allArticles.filter(a => {
		if (!a.url || seen.has(a.url)) return false;
		seen.add(a.url); return true;
	});

	// Remove sponsored content
	allArticles = allArticles.filter(a => !isSponsored(a));

	// Relevance filter — keep war/security/politics/economics
	const RELEVANT_RX = /war|militar|army|troops|idf|hamas|hezbollah|houthi|iran|israel|gaza|lebanon|syria|strike|attack|missile|rocket|drone|bomb|ceasefire|hostage|prisoner|nuclear|weapon|terror|secur|defense|defence|intelligen|border|front|combat|soldier|navy|airforce|raid|intercept|iron dome|shield|tunnel|sniper|tank|artillery|siege|blockad|sanction|tariff|inflation|econom|trade|gdp|market|oil|energy|pipeline|dollar|debt|budget|tax|diplomat|summit|treaty|alliance|nato|biden|trump|putin|congress|parliament|knesset|minister|president|prime minister|govern|elect|vote|polic|law|court|un |united nations|refugee|humanitarian|aid|civilian|casualt|killed|death|wounded|evacuai|crisis|escalat|conflict|tension|negotiat|peace|deal|agreement/i;

	allArticles = allArticles.filter(a => RELEVANT_RX.test(a.title));



	setProgress(`${allArticles.length} articles. Grouping...`);
	groupedStories = groupArticles(allArticles);

	loading.classList.remove('active');
	btn.disabled = false;

	if (groupedStories.length === 0) {
		empty.classList.add('active');
		return;
	}

	renderStories(groupedStories.slice(0, 50));

	document.getElementById('statStories').textContent  = Math.min(groupedStories.length, 50);
	document.getElementById('statSources').textContent  = new Set(allArticles.map(a => a.sourceName)).size;
	document.getElementById('statArticles').textContent = allArticles.length;
	document.getElementById('statGeminiBadge').innerHTML = '';
	document.getElementById('statTime').textContent = new Date().toLocaleTimeString();
	bar.classList.add('active');

	const key = document.getElementById('geminiApiKey').value.trim();
	document.getElementById('geminiEnhanceBtn').disabled = key.length < 10;
}

async function fetchGDELT() {
	for (const proxy of CORS_PROXIES.map(p => p + encodeURIComponent(GDELT_URL))) {
		try {
			const res = await fetchWithTimeout(proxy, 8000);
			if (!res.ok) continue;
			const data = await res.json();
			if (!data.articles) return [];
			return data.articles.map(a => ({
				title: decodeEntities(a.title || ''),
				url: a.url,
				sourceName: a.domain || extractDomain(a.url),
				flag: '🌐',
			}));
		} catch(e) { continue; }
	}
	return [];
}

async function fetchRSS(feed) {
	for (const proxy of CORS_PROXIES) {
		try {
			const r = await fetchWithTimeout(proxy + encodeURIComponent(feed.url), 8000);
			if (!r.ok) continue;
			const text = await r.text();
			if (text) return parseRSS(text, feed);
		} catch(e) { continue; }
	}
	return [];
}

function parseRSS(xmlText, feed) {
	const articles = [];
	const cutoff = Date.now() - 12 * 60 * 60 * 1000; // last 12 hours
	try {
		const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
		doc.querySelectorAll('item, entry').forEach(item => {
			const title = decodeEntities((item.querySelector('title')?.textContent || '').trim());
			const linkEl = item.querySelector('link');
			const url = linkEl?.getAttribute('href') || linkEl?.textContent?.trim() || '';

			// Extract publish date
			const dateStr = item.querySelector('pubDate')?.textContent
				|| item.querySelector('published')?.textContent
				|| item.querySelector('updated')?.textContent
				|| '';
			const pubTime = dateStr ? new Date(dateStr).getTime() : 0;

			// Skip articles older than cutoff (allow if no date found)
			if (pubTime && pubTime < cutoff) return;

			if (title && url) articles.push({ title, url, sourceName: feed.name, flag: feed.flag });
		});
	} catch(e) {
		console.warn('RSS parse error for', feed.name, e);
	}
	return articles;
}

// ── TF-IDF grouping ──
function tokenize(text) {
	return text.toLowerCase()
		.replace(/[^\w\s\u0590-\u05FF\u0600-\u06FF]/g, ' ')
		.split(/\s+/)
		.filter(w => w.length > 2 && !STOPWORDS.has(w));
}

function groupArticles(articles) {
	if (!articles.length) return [];
	const N = articles.length;
	const tfs = articles.map(a => {
		const tokens = tokenize(a.title);
		const tf = {};
		tokens.forEach(t => tf[t] = (tf[t]||0) + 1);
		const len = tokens.length || 1;
		Object.keys(tf).forEach(t => tf[t] /= len);
		return tf;
	});
	const df = {};
	tfs.forEach(tf => Object.keys(tf).forEach(t => df[t] = (df[t]||0) + 1));
	const vecs = tfs.map(tf => {
		const v = {};
		Object.keys(tf).forEach(t => {
			if (df[t] < N) v[t] = tf[t] * Math.log(N / df[t]);
		});
		return v;
	});

	const THRESHOLD = TFIDF_SIMILARITY_THRESHOLD;
	const assigned = new Set();
	const groups = [];

	for (let i = 0; i < articles.length; i++) {
		if (assigned.has(i)) continue;
		const group = [i]; assigned.add(i);
		for (let j = i+1; j < articles.length; j++) {
			if (assigned.has(j)) continue;
			if (cosineSim(vecs[i], vecs[j]) >= THRESHOLD) { group.push(j); assigned.add(j); }
		}
		groups.push(group.map(idx => articles[idx]));
	}
	// Source weight: Israel/Arab/USA/World sources rank higher
	const SOURCE_WEIGHT = {
		'🇮🇱': 3, '🇺🇸': 3,
		'🇵🇸': 2.5,
		'🇱🇧': 2, '🇸🇦': 2, '🇶🇦': 2, '🇮🇷': 2, '🇪🇬': 2, '🇯🇴': 2,
		'🇬🇧': 1.5, '🇫🇷': 1.5, '🇩🇪': 1.5, '🇪🇺': 1.5,
		'🌐': 1.2,
	};
	function groupScore(group) {
		const sourceBonus = group.reduce((s, a) => s + (SOURCE_WEIGHT[a.flag] || 1), 0);
		return group.length * 2 + sourceBonus;
	}
	return groups.sort((a, b) => groupScore(b) - groupScore(a));
}

function cosineSim(v1, v2) {
	let dot=0, m1=0, m2=0;
	new Set([...Object.keys(v1),...Object.keys(v2)]).forEach(k => {
		dot += (v1[k]||0)*(v2[k]||0);
		m1  += (v1[k]||0)**2;
		m2  += (v2[k]||0)**2;
	});
	return (!m1||!m2) ? 0 : dot/(Math.sqrt(m1)*Math.sqrt(m2));
}

// ── Gemini ──
async function enhanceWithGemini() {
	const key = document.getElementById('geminiApiKey').value.trim();
	if (!key || !groupedStories.length) return;
	fetchGeneration++;
	const myGen = fetchGeneration;
	const btn = document.getElementById('geminiEnhanceBtn');
	btn.disabled = true;
	btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enhancing...';

	const top60 = allArticles.slice(0,60).map((a,i) => `${i}: ${a.title}`).join('\n');
	const prompt = `Group these news headlines by story. Headlines in different languages about the same event = same group. Return ONLY a JSON array, no markdown:\n[{"group":0,"indices":[0,3,7],"headline":"Best English headline"},…]\n\nHeadlines:\n${top60}`;

	try {
		const res = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
			{ method:'POST', headers:{'Content-Type':'application/json'},
			  body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{temperature:0.1,maxOutputTokens:2048} }) }
		);
		const data = await res.json();
		if (data.error) throw new Error(data.error.message);
		const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
		const match = raw.match(/\[[\s\S]*\]/);
		if (!match) throw new Error('Invalid response');

		const geminiGroups = JSON.parse(match[0]);
		if (fetchGeneration !== myGen) return;
		const top60a = allArticles.slice(0,60);
		const usedIdx = new Set(geminiGroups.flatMap(g => g.indices));
		const newGroups = geminiGroups.map(g => ({
			headline: g.headline,
			articles: g.indices.map(i => top60a[i]).filter(Boolean)
		})).filter(g => g.articles.length);

		top60a.forEach((a,i) => {
			if (!usedIdx.has(i)) newGroups.push({ headline: a.title, articles: [a] });
		});
		newGroups.sort((a,b) => b.articles.length - a.articles.length);
		renderStoriesEnhanced(newGroups.slice(0,50));

		document.getElementById('statGeminiBadge').innerHTML = '<span class="gemini-badge"><i class="fas fa-magic"></i> Gemini Enhanced</span>';
		document.getElementById('statStories').textContent = Math.min(newGroups.length,50);
		document.getElementById('aiSumSummaryBar').classList.add('active');
	} catch(e) {
		console.error('Gemini enhance failed:', e);
		const list = document.getElementById('aiSumList');
		const errDiv = document.createElement('div');
		errDiv.style.cssText = 'padding:1rem 1.5rem;color:#f87171;font-size:0.85rem;';
		errDiv.textContent = 'Gemini enhancement failed: ' + (e.message || 'Unknown error');
		list.prepend(errDiv);
		setTimeout(() => errDiv.remove(), 5000);
	}
	btn.disabled = false;
	btn.innerHTML = '<i class="fas fa-magic"></i> Enhance';
}

function buildCategoryHeader(catName, count) {
	const header = document.createElement('div');
	header.style.cssText = `
		padding: 0.6rem 1rem 0.6rem 1.2rem;
		margin: 1.4rem 0 0.4rem 0;
		background: rgba(139,92,246,0.08);
		border-left: 4px solid #a78bfa;
		border-radius: 0 10px 10px 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
	`;
	header.innerHTML = `
		<span style="font-size:1.1rem; font-weight:700; color:#a78bfa; letter-spacing:0.03em;">${catName}</span>
		<span style="
			font-size:0.72rem;
			font-weight:600;
			color:#a78bfa;
			background:rgba(139,92,246,0.12);
			border:1px solid rgba(167,139,250,0.4);
			border-radius:20px;
			padding:0.1rem 0.6rem;
		">${count} stories</span>
	`;
	return header;
}

// ── Render ──
function renderStories(groups) {
	const list = document.getElementById('aiSumList');
	list.innerHTML = '';

	// Categorize all groups
	const categorized = {};
	TOPIC_CATEGORIES.forEach(cat => categorized[cat.name] = []);

	groups.forEach(articles => {
		const headline = pickHeadline(articles);
		const category = categorizeStory(headline, articles);
		if (!categorized[category]) categorized[category] = [];
		categorized[category].push({ articles, headline });
	});

	let globalRank = 1;

	// Render in TOPIC_CATEGORIES order (not by count — hierarchy matters)
	TOPIC_CATEGORIES.forEach(cat => {
		const categoryGroups = categorized[cat.name];
		if (!categoryGroups || categoryGroups.length === 0) return;

		// Sort within category by source count, cap at 25
		const sorted = categoryGroups
			.sort((a,b) => b.articles.length - a.articles.length)
			.slice(0, 25);

		// Category header
		list.appendChild(buildCategoryHeader(cat.name, sorted.length));

		sorted.forEach(({ articles, headline }) => {
			list.appendChild(buildCard(globalRank++, headline, articles));
		});
	});
}

function renderStoriesEnhanced(groups) {
	const list = document.getElementById('aiSumList');
	list.innerHTML = '';

	const categorized = {};
	TOPIC_CATEGORIES.forEach(cat => categorized[cat.name] = []);

	groups.forEach(g => {
		const category = categorizeStory(g.headline, g.articles);
		if (!categorized[category]) categorized[category] = [];
		categorized[category].push(g);
	});

	let globalRank = 1;

	TOPIC_CATEGORIES.forEach(cat => {
		const categoryGroups = categorized[cat.name];
		if (!categoryGroups || categoryGroups.length === 0) return;

		const sorted = categoryGroups
			.sort((a,b) => b.articles.length - a.articles.length)
			.slice(0, 25);

		list.appendChild(buildCategoryHeader(cat.name, sorted.length));

		sorted.forEach(g => list.appendChild(buildCard(globalRank++, g.headline, g.articles)));
	});
}

function buildCard(rank, headline, articles) {
	const count = articles.length;
	const badgeClass = count >= 5 ? 'badge-hot' : count >= 3 ? 'badge-warm' : 'badge-normal';
	const badgeLabel = count >= 5 ? `🟢 ${count} sources` : count >= 3 ? `🟡 ${count} sources` : `🔴 ${count} source${count>1?'s':''}`;
	const isRTL = /[\u0590-\u05FF\u0600-\u06FF]/.test(headline.slice(0,10));

	const seen = new Set();
	const unique = articles.filter(a => {
		const k = a.sourceName; if (seen.has(k)) return false; seen.add(k); return true;
	});

	const links = unique.map(a => {
		const safeUrl = /^https?:\/\//i.test(a.url) ? esc(a.url) : '#';
		return `<a class="source-link" href="${safeUrl}" target="_blank" rel="noopener">
			${getSourceFlag(a.sourceName)} ${esc(a.sourceName)}
		</a>`;
	}).join('');

	const card = document.createElement('div');
	card.className = 'story-card';
	card.dataset.rank = rank;
	card.innerHTML = `
		<div class="story-top">
			<span class="story-rank">#${rank}</span>
			<span class="story-badge ${badgeClass}">${badgeLabel}</span>
			<span class="story-headline" dir="${isRTL?'rtl':'ltr'}">${esc(headline)}</span>
		</div>
		<div class="story-headline-he" id="he-${rank}" style="border-right:3px solid #a78bfa;padding-right:0.5rem;">⏳ מתרגם...</div>
		<div class="story-sources">${links}</div>`;

	// Translation runs after card is in DOM via MutationObserver trick
	requestAnimationFrame(() => translateToHebrew(headline, rank));

	return card;
}

async function translateToHebrew(text, rank) {
	const myGen = fetchGeneration;   // ← ADD THIS — snapshot at call time
	if (/[\u0590-\u05FF]/.test(text)) {
		const el = document.getElementById('he-' + rank);
		if (el) el.textContent = text;
		return;
	}
	try {
		const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=iw&dt=t&q=${encodeURIComponent(text)}`;
		const res = await fetch(url);
		const data = await res.json();
		const translated = data[0].reduce((acc, seg) => acc + (seg[0] || ''), '');
		if (fetchGeneration !== myGen) return;   // ← ADD THIS — stale, discard
		const el = document.getElementById('he-' + rank);
		if (el) el.textContent = translated || '';
	} catch(e) {
		if (fetchGeneration !== myGen) return;   // ← ADD THIS
		const el = document.getElementById('he-' + rank);
		if (el) el.textContent = '';
	}
}

function pickHeadline(articles) {
	const eng = articles.filter(a => !/[\u0590-\u05FF\u0600-\u06FF]/.test(a.title));
	const pool = eng.length ? eng : articles;
	return pool.reduce((b,a) => a.title.length > b.title.length ? a : b, pool[0]).title;
}

// ── Utils ──
function fetchWithTimeout(url, ms, options={}) {
	const ctrl = new AbortController();
	const id = setTimeout(() => ctrl.abort(), ms);
	return fetch(url, { ...options, signal: ctrl.signal }).finally(() => clearTimeout(id));
}
function decodeEntities(str) {
	const t = document.createElement('textarea'); t.innerHTML = str; return t.value;
}
function extractDomain(url) {
	try { return new URL(url).hostname.replace('www.',''); } catch(e) { return url; }
}
function esc(str) {
	return (str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function setProgress(msg) { document.getElementById('aiSumProgress').textContent = msg; }

const _aiSumOverlay = document.getElementById('aiSumOverlay');
if (_aiSumOverlay) _aiSumOverlay.addEventListener('click', function(e) {
	if (e.target === this) closeAiSum();
});

const _geminiKey = document.getElementById('geminiApiKey');
if (_geminiKey) _geminiKey.addEventListener('input', function() {
	document.getElementById('geminiEnhanceBtn').disabled =
		this.value.trim().length < 10 || groupedStories.length === 0;
});