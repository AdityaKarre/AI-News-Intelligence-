import { useEffect, useState, useCallback } from "react";

const API_BASE = "https://ai-news-backend-ty0t.onrender.com";

// ─────────────────────────────────────────────
// HIGH-DENSITY CATEGORY FILTER MAP
// ─────────────────────────────────────────────
const CATEGORY_FILTERS = {
  Technology: {
    block: [
      "parliament", "minister", "election", "vote", "party", "congress",
      "bjp", "aap", "lok sabha", "rajya sabha", "mla", "mp ", " mp ",
      "chief minister", "cm ", "governor", "politician", "modi",
      "rahul gandhi", "amit shah", "kejriwal", "yogi",
      "murder", "rape", "assault", "arrest", "police", "court",
      "verdict", "sentence", "accused", "criminal", "fir ", "custody",
      "bail", "judge", "justice", "tribunal",
      "temple", "mosque", "church", "bakrid", "eid", "diwali",
      "ramadan", "hindu", "muslim", "christian", "religion",
      "protest", "riot", "violence", "communal", "highway", "accident",
      "cricket", "ipl", "football", "tennis", "match", "tournament",
      "player", "team", "wicket", "goal", "score",
      "bollywood", "movie", "film", "actor", "actress", "celebrity",
      "song", "album", "box office", "ott",
      "inflation", "gdp", "rupee", "budget", "tax", "sensex", "nifty",
    ],
    allow: [
      "tech", "technology", "software", "hardware", "app", "apps",
      "smartphone", "phone", "laptop", "computer", "chip", "semiconductor",
      "ai", "artificial intelligence", "machine learning", "deep learning",
      "cyber", "cybersecurity", "hack", "data breach", "cloud",
      "5g", "internet", "broadband", "wifi", "satellite",
      "robot", "robotics", "drone", "ev", "electric vehicle",
      "coding", "developer", "programming", "api", "open source",
      "google", "apple", "microsoft", "amazon", "meta", "openai",
      "tesla", "nvidia", "intel", "samsung", "qualcomm", "amd",
      "gadget", "device", "wearable", "smartwatch", "tablet",
      "launch", "release", "update", "version", "feature",
      "blockchain", "crypto", "bitcoin", "web3", "startup", "unicorn", 
      "funding", "innovation", "patent", "research", "digital",
      "playstation", "xbox", "gaming", "gpu", "processor", "iphone", 
      "android", "pixel", "galaxy", "oneplus", "screen", "display", 
      "battery", "charging", "online", "server", "system", "platform"
    ],
  },
  Sports: {
    block: [
      "parliament", "minister", "election", "vote", "party", "bjp",
      "congress", "lok sabha", "chief minister", "governor",
      "murder", "rape", "assault", "arrest", "court", "verdict",
      "accused", "criminal", "fir",
      "temple", "mosque", "bakrid", "eid", "diwali", "religion",
      "protest", "riot", "communal",
      "software", "hardware", "chip", "smartphone", "ai ",
      "machine learning", "cybersecurity", "cloud",
      "stock market", "sensex", "nifty", "inflation", "gdp",
      "budget", "tax", "rupee", "ipo",
      "bollywood", "movie", "film", "actor", "actress", "song",
      "album", "box office",
    ],
    allow: [
      "cricket", "football", "soccer", "tennis", "basketball",
      "hockey", "rugby", "golf", "athletics", "olympic", "olympics",
      "ipl", "bcci", "fifa", "uefa", "nba", "nfl", "nhl", "mlb",
      "match", "tournament", "championship", "league", "cup", "trophy",
      "player", "team", "coach", "squad", "innings", "wicket", "run",
      "goal", "score", "fixture", "series", "test match", "odi", "t20",
      "grand slam", "wimbledon", "formula 1", "f1", "racing",
      "marathon", "athlete", "sport", "sports", "final", "semifinal",
      "stadium", "transfer", "debut", "hat-trick", "penalty", "game",
      "play", "won", "lost", "win", "defeat", "victory", "stumper", "clash"
    ],
  },
  Business: {
    block: [
      "election", "vote", "party", "bjp", "congress", "lok sabha",
      "murder", "rape", "assault", "arrest", "court", "verdict",
      "accused", "fir",
      "temple", "mosque", "bakrid", "eid", "diwali", "religion",
      "protest", "riot", "communal",
      "bollywood", "movie", "film", "actor", "actress", "song",
      "box office", "ott",
      "cricket match", "ipl match", "football match", "wicket",
    ],
    allow: [
      "market", "stock", "share", "economy", "gdp", "inflation",
      "budget", "trade", "export", "import", "revenue", "profit",
      "loss", "earnings", "investment", "investor", "fund", "ipo",
      "startup", "company", "corporate", "industry", "sector",
      "bank", "banking", "finance", "financial", "tax", "rupee",
      "dollar", "sensex", "nifty", "bse", "nse", "rbi", "fed",
      "interest rate", "merger", "acquisition", "deal", "billion",
      "million", "quarter", "annual", "results", "growth", "recession",
      "employment", "job", "layoff", "hire", "ceo", "cfo", "business", 
      "commerce", "retail", "ecommerce", "supply chain", "crude", "oil", 
      "gold", "commodity", "forex", "chemical", "stores", "sales", "brands", 
      "retailer", "prices", "firm", "factory", "manufacture", "production", "commercial"
    ],
  },
  Entertainment: {
    block: [
      "parliament", "minister", "election", "lok sabha",
      "chief minister", "governor", "bjp", "congress",
      "murder", "rape", "assault", "arrest", "fir", "court",
      "bakrid", "riot", "communal",
      "stock market", "sensex", "nifty", "inflation", "ipo",
      "software", "chip", "semiconductor", "cybersecurity",
      "wicket", "innings", "goal", "penalty", "ipl score",
    ],
    allow: [
      "movie", "film", "cinema", "bollywood", "hollywood", "films",
      "series", "show", "tv", "ott", "netflix", "amazon prime",
      "disney", "hotstar", "song", "music", "album", "artist",
      "singer", "actor", "actress", "celebrity", "star",
      "award", "oscar", "grammy", "bafta", "filmfare",
      "release", "trailer", "review", "box office", "collection",
      "streaming", "web series", "entertainment", "concert", "tour",
      "fashion", "red carpet", "interview", "debut", "premiere",
      "television", "channel", "theatre", "screen", "songs", "teaser",
      "drama", "episode", "music video", "track", "singles", "starrer"
    ],
  },
  Politics: {
    block: [
      "bollywood", "movie", "film", "box office", "actor",
      "actress", "song", "album",
      "cricket score", "ipl score", "football score",
      "wicket", "goal scored", "match result",
      "software update", "app launch", "smartphone launch",
      "chip release",
    ],
    allow: [
      "government", "parliament", "minister", "prime minister",
      "president", "election", "vote", "party", "congress", "bjp",
      "lok sabha", "rajya sabha", "senate", "house", "white house",
      "policy", "law", "bill", "act", "constitution", "court",
      "supreme court", "high court", "judiciary", "diplomat",
      "foreign policy", "treaty", "sanction", "protest", "opposition",
      "political", "politician", "governance", "administration",
      "campaign", "rally", "coalition", "majority", "minority",
      "modi", "biden", "trump", "rahul", "shah", "zelensky",
      "war", "conflict", "ceasefire", "un ", "nato", "g20", "g7",
      "lok sabha", "assembly", "mla", "mp ", "leaders", "state", "centre"
    ],
  },
};

