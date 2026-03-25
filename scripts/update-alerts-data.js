/**
 * update-alerts-data.js
 * Runs via GitHub Actions every 30 minutes.
 * 1. Fetches alert history from tzevaadom.co.il (no CORS issues server-side)
 * 2. Merges with existing data (preserves historical alerts beyond the API's rolling window)
 * 3. Writes data/alert-history.json
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'alert-history.json');
const TELEGRAM_FILE = path.join(__dirname, '..', 'data', 'telegram-idf.json');
const ALERT_API = 'https://api.tzevaadom.co.il/alerts-history';
const TG_URL = 'https://t.me/s/IDFSpokesperson';

async function fetchAlerts() {
    console.log('Fetching from tzevaadom.co.il...');
    try {
        const resp = await fetch(ALERT_API, {
            headers: { 'User-Agent': 'TatzpitBot/1.0' },
            signal: AbortSignal.timeout(15000),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('Empty or invalid response');
        }
        console.log(`Fetched ${data.length} events from API`);
        return data;
    } catch (e) {
        console.error('Alert fetch failed:', e.message);
        return null;
    }
}

function mergeAlerts(existing, fresh) {
    // The API has a rolling window — merge to preserve historical data
    if (!existing || !existing.events) return fresh;
    if (!fresh) return existing.events;

    // Build a map of existing events by ID
    const byId = new Map();
    for (const ev of existing.events) {
        byId.set(ev.id, ev);
    }
    // Add/update with fresh data
    for (const ev of fresh) {
        byId.set(ev.id, ev); // fresh data overwrites
    }
    // Sort by newest first
    return [...byId.values()].sort((a, b) => {
        const tA = Math.min(...(a.alerts || []).map(al => al.time || 0));
        const tB = Math.min(...(b.alerts || []).map(al => al.time || 0));
        return tB - tA;
    });
}

async function main() {
    console.log('=== Alert History Update ===');
    console.log(`Time: ${new Date().toISOString()}`);

    // Load existing data
    let existing = null;
    try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        existing = JSON.parse(raw);
        console.log(`Loaded existing: ${existing.events?.length || 0} events`);
    } catch (e) {
        console.log('No existing data file, starting fresh.');
    }

    // Fetch fresh data
    const freshData = await fetchAlerts();

    // Merge
    const merged = mergeAlerts(existing, freshData);
    if (!merged || merged.length === 0) {
        console.error('No data available at all. Exiting.');
        process.exit(existing ? 0 : 1); // Don't fail if we already have data
    }

    const output = {
        updated: new Date().toISOString(),
        source: 'tzevaadom.co.il',
        event_count: merged.length,
        events: merged,
    };

    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(output));
    console.log(`Written ${merged.length} events to ${DATA_FILE}`);
    // ── Telegram IDF Spokesperson ──────────────────────────────────────────
    console.log('\nFetching IDF Spokesperson Telegram...');
    try {
        const tgResp = await fetch(TG_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            signal: AbortSignal.timeout(15000),
        });
        if (!tgResp.ok) throw new Error(`HTTP ${tgResp.status}`);
        const tgHtml = await tgResp.text();
        console.log(`Telegram page size: ${tgHtml.length} chars`);
        console.log(`Contains 'tgme_widget_message_text': ${tgHtml.includes('tgme_widget_message_text')}`);
        console.log(`Contains 'message_text': ${tgHtml.includes('message_text')}`);
        console.log(`First 300 chars: ${tgHtml.slice(0, 300)}`);

        const messages = [];

        // Method 1: Find all message text divs
        const textRegex = /tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/gi;
        const timeRegex = /<time[^>]*datetime="([^"]*)"/gi;

        // Collect all timestamps
        const allTimes = [];
        let tm;
        while ((tm = timeRegex.exec(tgHtml)) !== null) {
            allTimes.push(tm[1]);
        }
        console.log(`Found ${allTimes.length} timestamps`);

        // Collect all message texts
        let textMatch;
        let idx = 0;
        while ((textMatch = textRegex.exec(tgHtml)) !== null) {
            let text = textMatch[1]
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<[^>]+>/g, '')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#039;/g, "'")
                .replace(/\s+/g, ' ')
                .trim();

            if (text.length >= 10) {
                // Extract numbers about rockets/missiles (Hebrew + English)
                const nums = [];
                const patterns = [
                    /(\d+)\s*(rocket|missile|projectile|UAV|drone|aerial|intercept)/gi,
                    /(\d+)\s*(רקט|טיל|כטב"מ|שיגור|יירוט|מל"ט)/gi,
                    /(יורט|יירט|שוגר|שוגרו)\s*[-–]?\s*(\d+)/gi,
                ];
                for (const rx of patterns) {
                    for (const m of text.matchAll(rx)) {
                        nums.push(m[0].trim());
                    }
                }

                messages.push({
                    text: text.slice(0, 300),
                    nums,
                    ts: allTimes[idx] || null,
                });
            }
            idx++;
        }

        console.log(`Parsed ${messages.length} messages from method 1`);

        // Method 2 fallback: if method 1 found nothing, try broader search
        if (messages.length === 0) {
            console.log('Method 1 failed. Trying broader search...');
            const broadRegex = /class="[^"]*message[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
            let bm;
            while ((bm = broadRegex.exec(tgHtml)) !== null) {
                let text = bm[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
                if (text.length >= 20 && text.length < 2000) {
                    messages.push({ text: text.slice(0, 300), nums: [], ts: null });
                }
                if (messages.length >= 15) break;
            }
            console.log(`Parsed ${messages.length} messages from method 2`);
        }

        // Keep last 15 messages, newest first
        const recent = messages.slice(-15).reverse();

        const tgOutput = {
            updated: new Date().toISOString(),
            source: 'IDF Spokesperson Telegram',
            message_count: recent.length,
            debug: {
                page_size: tgHtml.length,
                has_widget_class: tgHtml.includes('tgme_widget_message_text'),
                timestamps_found: allTimes.length,
                raw_messages_found: messages.length,
            },
            messages: recent,
        };

        fs.writeFileSync(TELEGRAM_FILE, JSON.stringify(tgOutput, null, 2));
        console.log(`Written ${recent.length} messages to ${TELEGRAM_FILE}`);
    } catch (e) {
        console.warn('Telegram fetch failed:', e.message);
    }
	console.log('=== Done ===');
}

main().catch(e => {
    console.error('Fatal:', e);
    process.exit(1);
});
