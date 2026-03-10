// ── Iran Attacks Since Oct 7 ──────────────────────────────────────────────
let _iranEventsFlat = [];
let _iranTimeRange  = 'all';
let _iranCountries  = null;
let _iranFetching   = false;

function iranFlagImg(name) {
	const MAP = {
		'Israel':'il','UAE':'ae','Saudi Arabia':'sa','Bahrain':'bh',
		'Qatar':'qa','Kuwait':'kw','Jordan':'jo','Oman':'om',
		'Iraq':'iq','Syria':'sy','Yemen':'ye','Lebanon':'lb',
		'Pakistan':'pk','Turkey':'tr','Egypt':'eg','Libya':'ly',
		'Tunisia':'tn','Morocco':'ma','Algeria':'dz','Sudan':'sd',
		'Afghanistan':'af','Iran':'ir','Red Sea / Ships':'',
	};
	const code = MAP[name];
	if (!code) return '<span style="font-size:0.9rem;">🚢</span>';
	return `<img src="https://flagcdn.com/16x12/${code}.png" style="width:20px;height:15px;border-radius:2px;vertical-align:middle;display:inline-block;">`;
}

function openIranAttacks() {
	document.getElementById('iranAttacksOverlay').classList.add('active');
	document.body.style.overflow = 'hidden';
	// Always show loading and fetch fresh live data on every open
	document.getElementById('iranAttacksContent').innerHTML = `
		<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:3rem 1rem;gap:1rem;">
			<div style="width:40px;height:40px;border:3px solid rgba(251,146,60,0.2);border-top-color:#fb923c;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
			<div style="color:rgba(255,255,255,0.5);font-size:0.85rem;">Fetching latest attack data...</div>
			<div style="color:rgba(255,255,255,0.25);font-size:0.72rem;">Searching live news sources</div>
		</div>`;
	fetchIranLiveData();
}

function closeIranAttacks() {
	document.getElementById('iranAttacksOverlay').classList.remove('active');
	if (!document.querySelector('.ai-sum-overlay.active')) {
		document.body.style.overflow = 'auto';
	}
}

function setIranRange(r) {
	_iranTimeRange = r;
	renderIranAttacks();
}

