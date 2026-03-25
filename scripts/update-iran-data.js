/**
 * update-iran-data.js
 * Runs via GitHub Actions every 4 hours.
 * 1. Fetches GDELT articles about Iran attacks
 * 2. Fetches relevant RSS feeds
 * 3. Sends to Gemini for structured extraction
 * 4. Merges with existing data (preserves historical events)
 * 5. Writes data/iran-attacks.json
 */

const fs = require('fs');
const path = require('path');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DATA_FILE = path.join(__dirname, '..', 'data', 'iran-attacks.json');

// ── GDELT queries ──────────────────────────────────────────────────────────
const GDELT_QUERIES = [
	'iran attack',
	'iran missile',
	'iran drone strike',
	'iran Israel attack',
	'iran UAE attack',
	'iran Saudi attack',
	'IRGC attack',
	'shahed drone',
	'iran ballistic missile',
	'iran war',
	'iran strikes',
	'iran ceasefire',
	'iran military',
];

async function fetchGDELT() {
	const articles = [];
	for (const q of GDELT_QUERIES) {
		const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(q)}&mode=artlist&maxrecords=50&format=json&timespan=7d&sort=hybridrel`;
		try {
			const resp = await fetch(url);
			if (!resp.ok) continue;
			const data = await resp.json();
			if (data.articles) {
				for (const a of data.articles) {
					articles.push({
						title: a.title || '',
						url: a.url || '',
						source: a.domain || '',
						date: a.seendate || '',
						language: a.language || 'English',
					});
				}
			}
		} catch (e) {
			console.warn(`GDELT fetch failed for "${q}":`, e.message);
		}
	}
	// Deduplicate by URL
	const seen = new Set();
	return articles.filter(a => {
		if (seen.has(a.url)) return false;
		seen.add(a.url);
		return true;
	});
}

// ── RSS feeds (no CORS issues server-side) ─────────────────────────────────
const RSS_URLS = [
	'https://www.aljazeera.com/xml/rss/all.xml',
	'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml',
	'https://rss.cnn.com/rss/edition_meast.rss',
	'https://feeds.reuters.com/reuters/topNews',
	'https://www.timesofisrael.com/feed/',
	'https://www.jpost.com/rss/rssfeedsfrontpage.aspx',
	'https://www.i24news.tv/en/rss',
	'https://english.almayadeen.net/rss.xml',
	'https://english.almanar.com.lb/feed',
	'https://www.presstv.ir/rss',
	'https://www.tasnimnews.com/en/rss',
	'https://moxie.foxnews.com/google-publisher/world.xml',
	'https://feeds.nbcnews.com/nbcnews/public/world',
	'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
	'https://feeds.washingtonpost.com/rss/world',
	'https://rss.ap.org/topics/world-news',
];

const IRAN_KEYWORDS = /iran|irgc|tehran|shaheed|shahed|ballistic|missile.*(?:gulf|israel|uae|saudi|bahrain|qatar|kuwait|jordan)|drone.*(?:attack|strike)|cruise\s*missile/i;

async function fetchRSSFeeds() {
	const articles = [];
	for (const url of RSS_URLS) {
		try {
			const resp = await fetch(url, {
				headers: { 'User-Agent': 'TatzpitBot/1.0' },
				signal: AbortSignal.timeout(10000),
			});
			if (!resp.ok) continue;
			const text = await resp.text();

			// Simple XML extraction (no dependencies needed)
			const items = text.match(/<item[\s\S]*?<\/item>/gi) || [];
			for (const item of items) {
				const title = (item.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '';
				const cleanTitle = title.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').trim();
				const link = (item.match(/<link[^>]*>([\s\S]*?)<\/link>/i) || [])[1] || '';
				const cleanLink = link.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
				const pubDate = (item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) || [])[1] || '';
				const desc = (item.match(/<description[^>]*>([\s\S]*?)<\/description>/i) || [])[1] || '';
				const cleanDesc = desc.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').trim();

				const combined = `${cleanTitle} ${cleanDesc}`;
				if (IRAN_KEYWORDS.test(combined)) {
					articles.push({
						title: cleanTitle,
						url: cleanLink,
						date: pubDate,
						source: new URL(url).hostname.replace('www.', ''),
						snippet: cleanDesc.slice(0, 300),
					});
				}
			}
		} catch (e) {
			console.warn(`RSS fetch failed for ${url}:`, e.message);
		}
	}
	return articles;
}

// ── Gemini structuring ─────────────────────────────────────────────────────
async function structureWithGemini(articles, existingData) {
	if (!GEMINI_API_KEY) {
		console.error('No GEMINI_API_KEY set. Cannot structure data.');
		return null;
	}

	const today = new Date().toISOString().split('T')[0];

	// Provide existing data as context so Gemini can update/merge
	const existingSummary = existingData
		? `\n\nEXISTING DATA (update/add to this — do NOT remove confirmed events):\n${JSON.stringify(existingData, null, 0)}`
		: '';

	// Trim articles for token limits
	const articleText = articles.slice(0, 80).map((a, i) =>
		`[${i + 1}] ${a.date || ''} | ${a.source || ''} | ${a.title}\n${a.snippet || ''}`
	).join('\n\n');

	const prompt = `You are a military analyst. Today is ${today}. Below are news articles about Iran's attacks on other countries since February 28, 2026.

ARTICLES:
${articleText}
${existingSummary}

TASK: Return a complete, updated JSON array of ALL confirmed Iran attacks since 2026-02-28. Merge new information from the articles with the existing data. Add new events, update casualty counts if new information is available, but NEVER remove confirmed events.

CRITICAL RULES:
- Only include CONFIRMED attacks (reported by 2+ credible sources)
- Every event MUST have real lat/lng coordinates of the actual location hit
- Use Israel timezone (+02:00) for timestamps
- Keep detail field factual, 1-2 sentences max

Return ONLY valid JSON, no markdown fences, no explanation.

Schema:
[{
  "name": "Country name",
  "color": "#hex",
  "events": [{
    "ts": "2026-MM-DDTHH:MM",
    "types": ["missiles"|"drones"|"cruise"|"rockets"],
    "targets": ["Military base"|"Residential"|"Airport"|"Port"|"Hotel"|"Ship"|"Embassy/Consulate"|"Radar station"|"Data center"|"Industrial"],
    "counts": {"missiles": N, "drones": N},
    "cas": {"k": N, "i": N},
    "lat": 25.2532,
    "lng": 55.3657,
    "location_name": "Specific place name",
    "detail": "1-2 sentence factual description"
  }]
}]

Color map: Israel=#fbbf24, UAE=#f87171, Saudi Arabia=#fb923c, Bahrain=#60a5fa, Qatar=#a78bfa, Kuwait=#34d399, Jordan=#e879f9, Oman=#2dd4bf, Red Sea / Ships=#38bdf8, Iraq=#a3e635, Syria=#e11d48`;

	const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

	try {
		const resp = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				contents: [{ parts: [{ text: prompt }] }],
				generationConfig: {
					temperature: 0.1,
					maxOutputTokens: 8192,
				},
			}),
		});

		if (!resp.ok) {
			const err = await resp.text();
			throw new Error(`Gemini API ${resp.status}: ${err}`);
		}

		const data = await resp.json();
		const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
		const clean = text.replace(/```json\s*/g, '').replace(/```/g, '').trim();
		const jsonMatch = clean.match(/\[[\s\S]*\]/);
		const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : clean);

		if (Array.isArray(parsed) && parsed.length > 0) {
			return parsed;
		}
		throw new Error('Empty array returned');
	} catch (e) {
		console.error('Gemini structuring failed:', e.message);
		return null;
	}
}

