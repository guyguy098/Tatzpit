// ── Arsenal Translation (append-only, no existing HTML modified) ─────────
async function translateArsenalNote(text, el) {
	if (!el || !text) return;
	if (/[\u0590-\u05FF]/.test(text)) { el.textContent = text; return; }
	try {
		const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=iw&dt=t&q=${encodeURIComponent(text)}`;
		const res = await fetch(url);
		const data = await res.json();
		const translated = data[0].reduce((acc, seg) => acc + (seg[0] || ''), '');
		if (el && translated) { el.textContent = translated; el.style.display = ''; }
	} catch(e) {
		if (el) el.style.display = 'none';
	}
}

function addArsenalTranslations(containerId) {
	const container = document.getElementById(containerId);
	if (!container) return;
	// Each weapon card has a flex:1 text column. The notes div is the last child with line-height:1.5 and color 0.5 opacity.
	container.querySelectorAll('div[style*="flex:1"]').forEach(textCol => {
		const children = Array.from(textCol.children);
		// Find the notes div — it's the last div that has actual descriptive text (not status badges)
		const notesDiv = children.find(d =>
			d.style.lineHeight === '1.5' &&
			d.style.fontSize === '0.72rem' &&
			d.textContent.length > 20
		);
		if (!notesDiv) return;
		// Don't add twice on re-render
		if (notesDiv.nextElementSibling && notesDiv.nextElementSibling.classList.contains('arsenal-he')) return;
		const heDiv = document.createElement('div');
		heDiv.className = 'arsenal-he';
		heDiv.style.cssText = 'font-size:0.72rem;color:rgba(255,255,255,0.35);line-height:1.5;direction:rtl;text-align:right;font-style:italic;margin-top:0.15rem;border-right:3px solid #a78bfa;padding-right:0.5rem;';
		heDiv.style.display = 'none';
		notesDiv.after(heDiv);
		translateArsenalNote(notesDiv.textContent, heDiv);
	});
}

// ── Hezbollah Arsenal ─────────────────────────────────────────────────────
const HEZBOLLAH_ARSENAL_DATA = [
	{
		category: 'Long-Range Ballistic Missiles',
		items: [
			{ name:'Scud-D',					wiki:'Scud missile',	range_km:700, payload_kg:985, accuracy:'INS ~450m CEP', status:'Operational', used_against_israel:false, notes:'Soviet-origin ballistic missile. Can reach all of Israel including Tel Aviv and Dimona. Most feared long-range asset.' },
			{ name:'Scud-C',					wiki:'Scud missile',	range_km:500, payload_kg:770, accuracy:'INS ~700m CEP', status:'Operational', used_against_israel:false, notes:'Extended range Scud variant transferred via Syria. Capable of hitting deep into Israel.' },
			{ name:'Zelzal-2',					wiki:'Zelzal-2',		range_km:210, payload_kg:600, accuracy:'UNguided',  status:'Operational', used_against_israel:false, notes:'Iranian-supplied heavy unguided rocket. 600kg warhead can cause massive damage in dense areas.' },
			{ name:'Fateh-110',     			wiki:'Fateh-110',		range_km:300, payload_kg:500, accuracy:'GPS/INS ~10m CEP',  status:'Operational', used_against_israel:true,  notes:'Precision-guided Iranian ballistic missile. First used by Hezbollah in November 2024. Can precisely target military bases anywhere in Israel.' },
			{ name:'Qadr-1 (early Fateh-110)',	wiki:'Fateh-110',		range_km:190, payload_kg:500, accuracy:'INS ~50m CEP',  status:'Operational', used_against_israel:true,  notes:'Iranian Fateh-100 early variant. 500kg warhead used in 2024 war against Israeli positions.' },
			{ name:'Qadr-2 (Guided Zelzal-2)',	wiki:'Zelzal-1',		range_km:250, payload_kg:405, accuracy:'INS+precision guidance kit ~30m CEP',  status:'Operational', used_against_israel:true,  notes:'Zelzal-2 retrofitted with precision guidance kit. Used in 2024 against Israeli targets including Haifa area.' },
		]
	},
	{
		category: 'Medium-Range Rockets',
		items: [
			{ name:'Fadi-1 (Syrian M-220mm)',		wiki:'',         	range_km:70,  payload_kg:83,  accuracy:'UNguided',  status:'Operational', used_against_israel:true,  notes:'220mm unguided rocket. First used in the 2024 war, targeting Jezreel Valley and Krayot suburbs of Haifa.' },
			{ name:'Fadi-6 (Guided 302mm)',			wiki:'',          	range_km:225, payload_kg:140, accuracy:'INS ~200m CEP', status:'Operational', used_against_israel:true,  notes:'302mm rocket with guidance kit. First used November 2024. Range covers all of northern and central Israel.' },
			{ name:'Fajr-5',						wiki:'Fajr-5',    	range_km:75,  payload_kg:90,  accuracy:'UNguided',  status:'Operational', used_against_israel:true,  notes:'Iranian-supplied 333mm rocket. Puts Tel Aviv in range from Lebanon. Used in 2006 and subsequent conflicts.' },
			{ name:'Fateh-110',						wiki:'Fateh-110', 	range_km:300, payload_kg:650, accuracy:'GPS/INS ~10m CEP (latest gen)', status:'Operational', used_against_israel:true, notes:'Solid-fuel SRBM, road-mobile. Transferred to Hezbollah via Syria (M-600 variant). From southern Lebanon can reach targets across Israel up to northern Negev. Multiple generations: Gen I 200km, Gen II 250km, Gen III/IV 300km. Extended family includes Fateh-313 (500km), Zolfaghar (700km), Kheibar Shekan (1,450km). Used by IRGC against US bases in Iraq (Jan 2020) and Kurdish targets. Also supplied to Russia for use in Ukraine.' },
			{ name:'Khaibar-1 (Fadi-2, M-302)',		wiki:'Khaibar-1',	range_km:150, payload_kg:170, accuracy:'UNguided',  status:'Operational', used_against_israel:true,  notes:'Syrian-made Chinese-designed rocket. Can target Tel Aviv. Puts ~3.5 million Israelis within range.' },
			{ name:'Nasr-1 (Guided Anti-ship)',		wiki:'Nasr-1',		range_km:35,  payload_kg:150, accuracy:'GPS guidance kit',    status:'Operational', used_against_israel:true,  notes:'M-302 retrofitted with guidance system. Used extensively in 2024. Reached Haifa and Krayot.' },
			{ name:'Nasr-2 (Guided M-302)',			wiki:'',			range_km:150, payload_kg:140, accuracy:'GPS guidance kit',    status:'Operational', used_against_israel:true,  notes:'Precision-guided 302mm rocket. First used October 2024. Can reach Tel Aviv from southern Lebanon.' },
		]
	},
	{
		category: 'Short-Range Rockets',
		items: [
			{ name:'Burkan 2',        	wiki:'Burkan-2',         			range_km:10,  	payload_kg:500, accuracy:'UNguided',  status:'Operational', used_against_israel:true,  notes:'Enormous 500kg warhead, 150m destruction radius. Used extensively in 2024 against IDF border positions. Most destructive short-range weapon.' },
			{ name:'Falaq-1',       	wiki:'Falaq-1',          			range_km:11,  	payload_kg:120, accuracy:'UNguided',  status:'Operational', used_against_israel:true,  notes:'Iranian 333mm heavy rocket. Large warhead for short range. Used for devastating attacks on border communities.' },
			{ name:'Falaq-2',       	wiki:'Falaq-2',          			range_km:11,  	payload_kg:120, accuracy:'UNguided',  status:'Operational', used_against_israel:true,  notes:'Iranian 333mm heavy rocket. Large warhead for short range. Used for devastating attacks on border communities.' },
			{ name:'Grad (122mm)',   	wiki:'BM-21 Grad',                	range_km:40, 	payload_kg:20, accuracy:'UNguided', status:'Operational', used_against_israel:true, notes:'Russian-origin smuggled rocket. More reliable than Qassam. Used in mass barrages to overwhelm Iron Dome.' },
			{ name:'Katyusha (122mm)', 	wiki:'Katyusha rocket',    			range_km:40,  	payload_kg:19,  accuracy:'UNguided',  status:'Operational', used_against_israel:true,  notes:'Soviet-origin BM-21 Grad rocket. Primary weapon of Hezbollah since 2006. Tens of thousands stockpiled. Can reach Haifa.' },
			{ name:'Raad-1 (Fajr-3)',   wiki:'Fajr-3 (artillery rocket)',   range_km:65,  	payload_kg:45,  accuracy:'UNguided',  status:'Operational', used_against_israel:true,  notes:'Uragan-type 220mm rocket. Can target Haifa from Lebanon. Fired in large salvos to overwhelm Iron Dome.' },
			{ name:'Sayyad-2',      	wiki:'Sayyad-2',          			range_km:150,  	payload_kg:45,  accuracy:'GPS/INS ~10m CEP', status:'Operational', used_against_israel:true,  notes:'Iranian-built UAV. Used for reconnaissance over Israeli positions and explosive-laden attack missions.' },
		]
	},
	{
		category: 'Drones (UAV)',
		items: [
			{ name:'Ababil-T (Mirsad-1)',   wiki:'HESA Ababil',   	range_km:150,  payload_kg:45,  accuracy:'GPS/INS ~10m CEP', status:'Operational', used_against_israel:true,  notes:'Iranian-built UAV. Used for reconnaissance over Israeli positions and explosive-laden attack missions.' },
			{ name:'Shahed 101',      		wiki:'Shahed drones',   range_km:150,  payload_kg:45,  accuracy:'GPS/INS ~10m CEP', status:'Operational', used_against_israel:true,  notes:'Iranian-built UAV. Used for reconnaissance over Israeli positions and explosive-laden attack missions.' },
			{ name:'Shahed-136',    		wiki:'Shahed 136',      range_km:2000, payload_kg:50,  accuracy:'GPS/INS (loitering) ~5m CEP',  status:'Operational', used_against_israel:true,  notes:'Iran-supplied loitering munition. Used against Israel multiple times since Oct 2023. Slow but nearly silent and cheap.' },
		]
	},
	{
		category: 'Anti-Ship & Anti-Tank',
		items: [
			{ name:'Almas-3',       wiki:'Almas (missile)',       range_km:8,    payload_kg:8,   accuracy:'Imaging IR (Fire&Forget)',   status:'Operational', used_against_israel:true,  notes:'Iranian fire-and-forget ATGM. Used in 2024 against IDF forces crossing the border.' },
			{ name:'C-802 (Noor)',  wiki:'C-802',                 range_km:120,  payload_kg:165, accuracy:'Active radar homing', status:'Operational', used_against_israel:true,  notes:'Used to hit Israeli corvette INS Hanit in 2006. Can threaten Israel\'s offshore Leviathan gas platforms.' },
			{ name:'Kornet ATGM',   wiki:'9M133 Kornet',          range_km:5.5,  payload_kg:7,   accuracy:'Laser guided', status:'Operational', used_against_israel:true,  notes:'Russian anti-tank missile. Destroyed multiple Merkava tanks in 2006 and used extensively in 2024 war.' },
		]
	}
];

var _hezbollahSort = 'range';
var _arsenalActiveTab = 'iran';

function openArsenal(tab) {
	_arsenalActiveTab = tab || 'iran';
	document.getElementById('arsenalOverlay').classList.add('active');
	document.body.style.overflow = 'hidden';
	switchArsenalTab(_arsenalActiveTab, true);
}

function closeArsenal() {
	document.getElementById('arsenalOverlay').classList.remove('active');
	if (!document.querySelector('.ai-sum-overlay.active')) {
		document.body.style.overflow = 'auto';
	}
}

function switchArsenalTab(tab, forceRender) {
	_arsenalActiveTab = tab;
	const iranContent  = document.getElementById('iranArsenalContent');
	const hzbContent   = document.getElementById('hezbollahArsenalContent');
	const tabIran      = document.getElementById('arsenalTabIran');
	const tabHzb       = document.getElementById('arsenalTabHizbollah');
	if (tab === 'iran') {
		iranContent.style.display  = '';
		hzbContent.style.display   = 'none';
		tabIran.style.color        = '#a78bfa';
		tabIran.style.borderBottomColor = '#a78bfa';
		tabHzb.style.color         = 'rgba(255,255,255,0.35)';
		tabHzb.style.borderBottomColor  = 'transparent';
		if (forceRender || !iranContent.innerHTML.trim()) renderIranArsenal(IRAN_ARSENAL_DATA);
	} else {
		hzbContent.style.display   = '';
		iranContent.style.display  = 'none';
		tabHzb.style.color         = '#4ade80';
		tabHzb.style.borderBottomColor = '#4ade80';
		tabIran.style.color        = 'rgba(255,255,255,0.35)';
		tabIran.style.borderBottomColor = 'transparent';
		if (forceRender || !hzbContent.innerHTML.trim()) renderGroupArsenal('hezbollahArsenalContent', HEZBOLLAH_ARSENAL_DATA, '_hezbollahSort', '#4ade80', 'renderHezbollahArsenal');
	}
}

function openHezbollahArsenal() { openArsenal('hizbollah'); }

function closeHezbollahArsenal() { closeArsenal(); }

function openIranArsenal() { openArsenal('iran'); }

function closeIranArsenal() { closeArsenal(); }

function sortHezbollahArsenal(by) {
	_hezbollahSort = by;
	renderGroupArsenal('hezbollahArsenalContent', HEZBOLLAH_ARSENAL_DATA, '_hezbollahSort', '#4ade80', 'renderHezbollahArsenal');
}

function renderHezbollahArsenal() { switchArsenalTab('hizbollah', true); }

// ── Shared arsenal renderer ────────────────────────────────────────────────
function renderGroupArsenal(contentId, data, sortVar, accentColor, rerenderFn) {
	const currentSort = window[sortVar] || 'range';
	const CAT_CFG = {
		'Long-Range Ballistic Missiles': { color:'#f87171', icon:'🚀' },
		'Long-Range Rockets':            { color:'#f87171', icon:'🚀' },
		'Medium-Range Rockets':          { color:'#fb923c', icon:'💥' },
		'Short-Range Rockets':           { color:'#fbbf24', icon:'🎯' },
		'Drones (UAV)':                  { color:'#60a5fa', icon:'✈️' },
		'Drones & Naval':                { color:'#38bdf8', icon:'🌊' },
		'Anti-Ship & Anti-Tank':         { color:'#a78bfa', icon:'⚔️' },
	};

	const sorted = data.map(cat => ({
		...cat,
		items: [...(cat.items||[])].sort((a,b) =>
			currentSort === 'payload' ? (b.payload_kg||0)-(a.payload_kg||0) :
			currentSort === 'name'    ? a.name.localeCompare(b.name) :
			(b.range_km||0)-(a.range_km||0)
		)
	}));

	const btnStyle = (key) => currentSort === key
		? `padding:0.25rem 0.7rem;border-radius:5px;font-size:0.72rem;font-weight:600;cursor:pointer;border:1px solid ${accentColor};background:${accentColor}22;color:${accentColor};`
		: 'padding:0.25rem 0.7rem;border-radius:5px;font-size:0.72rem;font-weight:600;cursor:pointer;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.4);';

	let html = `
		<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem;">
			<span style="font-size:0.7rem;color:rgba(255,255,255,0.35);">Sort by:</span>
			<button onclick="sortHezbollahArsenal('name')"    style="${btnStyle('name')}">🔤 Name</button>
			<button onclick="sortHezbollahArsenal('range')"   style="${btnStyle('range')}">📏 Range</button>
			<button onclick="sortHezbollahArsenal('payload')" style="${btnStyle('payload')}">💣 Payload</button>
		</div>`;

	let _grpItemIdx = 0;
	for (const cat of sorted) {
		const cfg = CAT_CFG[cat.category] || { color: accentColor, icon:'⚔️' };
		html += `
		<div style="margin-bottom:1.25rem;">
			<div style="font-size:0.8rem;font-weight:800;color:${cfg.color};margin-bottom:0.5rem;padding-bottom:0.3rem;border-bottom:1px solid rgba(255,255,255,0.07);">${cfg.icon} ${cat.category} <span style="font-size:0.65rem;color:rgba(255,255,255,0.3);font-weight:400;">${(cat.items||[]).length} weapons</span></div>
			<div style="display:flex;flex-direction:column;gap:0.5rem;">
				${(cat.items||[]).map((item,_ii_)=>{ item._globalIdx = _grpItemIdx++; return `
				<div style="display:flex;gap:0.75rem;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-left:3px solid ${cfg.color};border-radius:8px;padding:0.65rem;align-items:flex-start;">
					<div style="flex-shrink:0;width:110px;height:72px;border-radius:8px;overflow:visible;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.08);position:relative;z-index:1;">
						<img data-wiki="${item.wiki||''}"
							style="width:110px;height:72px;object-fit:cover;object-position:center;display:none;border-radius:8px;cursor:zoom-in;transition:transform 0.25s ease,box-shadow 0.25s ease;transform-origin:left center;"
							onmouseover="this.style.transform='scale(5)';this.style.boxShadow='0 12px 48px rgba(0,0,0,0.95)';this.style.zIndex='99999';this.style.position='relative';let p=this.parentElement;while(p&&p.id!=='${contentId}'){p.style.zIndex='99999';p.style.position='relative';p=p.parentElement;}"
							onmouseout="this.style.transform='scale(1)';this.style.boxShadow='none';this.style.zIndex='1';let p=this.parentElement;while(p&&p.id!=='${contentId}'){p.style.zIndex='';p.style.position='';p=p.parentElement;}"
						/>
						<div class="wiki-img-fallback" style="font-size:2.2rem;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.03);border-radius:8px;">${cfg.icon}</div>
					</div>
					<div style="flex:1;min-width:0;">
						<div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:0.3rem;margin-bottom:0.25rem;">
							<span style="font-size:0.8rem;font-weight:700;color:${cfg.color};cursor:pointer;text-decoration:underline;text-underline-offset:3px;text-decoration-color:rgba(255,255,255,0.2);" onclick="window.open('https://en.wikipedia.org/wiki/${encodeURIComponent(''+item.wiki)}','_blank')">${item.name} <span style="font-size:0.65rem;opacity:0.5;">↗</span></span>
							${item.used_against_israel ? `<span style="font-size:0.62rem;background:rgba(248,113,113,0.15);color:#f87171;border:1px solid rgba(248,113,113,0.3);border-radius:3px;padding:0.1rem 0.35rem;">Used vs Israel</span>` : ''}
						</div>
						<div style="display:flex;flex-wrap:wrap;gap:0.4rem 1rem;margin-bottom:0.25rem;">
							${item.range_km   ? `<span style="font-size:0.68rem;color:rgba(255,255,255,0.45);">📏 <span style="color:rgba(255,255,255,0.75);">${item.range_km} km</span></span>` : ''}
							${item.payload_kg ? `<span style="font-size:0.68rem;color:rgba(255,255,255,0.45);">💣 <span style="color:rgba(255,255,255,0.75);">${item.payload_kg} kg</span></span>` : ''}
							${item.accuracy   ? `<span style="font-size:0.68rem;color:rgba(255,255,255,0.45);">🎯 <span style="color:rgba(255,255,255,0.75);">${item.accuracy}</span></span>` : ''}
						</div>
						<div style="margin-bottom:0.2rem;">
							<span style="font-size:0.62rem;padding:0.1rem 0.4rem;border-radius:3px;background:${item.status==='Operational'?'rgba(52,211,153,0.15)':'rgba(251,191,36,0.15)'};color:${item.status==='Operational'?'#34d399':'#fbbf24'};border:1px solid ${item.status==='Operational'?'rgba(52,211,153,0.3)':'rgba(251,191,36,0.3)'};">${item.status||'Unknown'}</span>
						</div>
						${item.notes ? `<div style="font-size:0.72rem;color:rgba(255,255,255,0.5);line-height:1.5;">${item.notes}</div>
						<div id="arsenal-he-${contentId}-${item._globalIdx}" style="font-size:0.72rem;color:rgba(255,255,255,0.35);line-height:1.5;direction:rtl;text-align:right;font-style:italic;margin-top:0.15rem;"></div>` : ''}
					</div>
				</div>`; }).join('')}
			</div>
		</div>`;
	}

	html += `<div style="font-size:0.6rem;color:rgba(255,255,255,0.18);text-align:center;padding-top:0.5rem;border-top:1px solid rgba(255,255,255,0.06);">Sources: CSIS, Alma Research, INSS, Jane's Defence · ${new Date().toLocaleDateString('en-GB')}</div>`;
	document.getElementById(contentId).innerHTML = html;
	// Translate notes to Hebrew
	data.forEach(cat => (cat.items||[]).forEach(item => {
		if (item.notes) translateArsenalNote(item.notes, 'arsenal-he-' + contentId + '-' + item._globalIdx);
	}));

	document.querySelectorAll(`#${contentId} img[data-wiki]`).forEach(img => {
		const article = img.getAttribute('data-wiki');
		if (article) loadWikiImage(img, article);
	});
	
	addArsenalTranslations(contentId);
}
// ── End Hezbollah/Hamas Arsenal ────────────────────────────────────────────

// ── Iran Arsenal ──────────────────────────────────────────────────────────
function openIranArsenal() {
	document.getElementById('iranArsenalOverlay').classList.add('active');
	document.body.style.overflow = 'hidden';
	renderIranArsenal(IRAN_ARSENAL_DATA);
}

function closeIranArsenal() {
	document.getElementById('iranArsenalOverlay').classList.remove('active');
	document.body.style.overflow = 'auto';
}

const IRAN_ARSENAL_DATA = [
	{
		category: 'Ballistic Missiles',
		items: [
					{ name:'Emad',                  	wiki:'Emad (missile)',           range_km:1700, payload_kg:750,  accuracy:'MaRV (maneuverable RV)~500m CEP',  status:'Operational', used_against_israel:false, notes:'Shahab-3 derivative with maneuverable reentry vehicle. Assessed by CSIS as reaching all of Israel.' },
					{ name:'Fattah-1 (Hypersonic)', 	wiki:'Fattah (missile)',         range_km:1400, payload_kg:500,  accuracy:'Hypersonic glide + INS ~10m CEP',   status:'Operational', used_against_israel:true,  notes:'Iran\'s first claimed hypersonic glide missile. Used in October 2024 attack on Israel. Travels at Mach 13–15, extremely difficult to intercept.' },
					{ name:'Fattah-2 (Hypersonic)', 	wiki:'Fattah-2',                 range_km:1500, payload_kg:500,  accuracy:'Hypersonic glide + MaRV ~10m CEP',   status:'Operational', used_against_israel:true,  notes:'Upgraded Fattah with enhanced maneuverability. Used in March 2026 attacks on Israel and US Gulf bases. Penetrated multiple air defense systems.' },
					{ name:'Ghadr-110',             	wiki:'Ghadr-110',                range_km:2000, payload_kg:750,  accuracy:'INS/GPS 30–50m CEP', status:'Operational', used_against_israel:true,  notes:'Liquid-fuel variant of Shahab-3. Used in multiple strikes on Israel in 2024. Improved guidance over Shahab-3.' },
					{ name:'Haj Qasem',             	wiki:'Haj Qasem (missile)',      range_km:1400, payload_kg:500,  accuracy:'GPS/INS + fin guidance ~30m CEP',   status:'Operational', used_against_israel:true,  notes:'Named after Qasem Soleimani. Solid-fuel MRBM with guidance fins. Used in True Promise II (October 2024).' },
					{ name:'Khorramshahr-4 (Kheibar)', 	wiki:'Kheibar (missile)',        range_km:2000, payload_kg:1500, accuracy:'MaRV (maneuvering reentry) 30m CEP',     status:'Operational', used_against_israel:true,  notes:'Used in October 2024 True Promise II attack. MaRV warhead allows maneuvering during reentry, harder to intercept.' },
					{ name:'Kheibar Shekan',        	wiki:'Kheibar Shekan',           range_km:1450, payload_kg:500,  accuracy:'GPS/INS + fin guidance ~30m CEP',   status:'Operational', used_against_israel:true,  notes:'Solid-fuel, fin-guided MRBM with satellite navigation. Used in April and October 2024 attacks. Struck Nevatim Air Base.' },
					{ name:'Qasem Basir',           	wiki:'Qasem Basir',              range_km:1500, payload_kg:500,  accuracy:'GPS/INS ~30m CEP',   status:'Operational', used_against_israel:false, notes:'Iran\'s newest solid-fuel MRBM unveiled in 2025. High maneuverability in terminal phase designed to evade Arrow and Patriot interception systems.' },
					{ name:'Sejjil-2',              	wiki:'Sejjil',                   range_km:2500, payload_kg:750,  accuracy:'INS/GPS 30–50m CEP',  status:'Operational', used_against_israel:false, notes:'Solid-fuel MRBM, fastest launch time of any Iranian ballistic missile. Can reach all of Israel in ~11 min.' },
					{ name:'Shahab-3',              	wiki:'Shahab-3',                 range_km:1300, payload_kg:760,  accuracy:'Inertial only (~2500m CEP, very imprecise) ~2500m CEP', status:'Operational', used_against_israel:false, notes:'Iran\'s workhorse liquid-fuel MRBM. Older system, less accurate but in large quantities. Backbone of Iranian arsenal for decades.' },
		]
	},
	{
		category: 'Cruise Missiles',
		items: [
			{ name:'Hoveyzeh', wiki:'Hoveyzeh (cruise missile)', range_km:1350, payload_kg:450, accuracy:'GPS + terrain-following ~5m CEP', status:'Operational', used_against_israel:true,  notes:'Terrain-hugging cruise missile. Used in April 2024 attack on Israel alongside ballistic missiles and drones.' },
			{ name:'Paveh',    wiki:'Paveh cruise missile',    range_km:1650, payload_kg:500, accuracy:'GPS + terrain-following ~5m CEP', status:'Operational', used_against_israel:true,  notes:'Long-range terrain-hugging cruise missile unveiled in 2023. Used in attacks on Israel and US bases in the region. Flies at low altitude to evade radar.' },
			{ name:'Soumar',   wiki:'Soumar (missile)',   range_km:3000, payload_kg:450, accuracy:'GPS + terrain-following ~5m CEP', status:'Operational', used_against_israel:false, notes:'Iran\'s longest-range cruise missile. Based on Soviet Kh-55 design. Flies low to evade radar. Rarely used operationally.' },
		]
	},
	{
		category: 'Drones (UAV)',
		items: [
			{ name:'Arash-2 (Kian-2)',        wiki:'Arash-2',          range_km:2000, payload_kg:150, accuracy:'GPS/INS ~10m CEP',                     status:'Operational', used_against_israel:false, notes:'Large loitering munition. 2,000 km range designed to reach Israeli cities of Tel Aviv and Haifa from Iran. Radar-evading with high destructive capability.' },
			{ name:'Kaman-22',                wiki:'Kaman 22 (UAV)',   range_km:3000, payload_kg:300, accuracy:'GPS/INS + smart munitions ~5m CEP',     status:'Operational', used_against_israel:false, notes:'Wide-body UCAV resembling MQ-9 Reaper. 24hr endurance, 7 hardpoints. Iran\'s first wide-body combat drone. Can carry all types of Iranian munitions.' },
			{ name:'Karrar',                  wiki:'Karrar (UAV)',     range_km:1000, payload_kg:500, accuracy:'GPS/INS ~10m CEP',                     status:'Operational', used_against_israel:false, notes:'Jet-powered combat UAV. Can carry bombs or anti-ship missiles. Also used as decoy to overwhelm air defense radars.' },
			{ name:'Mohajer-6',               wiki:'Qods Mohajer-6',   range_km:2000, payload_kg:150, accuracy:'Qaem TV/IR-guided + Almas ATGMs ~3m CEP', status:'Operational', used_against_israel:false, notes:'Multirole ISR/UCAV. 12hr endurance. Carries up to 4 Qaem or Almas guided munitions. Widely exported; used by Russia in Ukraine. ~210 produced.' },
			{ name:'Shahed-129',              wiki:'Shahed 129',       range_km:1700, payload_kg:400, accuracy:'GPS/INS + Sadid PGMs ~5m CEP',         status:'Operational', used_against_israel:true,  notes:'MALE UCAV, similar to MQ-1 Predator. 24hr endurance. Carries up to 4 Sadid guided missiles. Used in Syria, Iraq. Shot down entering Israeli airspace from Lebanon (2012).' },
			{ name:'Shahed-136 (Geran-2)',    wiki:'Shahed 136',       range_km:2500, payload_kg:50,  accuracy:'GPS/INS (loitering munition) ~5m CEP', status:'Operational', used_against_israel:true,  notes:'One-way loitering munition. Used en masse (170+) in April 2024 to saturate Israeli air defenses. Cheap and produced in large numbers.' },
			{ name:'Shahed-149 (Gaza)',       wiki:'Shahed 149 Gaza',  range_km:2000, payload_kg:500, accuracy:'GPS/INS + Sadid-345 PGMs ~5m CEP',     status:'Operational', used_against_israel:false, notes:'Super-heavy MALE UCAV, turboprop-powered. 35hr endurance, 22m wingspan. Can carry up to 13 Sadid-345 bombs. Iran\'s largest drone, comparable to MQ-9 Reaper.' },
			{ name:'Shahed-238',              wiki:'Shahed 238',       range_km:2000, payload_kg:50,  accuracy:'GPS/INS (loitering munition) ~5m CEP', status:'Operational', used_against_israel:true,  notes:'Jet-powered upgrade of Shahed-136. 185 used in April 2024 attack. Faster and harder to intercept than propeller variant.' },
		]
	},
	{
		category: 'Submarines',
		items: [
			{ name:'Fateh-class',        	wiki:'IRIS Fateh',            	range_km:1000, payload_kg:null, accuracy:'Cruise missile guidance', status:'Operational', used_against_israel:false, notes:'Iran\'s most advanced domestically-built submarine. Can launch cruise missiles. Primarily a Gulf/regional threat.' },
			{ name:'Ghadir-class',       	wiki:'Ghadir-class submarine', 	range_km:600,  payload_kg:null, accuracy:'Torpedo/mine — no missile guidance', status:'Operational', used_against_israel:false, notes:'21 units in service. Small coastal submarines designed for Persian Gulf operations, mining, and surprise attacks on shipping.' },
			{ name:'Kilo-class (877EKM)', 	wiki:'Kilo-class submarine',  	range_km:6000, payload_kg:null, accuracy:'Cruise missile guidance', status:'Operational', used_against_israel:false, notes:'3 Russian-built subs. Can fire cruise missiles. Range enough to operate in Red Sea and Mediterranean.' },
		]
	}
];

async function fetchIranArsenal() {
	document.getElementById('iranArsenalContent').innerHTML = `
		<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:3rem 1rem;gap:1rem;">
			<div style="width:40px;height:40px;border:3px solid rgba(168,85,247,0.2);border-top-color:#a78bfa;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
			<div style="color:rgba(255,255,255,0.5);font-size:0.85rem;">Searching for arsenal data...</div>
		</div>`;
	renderIranArsenal(IRAN_ARSENAL_DATA);
}

function loadWikiImage(imgEl, articleTitle) {
	const fallback = imgEl.parentElement.querySelector('.wiki-img-fallback');
	fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(articleTitle)}`)
		.then(r => { if (!r.ok) throw new Error('bad response'); return r.json(); })
		.then(data => {
			const src = data?.thumbnail?.source || data?.originalimage?.source;
			if (!src) throw new Error('no image in response');
			imgEl.onload = () => {
				imgEl.style.display = 'block';
				if (fallback) fallback.style.display = 'none';
			};
			imgEl.onerror = () => {
				imgEl.style.display = 'none';
				if (fallback) fallback.style.display = 'flex';
			};
			imgEl.src = src;
		})
		.catch(() => {
			imgEl.style.display = 'none';
			if (fallback) fallback.style.display = 'flex';
		});
}

let _arsenalSort = 'range'; // 'range' | 'payload'

function sortIranArsenal(by) {
	_arsenalSort = by;
	document.querySelectorAll('.arsenal-sort-btn').forEach(b => {
		const active = b.dataset.sort === by;
		b.style.background = active ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.04)';
		b.style.borderColor = active ? 'rgba(168,85,247,0.6)' : 'rgba(255,255,255,0.12)';
		b.style.color = active ? '#a78bfa' : 'rgba(255,255,255,0.4)';
	});
	// Re-sort each category's item list in the DOM — just re-render
	renderIranArsenal(IRAN_ARSENAL_DATA);
}

function renderIranArsenal(categories) {
	const CAT_CFG = {
		'Ballistic Missiles': { color:'#f87171', icon:'🚀' },
		'Cruise Missiles':    { color:'#fbbf24', icon:'💥' },
		'Drones':             { color:'#fb923c', icon:'✈️' },
		'Submarines':         { color:'#38bdf8', icon:'🌊' },
		'Other':              { color:'#94a3b8', icon:'⚔️' },
	};

	const totalItems = categories.reduce((s,c)=>s+(c.items||[]).length, 0);
	const usedCount  = categories.reduce((s,c)=>s+(c.items||[]).filter(i=>i.used_against_israel).length, 0);

	// Sort items within each category
	const sorted = categories.map(cat => ({
		...cat,
		items: [...(cat.items||[])].sort((a,b) => {
			if (_arsenalSort === 'payload') return (b.payload_kg||0) - (a.payload_kg||0);
			if (_arsenalSort === 'name')    return a.name.localeCompare(b.name);
			return (b.range_km||0) - (a.range_km||0);
		})
	}));
	categories = sorted;

	const btnStyle = (key) => _arsenalSort === key
		? 'padding:0.25rem 0.7rem;border-radius:5px;font-size:0.72rem;font-weight:600;cursor:pointer;border:1px solid rgba(168,85,247,0.6);background:rgba(168,85,247,0.25);color:#a78bfa;'
		: 'padding:0.25rem 0.7rem;border-radius:5px;font-size:0.72rem;font-weight:600;cursor:pointer;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.4);';
	let html = `
		<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem;">
			<span style="font-size:0.7rem;color:rgba(255,255,255,0.35);">Sort by:</span>
			<button class="arsenal-sort-btn" data-sort="name"    onclick="sortIranArsenal('name')"    style="${btnStyle('name')}">🔤 Name</button>
			<button class="arsenal-sort-btn" data-sort="range"   onclick="sortIranArsenal('range')"   style="${btnStyle('range')}">📏 Range</button>
			<button class="arsenal-sort-btn" data-sort="payload" onclick="sortIranArsenal('payload')" style="${btnStyle('payload')}">💣 Payload</button>
		</div>`;

	let _iranItemIdx = 0;
	for (const cat of categories) {
		const cfg = CAT_CFG[cat.category] || CAT_CFG['Other'];
		html += `
		<div style="margin-bottom:1.25rem;">
			<div style="font-size:0.8rem;font-weight:800;color:${cfg.color};margin-bottom:0.5rem;padding-bottom:0.3rem;border-bottom:1px solid rgba(255,255,255,0.07);">${cfg.icon} ${cat.category} <span style="font-size:0.65rem;color:rgba(255,255,255,0.3);font-weight:400;">${(cat.items||[]).length} weapons</span></div>
			<div style="display:flex;flex-direction:column;gap:0.5rem;">
				${(cat.items||[]).map((item,_ii_)=>{ item._globalIdx = _iranItemIdx++; return `
				<div style="display:flex;gap:0.75rem;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-left:3px solid ${cfg.color};border-radius:8px;padding:0.65rem;align-items:flex-start;">
					<div style="flex-shrink:0;width:110px;height:72px;border-radius:8px;overflow:visible;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.08);position:relative;z-index:1;">
						<img data-wiki="${item.wiki||''}"
							style="width:110px;height:72px;object-fit:cover;object-position:center;display:none;border-radius:8px;cursor:zoom-in;transition:transform 0.25s ease,box-shadow 0.25s ease;transform-origin:left center;"
							onmouseover="this.style.transform='scale(5)';this.style.boxShadow='0 12px 48px rgba(0,0,0,0.95)';this.style.zIndex='99999';this.style.position='relative';let p=this.parentElement;while(p&&p.id!=='iranArsenalContent'){p.style.zIndex='99999';p.style.position='relative';p=p.parentElement;}"
							onmouseout="this.style.transform='scale(1)';this.style.boxShadow='none';this.style.zIndex='1';let p=this.parentElement;while(p&&p.id!=='iranArsenalContent'){p.style.zIndex='';p.style.position='';p=p.parentElement;}"
					/>
						<div class="wiki-img-fallback" style="font-size:2.2rem;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.03);border-radius:8px;">${cfg.icon}</div>
					</div>
					<div style="flex:1;min-width:0;">
						<div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:0.3rem;margin-bottom:0.25rem;">
							<span style="font-size:0.8rem;font-weight:700;color:${cfg.color};cursor:pointer;text-decoration:underline;text-underline-offset:3px;text-decoration-color:rgba(168,85,247,0.4);" onclick="window.open('https://en.wikipedia.org/wiki/${encodeURIComponent(item.wiki||item.name)}','_blank')">${item.name} <span style="font-size:0.65rem;opacity:0.5;">↗</span></span>
							${item.used_against_israel?`<span style="font-size:0.62rem;background:rgba(248,113,113,0.15);color:#f87171;border:1px solid rgba(248,113,113,0.3);border-radius:3px;padding:0.1rem 0.35rem;">Used vs Israel</span>`:''}
						</div>
						<div style="display:flex;flex-wrap:wrap;gap:0.4rem 1rem;margin-bottom:0.25rem;">
							${item.range_km?`<span style="font-size:0.68rem;color:rgba(255,255,255,0.45);">📏 Range: <span style="color:rgba(255,255,255,0.75);">${item.range_km.toLocaleString()} km</span></span>`:''}
							${item.payload_kg?`<span style="font-size:0.68rem;color:rgba(255,255,255,0.45);">💣 Payload: <span style="color:rgba(255,255,255,0.75);">${item.payload_kg} kg</span></span>`:''}
							${item.accuracy?`<span style="font-size:0.68rem;color:rgba(255,255,255,0.45);">🎯 CEP: <span style="color:rgba(255,255,255,0.75);">${item.accuracy}</span></span>`:''}
						</div>
						<div style="display:flex;align-items:center;gap:0.4rem;margin-bottom:0.2rem;">
							<span style="font-size:0.62rem;padding:0.1rem 0.4rem;border-radius:3px;background:${item.status==='Operational'?'rgba(52,211,153,0.15)':'rgba(251,191,36,0.15)'};color:${item.status==='Operational'?'#34d399':'#fbbf24'};border:1px solid ${item.status==='Operational'?'rgba(52,211,153,0.3)':'rgba(251,191,36,0.3)'};">${item.status||'Unknown'}</span>
						</div>
						${item.notes?`<div style="font-size:0.72rem;color:rgba(255,255,255,0.5);line-height:1.5;">${item.notes}</div>
						<div id="arsenal-he-iran-${item._globalIdx}" style="font-size:0.72rem;color:rgba(255,255,255,0.35);line-height:1.5;direction:rtl;text-align:right;font-style:italic;margin-top:0.15rem;"></div>`:''}
					</div>
				</div>`; }).join('')}
			</div>
		</div>`;
	}

	html += `<div style="font-size:0.6rem;color:rgba(255,255,255,0.18);text-align:center;padding-top:0.5rem;border-top:1px solid rgba(255,255,255,0.06);">Sources: IISS Military Balance, CSIS Missile Defense Project, Jane's Defence · ${new Date().toLocaleDateString('en-GB')}</div>`;

	document.getElementById('iranArsenalContent').innerHTML = html;
	// Translate notes to Hebrew
	categories.forEach(cat => (cat.items||[]).forEach(item => {
		if (item.notes) translateArsenalNote(item.notes, 'arsenal-he-iran-' + item._globalIdx);
	}));
	// Load Wikipedia thumbnails for all weapons
	document.querySelectorAll('#iranArsenalContent img[data-wiki]').forEach(img => {
		const article = img.getAttribute('data-wiki');
		if (article) loadWikiImage(img, article, '');
	});
	
	addArsenalTranslations('iranArsenalContent');
}
// ── End Iran Arsenal ──────────────────────────────────────────────────────