// ─────────────────────────────────────────────
// FILTER FUNCTION
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// COMPREHENSIVE FILTER & DYNAMIC DEMO SHUFFLER
// ─────────────────────────────────────────────
function filterArticles(articles, category) {
  if (!articles || articles.length === 0) return [];

  if (category === "All" || !CATEGORY_FILTERS[category]) {
    // For "All", still shuffle slightly on refresh to show distinct news
    return [...articles].sort(() => 0.5 - Math.random()).slice(0, 8);
  }

  const { block, allow } = CATEGORY_FILTERS[category];

  // Pass 1: Strict match
  let filtered = articles.filter((article) => {
    const text = ((article.title || "") + " " + (article.description || "")).toLowerCase();
    for (const word of block) {
      if (text.includes(word.toLowerCase())) return false;
    }
    for (const word of allow) {
      if (text.includes(word.toLowerCase())) return true;
    }
    return false;
  });

  // Pass 2: High Density Pad (If under 6 articles, bring in pristine general entries)
  if (filtered.length < 6) {
    const backupArticles = articles.filter((article) => {
      if (filtered.some(f => (f.link || f.title) === (article.link || article.title))) return false;
      const text = ((article.title || "") + " " + (article.description || "")).toLowerCase();
      return !block.some(word => text.includes(word.toLowerCase()));
    });
    
    // Shuffle the backup pool so different articles appear on every refresh click
    const shuffledBackup = [...backupArticles].sort(() => 0.5 - Math.random());
    filtered = [...filtered, ...shuffledBackup];
  } else {
    // Even if we have plenty of strict articles, shuffle them so the user gets distinct layouts
    filtered = [...filtered].sort(() => 0.5 - Math.random());
  }

  // Always return a robust set of distinct articles (sliced up to 8 max)
  return filtered.slice(0, 8);
}

