import { useEffect, useState, useCallback } from "react";

const API_BASE = "https://ai-news-backend-ty0t.onrender.com";

// ─────────────────────────────────────────────
// OPTIMIZED CATEGORY FILTER MAP
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
      "blockchain", "crypto", "bitcoin", "web3",
      "startup", "unicorn", "funding", "series a", "series b",
      "innovation", "patent", "research", "digital",
      "playstation", "xbox", "gaming", "gpu", "processor",
      "iphone", "android", "pixel", "galaxy", "oneplus",
      "elon musk", "sam altman", "sundar pichai", "jensen huang",
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
      "stadium", "transfer", "debut", "hat-trick", "penalty",
      "virat kohli", "rohit sharma", "dhoni", "bumrah",
      "messi", "ronaldo", "federer", "nadal", "djokovic",
      "lebron", "neymar", "mbappé", "verstappen",
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
      "employment", "job", "layoff", "hire", "ceo", "cfo",
      "business", "commerce", "retail", "ecommerce", "supply chain",
      "crude", "oil", "gold", "commodity", "forex", "chemical", "industry",
      "stores", "sales", "brands", "growth", "retailer", "earnings"
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
      "shah rukh", "salman", "deepika", "ranveer", "alia",
      "taylor swift", "beyoncé", "rihanna", "drake",
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
      "lok sabha", "assembly", "mla", "mp ",
    ],
  },
};

// ─────────────────────────────────────────────
// FILTER FUNCTION
// ─────────────────────────────────────────────
function filterArticles(articles, category) {
  if (category === "All" || !CATEGORY_FILTERS[category]) {
    return articles;
  }

  const { block, allow } = CATEGORY_FILTERS[category];

  // 1. First Pass: Strict Filter (Only pristine matches)
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

  // 2. Second Pass: If we have fewer than 5 articles, grab safe fallback articles
  if (filtered.length < 5) {
    const fallbackArticles = articles.filter((article) => {
      // Make sure it isn't already in our strict list
      if (filtered.some(f => (f.link || f.title) === (article.link || article.title))) return false;
      
      const text = ((article.title || "") + " " + (article.description || "")).toLowerCase();
      // Ensure it doesn't contain ANY block words for this category
      return !block.some(word => text.includes(word.toLowerCase()));
    });

    // Combine them to pad the total count up to a healthy amount
    filtered = [...filtered, ...fallbackArticles].slice(0, 8); 
  }

  return filtered;
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

  // ── Fetch & Filter News ──────────────────────
  useEffect(() => {
    window.scrollTo(0, 0);
    setExpandedCard(null);
    setDeepContextCard(null);
    setAnalysisData({});
    setError(null);

    const fetchNews = async () => {
      try {
        setLoading(true);

        const response = await fetchWithRetry(
          `${API_BASE}/api/news?region=${selectedRegion}&category=${selectedCategory}&_t=${Date.now()}`,
          {},
          2,
          1200
        );

        const data     = await response.json();
        const fetched  = data.news || data.articles || [];
        
        // Run our smart padding filter
        const filtered = filterArticles(fetched, selectedCategory);

        // Even if strict matching fails, our second pass keeps it populated
        if (filtered.length === 0) {
          setArticles([]);
          setError("No updates found in this region right now. Hit Refresh to poll fresh updates.");
          return;
        }

        setArticles(filtered);

      } catch (err) {
        console.error("Fetch error:", err);
        setError("Could not load news. Check your connection or try again.");
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [selectedRegion, selectedCategory, refreshKey]);

  // ── Analyze Article ──────────────────────────
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

  // ── Expand Card ──────────────────────────────
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

  // ── Back button ──────────────────────────────
  useEffect(() => {
    const onBack = () => { if (expandedCard) setExpandedCard(null); };
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, [expandedCard]);

  // ── RENDER ───────────────────────────────────
  return (
    <section className="relative z-10 px-4 sm:px-6 lg:px-10 pb-20">

      {loading && (
        <div className="max-w-6xl mx-auto flex flex-col gap-5">
          {[1, 2, 3].map((n) => (
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

      {!loading && error && (
        <div className="max-w-2xl mx-auto mt-16 text-center">
          <div className="bg-purple-950/20 border border-purple-500/30 backdrop-blur-xl rounded-2xl px-6 py-10 shadow-xl shadow-purple-950/50">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
              <span className="text-purple-300 text-xl font-bold">!</span>
            </div>
            <p className="text-purple-200 text-lg font-semibold mb-2">Feed Status</p>
            <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">{error}</p>
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