function getIranBaseData() {
	return [
		{ name:'Israel', color:'#fbbf24', events:[
			{ ts:'2026-02-28T22:00', types:['missiles','drones'], targets:['Residential','Military base'], counts:{missiles:70,drones:100}, cas:{k:1,i:12}, detail:'~70 ballistic missiles + 100 drones. 1 woman killed in Tel Aviv from shrapnel. Iron Dome/Arrow intercepted majority.' },
			{ ts:'2026-03-01T06:00', types:['missiles'], targets:['Residential'], counts:{missiles:35}, cas:{k:8,i:20}, detail:'Ballistic missile struck Beit Shemesh. 8 killed, ~20 injured. Sirens across Tel Aviv from 06:00.' },
			{ ts:'2026-03-01T15:00', types:['missiles','drones'], targets:['Military base'], counts:{missiles:30,drones:50}, cas:{k:0,i:5}, detail:'Afternoon barrages. Mostly intercepted by Iron Dome and Arrow.' },
			{ ts:'2026-03-02T08:00', types:['drones'], targets:['Residential'], counts:{drones:40}, cas:{k:0,i:3}, detail:'Drone swarms overnight. Sirens in Galilee and central Israel.' },
		]},
		{ name:'UAE', color:'#f87171', events:[
			{ ts:'2026-02-28T20:00', types:['missiles','drones'], targets:['Military base','Airport','Port','Hotel'], counts:{missiles:137,drones:209}, cas:{k:1,i:7}, detail:'Day 1. Fires at Palm Jumeirah Fairmont, Burj Al Arab, Jebel Ali Port, Dubai Airport. 1 killed at Abu Dhabi Airport.' },
			{ ts:'2026-03-01T04:30', types:['missiles','drones','cruise'], targets:['Hotel','Port','Data center','Military base'], counts:{missiles:28,drones:150,cruise:2}, cas:{k:1,i:15}, detail:'AWS data center hit. French naval base struck. US consulate fire. Dubai Airport Terminal 3 struck.' },
			{ ts:'2026-03-02T09:00', types:['missiles','drones'], targets:['Residential','Military base'], counts:{missiles:10,drones:80}, cas:{k:0,i:20}, detail:'3rd day of continuous barrages. Debris across Dubai and Abu Dhabi.' },
			{ ts:'2026-03-03T07:00', types:['drones'], targets:['Residential'], counts:{drones:50}, cas:{k:0,i:10}, detail:'Daily drone waves. UAE air defenses intercept majority.' },
			{ ts:'2026-03-04T00:00', types:['drones','missiles'], targets:['Embassy/Consulate','Port'], counts:{drones:121,missiles:3}, cas:{k:1,i:40}, detail:'US consulate Dubai struck. 3 ballistic missiles + 121 drones intercepted overnight.' },
			{ ts:'2026-03-05T19:00', types:['missiles','drones'], targets:['Residential','Industrial'], counts:{missiles:7,drones:60}, cas:{k:0,i:6}, detail:'Safety alerts Abu Dhabi, Dubai, Sharjah. 6 workers injured in ICAD 2 industrial area.' },
		]},
		{ name:'Saudi Arabia', color:'#fb923c', events:[
			{ ts:'2026-02-28T21:00', types:['missiles','drones'], targets:['Capital city','Military base'], counts:{missiles:30,drones:40}, cas:{k:0,i:0}, detail:'Riyadh and eastern region targeted. Saudi defenses repelled all.' },
			{ ts:'2026-03-02T10:00', types:['drones'], targets:['Embassy/Consulate'], counts:{drones:20}, cas:{k:0,i:0}, detail:'US embassy Riyadh targeted. All intercepted.' },
		]},
		{ name:'Bahrain', color:'#60a5fa', events:[
			{ ts:'2026-02-28T21:00', types:['missiles','drones'], targets:['Military base','Residential'], counts:{missiles:45,drones:9}, cas:{k:0,i:4}, detail:'US Navy 5th Fleet HQ Manama struck. Shahed drone hit tower block. 4 injured.' },
			{ ts:'2026-03-01T08:00', types:['drones'], targets:['Military base'], counts:{drones:15}, cas:{k:0,i:2}, detail:'Follow-up drone waves on US assets.' },
		]},
		{ name:'Qatar', color:'#a78bfa', events:[
			{ ts:'2026-02-28T22:00', types:['missiles','drones','cruise'], targets:['Military base','Radar station'], counts:{missiles:65,drones:12,cruise:1}, cas:{k:0,i:16}, detail:'Al Udeid Air Base targeted. Long-range radar struck. 16 injured.' },
			{ ts:'2026-03-04T12:00', types:['drones','cruise'], targets:['Military base'], counts:{drones:10,cruise:2}, cas:{k:0,i:0}, detail:'10 drones + 2 cruise missiles intercepted. 10 IRGC agents arrested.' },
		]},
		{ name:'Kuwait', color:'#34d399', events:[
			{ ts:'2026-02-28T23:00', types:['missiles','drones'], targets:['Military base'], counts:{missiles:97,drones:283}, cas:{k:0,i:0}, detail:'97 missiles + 283 drones via maritime routes. All intercepted.' },
		]},
		{ name:'Jordan', color:'#e879f9', events:[
			{ ts:'2026-02-28T22:00', types:['missiles','drones'], targets:['Airspace'], counts:{missiles:20,drones:29}, cas:{k:0,i:0}, detail:'49 drones and missiles intercepted over Amman and northern Jordan.' },
		]},
		{ name:'Oman', color:'#2dd4bf', events:[
			{ ts:'2026-03-01T14:00', types:['drones'], targets:['Port'], counts:{drones:2}, cas:{k:0,i:1}, detail:'2 drones struck Duqm commercial port. 1 worker injured.' },
		]},
		{ name:'Red Sea / Ships', color:'#38bdf8', events:[
			{ ts:'2026-03-01T10:00', types:['drones'], targets:['Ship (tanker)'], counts:{drones:1}, cas:{k:0,i:4}, detail:'Tanker "Skylight" struck in Strait of Hormuz. 4 mariners wounded.' },
		]},
	];
}

