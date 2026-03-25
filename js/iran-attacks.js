// ── Iran Attacks Since 28/2/2026 ─────────────────────────────────────────
let _iranEventsFlat = [];
let _iranTimeRange  = 'all';
let _iranCountries  = null;
let _iranFetching = false;

function iranFlagImg(name) {
	const MAP = {
		'Israel':'il','UAE':'ae','Saudi Arabia':'sa','Bahrain':'bh',
		'Qatar':'qa','Kuwait':'kw','Jordan':'jo','Oman':'om',
		'Iraq':'iq','Syria':'sy','Yemen':'ye','Lebanon':'lb',
		'Pakistan':'pk','Turkey':'tr','Egypt':'eg','Libya':'ly',
		'Tunisia':'tn','Morocco':'ma','Algeria':'dz','Sudan':'sd',
		'Afghanistan':'af','Iran':'ir','Red Sea / Ships':'','Cyprus':'cy',
	};
	const code = MAP[name];
	if (!code) return '<span style="font-size:0.9rem;">🚢</span>';
	return `<img src="https://flagcdn.com/16x12/${code}.png" style="width:20px;height:15px;border-radius:2px;vertical-align:middle;display:inline-block;">`;
}

function openIranAttacks() {
	document.getElementById('iranAttacksOverlay').classList.add('active');
	document.body.style.overflow = 'hidden';
	document.documentElement.style.overflow = 'hidden';

	// Load from localStorage if available (previous AI-processed data)
	if (!_iranCountries) {
		try {
			const cached = localStorage.getItem('iranAttacksData');
			if (cached) {
				const parsed = JSON.parse(cached);
				if (Array.isArray(parsed.countries) && parsed.countries.length > 0) {
					_iranCountries = parsed.countries;
				}
			}
		} catch(e) {}
	}

	if (_iranCountries) {
		renderIranAttacks();
		_iranSetStatus('🟡 Showing last fetched data · auto-updating in background...');
	} else {
		document.getElementById('iranAttacksContent').innerHTML = `
			<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:3rem 1rem;gap:1rem;">
				<div style="width:40px;height:40px;border:3px solid rgba(251,146,60,0.2);border-top-color:#fb923c;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
				<div style="color:rgba(255,255,255,0.5);font-size:0.85rem;">Fetching live attack data from GDELT...</div>
				<div id="iranFirstLoadStatus" style="color:rgba(255,255,255,0.25);font-size:0.72rem;">Connecting to news sources</div>
			</div>`;
	}

	fetchIranLiveData();
}

function closeIranAttacks() {
	document.getElementById('iranAttacksOverlay').classList.remove('active');
	if (!document.querySelector('.ai-sum-overlay.active')) {
		document.body.style.overflow = '';
		document.documentElement.style.overflow = '';
	}
}

function setIranRange(r) {
	_iranTimeRange = r;
	renderIranAttacks();
}

function _iranSetStatus(html) {
	const el = document.getElementById('iranDataStatus');
	if (el) el.innerHTML = html;
}

// ── GDELT queries ──────────────────────────────────────────────────────────
const IRAN_GDELT_QUERIES = [
	'iran missile attack 2026',
	'iran drone attack gulf 2026',
	'iran strikes Israel UAE Saudi',
	'IRGC attack Middle East 2026',
	'shahed drone attack 2026',
	'iran attacks bahrain kuwait qatar',
	'iran attacks iraq erbil 2026',
];

async function _iranFetchGDELT() {
	const articles = [];
	for (const q of IRAN_GDELT_QUERIES) {
		const gdeltUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(q)}&mode=artlist&maxrecords=40&format=json&timespan=14d&sort=hybridrel`;
		const url = (typeof CORS_PROXY !== 'undefined' && CORS_PROXY) ? CORS_PROXY + encodeURIComponent(gdeltUrl) : gdeltUrl;
		try {
			const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
			if (!resp.ok) continue;
			const data = await resp.json();
			if (data.articles) {
				for (const a of data.articles) {
					articles.push({ title: a.title||'', url: a.url||'', source: a.domain||'', date: a.seendate||'' });
				}
			}
		} catch(e) { /* continue */ }
	}
	const seen = new Set();
	return articles.filter(a => { if (!a.url||seen.has(a.url)) return false; seen.add(a.url); return true; });
}

// ── Gemini structuring ─────────────────────────────────────────────────────
async function _iranStructureWithGemini(articles, existingData, apiKey) {
	const today = new Date().toISOString().split('T')[0];
	const existingSummary = existingData
		? `\n\nEXISTING DATA (update/add — do NOT remove confirmed events):\n${JSON.stringify(existingData, null, 0)}`
		: '';
	const articleText = articles.slice(0, 80).map((a, i) =>
		`[${i+1}] ${a.date||''} | ${a.source||''} | ${a.title}`
	).join('\n\n');

	const prompt = `You are a military analyst. Today is ${today}. Below are news articles about Iran's attacks on other countries since February 28, 2026.

ARTICLES:
${articleText}
${existingSummary}

TASK: Return a complete, updated JSON array of ALL confirmed Iran attacks since 2026-02-28. Merge new information with existing data. Add new events, update casualty counts, but NEVER remove confirmed events.

RULES:
- Only CONFIRMED attacks (2+ credible sources)
- Every event MUST have real lat/lng coordinates
- Israel timezone (+02:00) for timestamps
- Detail: factual, 1-2 sentences max

Return ONLY valid JSON array, no markdown, no explanation.

Schema: [{"name":"Country","color":"#hex","events":[{"ts":"2026-MM-DDTHH:MM","types":["missiles"|"drones"|"cruise"|"rockets"],"targets":["Military base"|"Residential"|"Airport"|"Port"|"Hotel"|"Ship"|"Embassy/Consulate"|"Radar station"|"Data center"|"Industrial"],"counts":{"missiles":N,"drones":N},"cas":{"k":N,"i":N},"lat":0.0,"lng":0.0,"location_name":"Place","detail":"Description"}]}]

Colors: Israel=#fbbf24, UAE=#f87171, Saudi Arabia=#fb923c, Bahrain=#60a5fa, Qatar=#a78bfa, Kuwait=#34d399, Jordan=#e879f9, Oman=#2dd4bf, Red Sea / Ships=#38bdf8, Iraq=#a3e635, Syria=#e11d48, Turkey=#ef4444, Cyprus=#94a3b8`;

	const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			contents: [{ parts: [{ text: prompt }] }],
			generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
		}),
	});
	if (!resp.ok) throw new Error(`Gemini ${resp.status}`);
	const data = await resp.json();
	const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
	const clean = text.replace(/```json\s*/g, '').replace(/```/g, '').trim();
	const jsonMatch = clean.match(/\[[\s\S]*\]/);
	return JSON.parse(jsonMatch ? jsonMatch[0] : clean);
}

