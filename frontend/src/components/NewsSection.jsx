import { useEffect, useState, useCallback } from "react";

const API_BASE = "https://ai-news-backend-ty0t.onrender.com";

// ─────────────────────────────────────────────
// Airtight Target Industry Validation Dictionaries
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// FETCH INFRASTRUCTURE WITH CACHE BYPASSING
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

function NewsSection({ selectedRegion, selectedCategory, refreshKey }) {
  const [articles, setArticles]               = useState([]);
  const [expandedCard, setExpandedCard]       = useState(null);
  const [deepContextCard, setDeepContextCard] = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [loadingCard, setLoadingCard]         = useState(null);
  const [analysisData, setAnalysisData]       = useState({});
  const [error, setError]                     = useState(null);
  const [syncTime, setSyncTime]               = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

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

    const response = await fetch(

      `${API_BASE}/api/news?region=${selectedRegion}&category=${selectedCategory}&t=${Date.now()}`
    );

    const data = await response.json();

    let fetchedArticles = data.news || [];

    // Light shuffle for refresh realism
    if (fetchedArticles.length > 5) {

      const topArticles = fetchedArticles.slice(0, 3);

      const remaining = fetchedArticles.slice(3);

      remaining.sort(() => Math.random() - 0.5);

      fetchedArticles = [...topArticles, ...remaining];
    }

    // Better article count
    if (selectedCategory === "All") {

      fetchedArticles = fetchedArticles.slice(0, 12);

    } else {

      fetchedArticles = fetchedArticles.slice(0, 10);
    }

    setArticles(fetchedArticles);

    setLastUpdated(

      new Date().toLocaleTimeString([], {

        hour: "2-digit",
        minute: "2-digit",
      })
    );

  } catch (err) {

    console.error(err);

    setError("Unable to load live news feeds.");

  } finally {

    setTimeout(() => {

      setLoading(false);

    }, 1200);
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
          <div className="flex items-center justify-between mb-5 px-1">

  <div className="flex items-center gap-2">

    <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />

    <p className="text-sm text-gray-300">
      LIVE AI News Intelligence
    </p>

  </div>

  <p className="text-xs text-gray-400">

    {lastUpdated
      ? `Last synced ${lastUpdated}`
      : "Syncing feeds..."}

  </p>

</div>
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