async function fetchIranLiveData() {
	if (_iranFetching) return;
	_iranFetching = true;
	const btn = document.getElementById('iranRefreshBtn');
	if (btn) { btn.textContent = '⏳ Fetching...'; btn.disabled = true; }

	try {
		const today = new Date().toISOString().split('T')[0];
		const resp = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: 'claude-sonnet-4-20250514',
				max_tokens: 4000,
				tools: [{ type: 'web_search_20250305', name: 'web_search' }],
				system: `You are a military analyst with precise geographic knowledge. Search the web for ALL confirmed Iran missile, drone, and rocket attacks on other countries from February 28 2026 until today (${today}). Use multiple searches to be thorough. Return ONLY a valid JSON array — no markdown fences, no explanation, no preamble. Schema: [{"name":"Country name","color":"#hex","events":[{"ts":"2026-MM-DDTHH:MM","types":["missiles"|"drones"|"cruise"|"rockets"],"targets":["Military base"|"Residential"|"Airport"|"Port"|"Hotel"|"Ship"|"Embassy"|"Radar"|"Data center"|"Industrial"],"counts":{"missiles":N,"drones":N,"cruise":N,"rockets":N},"cas":{"k":N,"i":N},"lat":DECIMAL_LAT,"lng":DECIMAL_LNG,"location_name":"Specific place name e.g. Dubai International Airport, Palm Jumeirah, Beit Shemesh, Al Udeid Air Base","detail":"1-2 sentence factual description with numbers"}]}]. CRITICAL: lat/lng are MANDATORY for every event — use the exact real-world coordinates of the named location. Colors: Israel=#fbbf24, UAE=#f87171, Saudi Arabia=#fb923c, Bahrain=#60a5fa, Qatar=#a78bfa, Kuwait=#34d399, Jordan=#e879f9, Oman=#2dd4bf, Red Sea / Ships=#38bdf8, Iraq=#a3e635, Syria=#e11d48. Only include attack types actually used. Include every country attacked. Use real verified data.`,
				messages: [{ role: 'user', content: `Search for: "Iran missile attack 2026", "Iran drone attack Gulf 2026", "Iran strikes UAE Israel Saudi Arabia March 2026". Today is ${today}. Every event MUST have lat/lng of the exact location hit (e.g. Dubai Airport=25.2532,55.3657 — not just country center). Return complete JSON array only.` }]
			})
		});
		const data = await resp.json();
		const text = (data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
		const clean = text.replace(/```json[\s\S]*?```/g, s => s.slice(7,-3)).replace(/```/g,'').trim();
		const jsonMatch = clean.match(/\[[\s\S]*\]/);
		const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : clean);
		if (Array.isArray(parsed) && parsed.length > 0) {
			_iranCountries = parsed;
			renderIranAttacks();
			if (_iranMap) buildIranMap();
			// Update status after render
			const statusEl = document.getElementById('iranDataStatus');
			if (statusEl) {
				const totalEvents = parsed.reduce((s,c)=>s+(c.events||[]).length,0);
				statusEl.innerHTML = `🟢 Live data · ${parsed.length} countries · ${totalEvents} attack events · updated ${new Date().toLocaleTimeString()}`;
			}
		} else {
			throw new Error('Empty or invalid response');
		}
	} catch(e) {
		// Fall back to hardcoded data
		if (!_iranCountries) _iranCountries = getIranBaseData();
		renderIranAttacks();
		const statusEl = document.getElementById('iranDataStatus');
		if (statusEl) statusEl.innerHTML = `🔴 Live fetch failed · showing hardcoded data · <span style="cursor:pointer;text-decoration:underline;" onclick="fetchIranLiveData()">retry</span>`;
	} finally {
		_iranFetching = false;
		const btn2 = document.getElementById('iranRefreshBtn');
		if (btn2) { btn2.textContent = '🔄 Refresh'; btn2.disabled = false; }
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
	const COUNTRIES = _iranCountries || getIranBaseData();

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
			return `<div style="position:absolute;left:${t.pct}%;font-size:0.58rem;color:rgba(255,255,255,0.35);transform:${transform};">${t.lbl}</div>`;
		}).join('')}
	</div>`;

	const gridLines = ticks.map(t=>`<div style="position:absolute;left:${t.pct}%;top:0;bottom:0;border-left:1px solid rgba(255,255,255,0.05);pointer-events:none;"></div>`).join('');

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
		<div id="iranDataStatus" style="font-size:0.65rem;color:rgba(255,255,255,0.3);margin-bottom:0.5rem;">🟡 Showing cached data · press Refresh for live updates</div>
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
			<div id="iranMapContainer" style="width:100%;height:500px;border-radius:10px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);"></div>
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

	// Country ISO3 codes for GeoJSON fetch
	const COUNTRY_ISO = {
		'Iran':         'IRN',
		'Israel':       'ISR',
		'UAE':          'ARE',
		'Saudi Arabia': 'SAU',
		'Bahrain':      'BHR',
		'Qatar':        'QAT',
		'Kuwait':       'KWT',
		'Jordan':       'JOR',
		'Oman':         'OMN',
		'Iraq':         'IRQ',
		'Syria':        'SYR',
		'Yemen':        'YEM',
	};

	// Country label centers
	const COUNTRY_CENTERS = {
		'Iran':         [32.5, 53.7],
		'Israel':       [31.5, 35.0],
		'UAE':          [24.2, 54.5],
		'Saudi Arabia': [24.7, 46.7],
		'Bahrain':      [26.1, 50.6],
		'Qatar':        [25.3, 51.2],
		'Kuwait':       [29.4, 47.6],
		'Jordan':       [31.0, 36.5],
		'Oman':         [21.5, 57.5],
		'Iraq':         [33.0, 44.0],
		'Syria':        [35.0, 38.0],
		'Yemen':        [16.0, 48.0],
	};

	const TYPE_ICONS = { missiles:'🚀', drones:'✈️', cruise:'💥', rockets:'🎯' };
	const TARGET_ICONS = {
		'military base':'🪖','airport':'✈️','port':'⚓','hotel':'🏨',
		'residential':'🏠','ship':'🚢','embassy':'🏛️','radar':'📡',
		'data center':'💾','industrial':'🏭','capital city':'🏙️',
		'radar station':'📡','ship (tanker)':'🛢️','airspace':'🌐',
		'embassy/consulate':'🏛️','airbase':'✈️','air base':'✈️',
		'power plant':'⚡','oil facility':'🛢️','nuclear site':'☢️',
		'headquarters':'🏢','naval base':'⚓','troops':'🪖',
	};
	const getTargetIcon = t => TARGET_ICONS[t.toLowerCase()] || '🎯';

	const FF_GREEN = '#39FF14';
	const FF_RED   = '#FF3333';

	// Load GeoJSON borders for Iran + all attacked countries
	const countries   = _iranCountries || getIranBaseData();
	const attackedSet = new Set(countries.map(c=>c.name));
	const toLoad  = ['Iran', ...attackedSet].filter(n=>COUNTRY_ISO[n]);
	const iranCenter = [32.5, 53.7];

	// ISO2 codes for individual GeoJSON files
	const COUNTRY_ISO2 = {
		'Iran':'IR','Israel':'IL','UAE':'AE','Saudi Arabia':'SA',
		'Bahrain':'BH','Qatar':'QA','Kuwait':'KW','Jordan':'JO',
		'Oman':'OM','Iraq':'IQ','Syria':'SY','Yemen':'YE',
	};

	// English names Nominatim understands
	const NOMINATIM_NAMES = {
		'Iran':'Iran','Israel':'Israel','UAE':'United Arab Emirates',
		'Saudi Arabia':'Saudi Arabia','Bahrain':'Bahrain','Qatar':'Qatar',
		'Kuwait':'Kuwait','Jordan':'Jordan','Oman':'Oman',
		'Iraq':'Iraq','Syria':'Syria','Yemen':'Yemen',
	};

	toLoad.forEach(name => {
		const isIran  = name === 'Iran';
		const color   = isIran ? FF_GREEN : FF_RED;
		const qname   = encodeURIComponent(NOMINATIM_NAMES[name] || name);
		fetch(`https://nominatim.openstreetmap.org/search?q=${qname}&polygon_geojson=1&format=json&limit=1&featuretype=country`, {
			headers:{ 'Accept-Language':'en', 'User-Agent':'HamalWarMap/1.0' }
		})
		.then(r => r.json())
		.then(results => {
			const geo = results?.[0]?.geojson;
			if (!geo) throw new Error('no geojson');
			L.geoJSON(geo, {
				style:{ color, weight:2.5, fillColor:color, fillOpacity:0.15 }
			}).addTo(_iranMap)
			  .bindPopup(`<b style="color:${color};">${name}</b>${isIran?' — Origin of attacks':' — Attacked by Iran'}`);
		})
		.catch(() => {
			if (_iranMapGen !== myMapGen) return;
			// Final fallback: use naturalearth via jsdelivr (cached CDN, fast)
			fetch(`https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_10m_admin_0_countries.geojson`)
			.then(r=>r.json())
			.then(world=>{
				if (_iranMapGen !== myMapGen) return;
				const ISO_MAP = {
					'Iran':'IRN','Israel':'ISR','UAE':'ARE','Saudi Arabia':'SAU',
					'Bahrain':'BHR','Qatar':'QAT','Kuwait':'KWT','Jordan':'JOR',
					'Oman':'OMN','Iraq':'IRQ','Syria':'SYR','Yemen':'YEM',
				};
				const feat = world.features.find(f=>f.properties.ADM0_A3===ISO_MAP[name]);
				if (!feat) return;
				L.geoJSON(feat, {
					style:{ color, weight:2.5, fillColor:color, fillOpacity:0.15 }
				}).addTo(_iranMap)
				  .bindPopup(`<b style="color:${color};">${name}</b>${isIran?' — Origin of attacks':' — Attacked by Iran'}`);
			})
			.catch(()=>{
				if (_iranMapGen !== myMapGen) return;
				// Absolute last resort: circle
				const c = COUNTRY_CENTERS[name];
				if (c) L.circle(c,{radius:200000,color,weight:2.5,fillColor:color,fillOpacity:0.15}).addTo(_iranMap);
			});
		});
	});

	// Iran label
	L.marker(iranCenter, {
		icon: L.divIcon({
			className:'',
			html:`<div style="color:${FF_GREEN};font-weight:900;font-size:0.8rem;text-shadow:0 0 6px ${FF_GREEN},0 0 12px #000;white-space:nowrap;">🇮🇷 IRAN</div>`,
			iconAnchor:[20,10],
		}), interactive:false,
	}).addTo(_iranMap);

	// Dashed attack lines + country labels + strike markers from live data
	for (const country of countries) {
		const center = COUNTRY_CENTERS[country.name];
		if (!center) continue;

		// Dashed line from Iran
		L.polyline([iranCenter, center], {
			color:FF_GREEN, weight:1, opacity:0.6, dashArray:'4 6'
		}).addTo(_iranMap);

		// Country label
		L.marker(center, {
			icon: L.divIcon({
				className:'',
				html:`<div style="color:${FF_RED};font-size:0.68rem;font-weight:900;text-shadow:0 0 4px #000,0 0 8px #000;white-space:nowrap;">${iranFlagImg(country.name)} ${country.name}</div>`,
				iconAnchor:[30,8],
			}), interactive:false,
		}).addTo(_iranMap);

		// Strike markers from live event data
		for (const ev of (country.events||[])) {
			const mainType   = (ev.types||[])[0] || 'missiles';
			const mainTarget = ((ev.targets||[])[0]||'').toLowerCase();

			const placeMarker = (coords, ev, country, mainType, mainTarget) => {
				const icon    = TYPE_ICONS[mainType] || '💥';
				const tIcon   = getTargetIcon(mainTarget);
				const hasCas  = ev.cas && (ev.cas.k>0||ev.cas.i>0);
				const countStr= Object.entries(ev.counts||{}).map(([k,v])=>`${v} ${k}`).join(', ');
				const [dp,tp] = ev.ts.split('T');
				const [y,m,d] = dp.split('-');
				L.marker(coords, {
					icon: L.divIcon({
						className:'',
						html:`<div style="font-size:1.3rem;filter:drop-shadow(0 0 5px rgba(0,0,0,0.95));cursor:pointer;background:none;border:none;box-shadow:none;">${icon}</div>`,
						iconSize:[24,24], iconAnchor:[12,12], bgPos:[0,0],
					}),
				}).addTo(_iranMap).bindPopup(
					`<div style="font-size:0.78rem;max-width:200px;line-height:1.6;">
						<b style="color:${FF_RED};">${iranFlagImg(country.name)} ${country.name}</b><br>
						<span style="color:#aaa;">${d}/${m}/${y} ${tp}</span><br>
						${ev.location_name?`<span style="color:#fff;font-weight:600;">${ev.location_name}</span><br>`:''}
						${icon} ${countStr}<br>
						${tIcon} ${(ev.targets||[]).join(', ')}
						${hasCas?`<br><span style="color:#f87171;">💀 ${ev.cas.k} killed &nbsp;🩸 ${ev.cas.i} injured</span>`:''}
						<br><span style="color:#ccc;font-size:0.72rem;">${ev.detail||''}</span>
					</div>`
				);
			};

			if (ev.lat && ev.lng) {
				// API returned coordinates — use them directly
				placeMarker([ev.lat, ev.lng], ev, country, mainType, mainTarget);
			} else {
				// No coordinates — geocode the location name via Nominatim
				const query = ev.location_name
					? `${ev.location_name}, ${country.name}`
					: `${(ev.targets||[]).join(' ')}, ${country.name}`;
				fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
					headers:{ 'Accept-Language':'en', 'User-Agent':'HamalWarMap/1.0' }
				})
				.then(r=>r.json())
				.then(results => {
					if (_iranMapGen !== myMapGen) return;
					if (results?.[0]?.lat) {
						placeMarker([parseFloat(results[0].lat), parseFloat(results[0].lon)], ev, country, mainType, mainTarget);
					} else if (center) {
						// Last resort — jitter around country center
						placeMarker([center[0]+(Math.random()-0.5)*1.2, center[1]+(Math.random()-0.5)*1.2], ev, country, mainType, mainTarget);
					}
				})
				.catch(() => {
					if (_iranMapGen !== myMapGen) return;
					if (center) placeMarker([center[0]+(Math.random()-0.5)*1.2, center[1]+(Math.random()-0.5)*1.2], ev, country, mainType, mainTarget);
				});
				continue; // skip the old marker code below
			}
			if (!ev.lat || !ev.lng) continue;

			
		}
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