// ── Validate ───────────────────────────────────────────────────────────────
function _iranValidateData(data) {
	if (!Array.isArray(data)) return null;
	const valid = data.map(country => {
		if (!country.name || !Array.isArray(country.events)) return null;
		const events = country.events.filter(ev => {
			if (!ev.ts || !ev.types || !ev.counts) return false;
			const d = new Date(ev.ts + ':00+02:00');
			if (isNaN(d.getTime()) || d < new Date('2026-02-28')) return false;
			if (!ev.cas) ev.cas = { k: 0, i: 0 };
			return true;
		});
		return events.length ? { name: country.name, color: country.color || '#94a3b8', events } : null;
	}).filter(Boolean);
	return valid.length ? valid : null;
}

function _iranStatusBase() {
	if (!_iranCountries) return '🔴 No data';
	const t = _iranCountries.reduce((s,c) => s + (c.events||[]).length, 0);
	return `🟡 ${_iranCountries.length} countries · ${t} events`;
}

// ── Main fetch: static JSON → seed data → GDELT + Gemini auto-enhance ────
async function fetchIranLiveData() {
	if (_iranFetching) return;
	_iranFetching = true;
	const btn = document.getElementById('iranRefreshBtn');
	if (btn) { btn.textContent = '⏳ Updating...'; btn.disabled = true; }

	// Step 1: Try static JSON (works on GitHub Pages)
	try {
		const resp = await fetch(`data/iran-attacks.json?v=${Math.floor(Date.now()/60000)}`);
		if (resp.ok) {
			const data = await resp.json();
			if (Array.isArray(data.countries) && data.countries.length > 0) {
				_iranCountries = data.countries;
				try { localStorage.setItem('iranAttacksData', JSON.stringify(data)); } catch(e) {}
				renderIranAttacks();
				if (_iranMap) buildIranMap();
				const t = data.countries.reduce((s,c)=>s+(c.events||[]).length,0);
				_iranSetStatus(`🟢 ${data.countries.length} countries · ${t} events · updated: ${data.updated ? new Date(data.updated).toLocaleString() : '?'} · source: ${data.source||'pipeline'}`);
			}
		}
	} catch(e) { /* continue */ }

	// Step 2: GDELT + Gemini live update (only if no data yet or user has Gemini key)
	if (!_iranCountries || localStorage.getItem('iranGeminiKey')) {
		await _iranBackgroundEnhance();
	}

	// Step 3: If still no data after everything, show error
	if (!_iranCountries) {
		document.getElementById('iranAttacksContent').innerHTML = `
			<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:3rem 1rem;gap:1rem;text-align:center;">
				<i class="fas fa-exclamation-triangle" style="font-size:2rem;color:#fb923c;"></i>
				<div style="color:rgba(255,255,255,0.6);font-size:0.9rem;">No attack data available yet</div>
				<div style="color:rgba(255,255,255,0.35);font-size:0.78rem;max-width:400px;">
					Enter your Gemini API key below, then press Fetch.<br>
					GDELT articles will be fetched and AI will structure them into attack data.
				</div>
				<div style="display:flex;gap:0.5rem;align-items:center;margin-top:0.5rem;">
					<input type="password" id="iranGeminiKey" placeholder="Gemini API key" style="padding:0.5rem 0.75rem;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:white;font-size:0.85rem;width:260px;outline:none;">
					<button onclick="_iranSaveKeyAndFetch()" style="padding:0.5rem 1rem;background:rgba(251,146,60,0.2);border:1px solid rgba(251,146,60,0.4);border-radius:8px;color:#fb923c;font-size:0.85rem;font-weight:600;cursor:pointer;">🔄 Fetch</button>
				</div>
			</div>`;
	}

	_iranFetching = false;
	if (btn) { btn.textContent = '🔄 Refresh'; btn.disabled = false; }
}