// ─────────────────────────────────────────────
// FETCH WITH RETRY
// ─────────────────────────────────────────────
async function fetchWithRetry(url, options = {}, retries = 2, delayMs = 1000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
    }
  }
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────
function NewsSection({ selectedRegion, selectedCategory, refreshKey }) {
  const [articles, setArticles]               = useState([]);
  const [expandedCard, setExpandedCard]       = useState(null);
  const [deepContextCard, setDeepContextCard] = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [loadingCard, setLoadingCard]         = useState(null);
  const [analysisData, setAnalysisData]       = useState({});
  const [error, setError]                     = useState(null);
  
  // New Visual Proof State
  const [syncTime, setSyncTime]               = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    setExpandedCard(null);
    setDeepContextCard(null);
    setAnalysisData({});
    
    // Reset views instantly on refresh so skeleton loaders trigger cleanly
    setError(null);
    setArticles([]);

    const fetchNews = async () => {
      try {
        setLoading(true);

        const response = await fetchWithRetry(
          `${API_BASE}/api/news?region=${selectedRegion}&category=${selectedCategory}&nocache=${Date.now()}`,
          {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          },
          2,
          1000
        );

        const data     = await response.json();
        const fetched  = data.news || data.articles || [];
        const filtered = filterArticles(fetched, selectedCategory);

        // Update the visual sync clock to show your refresh button is actively working
        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setSyncTime(currentTime);

        if (filtered.length === 0) {
          setError("Can't find or load the news at the moment.");
          return;
        }

        setArticles(filtered);

      } catch (err) {
        console.error("Fetch error:", err);
        setError("Can't find or load the news at the moment.");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [selectedRegion, selectedCategory, refreshKey]);

  const analyzeArticle = useCallback(async (article) => {
    const uniqueId = article.link || article.title;
    try {
      setLoadingCard(uniqueId);
      const response = await fetchWithRetry(
        `${API_BASE}/api/analyze`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: article.link }),
        },
        1,
        1500
      );
      const data = await response.json();
      setAnalysisData((prev) => ({
        ...prev,
        [uniqueId]: {
          summary:     data.analysis?.explanation  || "AI Summary unavailable.",
          deepContext: data.analysis?.deep_context || "Deep Context unavailable.",
        },
      }));
    } catch (err) {
      console.error("Analysis error:", err);
      setAnalysisData((prev) => ({
        ...prev,
        [uniqueId]: {
          summary:     "Could not generate AI summary. Please try again.",
          deepContext: "Could not generate deep context. Please try again.",
        },
      }));
    } finally {
      setLoadingCard(null);
    }
  }, []);

  const handleExpand = async (article) => {
    const uniqueId = article.link || article.title;
    if (expandedCard === uniqueId) {
      setExpandedCard(null);
      setDeepContextCard(null);
      return;
    }
    setExpandedCard(uniqueId);
    setDeepContextCard(null);
    if (!analysisData[uniqueId]) {
      await analyzeArticle(article);
    }
  };

  useEffect(() => {
    const onBack = () => { if (expandedCard) setExpandedCard(null); };
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, [expandedCard]);

  return (
    <section className="relative z-10 px-4 sm:px-6 lg:px-10 pb-20">

      {/* Visual Sync Badge Tracker */}
      {syncTime && !loading && (
        <div className="max-w-6xl mx-auto mb-4 text-right">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            System Feed Synced: {syncTime}
          </span>
        </div>
      )}

      {loading && (
        <div className="max-w-6xl mx-auto flex flex-col gap-5">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl animate-pulse">
              <div className="flex justify-between items-center mb-4">
                <div className="h-5 w-24 bg-purple-500/20 rounded-full"></div>
                <div className="h-4 w-16 bg-white/10 rounded"></div>
              </div>
              <div className="h-6 bg-white/10 rounded-md w-3/4 mb-3"></div>
              <div className="h-6 bg-white/10 rounded-md w-1/2 mb-4"></div>
              <div className="h-4 bg-white/5 rounded w-full mb-2"></div>
              <div className="h-4 bg-white/5 rounded w-5/6"></div>
            </div>
          ))}
        </div>
      )}

      {/* Your Requested Disclaimer View */}
      {!loading && error && (
        <div className="max-w-2xl mx-auto mt-16 text-center">
          <div className="bg-purple-950/20 border border-purple-500/20 backdrop-blur-xl rounded-2xl px-6 py-12 shadow-xl shadow-purple-950/40">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
              <span className="text-purple-300 text-lg font-semibold">ℹ</span>
            </div>
            <p className="text-gray-300 text-base font-medium leading-relaxed max-w-sm mx-auto">
              {error}
            </p>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="max-w-6xl mx-auto flex flex-col gap-5">
          {articles.map((article) => {
            const uniqueId   = article.link || article.title;
            const isExpanded = expandedCard === uniqueId;
            const analysis   = analysisData[uniqueId];

            return (
              <div
                key={`${uniqueId}-${selectedCategory}-${selectedRegion}`}
                className={`
                  bg-white/5 border rounded-2xl backdrop-blur-xl
                  transition-all duration-300 overflow-hidden
                  ${isExpanded
                    ? "border-purple-400/30 shadow-lg shadow-purple-950/40"
                    : "border-white/10 hover:border-purple-400/20 hover:bg-white/[0.07]"}
                `}
              >
                {/* Card Header */}
                <div
                  onClick={() => handleExpand(article)}
                  className="cursor-pointer p-5 sm:p-6 flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 text-xs font-medium tracking-wide">
                        {article.source}
                      </span>
                      <span className="text-gray-400 text-xs sm:text-sm font-medium">
                        {article.category}
                      </span>
                    </div>
                    <span className="text-gray-500 text-xs sm:text-sm">
                      {article.time || "Latest"}
                    </span>
                  </div>

                  <h3
                    className={`
                      text-white font-bold leading-snug break-words tracking-tight
                      ${article.title?.length > 120
                        ? "text-base sm:text-lg"
                        : "text-lg sm:text-xl lg:text-2xl"}
                    `}
                  >
                    {article.title}
                  </h3>

                  <p className="text-gray-300 text-sm sm:text-base leading-7">
                    {article.description}
                  </p>
                </div>

                {/* Expandable AI Section */}
                <div className={`
                  transition-all duration-500 overflow-hidden
                  ${isExpanded ? "max-h-[2500px] opacity-100" : "max-h-0 opacity-0"}
                `}>
                  <div className="px-5 sm:px-6 pb-6">

                    {loadingCard === uniqueId && !analysis && (
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-gray-300 animate-pulse flex flex-col gap-3">
                        <div className="h-4 bg-purple-400/20 rounded w-1/4"></div>
                        <div className="h-3 bg-white/10 rounded w-full"></div>
                        <div className="h-3 bg-white/10 rounded w-5/6"></div>
                      </div>
                    )}

                    {analysis && (
                      <div className="flex flex-col gap-5">

                        <div className="bg-purple-500/10 border border-purple-400/20 rounded-2xl p-5 shadow-inner">
                          <h4 className="text-purple-200 text-lg font-semibold mb-3 tracking-wide">AI Summary</h4>
                          <p className="text-gray-200 leading-8 text-sm sm:text-base">
                            {analysis.summary}
                          </p>
                        </div>

                        <div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeepContextCard(
                                deepContextCard === uniqueId ? null : uniqueId
                              );
                            }}
                            className="w-full py-3 rounded-xl bg-indigo-500/10 border border-indigo-400/20
                              text-indigo-200 font-medium hover:bg-indigo-500/20 transition-all active:scale-[0.99]"
                          >
                            {deepContextCard === uniqueId ? "Hide Deep Context" : "View Deep Context"}
                          </button>

                          <div className={`overflow-hidden transition-all duration-500
                            ${deepContextCard === uniqueId ? "max-h-[400px] opacity-100 mt-4" : "max-h-0 opacity-0"}`}
                          >
                            <div className="bg-indigo-500/10 border border-indigo-400/20 rounded-2xl p-5 max-h-[400px] overflow-y-auto custom-scrollbar">
                              <h4 className="text-indigo-200 text-lg font-semibold mb-3 tracking-wide">Deep Context</h4>
                              <p className="text-gray-200 leading-8 whitespace-pre-line text-sm sm:text-base">
                                {analysis.deepContext}
                              </p>
                            </div>
                          </div>
                        </div>

                        <a href={article.link} target="_blank" rel="noopener noreferrer" className="block w-full">
                          <button className="w-full py-3.5 rounded-xl
                            bg-gradient-to-r from-purple-500 to-indigo-500
                            text-white font-semibold hover:opacity-90 active:scale-[0.99] transition-all shadow-md shadow-purple-950/20">
                            Read Full Article
                          </button>
                        </a>

                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </section>
  );
}

export default NewsSection;