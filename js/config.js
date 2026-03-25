const CORS_PROXY = 'tatzpit-proxy.guyguy098.workers.dev/?url=';

let activeStreams = new Set();
let loadedStreams = new Map();
let videoListenerControllers = new Map();
let lastOrientationWasLandscape = null;
let customSelectedChannels = new Set(); // Custom layout functionality
let customLayoutApplied = false; 		// track whether a layout was actually applied:
let allArticles = [];
let groupedStories = [];
let fetchGeneration = 0;
let bandwidthIntervalId = null;


// ── Config Constants ──
const MAX_ACTIVE_STREAMS     = 6;
const MAX_CONCURRENT_PREVIEWS = 6; // 6 x 2.5 Mbps = 15 Mbps cap
const BANDWIDTH_LIMIT_MBPS   = 15;
const PREVIEW_FRAME_DELAY_MS = 1000;
const ERROR_DISPLAY_MS       = 3000;
const BANDWIDTH_POLL_MS      = 1000;
const TFIDF_SIMILARITY_THRESHOLD = 0.18;
const MAX_STORIES_DISPLAY    = 50;
const MAX_ARTICLES_PER_CATEGORY = 25;
const GEMINI_ARTICLE_LIMIT   = 60;
const GEMINI_MIN_KEY_LENGTH  = 10;
const RESIZE_DEBOUNCE_MS     = 50;
const STAT_BAR_INIT_DELAY_MS = 50;
const LAYOUT_READ_DELAY_MS   = 10;