// ── Validation & cleanup ───────────────────────────────────────────────────
function validateData(data) {
	if (!Array.isArray(data)) return null;

	return data.map(country => {
		if (!country.name || !Array.isArray(country.events)) return null;

		const events = country.events.filter(ev => {
			if (!ev.ts || !ev.types || !ev.counts) return false;
			// Ensure ts is in valid range
			const evDate = new Date(ev.ts + ':00+02:00');
			if (isNaN(evDate.getTime())) return false;
			if (evDate < new Date('2026-02-28')) return false;
			// Ensure cas exists
			if (!ev.cas) ev.cas = { k: 0, i: 0 };
			return true;
		});

		if (events.length === 0) return null;

		return {
			name: country.name,
			color: country.color || '#94a3b8',
			events,
		};
	}).filter(Boolean);
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
	console.log('=== Iran Attack Data Update ===');
	console.log(`Time: ${new Date().toISOString()}`);

	// Load existing data
	let existingData = null;
	try {
		const raw = fs.readFileSync(DATA_FILE, 'utf-8');
		const parsed = JSON.parse(raw);
		existingData = parsed.countries || null;
		console.log(`Loaded existing data: ${existingData?.length || 0} countries`);
	} catch (e) {
		console.log('No existing data file found, starting fresh.');
	}

	// Fetch from sources
	console.log('\nFetching GDELT...');
	const gdeltArticles = await fetchGDELT();
	console.log(`GDELT: ${gdeltArticles.length} articles`);

	console.log('Fetching RSS feeds...');
	const rssArticles = await fetchRSSFeeds();
	console.log(`RSS: ${rssArticles.length} relevant articles`);

	// Combine and deduplicate
	const allArticles = [...gdeltArticles, ...rssArticles];
	const seen = new Set();
	const unique = allArticles.filter(a => {
		const key = a.title.toLowerCase().slice(0, 60);
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
	console.log(`Combined unique articles: ${unique.length}`);

	if (unique.length === 0 && !existingData) {
		console.log('No articles found and no existing data. Skipping update.');
		process.exit(0);
	}

	// Structure with Gemini
	let structuredData = null;
	if (unique.length > 0) {
		console.log('\nSending to Gemini for structuring...');
		structuredData = await structureWithGemini(unique, existingData);
	}

	// Validate
	if (structuredData) {
		structuredData = validateData(structuredData);
	}

	// Use structured data, or keep existing
	const finalData = structuredData || existingData;
	if (!finalData) {
		console.error('No data available. Exiting without update.');
		process.exit(1);
	}

	const totalEvents = finalData.reduce((s, c) => s + c.events.length, 0);
	console.log(`\nFinal: ${finalData.length} countries, ${totalEvents} events`);

	// Write output
	const output = {
		updated: new Date().toISOString(),
		source: 'GDELT + RSS + Gemini',
		articles_processed: unique.length,
		countries: finalData,
	};

	fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
	fs.writeFileSync(DATA_FILE, JSON.stringify(output, null, 2));
	console.log(`Written to ${DATA_FILE}`);
	console.log('=== Done ===');
}

main().catch(e => {
	console.error('Fatal error:', e);
	process.exit(1);
});