function _iranSaveKeyAndFetch() {
	const keyEl = document.getElementById('iranGeminiKey');
	const key = keyEl?.value?.trim();
	if (key && key.length >= 10) {
		keyEl.dataset.userTyped = 'true';
		localStorage.setItem('iranGeminiKey', key);
		// Also sync to AI Summary panel if it exists
		const aiKeyEl = document.getElementById('geminiApiKey');
		if (aiKeyEl && !aiKeyEl.value.trim()) aiKeyEl.value = key;
	}
	_iranFetching = false; // reset so it can run again
	_iranCountries = null; // force fresh
	openIranAttacks();
}

async function _iranBackgroundEnhance() {
	// Don't auto-use stored key — the server pipeline handles updates.
	// Only use key if user explicitly typed one in the Iran panel's input field.
	const iranKeyEl = document.getElementById('iranGeminiKey');
	const geminiKey = (iranKeyEl && iranKeyEl.value && iranKeyEl.dataset.userTyped === 'true')
		? iranKeyEl.value.trim() : '';

	// Fetch GDELT
	_iranSetStatus(_iranStatusBase() + ' · <span style="color:#fb923c;">📡 Searching GDELT...</span>');
	let articles = [];
	try { articles = await _iranFetchGDELT(); } catch(e) { /* continue */ }

	if (!articles.length) {
		_iranSetStatus(_iranStatusBase() + ' · <span style="color:rgba(255,255,255,0.3);">No new articles from GDELT</span>');
		return;
	}

	_iranSetStatus(_iranStatusBase() + ` · <span style="color:#fb923c;">📰 ${articles.length} articles found</span>`);

	if (!geminiKey || geminiKey.length < 10) {
		_iranSetStatus(_iranStatusBase() + ` · 📰 ${articles.length} articles · <span style="color:rgba(255,255,255,0.3);">Add Gemini key in AI Summary panel for AI auto-update</span>`);
		return;
	}

	// Gemini structuring
	_iranSetStatus(_iranStatusBase() + ` · <span style="color:#a78bfa;">🤖 AI analyzing ${articles.length} articles...</span>`);
	try {
		const structured = await _iranStructureWithGemini(articles, _iranCountries, geminiKey);
		const validated = _iranValidateData(structured);
		if (validated) {
			_iranCountries = validated;
			try { localStorage.setItem('iranAttacksData', JSON.stringify({ updated: new Date().toISOString(), countries: validated })); } catch(e) {}
			renderIranAttacks();
			if (_iranMap) buildIranMap();
			const t = validated.reduce((s,c) => s + (c.events||[]).length, 0);
			_iranSetStatus(`🟢 ${validated.length} countries · ${t} events · <span class="gemini-badge" style="display:inline-flex;align-items:center;gap:0.3rem;padding:0.1rem 0.5rem;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);border-radius:4px;font-size:0.65rem;color:#6ee7b7;"><i class="fas fa-magic"></i> AI-updated just now</span> · ${articles.length} articles processed`);
		} else {
			_iranSetStatus(_iranStatusBase() + ' · <span style="color:#f87171;">AI returned invalid data</span>');
		}
	} catch(e) {
		console.warn('Gemini enhance failed:', e.message);
		_iranSetStatus(_iranStatusBase() + ` · <span style="color:#f87171;">AI failed: ${e.message.slice(0,80)}</span>`);
	}
}

