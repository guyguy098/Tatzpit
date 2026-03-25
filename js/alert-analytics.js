// ══════════════════════════════════════════════════════════════════════════
// ALERT ANALYTICS
// Colors: Red=#f87171 Rockets | Orange=#fb923c Drones | Purple=#a78bfa Infiltration
//         Teal=#2dd4bf Hazmat | Blue=#60a5fa Stats | Green=#34d399 Calm | Yellow=#fbbf24 Warn
// ══════════════════════════════════════════════════════════════════════════

let _analyticsRawEvents = null;
let _analyticsFilter    = 'all';
let _analyticsChartRange = '24h';

const AA_THREAT_LABELS = {
	0:'Rockets / Missiles',1:'Unconventional Threat',2:'Terrorist Infiltration',
	3:'Hazmat / Chemical',4:'Earthquake',5:'Hostile Aircraft / Drones',6:'Tsunami',7:'Radiological'
};
const AA_THREAT_ICONS = {
	0:'fa-rocket',1:'fa-skull-crossbones',2:'fa-person-running',
	3:'fa-biohazard',4:'fa-wave-square',5:'fa-plane-slash',6:'fa-water',7:'fa-radiation'
};
const AA_THREAT_COLORS = {
	0:'#f87171',1:'#e879f9',2:'#a78bfa',3:'#2dd4bf',4:'#60a5fa',5:'#fb923c',6:'#38bdf8',7:'#fbbf24'
};

const AA_isNorth      = c => /מטולה|קריית שמונה|נהריה|עכו|חיפה|טבריה|נצרת|גליל|כרמל|עפולה|בית שאן|שגור|מעלות|שלומי|נקרה|כינרת|צפת|גולן|בוקעתא|שמס|מסעדה|כצרין|קצרין|יזרעאל|קריית אתא|קריית ביאליק|קריית מוצקין|קריית ים|נשר|טירת כרמל|שפרעם|פקיעין|מגדל|זיכרון/.test(c);
const AA_isSouth      = c => /שדרות|ספיר|נתיבות|אופקים|רהט|באר שבע|אשקלון|אשדוד|גן יבנה|קריית גת|ניר עם|כיסופים|נירים|ניר עוז|בארי|עזה|נחל עוז|רעים|כפר עזה|מבקיעים|ניר משה|שוקדה|תקומה|יד מרדכי|לכיש|אשכול/.test(c);
const AA_isCenter     = c => /תל אביב|ראשון לציון|פתח תקווה|רמת גן|בת ים|חולון|הרצליה|נתניה|כפר סבא|רעננה|הוד השרון|רמת השרון|גבעתיים|בני ברק|אור יהודה|יהוד|לוד|רמלה|ראש העין|אלעד/.test(c);
const AA_isJerusalem  = c => /ירושלים|בית שמש|מבשרת|גבעת זאב|עציון|תקוע|הר גילה/.test(c);
const AA_isWestBank   = c => /אריאל|שומרון|בנימין|אלפי מנשה|קרני שומרון|עפרה|שילה|קדומים|אלקנה|ברקן|מעלה אדומים|מודיעין עילית|ביתר עילית|נוקדים|כוכב השחר|מעלה מכמש|מצפה יריחו/.test(c);

function AA_getRegion(city) {
	if (AA_isNorth(city))     return { r:'North',        src:'Hezbollah (Lebanon)',       sc:'#fb923c' };
	if (AA_isJerusalem(city)) return { r:'Jerusalem',    src:'Multiple',                  sc:'#a78bfa' };
	if (AA_isWestBank(city))  return { r:'West Bank',    src:'Palestinian Militias',      sc:'#e879f9' };
	if (AA_isSouth(city))     return { r:'South (Gaza)', src:'Hamas / PIJ',               sc:'#f87171' };
	if (AA_isCenter(city))    return { r:'Center',       src:'Long-range (Hamas/Houthis)',sc:'#60a5fa' };
	return                           { r:'Other',        src:'Unknown',                   sc:'#94a3b8' };
}

function AA_formatTime(s) {
	if (!s||s<=0) return '0s';
	if (s<60) return s+'s';
	if (s<3600) return Math.round(s/60)+'m';
	return (s/3600).toFixed(1)+'h';
}

function openAlertAnalytics() {
	document.getElementById('alertAnalyticsOverlay').classList.add('active');
	document.body.style.overflow = 'hidden';
	document.documentElement.style.overflow = 'hidden';
	if (!_analyticsRawEvents) fetchAlertAnalytics();
	else renderAnalytics();
}

function closeAlertAnalytics() {
	document.getElementById('alertAnalyticsOverlay').classList.remove('active');
	if (!document.querySelector('.ai-sum-overlay.active')) {
		document.body.style.overflow = '';
		document.documentElement.style.overflow = '';
	}
}

