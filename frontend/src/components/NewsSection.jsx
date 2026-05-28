import { useEffect, useState, useCallback } from "react";

const API_BASE = "https://ai-news-backend-ty0t.onrender.com";

const TARGET_KEYWORDS = {
  Technology: [
    "tech", "technology", "software", "hardware", "app", "apps", "smartphone", "phone", 
    "laptop", "computer", "chip", "semiconductor", "ai", "artificial intelligence", 
    "machine learning", "cyber", "cybersecurity", "hack", "cloud", "5g", "internet", 
    "wifi", "satellite", "robot", "drone", "ev", "electric vehicle", "coding", "developer", 
    "programming", "api", "google", "apple", "microsoft", "amazon", "meta", "openai", 
    "tesla", "nvidia", "intel", "samsung", "qualcomm", "amd", "gadget", "device", 
    "wearable", "smartwatch", "tablet", "launch", "release", "update", "processor", 
    "iphone", "android", "pixel", "galaxy", "oneplus", "display", "server", "system"
  ],
  Business: [
    "market", "stock", "share", "economy", "gdp", "inflation", "budget", "trade", "export", 
    "import", "revenue", "profit", "loss", "earnings", "investment", "investor", "fund", 
    "ipo", "startup", "company", "corporate", "industry", "sector", "bank", "banking", 
    "finance", "financial", "tax", "rupee", "dollar", "sensex", "nifty", "bse", "nse", "rbi", 
    "interest rate", "merger", "acquisition", "deal", "billion", "million", "quarter", 
    "annual", "results", "growth", "recession", "employment", "job", "layoff", "hire", "ceo", "cfo", 
    "business", "commerce", "retail", "ecommerce", "sales", "brands", "retailer", "prices", "firm"
  ],
  Sports: [
    "cricket", "football", "soccer", "tennis", "basketball", "hockey", "rugby", "golf", 
    "athletics", "olympic", "olympics", "ipl", "bcci", "fifa", "match", "tournament", 
    "championship", "league", "cup", "trophy", "player", "team", "coach", "squad", "innings", 
    "wicket", "run", "goal", "score", "fixture", "series", "stadium", "transfer", "debut", 
    "won", "lost", "win", "defeat", "victory", "clash"
  ],
  Entertainment: [
    "movie", "film", "cinema", "bollywood", "hollywood", "films", "series", "show", "tv", 
    "ott", "netflix", "amazon prime", "disney", "hotstar", "song", "music", "album", "artist", 
    "singer", "actor", "actress", "celebrity", "star", "award", "oscar", "grammy", "filmfare", 
    "release", "trailer", "review", "box office", "collection", "streaming", "entertainment", 
    "concert", "tour", "fashion", "interview", "debut", "premiere", "television", "theatre", "teaser"
  ],
  Politics: [
    "government", "parliament", "minister", "prime minister", "president", "election", 
    "vote", "party", "congress", "bjp", "lok sabha", "rajya sabha", "policy", "law", "bill", 
    "act", "constitution", "court", "supreme court", "high court", "diplomat", "foreign policy", 
    "protest", "opposition", "political", "politician", "governance", "administration", 
    "campaign", "rally", "coalition", "modi", "rahul", "shah", "leaders", "state", "centre"
  ]
};

const GLOBAL_BLOCKS = [
  "murder", "rape", "assault", "arrest", "police", "court", "verdict", "sentence", 
  "accused", "criminal", "fir ", "custody", "bail", "temple", "mosque", "church", 
  "communal", "highway", "accident", "protest"
];

function filterArticles(articles, category) {
  if (!articles || articles.length === 0) return [];
  if (category === "All" || !TARGET_KEYWORDS[category]) {
    return [...articles].sort(() => 0.5 - Math.random()).slice(0, 8);
  }

  const validTargets = TARGET_KEYWORDS[category];

  const highQualityPool = articles.filter(article => {
    const text = ((article.title || "") + " " + (article.description || "")).toLowerCase();
    
    // 1. Strict General Blocks check
    const containsBlock = GLOBAL_BLOCKS.some(word => text.includes(word));
    if (containsBlock) return false;

    // 2. Strict Exact Word Regex Check
    let hasMatch = false;
    for (let i = 0; i < validTargets.length; i++) {
      const regex = new RegExp(`\\b${validTargets[i]}\\b`, 'i');
      if (regex.test(text)) {
        hasMatch = true;
        break;
      }
    }
    return hasMatch;
  });

  // Loophole Closed: Completely removed the old padding loop that injected junk data
  return [...highQualityPool].sort(() => 0.5 - Math.random()).slice(0, 8);
}

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

function NewsSection({ selectedRegion, selectedCategory, refreshKey }) {
  const [articles, setArticles]               = useState([]);
  const [expandedCard, setExpandedCard]       = useState(null);
  const [deepContextCard, setDeepContextCard] = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [loadingCard, setLoadingCard]         = useState(null);
  const [analysisData, setAnalysisData]       = useState({});
  const [error, setError]                     = useState(null);
  const [syncTime, setSyncTime]               = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    setExpandedCard(null);
    setDeepContextCard(null);
    setAnalysisData({});
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

        setSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

        if (filtered.length === 0) {
          setError("Can't find or load any targeted news for this topic at the moment.");
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

      {syncTime && !loading && (
        <div className="max-w-6xl mx-auto mb-4 text-right">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
            Feed Verified: {syncTime}
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