function showIranEvent(idx) {
	const ev  = _iranEventsFlat[idx];
	const div = document.getElementById('iranEventDetail');
	if (!ev || !div) return;
	const TYPE_CFG = {
		missiles:{label:'Ballistic Missiles',color:'#f87171',icon:'🚀'},
		drones:  {label:'Drones (Shahed)',   color:'#fb923c',icon:'✈️'},
		cruise:  {label:'Cruise Missiles',   color:'#fbbf24',icon:'💥'},
		rockets: {label:'Rockets',           color:'#e879f9',icon:'🎯'},
	};
	const hasCas   = ev.cas.k > 0 || ev.cas.i > 0;
	const countStr = Object.entries(ev.counts).map(([k,v])=>`<span style="color:${TYPE_CFG[k]?.color||'#fff'};font-weight:700;">${TYPE_CFG[k]?.icon||'⚡'} ${v.toLocaleString()} ${TYPE_CFG[k]?.label||k}</span>`).join(' + ');
	const [datePart, timePart] = ev.ts.split('T');
	const [yyyy,mm,dd] = datePart.split('-');
	div.style.display = 'block';
	div.innerHTML = `
		<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.55rem;padding-bottom:0.45rem;border-bottom:1px solid rgba(255,255,255,0.08);">
			<span style="color:${ev.countryColor};font-weight:800;font-size:0.9rem;">${iranFlagImg(ev.countryName)} ${ev.countryName}</span>
			<span style="color:rgba(255,255,255,0.55);font-size:0.8rem;font-weight:600;">${dd}/${mm}/${yyyy} &nbsp;${timePart} (IL)</span>
		</div>
		<div style="margin-bottom:0.35rem;font-size:0.8rem;">${countStr}</div>
		<div style="margin-bottom:0.35rem;font-size:0.78rem;color:${hasCas?'#f87171':'#34d399'};font-weight:700;">${ev.cas.k>0?'💀 '+ev.cas.k+' killed &nbsp;':''}${ev.cas.i>0?'🩸 '+ev.cas.i+' injured':!hasCas?'✅ No casualties':''}</div>
		<div style="margin-bottom:0.4rem;font-size:0.77rem;color:rgba(255,255,255,0.5);">🎯 Targets: ${ev.targets.map(t=>`<span style="background:rgba(255,255,255,0.08);padding:0.12rem 0.4rem;border-radius:3px;margin-right:0.25rem;color:rgba(255,255,255,0.75);">${t}</span>`).join('')}</div>
		<div style="font-size:0.77rem;color:rgba(255,255,255,0.6);line-height:1.55;">${ev.detail}</div>
	`;
	div.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function renderIranAttacks() {
	_iranEventsFlat = [];
	const COUNTRIES = _iranCountries || [];
if (!COUNTRIES.length) {
		document.getElementById('iranAttacksContent').innerHTML = `
			<div style="text-align:center;padding:3rem;color:rgba(255,255,255,0.4);">
				<i class="fas fa-database" style="font-size:1.5rem;margin-bottom:0.75rem;display:block;opacity:0.3;"></i>
				No attack data available. Press Refresh to fetch live data.
				<br><button onclick="fetchIranLiveData()" style="margin-top:1rem;padding:0.4rem 1rem;background:rgba(251,146,60,0.15);border:1px solid rgba(251,146,60,0.35);border-radius:6px;color:#fb923c;font-size:0.82rem;cursor:pointer;">🔄 Refresh</button>
			</div>`;
		return;
	}
	const TYPE_CFG = {
		missiles:{label:'Ballistic Missiles',color:'#f87171',icon:'🚀'},
		drones:  {label:'Drones (Shahed)',   color:'#fb923c',icon:'✈️'},
		cruise:  {label:'Cruise Missiles',   color:'#fbbf24',icon:'💥'},
		rockets: {label:'Rockets',           color:'#e879f9',icon:'🎯'},
	};

	const daysSinceStart = Math.max(7, Math.ceil((Date.now() - new Date('2026-02-28T00:00:00+02:00').getTime()) / 86400000) + 1);
	const RANGE_CFGS = {
		'all': {sec:daysSinceStart, tickEvery:Math.max(1, Math.ceil(daysSinceStart/12)), tickFmt:'dd/mm', label:'All'},
		'7d': {sec:7,   tickEvery:1,   tickFmt:'dd/mm',   label:'7 Days'},
		'14d':{sec:14,  tickEvery:2,   tickFmt:'dd/mm',   label:'2 Weeks'},
		'1m': {sec:30,  tickEvery:5,   tickFmt:'dd/mm',   label:'1 Month'},
		'3m': {sec:90,  tickEvery:14,  tickFmt:'dd/mm',   label:'3 Months'},
		'6m': {sec:180, tickEvery:30,  tickFmt:'mm/yyyy', label:'6 Months'},
		'1y': {sec:365, tickEvery:30,  tickFmt:'mm/yyyy', label:'1 Year'},
	};
	const rc    = RANGE_CFGS[_iranTimeRange]||RANGE_CFGS['all'];
	const WAR_START_MS = new Date('2026-02-28T00:00:00+02:00').getTime();
	const TOMORROW_MS = Date.now() + 86400000;
	const START = (_iranTimeRange === 'all') ? WAR_START_MS : TOMORROW_MS - (rc.sec + 1) * 86400000;
	const END   = TOMORROW_MS;
	const SPAN  = END - START;
	const DAYS  = Math.ceil(SPAN / 86400000);
	
	for (const c of COUNTRIES) {
		for (const ev of c.events) {
			ev.countryName  = c.name;
			ev.countryColor = c.color;
			ev._idx = _iranEventsFlat.length;
			_iranEventsFlat.push(ev);
		}
	}

	const ticks = [];
	for (let i=0;i<=DAYS;i+=rc.tickEvery) {
		const d = new Date(START+i*86400000);
		let lbl = rc.tickFmt==='dd/mm'
			? String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')
			: String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();
		ticks.push({pct:i/DAYS*100, lbl});
	}

	const LABEL_W = 90;
	const ROW_H   = 44;

	const axisRow = `<div style="position:relative;height:18px;margin-left:${LABEL_W}px;">
		${ticks.map((t,i)=>{
			const isLast = i===ticks.length-1;
			const isFirst = i===0;
			const transform = isLast ? 'translateX(-100%)' : isFirst ? 'translateX(0%)' : 'translateX(-50%)';
			return `<div style="position:absolute;left:${t.pct}%;font-size:0.72rem;color:rgba(255,255,255,0.6);font-weight:600;transform:${transform};">${t.lbl}</div>`;
		}).join('')}
	</div>`;

		const gridLines = ticks.map(t=>`<div style="position:absolute;left:${t.pct}%;top:0;bottom:0;border-left:1px solid rgba(255,255,255,0.15);pointer-events:none;"></div>`).join('');


	const todayPct = Math.min(100,(Date.now()-START)/SPAN*100);
	const todayLine = todayPct>0&&todayPct<100
		? `<div style="position:absolute;left:${todayPct}%;top:0;bottom:0;border-left:2px dashed rgba(52,211,153,0.5);pointer-events:none;z-index:3;"><div style="position:absolute;top:0;left:2px;font-size:0.52rem;color:#34d399;">now</div></div>`
		: '';

	const rows = COUNTRIES.map((country,ci)=>{
		const dots = country.events.map(ev=>{
			const evMs = new Date(ev.ts+':00+02:00').getTime();
			if (evMs < START || evMs > END) return '';
			const pct   = Math.min(96, Math.max(2, (evMs-START)/SPAN*100));
			const total = Object.values(ev.counts).reduce((s,v)=>s+v,0);
			const r     = Math.min(14, Math.max(6, 5+Math.log10(total+1)*3.8));
			const color = TYPE_CFG[ev.types[0]]?.color||'#94a3b8';
			const hasCas= ev.cas.k>0||ev.cas.i>0;
			const [datePart,timePart] = ev.ts.split('T');
			const [yyyy,mm,dd] = datePart.split('-');
			const TARGET_ICONS = {
				'military base':'🪖','airport':'✈️','port':'⚓','hotel':'🏨',
				'residential':'🏠','ship':'🚢','embassy':'🏛️','radar':'📡',
				'data center':'💾','industrial':'🏭','capital city':'🏙️',
				'radar station':'📡','tank':'🚜','submarine':'🌊',
				'embassy/consulate':'🏛️','ship (tanker)':'🛢️','airspace':'🌐',
				'airbase':'✈️','air base':'✈️','power plant':'⚡',
				'oil facility':'🛢️','nuclear site':'☢️','headquarters':'🏢',
				'bridge':'🌉','highway':'🛣️','communications':'📻',
				'fuel depot':'⛽','ammunition depot':'💣','naval base':'⚓',
				'troops':'💂','convoy':'🚛','artillery':'💥',
			};
			const getTargetIcon = t => TARGET_ICONS[t.toLowerCase()] || '🎯';
			const row2  = Object.entries(ev.counts).map(([k,v])=>(TYPE_CFG[k]?.icon||'⚡')+' '+v+' '+(TYPE_CFG[k]?.label||k)).join('\n');
			const row3  = hasCas ? ((ev.cas.k>0?'💀 '+ev.cas.k+' killed ':'')+( ev.cas.i>0?'🩸 '+ev.cas.i+' injured':'')).trim() : '';
			const row4  = (ev.targets||[]).map(t=>getTargetIcon(t)+' '+t).join(' · ');
			const tip   = `${dd}/${mm}/${yyyy} ${timePart}|${row2}|${row3}|${row4}`;
			return `<div
				onclick="showIranEvent(${ev._idx})"
				data-tip="${tip}"
				onmouseenter="iranTip(this,true)"
				onmouseleave="iranTip(this,false)"
				style="position:absolute;left:${pct}%;top:50%;transform:translate(-50%,-50%);width:${r*2}px;height:${r*2}px;border-radius:50%;background:${color};border:${hasCas?'2.5px solid #fff':'1.5px solid rgba(255,255,255,0.15)'};cursor:pointer;box-shadow:0 0 ${hasCas?8:3}px ${color}88;z-index:2;transition:transform 0.15s;"
				onmousedown="this.style.transform='translate(-50%,-50%) scale(0.9)'"
				onmouseup="this.style.transform='translate(-50%,-50%) scale(1.3)'"
			></div>`;
		}).join('');
		return `<div class="iran-row" data-country="${country.name}" style="display:flex;align-items:center;height:${ROW_H}px;border-bottom:1px solid rgba(255,255,255,0.04);background:${ci%2===0?'rgba(255,255,255,0.012)':'transparent'};transition:background 0.15s;">
			<div style="width:${LABEL_W}px;flex-shrink:0;display:flex;align-items:center;gap:0.3rem;padding-right:4px;overflow:hidden;">
				${iranFlagImg(country.name)}
				<span style="font-size:0.75rem;font-weight:700;color:${country.color};line-height:1.25;">${country.name}</span>
			</div>
			<div style="flex:1;height:100%;position:relative;overflow:visible;">
				${gridLines}${todayLine}
				<div style="position:absolute;left:0;right:0;top:50%;border-top:1px dashed rgba(255,255,255,0.04);pointer-events:none;"></div>
				${dots}
			</div>
		</div>`;
	}).join('');

	const casCards = COUNTRIES.map(c=>{
		const k     = c.events.reduce((s,e)=>s+e.cas.k, 0);
		const i     = c.events.reduce((s,e)=>s+e.cas.i, 0);
		// Sum all weapon counts across all events
		const totals = {};
		for (const ev of c.events) {
			for (const [type, count] of Object.entries(ev.counts||{})) {
				totals[type] = (totals[type]||0) + count;
			}
		}
		const weaponRows = Object.entries(totals).map(([type,count])=>{
			const cfg = TYPE_CFG[type];
			return `<div style="font-size:0.68rem;color:${cfg?.color||'#fff'};">${cfg?.icon||'⚡'} ${count.toLocaleString()}</div>`;
		}).join('');
		return `<div class="iran-cas" data-country="${c.name}" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-left:3px solid ${c.color};border-radius:6px;padding:0.5rem 0.7rem;transition:background 0.15s,border-color 0.15s;">
			<div style="display:flex;align-items:center;gap:0.35rem;font-size:0.72rem;color:${c.color};font-weight:700;margin-bottom:0.3rem;">${iranFlagImg(c.name)} ${c.name}</div>
			${weaponRows}
			${k>0?`<div style="font-size:0.68rem;color:#f87171;margin-top:0.2rem;">💀 ${k} killed</div>`:''}
			${i>0?`<div style="font-size:0.68rem;color:#fb923c;">🩸 ${i} injured</div>`:''}
			${k===0&&i===0?`<div style="font-size:0.65rem;color:rgba(255,255,255,0.25);">✅ No casualties</div>`:''}
		</div>`;
	}).join('');

	const legend = [
		{icon:'🚀',label:'Ballistic Missiles',color:'#f87171'},
		{icon:'✈️',label:'Drones (Shahed)',   color:'#fb923c'},
		{icon:'💥',label:'Cruise Missiles',   color:'#fbbf24'},
		{icon:'🎯',label:'Rockets',           color:'#e879f9'},
	].map(v=>`<span style="display:inline-flex;align-items:center;gap:0.3rem;font-size:0.68rem;"><span style="font-size:0.85rem;">${v.icon}</span><span style="color:${v.color};">${v.label}</span></span>`).join('');

	const WAR_START   = new Date('2026-02-28T00:00:00+02:00').getTime();
	const daysSinceWar = (Date.now() - WAR_START) / 86400000;
	const rangeButtons = Object.entries(RANGE_CFGS).filter(([k,v])=>k==='all' || v.sec <= Math.max(7, daysSinceWar+1)).map(([k,v])=>{
		const active = k===_iranTimeRange;
		return `<button onclick="setIranRange('${k}')" style="padding:0.2rem 0.55rem;border-radius:4px;font-size:0.72rem;font-weight:600;cursor:pointer;border:1px solid ${active?'#60a5fa':'rgba(255,255,255,0.1)'};background:${active?'rgba(96,165,250,0.15)':'rgba(255,255,255,0.04)'};color:${active?'#60a5fa':'rgba(255,255,255,0.4)'};">${v.label}</button>`;
	}).join('');

	document.getElementById('iranAttacksContent').innerHTML = `
		<div id="iranBubbleTip" style="display:none;position:fixed;background:rgba(15,15,20,0.97);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:0.55rem 0.75rem;z-index:9999;pointer-events:none;max-width:220px;box-shadow:0 4px 20px rgba(0,0,0,0.6);">
			<div id="iranTipR1" style="font-size:0.95rem;color:#60a5fa;font-weight:700;margin-bottom:0.3rem;"></div>
			<div id="iranTipR2" style="font-size:0.72rem;color:rgba(255,255,255,0.75);margin-bottom:0.2rem;"></div>
			<div id="iranTipR3" style="font-size:0.72rem;margin-bottom:0.2rem;"></div>
			<div id="iranTipR4" style="font-size:0.7rem;color:rgba(255,255,255,0.45);"></div>
		</div>
		<div style="display:flex;flex-wrap:wrap;align-items:center;gap:0.4rem;margin-bottom:0.55rem;">
			${rangeButtons}
			<button id="iranRefreshBtn" onclick="fetchIranLiveData()" style="margin-left:auto;padding:0.2rem 0.65rem;border-radius:4px;font-size:0.72rem;font-weight:600;cursor:pointer;border:1px solid rgba(52,211,153,0.4);background:rgba(52,211,153,0.08);color:#34d399;">🔄 Refresh</button>
		</div>
		<div style="display:flex;flex-wrap:wrap;align-items:center;gap:0.5rem;margin-bottom:0.5rem;">
			<div id="iranDataStatus" style="font-size:0.65rem;color:rgba(255,255,255,0.3);flex:1;">🟡 Loaded</div>
			<input type="password" id="iranGeminiKey" value="${localStorage.getItem('iranGeminiKey')||''}" placeholder="Gemini API key" style="padding:0.25rem 0.5rem;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);border-radius:5px;color:white;font-size:0.7rem;width:180px;outline:none;">
		</div>
		<div style="display:flex;flex-wrap:wrap;gap:0.4rem 1rem;margin-bottom:0.6rem;">${legend}
			<span style="display:inline-flex;align-items:center;gap:0.3rem;font-size:0.68rem;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:transparent;border:2px solid white;flex-shrink:0;"></span><span style="color:rgba(255,255,255,0.4);">White border = casualties</span></span>
		</div>
		<div id="iranEventDetail" style="display:none;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:0.85rem;margin-bottom:0.65rem;"></div>
		<div id="iranChartScroll" style="overflow:hidden;">
			<div id="iranChartInner" style="width:100%;">
				${axisRow}
				${rows}
				${axisRow}
			</div>
		</div>
		<div style="font-size:0.6rem;color:rgba(255,255,255,0.18);margin-top:0.55rem;text-align:center;">Tap any bubble for full details · Sources: UAE MoD, IDF, Reuters, AP · ${new Date().toLocaleDateString('en-GB')}</div>
		<div style="margin-top:0.75rem;">
			<div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.07em;color:rgba(255,255,255,0.3);font-weight:600;margin-bottom:0.4rem;">Casualties by Country</div>
			<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:0.4rem;">${casCards}</div>
		</div>
		<div style="margin-top:1rem;">
			<div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.07em;color:rgba(255,255,255,0.3);font-weight:600;margin-bottom:0.5rem;">🗺️ Attack Map</div>
			<div id="iranMapContainer" style="width:100%;height:750px;border-radius:10px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);"></div>
			<div style="font-size:0.62rem;color:rgba(255,255,255,0.2);margin-top:0.4rem;text-align:center;">🟢 Iran &nbsp;·&nbsp; 🔴 Attacked country &nbsp;·&nbsp; Click markers for details</div>
		</div>
	`;
	requestAnimationFrame(() => {
		const scroll = document.getElementById('iranChartScroll');
		const inner  = document.getElementById('iranChartInner');
		if (!scroll || !inner) return;
		if (scroll.offsetWidth < 550) {
			scroll.style.overflowX = 'auto';
			scroll.style.webkitOverflowScrolling = 'touch';
			scroll.style.touchAction = 'pan-x';
			inner.style.minWidth = '550px';
			inner.style.width = 'auto';
		} else {
			scroll.style.overflow = 'hidden';
			inner.style.width = '100%';
			inner.style.minWidth = '0';
		}
		initIranMap();
	});
	
	// Cross-highlight rows ↔ casualty cards
	document.querySelectorAll('.iran-row, .iran-cas').forEach(el => {
		el.addEventListener('mouseenter', () => {
			const name = el.dataset.country;
			document.querySelectorAll(`.iran-row[data-country="${name}"]`).forEach(r => r.style.background = 'rgba(255,255,255,0.08)');
			document.querySelectorAll(`.iran-cas[data-country="${name}"]`).forEach(c => { c.style.background = 'rgba(255,255,255,0.1)'; c.style.borderColor = 'rgba(255,255,255,0.3)'; });
		});
		el.addEventListener('mouseleave', () => {
			document.querySelectorAll('.iran-row').forEach((r,i) => r.style.background = i%2===0 ? 'rgba(255,255,255,0.012)' : 'transparent');
			document.querySelectorAll('.iran-cas').forEach(c => { c.style.background = 'rgba(255,255,255,0.03)'; c.style.borderColor = 'rgba(255,255,255,0.07)'; });
		});
	});
}
let _iranMap = null;
let _iranMapGen = 0;

function iranShowTab(tab) {
	const tl  = document.getElementById('iranTabContentTimeline');
	const mp  = document.getElementById('iranTabContentMap');
	const btn1= document.getElementById('iranTabTimeline');
	const btn2= document.getElementById('iranTabMap');
	if (!tl||!mp) return;
	if (tab==='map') {
		tl.style.display  = 'none';
		mp.style.display  = 'block';
		btn1.style.cssText= 'flex:1;padding:0.4rem;border-radius:6px;font-size:0.8rem;font-weight:700;cursor:pointer;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.4);';
		btn2.style.cssText= 'flex:1;padding:0.4rem;border-radius:6px;font-size:0.8rem;font-weight:700;cursor:pointer;border:1px solid #60a5fa;background:rgba(96,165,250,0.15);color:#60a5fa;';
		initIranMap();
	} else {
		tl.style.display  = 'block';
		mp.style.display  = 'none';
		btn1.style.cssText= 'flex:1;padding:0.4rem;border-radius:6px;font-size:0.8rem;font-weight:700;cursor:pointer;border:1px solid #60a5fa;background:rgba(96,165,250,0.15);color:#60a5fa;';
		btn2.style.cssText= 'flex:1;padding:0.4rem;border-radius:6px;font-size:0.8rem;font-weight:700;cursor:pointer;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.4);';
	}
}

function initIranMap() {
	// Load Leaflet JS dynamically if not yet loaded
	if (!window.L) {
		const script = document.createElement('script');
		script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
		script.onload = () => buildIranMap();
		document.head.appendChild(script);
	} else {
		buildIranMap();
	}
}

function buildIranMap() {
	const container = document.getElementById('iranMapContainer');
	if (!container || !window.L) return;
	if (_iranMap) { _iranMap.remove(); _iranMap = null; }

	_iranMap = L.map(container, { center:[28,50], zoom:5, zoomControl:true, scrollWheelZoom:true });
	const myMapGen = ++_iranMapGen;
	L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
		attribution:'© OpenStreetMap © CARTO', subdomains:'abcd', maxZoom:10
	}).addTo(_iranMap);

	const FF_GREEN = '#39FF14';
	const FF_RED   = '#FF3333';
	const iranCenter = [32.5, 53.7];

	const countries = _iranCountries || [];

	// Compute center of each attacked country from its event coordinates
	const countryCenters = {};
	for (const c of countries) {
		const lats = c.events.filter(e => e.lat && e.lng).map(e => e.lat);
		const lngs = c.events.filter(e => e.lat && e.lng).map(e => e.lng);
		if (lats.length) {
			countryCenters[c.name] = [
				lats.reduce((s,v) => s+v, 0) / lats.length,
				lngs.reduce((s,v) => s+v, 0) / lngs.length,
			];
		}
	}

	// Draw Iran border
	const iranNominatim = encodeURIComponent('Iran');
	const _nomUrl1 = `https://nominatim.openstreetmap.org/search?q=${iranNominatim}&polygon_geojson=1&format=json&limit=1&featuretype=country`;
	fetch((typeof CORS_PROXY !== 'undefined' && CORS_PROXY) ? CORS_PROXY + encodeURIComponent(_nomUrl1) : _nomUrl1)
	.then(r => r.json())
	.then(results => {
		if (_iranMapGen !== myMapGen) return;
		const geo = results?.[0]?.geojson;
		if (geo) {
			L.geoJSON(geo, { style: { color: FF_GREEN, weight: 2.5, fillColor: FF_GREEN, fillOpacity: 0.15 } })
				.addTo(_iranMap)
				.bindPopup(`<b style="color:${FF_GREEN};">Iran</b> — Origin of attacks`);
		}
	}).catch(() => {});

	// Draw attacked country borders dynamically
	for (const country of countries) {
		const center = countryCenters[country.name];
		if (!center) continue;
		const qname = encodeURIComponent(country.name === 'UAE' ? 'United Arab Emirates' : country.name);
		const _nomUrl2 = `https://nominatim.openstreetmap.org/search?q=${qname}&polygon_geojson=1&format=json&limit=1&featuretype=country`;
		fetch((typeof CORS_PROXY !== 'undefined' && CORS_PROXY) ? CORS_PROXY + encodeURIComponent(_nomUrl2) : _nomUrl2)
		.then(r => r.json())
		.then(results => {
			if (_iranMapGen !== myMapGen) return;
			const geo = results?.[0]?.geojson;
			if (geo) {
				L.geoJSON(geo, { style: { color: FF_RED, weight: 2.5, fillColor: FF_RED, fillOpacity: 0.15 } })
					.addTo(_iranMap)
					.bindPopup(`<b style="color:${FF_RED};">${country.name}</b> — Attacked by Iran`);
			} else {
				// Fallback: circle around computed center
				L.circle(center, { radius: 150000, color: FF_RED, weight: 2, fillColor: FF_RED, fillOpacity: 0.1 }).addTo(_iranMap);
			}
		})
		.catch(() => {
			if (_iranMapGen !== myMapGen) return;
			L.circle(center, { radius: 150000, color: FF_RED, weight: 2, fillColor: FF_RED, fillOpacity: 0.1 }).addTo(_iranMap);
		});
	}

	// Iran label
	L.marker(iranCenter, {
		icon: L.divIcon({
			className: '',
			html: `<div style="color:${FF_GREEN};font-weight:900;font-size:0.8rem;text-shadow:0 0 6px ${FF_GREEN},0 0 12px #000;white-space:nowrap;">🇮🇷 IRAN</div>`,
			iconAnchor: [20, 10],
		}), interactive: false,
	}).addTo(_iranMap);

	// Dashed lines + ONE blast icon per attacked country
	for (const country of countries) {
		const center = countryCenters[country.name];
		if (!center) continue;

		// Green dashed line from Iran to target
		L.polyline([iranCenter, center], {
			color: FF_GREEN, weight: 1.5, opacity: 0.6, dashArray: '4 6'
		}).addTo(_iranMap);

		// Summary stats for popup
		const totalK = country.events.reduce((s, e) => s + (e.cas?.k || 0), 0);
		const totalI = country.events.reduce((s, e) => s + (e.cas?.i || 0), 0);
		const totalMissiles = country.events.reduce((s, e) => s + (e.counts?.missiles || 0) + (e.counts?.cruise || 0), 0);
		const totalDrones = country.events.reduce((s, e) => s + (e.counts?.drones || 0), 0);
		const hasCas = totalK > 0 || totalI > 0;

		// Blast icon at end of line
		L.marker(center, {
			icon: L.divIcon({
				className: '',
				html: `<div style="font-size:1.6rem;filter:drop-shadow(0 0 8px ${FF_RED});cursor:pointer;">💥</div>`,
				iconSize: [28, 28], iconAnchor: [14, 14],
			}),
		}).addTo(_iranMap).bindPopup(
			`<div style="font-size:0.82rem;max-width:220px;line-height:1.7;">
				<b style="color:${country.color};font-size:0.95rem;">${iranFlagImg(country.name)} ${country.name}</b><br>
				<span style="color:#aaa;">${country.events.length} attack events</span><br>
				${totalMissiles ? `🚀 ${totalMissiles.toLocaleString()} missiles<br>` : ''}
				${totalDrones ? `✈️ ${totalDrones.toLocaleString()} drones<br>` : ''}
				${hasCas ? `<span style="color:#f87171;">💀 ${totalK} killed &nbsp;🩸 ${totalI} injured</span>` : '<span style="color:#34d399;">✅ No casualties</span>'}
			</div>`
		);

		// Country label (offset above blast)
		L.marker([center[0] + 0.8, center[1]], {
			icon: L.divIcon({
				className: '',
				html: `<div style="color:${FF_RED};font-size:0.72rem;font-weight:900;text-shadow:0 0 4px #000,0 0 8px #000;white-space:nowrap;">${iranFlagImg(country.name)} ${country.name}</div>`,
				iconAnchor: [30, 8],
			}), interactive: false,
		}).addTo(_iranMap);
	}

	setTimeout(() => _iranMap.invalidateSize(), 150);
}