async function fetchAlertAnalytics() {
	const loading = document.getElementById('alertAnalyticsLoading');
	const content = document.getElementById('alertAnalyticsContent');
	const btn     = document.getElementById('alertAnalyticsRefreshBtn');
	loading.classList.add('active');
	content.style.display = 'none';
	btn.disabled = true;

	const ALERT_API = 'https://api.tzevaadom.co.il/alerts-history';
	let data = null;

	// Try fetching via our Cloudflare proxy first, then public fallbacks
	const proxies = [
		CORS_PROXY + encodeURIComponent(ALERT_API),
		'https://api.allorigins.win/raw?url=' + encodeURIComponent(ALERT_API),
		'https://corsproxy.io/?' + encodeURIComponent(ALERT_API),
	];

	for (const proxyUrl of proxies) {
		try {
			const r = await fetch(proxyUrl, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
			if (r.ok) {
				const json = await r.json();
				if (Array.isArray(json) && json.length > 0) {
					data = json;
					console.log(`Alert data fetched via proxy: ${data.length} events`);
					break;
				}
			}
		} catch(e) { console.warn('Proxy failed:', e.message); }
	}

	loading.classList.remove('active');
	btn.disabled = false;

	if (!data || !Array.isArray(data) || !data.length) {
		content.innerHTML = '<p style="color:rgba(255,255,255,0.4);text-align:center;padding:3rem;">Could not fetch alert data. Try again shortly.</p>';
		content.style.display = 'block';
		return;
	}

	_analyticsRawEvents = data;
	_analyticsFilter = 'all';
	_analyticsChartRange = '24h';
	renderAnalytics();
}

function setAnalyticsFilter(f) { _analyticsFilter=f; renderAnalytics(); }

function setChartRange(r)      { _analyticsChartRange=r; renderTimeChart(); }

function toggleMoreCities(id) {
	const el=document.getElementById(id), btn=document.getElementById(id+'-btn');
	if(el.style.display==='none'){el.style.display='flex';btn.textContent='▲ Show less';}
	else{el.style.display='none';btn.textContent='▼ Show all '+btn.dataset.total+' areas';}
}

function renderAnalytics() {
	const content=document.getElementById('alertAnalyticsContent');
	content.innerHTML=buildAnalyticsHTML(_analyticsRawEvents);
	content.style.display='block';
	renderTimeChart();
	fetchTelegramIntercepts();
	fetchWeatherCorrelation();
}

function renderTimeChart() {
	const chartDiv=document.getElementById('alertTimeChart');
	if(!chartDiv||!_analyticsRawEvents) return;
	const f=_analyticsFilter;
	const chartAlerts=[];
	for(const ev of _analyticsRawEvents) for(const a of (ev.alerts||[])) {
		if(a.isDrill) continue;
		const t=parseInt(a.threat);
		if(f==='all'||(f==='other'&&t!==0&&t!==5&&t!==2)||(f!=='all'&&f!=='other'&&t===parseInt(f))) chartAlerts.push(a);
	}
	const now=Math.floor(Date.now()/1000);
	const cfgs={'1h':{sec:3600,bkt:300},'5h':{sec:18000,bkt:900},'12h':{sec:43200,bkt:1800},'24h':{sec:86400,bkt:3600},'3d':{sec:259200,bkt:10800},'7d':{sec:604800,bkt:21600},'14d':{sec:1209600,bkt:43200},'30d':{sec:2592000,bkt:86400},'90d':{sec:7776000,bkt:259200},'180d':{sec:15552000,bkt:604800},'365d':{sec:31536000,bkt:1209600}};
	const cfg=cfgs[_analyticsChartRange]||cfgs['24h'];
	const rangeStart=now-cfg.sec, numBuckets=Math.ceil(cfg.sec/cfg.bkt), buckets=Array(numBuckets).fill(0);
	let inRange=0;
	for(const a of chartAlerts) if(a.time>=rangeStart){const idx=Math.min(numBuckets-1,Math.floor((a.time-rangeStart)/cfg.bkt));buckets[idx]++;inRange++;}
	const maxVal=Math.max(...buckets,1), chartH=100, barW=Math.max(2,Math.floor(560/numBuckets)), gap=numBuckets>80?0:1, svgW=numBuckets*(barW+gap), labelEvery=Math.max(1,Math.ceil(numBuckets/9));
	let bars='',labels='';
	for(let i=0;i<numBuckets;i++){
		const bTime=rangeStart+i*cfg.bkt, d=new Date(bTime*1000), hr=d.getHours(), isNight=hr<6||hr>=22;
		const h=Math.round((buckets[i]/maxVal)*chartH), x=i*(barW+gap);
		const color=buckets[i]===0?'rgba(255,255,255,0.04)':isNight?'#a78bfa':'#f87171';
		bars+=`<rect x="${x}" y="${chartH-h}" width="${barW}" height="${Math.max(h,buckets[i]>0?2:0)}" fill="${color}" rx="1" opacity="0.82"><title>${buckets[i]} alert waves</title></rect>`;
		if(i%labelEvery===0||i===numBuckets-1){
			const lbl=cfg.sec<=43200?String(hr).padStart(2,'0')+':'+(cfg.sec<=18000?String(d.getMinutes()).padStart(2,'0'):'00'):(d.getMonth()+1)+'/'+d.getDate();
			labels+=`<text x="${x+barW/2}" y="${chartH+14}" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="9">${lbl}</text>`;
		}
	}
	const peakIdx=buckets.indexOf(Math.max(...buckets)), peakX=peakIdx*(barW+gap)+barW/2;
	chartDiv.innerHTML=`
		<div style="color:rgba(255,255,255,0.3);font-size:0.73rem;margin-bottom:0.4rem;">${inRange} alert waves in range${inRange===0?' — dataset may not go back this far':''}</div>
		<div style="overflow-x:auto;"><svg width="${Math.max(svgW,200)}" height="${chartH+22}" style="display:block;min-width:100%;">${bars}${labels}${maxVal>1?`<line x1="${peakX}" y1="0" x2="${peakX}" y2="${chartH}" stroke="rgba(255,255,255,0.18)" stroke-dasharray="3,2" stroke-width="1"/>`:''}
		</svg></div>
		<div style="display:flex;gap:1.5rem;margin-top:0.4rem;">
			<span style="font-size:0.7rem;color:rgba(167,139,250,0.8);">▮ Night (22–06)</span>
			<span style="font-size:0.7rem;color:rgba(248,113,113,0.8);">▮ Day</span>
			<span style="font-size:0.7rem;color:rgba(255,255,255,0.25);">— Peak</span>
		</div>`;
	document.querySelectorAll('[id^="chartRangeBtn_"]').forEach(b=>{
		const active=b.id==='chartRangeBtn_'+_analyticsChartRange;
		b.style.borderColor=active?'#60a5fa':'rgba(255,255,255,0.1)';
		b.style.background=active?'rgba(96,165,250,0.15)':'rgba(255,255,255,0.04)';
		b.style.color=active?'#60a5fa':'rgba(255,255,255,0.4)';
	});
}

function buildAnalyticsHTML(events) {
	const now=Math.floor(Date.now()/1000), f=_analyticsFilter;
	const allAlertsRaw=[], allAlerts=[];
	for(const ev of events) for(const a of (ev.alerts||[])){
		const ta={...a,eventId:ev.id}; allAlertsRaw.push(ta);
		const t=parseInt(a.threat);
		if(f==='all'||(f==='other'&&t!==0&&t!==5&&t!==2)||(f!=='all'&&f!=='other'&&t===parseInt(f))) allAlerts.push(ta);
	}
	const ndRaw=allAlertsRaw.filter(a=>!a.isDrill), ndAlerts=allAlerts.filter(a=>!a.isDrill);
	const ndEvents=events.filter(ev=>ev.alerts&&ev.alerts.some(a=>{
		if(a.isDrill) return false; const t=parseInt(a.threat);
		return f==='all'||(f==='other'&&t!==0&&t!==5&&t!==2)||(f!=='all'&&f!=='other'&&t===parseInt(f));
	}));
	const card=(h,ex='')=>`<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:1.2rem;${ex}">${h}</div>`;
	const lbl=(t,c='rgba(255,255,255,0.38)')=>`<div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:0.07em;color:${c};margin-bottom:0.4rem;font-weight:600;">${t}</div>`;
	const big=(n,c='#60a5fa',sub='')=>`<div style="font-size:1.9rem;font-weight:800;color:${c};line-height:1;">${n}</div>${sub?`<div style="font-size:0.74rem;color:rgba(255,255,255,0.32);margin-top:0.25rem;">${sub}</div>`:''}`;
	let html=`<div style="display:grid;gap:0.9rem;">`;

	// Filter tabs
	const tCounts={};
	for(const a of ndRaw) tCounts[parseInt(a.threat)]=(tCounts[parseInt(a.threat)]||0)+1;
	const tabs=[
		{f:'all',lbl:`All (${ndRaw.length})`,c:'#94a3b8'},
		{f:'0',lbl:`🚀 Rockets (${tCounts[0]||0})`,c:'#f87171'},
		...(tCounts[5]?[{f:'5',lbl:`✈️ Drones (${tCounts[5]})`,c:'#fb923c'}]:[]),
		...(tCounts[2]?[{f:'2',lbl:`🏃 Infiltration (${tCounts[2]})`,c:'#a78bfa'}]:[]),
		...(Object.keys(tCounts).some(t=>t!=0&&t!=5&&t!=2)?[{f:'other',lbl:'⚠️ Other',c:'#2dd4bf'}]:[]),
	];
	html+=`<div style="display:flex;flex-wrap:wrap;gap:0.35rem;">${tabs.map(tab=>{const active=f===tab.f;return`<button onclick="setAnalyticsFilter('${tab.f}')" style="padding:0.3rem 0.7rem;border-radius:20px;font-size:0.78rem;font-weight:600;cursor:pointer;border:1px solid ${active?tab.c:'rgba(255,255,255,0.1)'};background:${active?tab.c+'22':'rgba(255,255,255,0.04)'};color:${active?tab.c:'rgba(255,255,255,0.45)'};">${tab.lbl}</button>`;}).join('')}</div>`;

	if(!ndAlerts.length){html+=`<p style="color:rgba(255,255,255,0.4);text-align:center;padding:2rem;">No alerts of this type in the dataset.</p></div>`;return html;}

	const latestTime=ndAlerts.length?Math.max(...ndAlerts.map(a=>a.time)):null;
	const oldestTime=ndAlerts.length?Math.min(...ndAlerts.map(a=>a.time)):null;
	const currentQuiet=latestTime?now-latestTime:0;
	const drillCount=allAlertsRaw.filter(a=>a.isDrill).length;
	const drillPct=allAlertsRaw.length?Math.round(drillCount/allAlertsRaw.length*100):0;
	const evH1=ndEvents.filter(ev=>ev.alerts.some(a=>a.time>=now-3600));
	const evH6=ndEvents.filter(ev=>ev.alerts.some(a=>a.time>=now-21600));
	const evH12=ndEvents.filter(ev=>ev.alerts.some(a=>a.time>=now-43200));
	const evH24=ndEvents.filter(ev=>ev.alerts.some(a=>a.time>=now-86400));
	const salvoData=ndEvents.map(ev=>{const as=ev.alerts.filter(a=>!a.isDrill);const cities=as.reduce((s,a)=>s+(a.cities||[]).length,0);const tS=Math.min(...as.map(a=>a.time));const tE=Math.max(...as.map(a=>a.time));return{cities,duration:tE-tS,waves:as.length,tStart:tS};});
	const maxSalvo=Math.max(...salvoData.map(s=>s.cities),0);
	const avgSalvo=salvoData.length?Math.round(salvoData.reduce((s,v)=>s+v.cities,0)/salvoData.length):0;
	const maxDur=Math.max(...salvoData.map(s=>s.duration),0);
	const avgDur=salvoData.length?Math.round(salvoData.reduce((s,v)=>s+v.duration,0)/salvoData.length):0;
	const eTimes=salvoData.map(s=>s.tStart).sort((a,b)=>a-b);
	const gaps=[];for(let i=1;i<eTimes.length;i++) gaps.push(eTimes[i]-eTimes[i-1]);
	const longestGap=Math.max(...gaps,0), avgGap=gaps.length?Math.round(gaps.reduce((s,v)=>s+v,0)/gaps.length):0;
	const rate1h=evH1.length, rate6h=evH6.length/6;
	const trend=rate1h>rate6h*1.5?'↑ Escalating':rate1h<rate6h*0.5&&rate6h>0?'↓ De-escalating':rate1h===0&&rate6h===0?'— Calm':'→ Stable';
	const trendC=trend.startsWith('↑')?'#f87171':trend.startsWith('↓')?'#34d399':trend.includes('Calm')?'#34d399':'#60a5fa';
	const nd6h=ndAlerts.filter(a=>a.time>=now-21600);
	const sevMap={0:1.5,5:1.2,2:2.0,1:2.5,7:2.5,3:1.8,4:1.0,6:2.0};
	const maxSev=nd6h.length?Math.max(...[...new Set(nd6h.map(a=>a.threat))].map(t=>sevMap[t]||1)):1;
	const northA=nd6h.some(a=>(a.cities||[]).some(AA_isNorth)), southA=nd6h.some(a=>(a.cities||[]).some(AA_isSouth));
	const multiFront=northA&&southA;
	const avgCit6h=nd6h.length&&evH6.length?nd6h.reduce((s,a)=>s+(a.cities||[]).length,0)/evH6.length:0;
	const rawScore=Math.min(10,(rate6h*1.5+(avgCit6h/20)+(multiFront?2:0))*maxSev);
	const scoreC=rawScore>=7?'#f87171':rawScore>=4?'#fb923c':rawScore>=2?'#fbbf24':'#34d399';
	const scoreLbl=rawScore>=7?'CRITICAL':rawScore>=4?'HIGH':rawScore>=2?'MODERATE':rawScore>0?'LOW':'NONE';

	// ── Dashboards ────────────────────────────────────────────────────────────
	const _IL_OFF = 7200; // UTC+2 (Israel Standard Time; change to 10800 for DST / UTC+3)
	const _todS2 = Math.floor((now + _IL_OFF) / 86400) * 86400 - _IL_OFF;			const SINCE_328 = 1743120000; // 28 Mar 2026 00:00 UTC
	const SINCE_228 = 1740700800; // 28 Feb 2026 00:00 UTC
	const DIST_COLS = {'North':'#fb923c','Center':'#60a5fa','South (Gaza)':'#f87171','Jerusalem':'#a78bfa','West Bank':'#e879f9','Other':'#94a3b8'};

	const _arc = (segs, total, cx, cy, r, centerLbl) => {
		if (!total) return `<text x="${cx}" y="${cy+4}" text-anchor="middle" fill="rgba(255,255,255,0.25)" font-size="8">No data</text>`;
		const circ=2*Math.PI*r; let off=0, out='';
		for (const s of segs) { const dash=(s.v/total)*circ; out+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.c}" stroke-width="11" stroke-dasharray="${dash.toFixed(1)} ${(circ-dash).toFixed(1)}" stroke-dashoffset="${(-off).toFixed(1)}" transform="rotate(-90 ${cx} ${cy})" opacity="0.85"/>`; off+=dash; }
		return out+`<text x="${cx}" y="${cy-3}" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-size="9" font-weight="700">${total}</text><text x="${cx}" y="${cy+9}" text-anchor="middle" fill="rgba(255,255,255,0.32)" font-size="7">${centerLbl}</text>`;
	};
	const _legend = (segs, total) => segs.length ? segs.map(s=>`<div style="display:flex;align-items:center;gap:4px;margin-bottom:3px;"><div style="width:7px;height:7px;border-radius:50%;background:${s.c};flex-shrink:0;"></div><span style="font-size:0.6rem;color:rgba(255,255,255,0.55);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.lbl}</span><span style="font-size:0.6rem;color:rgba(255,255,255,0.3);">${total?Math.round(s.v/total*100):'0'}%</span></div>`).join('') : '<span style="font-size:0.6rem;color:rgba(255,255,255,0.25);">No data</span>';
	const _dCard = (title, inner) => `<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:0.85rem;display:flex;flex-direction:column;gap:0.4rem;min-width:0;overflow:hidden;"><div style="font-size:0.62rem;text-transform:uppercase;letter-spacing:0.07em;color:rgba(255,255,255,0.35);font-weight:600;margin-bottom:0.2rem;">${title}</div>${inner}</div>`;

	// Row 1 – Chart 1: daily events past 7 days (line + markers)
	const _wkL=[], _wkC=[];
	for(let i=6;i>=0;i--){const ds=_todS2-i*86400,de=ds+86400;const cnt=ndEvents.filter(ev=>{const t=Math.min(...ev.alerts.map(a=>a.time));return t>=ds&&t<de;}).length;const d=new Date(ds*1000);_wkL.push((d.getMonth()+1)+'/'+(d.getDate()));_wkC.push(cnt);}
	const _wkMax=Math.max(..._wkC,1),_svgW=230,_svgH=68,_svgPad=10;
	const _xs=_wkC.map((_,i)=>_svgPad+i*(_svgW-_svgPad*2)/6);
	const _ys=_wkC.map(v=>_svgH-4-(v/_wkMax)*(_svgH-16));
	let _lineSvg=`<line x1="${_svgPad}" y1="${_svgH-4}" x2="${_svgW-_svgPad}" y2="${_svgH-4}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/><polyline points="${_xs.map((x,i)=>x+','+_ys[i]).join(' ')}" fill="none" stroke="rgba(96,165,250,0.5)" stroke-width="1.5" stroke-linejoin="round"/>`;
	_xs.forEach((x,i)=>{_lineSvg+=`<circle cx="${x}" cy="${_ys[i]}" r="3.5" fill="#60a5fa" opacity="0.9"/>`;if(_wkC[i]>0)_lineSvg+=`<text x="${x}" y="${_ys[i]-7}" text-anchor="middle" fill="#60a5fa" font-size="8" font-weight="700">${_wkC[i]}</text>`;_lineSvg+=`<text x="${x}" y="${_svgH+6}" text-anchor="middle" fill="rgba(255,255,255,0.28)" font-size="7">${_wkL[i]}</text>`;});

	// Row 1 – Chart 2: total attacks by type since 28/3/2026 (column)
	const _stC={};
	for(const a of ndAlerts){if(a.time>=SINCE_328){const t=parseInt(a.threat);_stC[t]=(_stC[t]||0)+1;}}
	const _stE=Object.entries(_stC).sort((a,b)=>b[1]-a[1]);
	const _stMax=Math.max(..._stE.map(([,v])=>v),1),_stN=_stE.length||1,_stBW=Math.min(26,Math.floor(210/_stN*0.7));
	let _stSvg='';
	_stE.forEach(([t,v],i)=>{const x=10+i*(210/_stN);const bH=Math.round((v/_stMax)*58);const c=AA_THREAT_COLORS[parseInt(t)]||'#94a3b8';const lbl=(AA_THREAT_LABELS[parseInt(t)]||'Other').split('/')[0].trim().substring(0,8);_stSvg+=`<rect x="${x}" y="${62-bH}" width="${_stBW}" height="${Math.max(bH,2)}" fill="${c}" rx="2" opacity="0.85"/><text x="${x+_stBW/2}" y="${Math.max(62-bH-3,5)}" text-anchor="middle" fill="${c}" font-size="8">${v}</text><text x="${x+_stBW/2}" y="76" text-anchor="middle" fill="rgba(255,255,255,0.32)" font-size="7">${lbl}</text>`;});
	if(!_stE.length)_stSvg=`<text x="110" y="42" text-anchor="middle" fill="rgba(255,255,255,0.25)" font-size="9">No data since 28/3</text>`;

	// Row 1 – Chart 3: today's waves by type (donut)
	const _tdTC={};
	for(const a of ndAlerts){if(a.time>=_todS2){const t=parseInt(a.threat);_tdTC[t]=(_tdTC[t]||0)+1;}}
	const _tdTSegs=Object.entries(_tdTC).map(([t,v])=>({v,c:AA_THREAT_COLORS[parseInt(t)]||'#94a3b8',lbl:(AA_THREAT_LABELS[parseInt(t)]||'Other').split('/')[0].trim()}));
	const _tdTTot=_tdTSegs.reduce((s,x)=>s+x.v,0);

	// Row 2 – Chart 4: today's waves by district (donut)
	const _tdDC={};
	for(const a of ndAlerts){if(a.time>=_todS2)for(const c of(a.cities||[])){const r=AA_getRegion(c).r;_tdDC[r]=(_tdDC[r]||0)+1;}}
	const _tdDSegs=Object.entries(_tdDC).map(([r,v])=>({v,c:DIST_COLS[r]||'#94a3b8',lbl:r}));
	const _tdDTot=_tdDSegs.reduce((s,x)=>s+x.v,0);

	// Row 2 – Chart 5: attack waves by hour today (column)
	const _hrC=Array(24).fill(0);
	for(const a of ndAlerts){if(a.time>=_todS2){const h=new Date(a.time*1000).getHours();_hrC[h]++;}}
	const _hrMax=Math.max(..._hrC,1),_hrW=Math.floor(228/24);
	let _hrSvg='';
	_hrC.forEach((v,h)=>{const bH=Math.round((v/_hrMax)*60);const isN=h<6||h>=22;const c=v===0?'rgba(255,255,255,0.05)':isN?'#a78bfa':'#f87171';_hrSvg+=`<rect x="${h*(_hrW+1)}" y="${62-bH}" width="${_hrW}" height="${Math.max(bH,v>0?2:0)}" fill="${c}" rx="1" opacity="0.85"/>`;if(v>0&&bH>8)_hrSvg+=`<text x="${h*(_hrW+1)+_hrW/2}" y="${62-bH-2}" text-anchor="middle" fill="${c}" font-size="6">${v}</text>`;if(h%6===0)_hrSvg+=`<text x="${h*(_hrW+1)+_hrW/2}" y="76" text-anchor="middle" fill="rgba(255,255,255,0.28)" font-size="7">${h}:00</text>`;});

	// Row 2 – Chart 6: total waves since 28/2/2026 by district (donut)
	const _sDistC={};
	for(const a of ndAlerts){if(a.time>=SINCE_228)for(const c of(a.cities||[])){const r=AA_getRegion(c).r;_sDistC[r]=(_sDistC[r]||0)+1;}}
	const _sDistSegs=Object.entries(_sDistC).map(([r,v])=>({v,c:DIST_COLS[r]||'#94a3b8',lbl:r}));
	const _sDistTot=_sDistSegs.reduce((s,x)=>s+x.v,0);

	// ─ Render ─
	html+=`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.75rem;">
		${_dCard('Daily Attacks — Past Week',`<svg viewBox="0 0 ${_svgW} ${_svgH+10}" style="width:100%;overflow:visible;">${_lineSvg}</svg>`)}
		${_dCard('Total Attacks by Type — Since 28/3/2026',`<svg viewBox="0 0 230 82" style="width:100%;overflow:visible;">${_stSvg}</svg>`)}
		${_dCard("Today's Waves by Type",`<div style="display:flex;align-items:center;gap:0.5rem;"><svg viewBox="0 0 90 90" style="width:86px;height:86px;flex-shrink:0;"><circle cx="45" cy="45" r="32" fill="rgba(255,255,255,0.03)"/>${_arc(_tdTSegs,_tdTTot,45,45,32,'waves')}</svg><div style="flex:1;overflow:hidden;">${_legend(_tdTSegs,_tdTTot)}</div></div>`)}
	</div>
	<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.75rem;margin-top:0.75rem;">
		${_dCard("Today's Waves by District",`<div style="display:flex;align-items:center;gap:0.5rem;"><svg viewBox="0 0 90 90" style="width:86px;height:86px;flex-shrink:0;"><circle cx="45" cy="45" r="32" fill="rgba(255,255,255,0.03)"/>${_arc(_tdDSegs,_tdDTot,45,45,32,'areas')}</svg><div style="flex:1;overflow:hidden;">${_legend(_tdDSegs,_tdDTot)}</div></div>`)}
		${_dCard('Attack Waves by Hour — Today',`<svg viewBox="0 0 230 82" style="width:100%;overflow:visible;">${_hrSvg}</svg><div style="display:flex;gap:1rem;margin-top:0.25rem;"><span style="font-size:0.6rem;color:rgba(248,113,113,0.7);">▮ Day</span><span style="font-size:0.6rem;color:rgba(139,92,246,0.7);">▮ Night (22–06)</span></div>`)}
		${_dCard('Total Waves by District — Since 28/2/2026',`<div style="display:flex;align-items:center;gap:0.5rem;"><svg viewBox="0 0 90 90" style="width:86px;height:86px;flex-shrink:0;"><circle cx="45" cy="45" r="32" fill="rgba(255,255,255,0.03)"/>${_arc(_sDistSegs,_sDistTot,45,45,32,'waves')}</svg><div style="flex:1;overflow:hidden;">${_legend(_sDistSegs,_sDistTot)}</div></div>`)}
	</div>`;
	// ── End Dashboards ─────────────────────────────────────────────────────────

	// Status
	const minAgo=latestTime?Math.round((now-latestTime)/60):null;
	const timeStr=minAgo===null?'—':minAgo<2?'🔴 Just now':minAgo<60?`🟠 ${minAgo}m ago`:minAgo<1440?`🟡 ${Math.round(minAgo/60)}h ago`:`🟢 ${Math.round(minAgo/1440)}d ago`;
	html+=card(`<div style="display:flex;flex-wrap:wrap;gap:0.8rem;justify-content:space-between;">
		<div>${lbl('Last Alert')}<span style="color:white;font-weight:700;">${timeStr}</span></div>
		<div>${lbl('Events in Dataset')}<span style="color:white;font-weight:700;">${ndEvents.length}</span></div>
		<div>${lbl('Drills vs Real')}<span style="color:white;font-weight:700;">${drillPct}%</span><span style="color:rgba(255,255,255,0.3);font-size:0.75rem;"> drills (${drillCount} / ${allAlertsRaw.length-drillCount} real)</span></div>
		<div>${lbl('Dataset Range')}<span style="color:rgba(255,255,255,0.55);font-size:0.82rem;">${oldestTime?new Date(oldestTime*1000).toLocaleDateString('en-IL'):''} → Now</span></div>
	</div>`);

	// Threat level + Trend
	html+=`<div style="display:grid;grid-template-columns:130px 1fr;gap:0.75rem;">`;
	html+=card(`${lbl('Threat Level')}<div style="font-size:3.2rem;font-weight:900;color:${scoreC};line-height:1;">${rawScore.toFixed(1)}</div><div style="font-size:0.62rem;font-weight:800;letter-spacing:0.12em;color:${scoreC};margin:0.2rem 0;">${scoreLbl}</div><div style="height:4px;background:rgba(255,255,255,0.07);border-radius:2px;"><div style="height:100%;width:${rawScore*10}%;background:${scoreC};border-radius:2px;"></div></div>`,'text-align:center;');
	html+=card(`${lbl('Trend vs 6h Avg')}<div style="font-size:1.25rem;font-weight:800;color:${trendC};margin-bottom:0.4rem;">${trend}</div><div style="display:flex;flex-direction:column;gap:0.25rem;">
		<div style="display:flex;justify-content:space-between;font-size:0.78rem;"><span style="color:rgba(255,255,255,0.38);">Last 1h</span><span style="color:${evH1.length>0?'#f87171':'#34d399'};font-weight:700;">${evH1.length} events</span></div>
		<div style="display:flex;justify-content:space-between;font-size:0.78rem;"><span style="color:rgba(255,255,255,0.38);">6h avg/hr</span><span style="color:white;font-weight:700;">${rate6h.toFixed(1)}</span></div>
		<div style="display:flex;justify-content:space-between;font-size:0.78rem;"><span style="color:rgba(255,255,255,0.38);">12h avg/hr</span><span style="color:white;font-weight:700;">${(evH12.length/12).toFixed(1)}</span></div>
		${multiFront?'<div style="margin-top:0.25rem;font-size:0.76rem;color:#f87171;font-weight:700;">⚡ Multi-front active (North + South)</div>':''}
	</div>`);
	html+=`</div>`;

	// Activity windows
	html+=`<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.55rem;">`;
	const wMap={1:3600,6:21600,12:43200,24:86400};
	for(const [lh,ea] of [['1h',evH1],['6h',evH6],['12h',evH12],['24h',evH24]]){
		const waves=ndAlerts.filter(a=>a.time>=now-wMap[parseInt(lh)]).length;
		html+=card(`${lbl('Last '+lh)}${big(ea.length,ea.length>0?'#f87171':'#34d399',waves+' siren waves')}`,'text-align:center;padding:0.9rem;');
	}
	html+=`</div>`;

	// Weekly summary
	const msD=86400, dayF=now-(now%msD);
	html+=card(`${lbl('Weekly Summary — Last 7 Days')}<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-top:0.65rem;">
		${Array.from({length:7},(_,i)=>{
			const ds=dayF-(6-i)*msD, de=ds+msD;
			const devs=ndEvents.filter(ev=>ev.alerts.some(a=>a.time>=ds&&a.time<de));
			const waves=ndAlerts.filter(a=>a.time>=ds&&a.time<de).length;
			const dName=new Date(ds*1000).toLocaleDateString('en-IL',{weekday:'short'});
			const allMax=Math.max(1,...Array.from({length:7},(_,j)=>{const s=dayF-(6-j)*msD;return ndEvents.filter(e=>e.alerts.some(a=>a.time>=s&&a.time<s+msD)).length}));
			const pct=Math.min(100,devs.length/allMax*100);
			const dc=devs.length>5?'#f87171':devs.length>2?'#fb923c':devs.length>0?'#fbbf24':'#34d399';
			return`<div style="text-align:center;"><div style="font-size:0.65rem;color:rgba(255,255,255,0.35);margin-bottom:3px;">${dName}</div><div style="height:48px;background:rgba(255,255,255,0.05);border-radius:4px;display:flex;align-items:flex-end;overflow:hidden;"><div style="width:100%;height:${pct}%;background:${dc};min-height:${devs.length>0?2:0}px;"></div></div><div style="font-size:0.72rem;color:${dc};font-weight:800;margin-top:2px;">${devs.length}</div><div style="font-size:0.6rem;color:rgba(255,255,255,0.22);">${waves}w</div></div>`;
		}).join('')}
	</div><div style="font-size:0.68rem;color:rgba(255,255,255,0.25);margin-top:0.4rem;">Number = attack events. w = siren waves. Color: green→yellow→orange→red.</div>`);

	// Threat breakdown
	const tCA={},tCitA={};
	for(const a of ndRaw){const t=parseInt(a.threat);tCA[t]=(tCA[t]||0)+1;tCitA[t]=(tCitA[t]||new Set());(a.cities||[]).forEach(c=>tCitA[t].add(c));}
	const thAll=Object.entries(tCA).sort((a,b)=>b[1]-a[1]);
	if(thAll.length) html+=card(`${lbl('Threat Type Breakdown')}<div style="display:flex;flex-direction:column;gap:0.6rem;margin-top:0.5rem;">
		${thAll.map(([t,cnt])=>{const pct=Math.round(cnt/ndRaw.length*100);const tc=AA_THREAT_COLORS[t]||'#94a3b8';const ti=AA_THREAT_ICONS[t]||'fa-exclamation-triangle';const tn=AA_THREAT_LABELS[t]||'Threat '+t;const ar=tCitA[t]?tCitA[t].size:0;
		return`<div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.18rem;"><span style="color:${tc};font-weight:700;font-size:0.85rem;"><i class="fas ${ti}"></i> ${tn}</span><span style="color:rgba(255,255,255,0.5);font-size:0.75rem;">${cnt} waves · ${ar} areas · <span style="color:${tc};font-weight:700;">${pct}%</span></span></div><div style="height:5px;background:rgba(255,255,255,0.05);border-radius:3px;"><div style="height:100%;width:${pct}%;background:${tc};border-radius:3px;"></div></div></div>`;
		}).join('')}</div>`);

	// Most recent event
	const latestEv=ndEvents[0];
	if(latestEv){
		const lCities=[...new Set(latestEv.alerts.flatMap(a=>a.cities||[]))];
		const lt=parseInt(latestEv.alerts[0]?.threat);
		const lc=AA_THREAT_COLORS[lt]||'#f87171', li=AA_THREAT_ICONS[lt]||'fa-exclamation-triangle', ln=AA_THREAT_LABELS[lt]||'Unknown';
		const evStart=Math.min(...latestEv.alerts.map(a=>a.time)), evEnd=Math.max(...latestEv.alerts.map(a=>a.time));
		const evAgoM=Math.round((now-evStart)/60);
		const regC={};for(const c of lCities){const r=AA_getRegion(c).r;regC[r]=(regC[r]||0)+1;}
		const PREV=20, hasMore=lCities.length>PREV;
		const cityTag=c=>`<span style="background:rgba(${lt===0?'220,38,38':lt===5?'249,115,22':'139,92,246'},0.12);border:1px solid rgba(${lt===0?'220,38,38':lt===5?'249,115,22':'139,92,246'},0.3);border-radius:4px;padding:0.15rem 0.4rem;font-size:0.74rem;color:${lc};">${c}</span>`;
		html+=card(`${lbl('Most Recent Attack Event')}
			<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;margin-top:0.25rem;">
				<div><span style="color:${lc};font-weight:700;"><i class="fas ${li}"></i> ${ln}</span><span style="color:rgba(255,255,255,0.3);font-size:0.78rem;margin-left:0.6rem;">${evAgoM<60?evAgoM+'m ago':Math.round(evAgoM/60)+'h ago'}</span></div>
				<div style="display:flex;gap:1rem;">
					<div style="text-align:center;"><div style="font-size:1.1rem;font-weight:800;color:${lc};">${lCities.length}</div><div style="font-size:0.65rem;color:rgba(255,255,255,0.32);">areas</div></div>
					<div style="text-align:center;"><div style="font-size:1.1rem;font-weight:800;color:#60a5fa;">${AA_formatTime(evEnd-evStart)}</div><div style="font-size:0.65rem;color:rgba(255,255,255,0.32);">duration</div></div>
					<div style="text-align:center;"><div style="font-size:1.1rem;font-weight:800;color:#94a3b8;">${latestEv.alerts.length}</div><div style="font-size:0.65rem;color:rgba(255,255,255,0.32);">waves</div></div>
				</div>
			</div>
			<div style="display:flex;flex-wrap:wrap;gap:0.35rem;margin-top:0.4rem;">${Object.entries(regC).map(([r,c])=>`<span style="font-size:0.7rem;color:rgba(255,255,255,0.45);background:rgba(255,255,255,0.05);padding:0.12rem 0.45rem;border-radius:3px;">${r}: ${c}</span>`).join('')}</div>
			<div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin-top:0.6rem;">${lCities.slice(0,PREV).map(cityTag).join('')}</div>
			${hasMore?`<div id="recentCitiesAll" style="display:none;flex-wrap:wrap;gap:0.3rem;margin-top:0.3rem;">${lCities.slice(PREV).map(cityTag).join('')}</div><button id="recentCitiesAll-btn" data-total="${lCities.length}" onclick="toggleMoreCities('recentCitiesAll')" style="margin-top:0.45rem;width:100%;background:none;border:1px solid rgba(255,255,255,0.12);border-radius:6px;color:rgba(255,255,255,0.38);font-size:0.76rem;padding:0.3rem 0.75rem;cursor:pointer;">▼ Show all ${lCities.length} areas</button>`:''}
		`);
	}

	// Salvo stats
	html+=`<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0.6rem;">`;
	html+=card(`${lbl('Largest Salvo','#60a5fa')}${big(maxSalvo,'#60a5fa','areas targeted at once')}`,'text-align:center;');
	html+=card(`${lbl('Avg Areas Per Event','#60a5fa')}${big(avgSalvo,'#60a5fa','across all events')}`,'text-align:center;');
	html+=card(`${lbl('Longest Barrage','#60a5fa')}${big(AA_formatTime(maxDur),'#60a5fa','first to last siren')}`,'text-align:center;');
	html+=card(`${lbl('Avg Event Duration','#60a5fa')}${big(AA_formatTime(avgDur),'#60a5fa','per attack')}`,'text-align:center;');
	html+=`</div>`;

	// Quiet periods
	html+=`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.6rem;">`;
	html+=card(`${lbl('Current Quiet','#34d399')}${big(AA_formatTime(currentQuiet),'#34d399','since last event')}`,'text-align:center;');
	html+=card(`${lbl('Longest Quiet','#34d399')}${big(AA_formatTime(longestGap),'#34d399','in dataset')}`,'text-align:center;');
	html+=card(`${lbl('Avg Gap','#34d399')}${big(AA_formatTime(avgGap),'#34d399','between events')}`,'text-align:center;');
	html+=`</div>`;

	// Multi-front
	let mfCount=0, mfDetails=[];
	for(const ev of ndEvents){const ec=ev.alerts.flatMap(a=>a.cities||[]);const fronts=[ec.some(AA_isNorth)&&'North',ec.some(AA_isSouth)&&'South',ec.some(AA_isJerusalem)&&'Jerusalem'].filter(Boolean);if(fronts.length>=2){mfCount++;if(mfDetails.length<4) mfDetails.push({fronts,t:Math.min(...ev.alerts.map(a=>a.time))});}}
	html+=card(`${lbl('Simultaneous Multi-Front Attacks','#f87171')}<div style="display:flex;align-items:flex-start;gap:1.25rem;margin-top:0.4rem;flex-wrap:wrap;">
		<div style="text-align:center;"><div style="font-size:2.2rem;font-weight:900;color:${mfCount>0?'#f87171':'#34d399'};">${mfCount}</div><div style="font-size:0.7rem;color:rgba(255,255,255,0.35);">coordinated</div></div>
		<div style="flex:1;">${mfDetails.length?mfDetails.map(d=>`<div style="font-size:0.78rem;color:rgba(255,255,255,0.6);margin-bottom:0.2rem;"><span style="color:#f87171;">⚡</span> ${d.fronts.join(' + ')} <span style="color:rgba(255,255,255,0.28);margin-left:0.4rem;">${new Date(d.t*1000).toLocaleString('en-IL',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span></div>`).join(''):'<span style="color:rgba(255,255,255,0.28);font-size:0.82rem;">None in dataset</span>'}</div>
	</div>`);

	// Geographic targeting
	const regHits={};
	for(const a of ndAlerts) for(const c of (a.cities||[])){const rg=AA_getRegion(c);if(!regHits[rg.r])regHits[rg.r]={count:0,src:rg.src,sc:rg.sc};regHits[rg.r].count++;}
	const regOrder=['North','Center','South (Gaza)','Jerusalem','West Bank','Other'];
	const regRows=regOrder.filter(r=>regHits[r]);
	const maxRegH=Math.max(...regRows.map(r=>regHits[r].count),1);
	if(regRows.length) html+=card(`${lbl('Geographic Targeting & Estimated Origin')}<div style="display:flex;flex-direction:column;gap:0.55rem;margin-top:0.45rem;">
		${regRows.map(r=>{const inf=regHits[r];const pct=Math.round(inf.count/maxRegH*100);return`<div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.15rem;"><div><span style="color:white;font-weight:600;font-size:0.85rem;">${r}</span><span style="color:rgba(255,255,255,0.28);font-size:0.72rem;margin-left:0.45rem;">← ${inf.src}</span></div><span style="color:${inf.sc};font-size:0.8rem;font-weight:700;">${inf.count} hits</span></div><div style="height:4px;background:rgba(255,255,255,0.05);border-radius:2px;"><div style="height:100%;width:${pct}%;background:${inf.sc};border-radius:2px;"></div></div></div>`;}).join('')}
	</div><div style="font-size:0.68rem;color:rgba(255,255,255,0.22);margin-top:0.6rem;">Attribution estimated from target geography — not confirmed launch origin.</div>`);

	// Post-attack pattern
	if(gaps.length>=5){
		const threshold=maxSalvo*0.5, postGaps=[];
		for(let i=0;i<ndEvents.length-1;i++) if((salvoData[i]?.cities||0)>=threshold) postGaps.push(eTimes[i+1]-eTimes[i]);
		const avgFU=postGaps.length?Math.round(postGaps.reduce((s,v)=>s+v,0)/postGaps.length):0;
		html+=card(`${lbl('Post-Attack Pattern','#fbbf24')}<div style="display:flex;gap:1.5rem;margin-top:0.4rem;flex-wrap:wrap;">
			<div><div style="font-size:1.4rem;font-weight:800;color:#fbbf24;">${AA_formatTime(avgFU)}</div><div style="font-size:0.7rem;color:rgba(255,255,255,0.35);">avg until next event after large salvo</div></div>
			<div><div style="font-size:1.4rem;font-weight:800;color:#fbbf24;">${postGaps.length}</div><div style="font-size:0.7rem;color:rgba(255,255,255,0.35);">large salvos analyzed (≥${Math.round(threshold)} areas)</div></div>
		</div>`);
	}

	// Day of week
	const byDow=Array(7).fill(0), dowN=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
	for(const ev of ndEvents){const d=new Date(Math.min(...ev.alerts.map(a=>a.time))*1000).getDay();byDow[d]++;}
	const maxDow=Math.max(...byDow,1);
	html+=card(`${lbl('Attack Pattern by Day of Week')}<div style="display:flex;align-items:flex-end;gap:6px;height:55px;margin-top:0.65rem;">
		${byDow.map((cnt,d)=>{const pct=Math.round(cnt/maxDow*100);const isSab=d===5||d===6;return`<div style="flex:1;display:flex;flex-direction:column;align-items:center;" title="${dowN[d]}: ${cnt}"><div style="width:100%;height:${pct}%;min-height:${cnt>0?2:0}px;background:${isSab?'rgba(96,165,250,0.75)':'rgba(248,113,113,0.75)'};border-radius:2px 2px 0 0;"></div></div>`;}).join('')}
	</div><div style="display:flex;gap:6px;margin-top:3px;">${dowN.map(d=>`<div style="flex:1;text-align:center;font-size:0.67rem;color:rgba(255,255,255,0.28);">${d}</div>`).join('')}</div>
	<div style="display:flex;gap:1rem;margin-top:0.4rem;"><span style="font-size:0.7rem;color:rgba(248,113,113,0.8);">▮ Weekdays</span><span style="font-size:0.7rem;color:rgba(96,165,250,0.8);">▮ Fri–Sat (Shabbat)</span></div>`);

	// Most targeted locations
	const cityHits={}, cityEvts={};
	for(const ev of ndEvents){const ecs=new Set(ev.alerts.flatMap(a=>a.cities||[]));for(const c of ecs) cityEvts[c]=(cityEvts[c]||0)+1;}
	for(const a of ndAlerts) for(const c of (a.cities||[])) cityHits[c]=(cityHits[c]||0)+1;
	const topCities=Object.entries(cityHits).sort((a,b)=>b[1]-a[1]).slice(0,15);
	if(topCities.length){
		const maxH=topCities[0][1];
		html+=card(`${lbl('Most Targeted Locations')}<div style="font-size:0.7rem;color:rgba(255,255,255,0.28);margin-bottom:0.6rem;">"Siren hits" = how many siren waves included this location. "Events" = separate attack events.</div>
			<div style="display:flex;flex-direction:column;gap:0.4rem;">
			${topCities.map(([city,hits],i)=>`<div style="display:flex;align-items:center;gap:0.55rem;"><span style="color:rgba(255,255,255,0.22);font-size:0.7rem;width:1rem;text-align:right;">${i+1}</span><div style="flex:1;"><div style="display:flex;justify-content:space-between;margin-bottom:0.12rem;"><span style="color:rgba(255,255,255,0.85);font-size:0.82rem;">${city}</span><span style="color:rgba(255,255,255,0.45);font-size:0.75rem;">${hits} siren hits · ${cityEvts[city]||0} events</span></div><div style="height:3px;background:rgba(255,255,255,0.05);border-radius:2px;"><div style="height:100%;width:${Math.round(hits/maxH*100)}%;background:linear-gradient(90deg,#f87171,#fb923c);border-radius:2px;"></div></div></div></div>`).join('')}
			</div>`);
	}

	// Persistently targeted
	const repeatT=Object.entries(cityEvts).filter(([,e])=>e>=2).sort((a,b)=>b[1]-a[1]).slice(0,12);
	if(repeatT.length) html+=card(`${lbl('Persistently Targeted Locations','#fbbf24')}<div style="font-size:0.7rem;color:rgba(255,255,255,0.28);margin-bottom:0.55rem;">Cities targeted across multiple separate attack events — repeatedly chosen, not just caught in a wide sweep.</div>
		<div style="display:flex;flex-wrap:wrap;gap:0.35rem;">${repeatT.map(([c,e])=>`<span style="background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.28);border-radius:6px;padding:0.22rem 0.55rem;font-size:0.78rem;"><span style="color:#fbbf24;font-weight:700;">${c}</span><span style="color:rgba(255,255,255,0.32);font-size:0.7rem;"> ${e} events</span></span>`).join('')}</div>`);

	// Attack timeline chart
	const chartRanges=[['1h','1H'],['5h','5H'],['12h','12H'],['24h','1D'],['3d','3D'],['7d','1W'],['14d','2W'],['30d','1M'],['90d','3M'],['180d','6M'],['365d','1Y']];
	html+=card(`${lbl('Attack Timeline')}<div style="display:flex;flex-wrap:wrap;gap:0.28rem;margin-bottom:0.65rem;">${chartRanges.map(([val,lb])=>`<button onclick="setChartRange('${val}')" id="chartRangeBtn_${val}" style="padding:0.22rem 0.5rem;border-radius:4px;font-size:0.73rem;font-weight:600;cursor:pointer;border:1px solid ${_analyticsChartRange===val?'#60a5fa':'rgba(255,255,255,0.1)'};background:${_analyticsChartRange===val?'rgba(96,165,250,0.15)':'rgba(255,255,255,0.04)'};color:${_analyticsChartRange===val?'#60a5fa':'rgba(255,255,255,0.4)'};">${lb}</button>`).join('')}</div><div id="alertTimeChart" style="min-height:130px;"><div style="color:rgba(255,255,255,0.2);text-align:center;padding:2rem;font-size:0.8rem;">Building chart...</div></div>`);

	// Today vs yesterday
	const todayS=now-(now%86400), ydayS=todayS-86400, BKTS=12, todB=Array(BKTS).fill(0), ydB=Array(BKTS).fill(0);
	for(const ev of ndEvents){const t=Math.min(...ev.alerts.map(a=>a.time));const bSize=86400/BKTS;if(t>=todayS){const idx=Math.min(BKTS-1,Math.floor((t-todayS)/bSize));todB[idx]++;}else if(t>=ydayS&&t<todayS){const idx=Math.min(BKTS-1,Math.floor((t-ydayS)/bSize));ydB[idx]++;}}
	const maxComp=Math.max(...todB,...ydB,1), todTotal=todB.reduce((s,v)=>s+v,0), ydTotal=ydB.reduce((s,v)=>s+v,0), compDiff=todTotal-ydTotal;
	html+=card(`${lbl('Today vs Yesterday')}<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.65rem;">
		<div style="display:flex;gap:1.5rem;"><div><span style="color:#f87171;font-weight:800;font-size:1.25rem;">${todTotal}</span><span style="color:rgba(255,255,255,0.35);font-size:0.75rem;"> today</span></div><div><span style="color:rgba(255,255,255,0.45);font-weight:800;font-size:1.25rem;">${ydTotal}</span><span style="color:rgba(255,255,255,0.35);font-size:0.75rem;"> yesterday</span></div></div>
		<div style="font-size:0.82rem;font-weight:700;color:${compDiff>0?'#f87171':compDiff<0?'#34d399':'#94a3b8'};">${compDiff>0?'▲ +'+compDiff+' more today':compDiff<0?'▼ '+Math.abs(compDiff)+' fewer today':'= Same pace'}</div>
	</div>
	<div style="display:flex;align-items:flex-end;gap:3px;height:55px;">${Array(BKTS).fill(0).map((_,i)=>{const tH=Math.round(todB[i]/maxComp*100);const yH=Math.round(ydB[i]/maxComp*100);const h=Math.round(i*24/BKTS);return`<div style="flex:1;display:flex;gap:1px;align-items:flex-end;" title="${h}:00"><div style="flex:1;height:${tH}%;min-height:${todB[i]>0?2:0}px;background:#f87171;border-radius:1px 1px 0 0;opacity:0.85;"></div><div style="flex:1;height:${yH}%;min-height:${ydB[i]>0?2:0}px;background:rgba(255,255,255,0.2);border-radius:1px 1px 0 0;"></div></div>`;}).join('')}</div>
	<div style="display:flex;justify-content:space-between;margin-top:3px;">${[0,6,12,18,23].map(h=>`<span style="color:rgba(255,255,255,0.22);font-size:0.67rem;">${h}:00</span>`).join('')}</div>
	<div style="display:flex;gap:1rem;margin-top:0.4rem;"><span style="font-size:0.7rem;color:rgba(248,113,113,0.8);">▮ Today</span><span style="font-size:0.7rem;color:rgba(255,255,255,0.32);">▮ Yesterday</span></div>`);

	// ── Point 6: Dataset coverage ─────────────────────────────────────────
	const datasetDays = oldestTime ? Math.round((now - oldestTime) / 86400) : 0;
	const datasetStart = oldestTime ? new Date(oldestTime*1000).toLocaleDateString('en-IL',{year:'numeric',month:'short',day:'numeric'}) : '?';
	const datasetEnd   = latestTime ? new Date(latestTime*1000).toLocaleDateString('en-IL',{year:'numeric',month:'short',day:'numeric'}) : '?';
	html += card(`
		${lbl('Dataset Coverage')}
		<div style="display:flex;flex-wrap:wrap;gap:1.25rem;align-items:center;margin-top:0.3rem;">
			<div style="display:flex;align-items:center;gap:0.5rem;flex:1;min-width:200px;">
				<div style="flex:1;height:6px;background:rgba(255,255,255,0.06);border-radius:3px;position:relative;">
					<div style="position:absolute;left:0;top:0;height:100%;width:100%;background:linear-gradient(90deg,rgba(96,165,250,0.4),rgba(96,165,250,0.85));border-radius:3px;"></div>
				</div>
			</div>
			<div style="display:flex;gap:1.5rem;flex-wrap:wrap;">
				<div>${lbl('From')}<span style="color:white;font-weight:700;font-size:0.9rem;">${datasetStart}</span></div>
				<div>${lbl('To')}<span style="color:white;font-weight:700;font-size:0.9rem;">${datasetEnd}</span></div>
				<div>${lbl('Span')}<span style="color:#60a5fa;font-weight:800;font-size:1.1rem;">${datasetDays}d</span></div>
				<div>${lbl('Total Events')}<span style="color:#60a5fa;font-weight:800;font-size:1.1rem;">${ndEvents.length}</span></div>
			</div>
		</div>
		<div style="font-size:0.68rem;color:rgba(255,255,255,0.22);margin-top:0.5rem;">⚠️ tzevaadom.co.il rolls over after a limited window — data before ${datasetStart} is not available. Analysis is limited to this range.</div>
	`);

	// ── Point 4: Threat diversity per event ───────────────────────────────
	const mixedEvents = [], singleEvents = {};
	for (const ev of ndEvents) {
		const threats = [...new Set(ev.alerts.filter(a=>!a.isDrill).map(a=>parseInt(a.threat)))];
		if (threats.length >= 2) {
			mixedEvents.push({ threats, t: Math.min(...ev.alerts.map(a=>a.time)), cities: ev.alerts.reduce((s,a)=>s+(a.cities||[]).length,0) });
		} else if (threats.length === 1) {
			singleEvents[threats[0]] = (singleEvents[threats[0]]||0)+1;
		}
	}
	const mixedPct = ndEvents.length ? Math.round(mixedEvents.length/ndEvents.length*100) : 0;
	html += card(`
		${lbl('Threat Diversity Per Event','#e879f9')}
		<div style="display:flex;gap:1.5rem;align-items:flex-start;flex-wrap:wrap;margin-top:0.35rem;">
			<div style="text-align:center;">
				<div style="font-size:2.5rem;font-weight:900;color:${mixedEvents.length>0?'#e879f9':'#34d399'};">${mixedEvents.length}</div>
				<div style="font-size:0.68rem;color:rgba(255,255,255,0.32);">mixed-threat events</div>
				<div style="font-size:0.78rem;color:#e879f9;font-weight:700;">${mixedPct}% of total</div>
			</div>
			<div style="flex:1;min-width:180px;">
				<div style="font-size:0.75rem;color:rgba(255,255,255,0.4);margin-bottom:0.4rem;">Recent combined attacks:</div>
				${mixedEvents.slice(0,4).map(ev=>`
					<div style="display:flex;align-items:center;gap:0.4rem;margin-bottom:0.3rem;font-size:0.78rem;">
						<span style="color:#e879f9;">⚡</span>
						<span style="color:white;">${ev.threats.map(t=>AA_THREAT_LABELS[t]||'Threat '+t).join(' + ')}</span>
						<span style="color:rgba(255,255,255,0.28);margin-left:auto;">${new Date(ev.t*1000).toLocaleDateString('en-IL',{month:'short',day:'numeric'})}</span>
					</div>
				`).join('')}
				${mixedEvents.length===0?'<div style="color:rgba(255,255,255,0.28);font-size:0.8rem;">No mixed-threat events in dataset.</div>':''}
			</div>
			<div>
				${lbl('Single-Threat Breakdown')}
				${Object.entries(singleEvents).map(([t,c])=>`<div style="font-size:0.76rem;color:${AA_THREAT_COLORS[t]||'#94a3b8'};"><i class="fas ${AA_THREAT_ICONS[t]||'fa-exclamation-triangle'}"></i> ${AA_THREAT_LABELS[t]||'Threat '+t}: <strong>${c}</strong></div>`).join('')}
			</div>
		</div>
	`);

	// ── Point 5: Quiet hour heatmap (7×24) ───────────────────────────────
	const heatmap = Array.from({length:7},()=>Array(24).fill(0));
	for (const ev of ndEvents) {
		const d = new Date(Math.min(...ev.alerts.map(a=>a.time))*1000);
		heatmap[d.getDay()][d.getHours()]++;
	}
	const maxCell = Math.max(...heatmap.flat(), 1);
	const dowLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
	html += card(`
		${lbl('Attack Frequency Heatmap — Day × Hour (Israel Time)')}
		<div style="overflow-x:auto;margin-top:0.75rem;">
			<table style="border-collapse:collapse;width:100%;min-width:420px;">
				<thead>
					<tr>
						<td style="font-size:0.6rem;color:rgba(255,255,255,0.25);padding:1px 4px;width:28px;"></td>
						${Array.from({length:24},(_,h)=>`<td style="font-size:0.55rem;color:rgba(255,255,255,0.28);text-align:center;padding:1px;">${h}</td>`).join('')}
					</tr>
				</thead>
				<tbody>
					${heatmap.map((row,d)=>`
						<tr>
							<td style="font-size:0.6rem;color:${d===5||d===6?'rgba(96,165,250,0.7)':'rgba(255,255,255,0.32)'};padding:2px 4px;white-space:nowrap;">${dowLabels[d]}</td>
							${row.map((cnt,h)=>{
								const isNight=h<6||h>=22;
								const intensity=cnt/maxCell;
								const base = isNight ? '139,92,246' : '248,113,113';
								const bg = cnt===0 ? 'rgba(255,255,255,0.03)' : `rgba(${base},${0.15+intensity*0.82})`;
								const title = `${dowLabels[d]} ${h}:00 — ${cnt} event${cnt!==1?'s':''}`;
								return `<td title="${title}" style="background:${bg};border:1px solid rgba(255,255,255,0.04);border-radius:2px;width:calc(100%/24);height:18px;cursor:default;"></td>`;
							}).join('')}
						</tr>
					`).join('')}
				</tbody>
			</table>
		</div>
		<div style="display:flex;gap:1.25rem;margin-top:0.55rem;flex-wrap:wrap;">
			<span style="font-size:0.68rem;color:rgba(248,113,113,0.75);">▮ Day attacks</span>
			<span style="font-size:0.68rem;color:rgba(139,92,246,0.75);">▮ Night attacks (22–06)</span>
			<span style="font-size:0.68rem;color:rgba(96,165,250,0.7);">▮ Fri–Sat (Shabbat)</span>
			<span style="font-size:0.68rem;color:rgba(255,255,255,0.18);">▮ No attacks</span>
			<span style="font-size:0.68rem;color:rgba(255,255,255,0.28);margin-left:auto;">Hover cell for count</span>
		</div>
	`);

	// ── Placeholders for async sections (7 & 9) ───────────────────────────
	html += card(`
		${lbl('IDF Spokesperson — Recent Intercept Reports','#34d399')}
		<div id="telegramInterceptDiv" style="min-height:60px;display:flex;align-items:center;justify-content:center;">
			<div style="color:rgba(255,255,255,0.25);font-size:0.82rem;"><i class="fas fa-spinner fa-spin"></i> Fetching from Telegram...</div>
		</div>
	`);
	html += card(`
		${lbl('Weather Correlation at Attack Times','#38bdf8')}
		<div id="weatherCorrelationDiv" style="min-height:60px;display:flex;align-items:center;justify-content:center;">
			<div style="color:rgba(255,255,255,0.25);font-size:0.82rem;"><i class="fas fa-spinner fa-spin"></i> Fetching weather data...</div>
		</div>
	`);

	html+=`</div>`;
	return html;
}

// ── Point 7: IDF Telegram intercept scraper ───────────────────────────────
async function fetchTelegramIntercepts() {
	const div = document.getElementById('telegramInterceptDiv');
	if (!div) return;

	const TG_URL = 'https://t.me/s/IDFSpokesperson';
	let html = null;

	// Try our Cloudflare proxy first, then public fallbacks
	const proxies = [
		CORS_PROXY + encodeURIComponent(TG_URL),
		'https://api.allorigins.win/raw?url=' + encodeURIComponent(TG_URL),
		'https://corsproxy.io/?' + encodeURIComponent(TG_URL),
	];

	for (const proxyUrl of proxies) {
		try {
			const r = await fetch(proxyUrl, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
			if (r.ok) {
				const text = await r.text();
				if (text.length > 20000 && text.includes('message')) {
					html = text;
					console.log(`Telegram fetched via proxy: ${text.length} chars`);
					break;
				}
			}
		} catch(e) {}
	}

	if (!html) {
		div.innerHTML = `<div style="color:rgba(255,255,255,0.35);font-size:0.8rem;text-align:center;padding:0.5rem;">
			<div style="margin-bottom:0.5rem;">Could not load Telegram data.</div>
			<a href="https://t.me/s/IDFSpokesperson" target="_blank" style="color:#34d399;text-decoration:underline;">Open IDF Spokesperson channel directly ↗</a>
		</div>`;
		return;
	}

	const parser = new DOMParser();
	const doc = parser.parseFromString(html, 'text/html');
	const msgEls = doc.querySelectorAll('.tgme_widget_message_text');
	const keywords = /intercept|rocket|missile|launched|fired|UAV|drone|projectile|aerial|threat|iron dome|שיגור|יירוט|רקט|טיל|כטב"מ|מל"ט/i;
	const numberRx = /(\d+)\s*(rocket|missile|projectile|UAV|drone|aerial|רקט|טיל|כטב"מ|שיגור|מל"ט)/gi;
	const interceptRx = /intercept(?:ed)?\s+(\d+)/gi;
	const found = [];

	msgEls.forEach(el => {
		const text = el.innerText || el.textContent || '';
		if ((keywords.test(text) || found.length < 3) && found.length < 8) {
			const nums = [];
			const m1 = [...text.matchAll(numberRx)];
			const m2 = [...text.matchAll(interceptRx)];
			m1.forEach(m => nums.push(m[0]));
			m2.forEach(m => nums.push('intercepted ' + m[1]));
			const tEl = el.closest('.tgme_widget_message')?.querySelector('time');
			const ts = tEl ? new Date(tEl.getAttribute('datetime')).toLocaleString('en-IL', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'}) : '';
			found.push({ text: text.slice(0, 220).replace(/\n+/g, ' '), nums, ts });
		}
	});

	if (!found.length) {
		div.innerHTML = `<div style="color:rgba(255,255,255,0.35);font-size:0.8rem;text-align:center;padding:0.5rem;">
			<div style="margin-bottom:0.5rem;">No recent intercept reports found.</div>
			<a href="https://t.me/s/IDFSpokesperson" target="_blank" style="color:#34d399;text-decoration:underline;">Open IDF Spokesperson channel directly ↗</a>
		</div>`;
		return;
	}

	div.innerHTML = `
		<div style="display:flex;flex-direction:column;gap:0.55rem;width:100%;">
			${found.map(f => `
				<div style="background:rgba(52,211,153,0.06);border:1px solid rgba(52,211,153,0.15);border-radius:8px;padding:0.6rem 0.8rem;">
					<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem;margin-bottom:0.3rem;">
						<div style="display:flex;flex-wrap:wrap;gap:0.3rem;">
							${f.nums.map(n => `<span style="background:rgba(52,211,153,0.15);border:1px solid rgba(52,211,153,0.3);border-radius:4px;padding:0.1rem 0.4rem;font-size:0.72rem;color:#34d399;font-weight:700;">${n}</span>`).join('')}
						</div>
						<span style="font-size:0.65rem;color:rgba(255,255,255,0.25);white-space:nowrap;">${f.ts}</span>
					</div>
					<div style="font-size:0.74rem;color:rgba(255,255,255,0.55);line-height:1.4;">${f.text}${f.text.length >= 220 ? '…' : ''}</div>
				</div>
			`).join('')}
			<a href="https://t.me/s/IDFSpokesperson" target="_blank" style="font-size:0.72rem;color:rgba(52,211,153,0.6);text-align:right;">Open full IDF Spokesperson channel ↗</a>
		</div>`;
}

// ── Point 9: Weather correlation (open-meteo, no API key) ─────────────────
async function fetchWeatherCorrelation() {
	const div = document.getElementById('weatherCorrelationDiv');
	if (!div || !_analyticsRawEvents) return;

	// Collect all real non-drill events
	const realEvents = _analyticsRawEvents.filter(ev => ev.alerts && ev.alerts.some(a=>!a.isDrill));
	if (!realEvents.length) { div.innerHTML='<span style="color:rgba(255,255,255,0.25);font-size:0.8rem;">No events to correlate.</span>'; return; }

	const times     = realEvents.flatMap(ev=>ev.alerts.filter(a=>!a.isDrill).map(a=>a.time));
	const minT      = Math.min(...times), maxT = Math.max(...times);
	const startDate = new Date(minT*1000).toISOString().slice(0,10);
	const endDate   = new Date(Math.min(maxT, Date.now()/1000 - 86400)*1000).toISOString().slice(0,10); // open-meteo needs yesterday max

	// Tel Aviv coords (central Israel)
	const WEATHER_URL = `https://archive-api.open-meteo.com/v1/archive?latitude=32.08&longitude=34.78&start_date=${startDate}&end_date=${endDate}&hourly=wind_speed_10m,visibility,precipitation&timezone=Asia%2FJerusalem&wind_speed_unit=kmh`;

	let weather = null;
	try {
		const r = await fetch(WEATHER_URL);
		if (r.ok) weather = await r.json();
	} catch(e) {}

	if (!weather || !weather.hourly) {
		div.innerHTML = '<span style="color:rgba(255,255,255,0.25);font-size:0.8rem;">Weather data unavailable for this date range.</span>';
		return;
	}

	// Build hourly lookup: ISO-hour → { wind, visibility, rain }
	const hourlyMap = {};
	weather.hourly.time.forEach((ts, i) => {
		hourlyMap[ts] = {
			wind:   weather.hourly.wind_speed_10m?.[i] ?? null,
			vis:    weather.hourly.visibility?.[i] ?? null,
			rain:   weather.hourly.precipitation?.[i] ?? 0,
		};
	});

	function getHourKey(ts) {
		const d = new Date(ts*1000);
		return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+'T'+String(d.getHours()).padStart(2,'0')+':00';
	}

	// Separate rocket vs drone events and get weather at each
	const byThreat = { rocket: [], drone: [], other: [] };
	for (const ev of realEvents) {
		const t = parseInt(ev.alerts.find(a=>!a.isDrill)?.threat ?? 0);
		const evTime = Math.min(...ev.alerts.map(a=>a.time));
		const w = hourlyMap[getHourKey(evTime)];
		if (!w) continue;
		const key = t===0?'rocket':t===5?'drone':'other';
		if (w.wind!==null) byThreat[key].push(w);
	}

	// Get overall baseline weather (all hours in dataset)
	const allWeather = Object.values(hourlyMap);
	const avg = arr => arr.length ? (arr.reduce((s,v)=>s+v,0)/arr.length).toFixed(1) : '—';
	const avgWind = arr => avg(arr.map(w=>w.wind).filter(v=>v!==null));
	const avgVis  = arr => avg(arr.map(w=>w.vis).filter(v=>v!==null&&v<100000));
	const rainPct = arr => arr.length ? Math.round(arr.filter(w=>w.rain>0.1).length/arr.length*100) : 0;

	const baseWind = avgWind(allWeather), rocketWind = avgWind(byThreat.rocket), droneWind = avgWind(byThreat.drone);
	const baseVis  = avgVis(allWeather),  rocketVis  = avgVis(byThreat.rocket),  droneVis  = avgVis(byThreat.drone);
	const droneRain = rainPct(byThreat.drone), rocketRain = rainPct(byThreat.rocket);

	const diff = (a, b) => {
		if (a==='—'||b==='—') return '';
		const d = (parseFloat(a)-parseFloat(b)).toFixed(1);
		return parseFloat(d)>0?`<span style="color:#f87171;font-size:0.7rem;"> (+${d})</span>`
			:parseFloat(d)<0?`<span style="color:#34d399;font-size:0.7rem;"> (${d})</span>`:'';
	};

	div.innerHTML = `
		<div style="width:100%;">
			<div style="font-size:0.7rem;color:rgba(255,255,255,0.28);margin-bottom:0.6rem;">Tel Aviv weather at time of each attack vs dataset baseline. Lower wind + higher visibility = better drone conditions.</div>
			<table style="width:100%;border-collapse:collapse;font-size:0.78rem;">
				<thead>
					<tr style="border-bottom:1px solid rgba(255,255,255,0.08);">
						<th style="text-align:left;padding:0.3rem 0.5rem;color:rgba(255,255,255,0.35);font-weight:600;font-size:0.68rem;">Metric</th>
						<th style="text-align:center;padding:0.3rem;color:rgba(255,255,255,0.35);font-weight:600;font-size:0.68rem;">Overall Avg</th>
						<th style="text-align:center;padding:0.3rem;color:#f87171;font-weight:600;font-size:0.68rem;">During 🚀 Rockets</th>
						<th style="text-align:center;padding:0.3rem;color:#fb923c;font-weight:600;font-size:0.68rem;">During ✈️ Drones</th>
					</tr>
				</thead>
				<tbody>
					<tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
						<td style="padding:0.35rem 0.5rem;color:rgba(255,255,255,0.6);">💨 Wind speed (km/h)</td>
						<td style="text-align:center;color:white;font-weight:700;">${baseWind}</td>
						<td style="text-align:center;color:#f87171;font-weight:700;">${rocketWind}${diff(rocketWind,baseWind)}</td>
						<td style="text-align:center;color:#fb923c;font-weight:700;">${droneWind}${diff(droneWind,baseWind)}</td>
					</tr>
					<tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
						<td style="padding:0.35rem 0.5rem;color:rgba(255,255,255,0.6);">👁 Visibility (m)</td>
						<td style="text-align:center;color:white;font-weight:700;">${baseVis}</td>
						<td style="text-align:center;color:#f87171;font-weight:700;">${rocketVis}${diff(rocketVis,baseVis)}</td>
						<td style="text-align:center;color:#fb923c;font-weight:700;">${droneVis}${diff(droneVis,baseVis)}</td>
					</tr>
					<tr>
						<td style="padding:0.35rem 0.5rem;color:rgba(255,255,255,0.6);">🌧 % of attacks during rain</td>
						<td style="text-align:center;color:white;font-weight:700;">${rainPct(allWeather)}%</td>
						<td style="text-align:center;color:#f87171;font-weight:700;">${rocketRain}%</td>
						<td style="text-align:center;color:#fb923c;font-weight:700;">${droneRain}%</td>
					</tr>
				</tbody>
			</table>
			${byThreat.drone.length<3?'<div style="font-size:0.68rem;color:rgba(255,255,255,0.22);margin-top:0.4rem;">⚠ Too few drone events in dataset for reliable correlation.</div>':''}
			<div style="font-size:0.65rem;color:rgba(255,255,255,0.18);margin-top:0.35rem;">Data: open-meteo.com Archive API — Tel Aviv (32.08°N, 34.78°E). No API key required.</div>
		</div>`;
}
// ── End Alert Analytics ───────────────────────────────────────────────────
