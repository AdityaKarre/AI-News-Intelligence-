import { useEffect, useState, useCallback } from "react";

const API_BASE = "https://ai-news-backend-ty0t.onrender.com";

// ─────────────────────────────────────────────
// CATEGORY FILTER MAP
//
// Two-pass filter:
//   1. BLOCK  — hide immediately if any word matches
//   2. ALLOW  — only show if at least one word matches
//
// Written to specifically fix the TOI/NDTV bleed
// seen in the screenshot (politics, crime, religion
// appearing under Technology / Sports etc.)
// ─────────────────────────────────────────────
const CATEGORY_FILTERS = {

  Technology: {
    // Block these topics no matter what
    block: [
      // Politics / Govt
      "parliament", "minister", "election", "vote", "party", "congress",
      "bjp", "aap", "lok sabha", "rajya sabha", "mla", "mp ", " mp ",
      "chief minister", "cm ", "governor", "politician", "modi",
      "rahul gandhi", "amit shah", "kejriwal", "yogi",
      // Crime / Law
      "murder", "rape", "assault", "arrest", "police", "court",
      "verdict", "sentence", "accused", "criminal", "fir ", "custody",
      "bail", "judge", "justice", "tribunal",
      // Religion / Social
      "temple", "mosque", "church", "bakrid", "eid", "diwali",
      "ramadan", "hindu", "muslim", "christian", "religion",
      "protest", "riot", "violence", "communal",
      // Sports
      "cricket", "ipl", "football", "tennis", "match", "tournament",
      "player", "team", "wicket", "goal", "score",
      // Entertainment
      "bollywood", "movie", "film", "actor", "actress", "celebrity",
      "song", "album", "box office", "ott",
      // Economy (non-tech)
      "inflation", "gdp", "rupee", "budget", "tax", "sensex", "nifty",
    ],
    // Must have at least one of these
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
      // Politics
      "parliament", "minister", "election", "vote", "party", "bjp",
      "congress", "lok sabha", "chief minister", "governor",
      // Crime
      "murder", "rape", "assault", "arrest", "court", "verdict",
      "accused", "criminal", "fir",
      // Religion
      "temple", "mosque", "bakrid", "eid", "diwali", "religion",
      "protest", "riot", "communal",
      // Tech
      "software", "hardware", "chip", "smartphone", "ai ",
      "machine learning", "cybersecurity", "cloud",
      // Business
      "stock market", "sensex", "nifty", "inflation", "gdp",
      "budget", "tax", "rupee", "ipo",
      // Entertainment
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
      // Politics (non-economic)
      "election", "vote", "party", "bjp", "congress", "lok sabha",
      // Crime
      "murder", "rape", "assault", "arrest", "court", "verdict",
      "accused", "fir",
      // Religion
      "temple", "mosque", "bakrid", "eid", "diwali", "religion",
      "protest", "riot", "communal",
      // Pure entertainment
      "bollywood", "movie", "film", "actor", "actress", "song",
      "box office", "ott",
      // Pure sports
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
      "crude", "oil", "gold", "commodity", "forex",
    ],
  },

  Entertainment: {
    block: [
      // Politics
      "parliament", "minister", "election", "lok sabha",
      "chief minister", "governor", "bjp", "congress",
      // Crime
      "murder", "rape", "assault", "arrest", "fir", "court",
      // Religion (non-entertainment)
      "bakrid", "riot", "communal",
      // Business
      "stock market", "sensex", "nifty", "inflation", "ipo",
      // Tech
      "software", "chip", "semiconductor", "cybersecurity",
      // Sports (non-celebrity)
      "wicket", "innings", "goal", "penalty", "ipl score",
    ],
    allow: [
      "movie", "film", "cinema", "bollywood", "hollywood",
      "series", "show", "tv", "ott", "netflix", "amazon prime",
      "disney", "hotstar", "song", "music", "album", "artist",
      "singer", "actor", "actress", "celebrity", "star",
      "award", "oscar", "grammy", "bafta", "filmfare",
      "release", "trailer", "review", "box office", "collection",
      "streaming", "web series", "entertainment", "concert", "tour",
      "fashion", "red carpet", "interview", "debut",
      "shah rukh", "salman", "deepika", "ranveer", "alia",
      "taylor swift", "beyoncé", "rihanna", "drake",
    ],
  },

  Politics: {
    block: [
      // Pure entertainment
      "bollywood", "movie", "film", "box office", "actor",
      "actress", "song", "album",
      // Pure sports
      "cricket score", "ipl score", "football score",
      "wicket", "goal scored", "match result",
      // Pure tech
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
// Returns filtered list.
// Safety net: if < 3 survive, returns original
// so screen is never blank.
// ─────────────────────────────────────────────
function filterArticles(articles, category) {
  if (category === "All" || !CATEGORY_FILTERS[category]) {
    return articles;
  }

  const { block, allow } = CATEGORY_FILTERS[category];

  const filtered = articles.filter((article) => {
    const text = (
      (article.title || "") + " " + (article.description || "")
    ).toLowerCase();

    // Step 1: Block check
    for (const word of block) {
      if (text.includes(word.toLowerCase())) return false;
    }

    // Step 2: Allow check
    for (const word of allow) {
      if (text.includes(word.toLowerCase())) return true;
    }

    return false;
  });

  // Safety net
  return filtered.length >= 3 ? filtered : articles;
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
          `${API_BASE}/api/news?region=${selectedRegion}&category=${selectedCategory}`,
          {},
          2,
          1200
        );

        const data     = await response.json();
        const fetched  = data.news || data.articles || [];
        const filtered = filterArticles(fetched, selectedCategory);

        if (filtered.length === 0) {
          setError("No articles found for this category right now. Try refreshing.");
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
        <div className="text-center text-gray-400 py-20 animate-pulse">
          Loading AI News Intelligence...
        </div>
      )}

      {!loading && error && (
        <div className="max-w-2xl mx-auto mt-16 text-center">
          <div className="bg-red-500/10 border border-red-400/20 rounded-2xl px-6 py-8">
            <p className="text-red-300 text-base font-medium mb-1">Something went wrong</p>
            <p className="text-gray-400 text-sm">{error}</p>
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
                    ? "border-purple-400/30"
                    : "border-white/10 hover:border-purple-400/20"}
                `}
              >
                {/* Card Header */}
                <div
                  onClick={() => handleExpand(article)}
                  className="cursor-pointer p-5 sm:p-6 flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 text-xs">
                        {article.source}
                      </span>
                      <span className="text-gray-400 text-xs sm:text-sm">
                        {article.category}
                      </span>
                    </div>
                    <span className="text-gray-500 text-xs sm:text-sm">
                      {article.time || "Latest"}
                    </span>
                  </div>

                  <h3
                    className={`
                      text-white font-bold leading-snug break-words
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
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-gray-300 animate-pulse">
                        Generating AI Intelligence...
                      </div>
                    )}

                    {analysis && (
                      <div className="flex flex-col gap-5">

                        <div className="bg-purple-500/10 border border-purple-400/20 rounded-2xl p-5">
                          <h4 className="text-purple-200 text-lg font-semibold mb-3">AI Summary</h4>
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
                              text-indigo-200 font-medium hover:bg-indigo-500/20 transition-all"
                          >
                            {deepContextCard === uniqueId ? "Hide Deep Context" : "View Deep Context"}
                          </button>

                          <div className={`overflow-hidden transition-all duration-500
                            ${deepContextCard === uniqueId ? "max-h-[400px] opacity-100 mt-4" : "max-h-0 opacity-0"}`}
                          >
                            <div className="bg-indigo-500/10 border border-indigo-400/20 rounded-2xl p-5 max-h-[400px] overflow-y-auto">
                              <h4 className="text-indigo-200 text-lg font-semibold mb-3">Deep Context</h4>
                              <p className="text-gray-200 leading-8 whitespace-pre-line text-sm sm:text-base">
                                {analysis.deepContext}
                              </p>
                            </div>
                          </div>
                        </div>

                        <a href={article.link} target="_blank" rel="noopener noreferrer">
                          <button className="w-full py-3.5 rounded-xl
                            bg-gradient-to-r from-purple-500 to-indigo-500
                            text-white font-semibold hover:opacity-90 transition-all">
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