function iranTip(el, show) {
	const tip = document.getElementById('iranBubbleTip');
	if (!tip) return;
	if (!show) { tip.style.display='none'; return; }
	const parts = (el.dataset.tip||'').split('|');
	const hasCas = parts[2] && !parts[2].includes('No casualties');
	document.getElementById('iranTipR1').textContent = parts[0]||'';
	document.getElementById('iranTipR2').innerHTML   = (parts[1]||'').split('\n').map(l=>`<div>${l}</div>`).join('');
	const casText = parts[2]||'';
	const tipR3 = document.getElementById('iranTipR3');
	tipR3.style.display = casText ? 'block' : 'none';
	tipR3.innerHTML = casText ? `<span style="color:#f87171;">${casText}</span>` : '';
	document.getElementById('iranTipR4').textContent = parts[3]||'';
	const rect = el.getBoundingClientRect();
	const tw=220, th=100;
	let left = rect.left + rect.width/2 - tw/2;
	let top  = rect.top  - th - 8;
	if (top < 60)                   top  = rect.bottom + 8;
	if (left < 8)                   left = 8;
	if (left+tw > window.innerWidth-8) left = window.innerWidth-tw-8;
	tip.style.left    = left+'px';
	tip.style.top     = top+'px';
	tip.style.display = 'block';
}
// ── End Iran Attacks ──────────────────────────────────────────────────────
