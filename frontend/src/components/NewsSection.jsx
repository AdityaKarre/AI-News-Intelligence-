import { useEffect, useState, useCallback } from "react";

const API_BASE = "https://ai-news-backend-ty0t.onrender.com";

// ─────────────────────────────────────────────
// Fetch with retry helper
// Retries up to `retries` times with exponential backoff.
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
  const [articles, setArticles]         = useState([]);
  const [expandedCard, setExpandedCard] = useState(null);
  const [deepContextCard, setDeepContextCard] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [loadingCard, setLoadingCard]   = useState(null);
  const [analysisData, setAnalysisData] = useState({});

  // FIX: Separate error state so the user sees a real message
  // instead of a blank screen when the backend is down.
  const [error, setError] = useState(null);


  // ─────────────────────────────────────────────
  // Fetch News
  // FIX: Reset expanded card + analysis cache on every
  // refresh/region/category change so stale data never shows.
  // ─────────────────────────────────────────────
  useEffect(() => {
    window.scrollTo(0, 0);

    // Reset stale state immediately
    setExpandedCard(null);
    setDeepContextCard(null);
    setAnalysisData({});
    setError(null);

    const fetchNews = async () => {
      try {
        setLoading(true);

        // FIX: fetchWithRetry wraps the call — if the Render
        // backend is cold-starting or temporarily flaky,
        // it retries up to 2 times before giving up.
        const response = await fetchWithRetry(
          `${API_BASE}/api/news?region=${selectedRegion}&category=${selectedCategory}`,
          {},
          2,
          1200
        );

        const data = await response.json();

        const fetched = data.news || data.articles || [];

        if (fetched.length === 0) {
          setError("No articles found for this category right now. Try refreshing.");
        }

        setArticles(fetched);

      } catch (err) {
        console.error("Error fetching news:", err);
        setError("Could not load news. Check your connection or try again shortly.");
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [selectedRegion, selectedCategory, refreshKey]);


  // ─────────────────────────────────────────────
  // Analyze Article
  // ─────────────────────────────────────────────
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
        1,   // 1 retry for analyze (it's slow; don't double-wait)
        1500
      );

      const data = await response.json();

      setAnalysisData((prev) => ({
        ...prev,
        [uniqueId]: {
          summary:
            data.analysis?.explanation ||
            "AI Summary unavailable right now.",
          deepContext:
            data.analysis?.deep_context ||
            "Deep Context unavailable right now.",
        },
      }));

    } catch (err) {
      console.error("Analysis error:", err);
      // Show a graceful fallback inside the card instead of silence
      setAnalysisData((prev) => ({
        ...prev,
        [uniqueId]: {
          summary: "Could not generate AI summary. Please try again.",
          deepContext: "Could not generate deep context. Please try again.",
        },
      }));
    } finally {
      setLoadingCard(null);
    }
  }, []);


  // ─────────────────────────────────────────────
  // Expand / Collapse Article Card
  // ─────────────────────────────────────────────
  const handleExpand = async (article) => {
    const uniqueId = article.link || article.title;

    if (expandedCard === uniqueId) {
      setExpandedCard(null);
      setDeepContextCard(null);
      return;
    }

    setExpandedCard(uniqueId);
    setDeepContextCard(null);

    // Only fetch analysis if not already cached
    if (!analysisData[uniqueId]) {
      await analyzeArticle(article);
    }
  };


  // ─────────────────────────────────────────────
  // Back Button closes expanded card
  // ─────────────────────────────────────────────
  useEffect(() => {
    const handleBackButton = () => {
      if (expandedCard) setExpandedCard(null);
    };
    window.addEventListener("popstate", handleBackButton);
    return () => window.removeEventListener("popstate", handleBackButton);
  }, [expandedCard]);


  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <section className="relative z-10 px-4 sm:px-6 lg:px-10 pb-20">

      {/* Loading State */}
      {loading && (
        <div className="text-center text-gray-400 py-20 animate-pulse">
          Loading AI News Intelligence...
        </div>
      )}

      {/* FIX: Real error message instead of blank screen */}
      {!loading && error && (
        <div className="max-w-2xl mx-auto mt-16 text-center">
          <div className="bg-red-500/10 border border-red-400/20 rounded-2xl px-6 py-8">
            <p className="text-red-300 text-base font-medium mb-1">
              Something went wrong
            </p>
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* News Cards */}
      {!loading && !error && (
        <div className="max-w-6xl mx-auto flex flex-col gap-5">
          {articles.map((article) => {
            const uniqueId  = article.link || article.title;
            const isExpanded = expandedCard === uniqueId;
            const analysis  = analysisData[uniqueId];

            return (
              <div
                key={`${uniqueId}-${selectedCategory}-${selectedRegion}`}
                className={`
                  bg-white/5 border rounded-2xl backdrop-blur-xl
                  transition-all duration-300 overflow-hidden
                  ${
                    isExpanded
                      ? "border-purple-400/30"
                      : "border-white/10 hover:border-purple-400/20"
                  }
                `}
              >
                {/* ── Card Header ── */}
                <div
                  onClick={() => handleExpand(article)}
                  className="cursor-pointer p-5 sm:p-6 flex flex-col gap-4"
                >
                  {/* Source + Category + Time */}
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

                  {/* Title */}
                  <h3
                    className={`
                      text-white font-bold leading-snug break-words
                      ${
                        article.title?.length > 120
                          ? "text-base sm:text-lg"
                          : "text-lg sm:text-xl lg:text-2xl"
                      }
                    `}
                  >
                    {article.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-300 text-sm sm:text-base leading-7">
                    {article.description}
                  </p>
                </div>

                {/* ── Expandable AI Section ── */}
                <div
                  className={`
                    transition-all duration-500 overflow-hidden
                    ${isExpanded ? "max-h-[2500px] opacity-100" : "max-h-0 opacity-0"}
                  `}
                >
                  <div className="px-5 sm:px-6 pb-6">

                    {/* AI Loading */}
                    {loadingCard === uniqueId && !analysis && (
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-gray-300 animate-pulse">
                        Generating AI Intelligence...
                      </div>
                    )}

                    {/* AI Analysis */}
                    {analysis && (
                      <div className="flex flex-col gap-5">

                        {/* AI Summary */}
                        <div className="bg-purple-500/10 border border-purple-400/20 rounded-2xl p-5">
                          <h4 className="text-purple-200 text-lg font-semibold mb-3">
                            AI Summary
                          </h4>
                          <p className="text-gray-200 leading-8 text-sm sm:text-base">
                            {analysis.summary}
                          </p>
                        </div>

                        {/* Deep Context Toggle */}
                        <div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeepContextCard(
                                deepContextCard === uniqueId ? null : uniqueId
                              );
                            }}
                            className="
                              w-full py-3 rounded-xl
                              bg-indigo-500/10 border border-indigo-400/20
                              text-indigo-200 font-medium
                              hover:bg-indigo-500/20 transition-all
                            "
                          >
                            {deepContextCard === uniqueId
                              ? "Hide Deep Context"
                              : "View Deep Context"}
                          </button>

                          {/* Deep Context Content */}
                          <div
                            className={`
                              overflow-hidden transition-all duration-500
                              ${
                                deepContextCard === uniqueId
                                  ? "max-h-[400px] opacity-100 mt-4"
                                  : "max-h-0 opacity-0"
                              }
                            `}
                          >
                            <div className="
                              bg-indigo-500/10 border border-indigo-400/20
                              rounded-2xl p-5 max-h-[400px] overflow-y-auto
                            ">
                              <h4 className="text-indigo-200 text-lg font-semibold mb-3">
                                Deep Context
                              </h4>
                              <p className="text-gray-200 leading-8 whitespace-pre-line text-sm sm:text-base">
                                {analysis.deepContext}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Read Article Button */}
                        <a
                          href={article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <button className="
                            w-full py-3.5 rounded-xl
                            bg-gradient-to-r from-purple-500 to-indigo-500
                            text-white font-semibold
                            hover:opacity-90 transition-all
                          ">
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