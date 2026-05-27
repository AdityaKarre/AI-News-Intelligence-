import { useEffect, useState } from "react";

function NewsSection({
  selectedRegion,
  selectedCategory,
  refreshKey
}) {

  const [articles, setArticles] = useState([]);

  const [expandedCard, setExpandedCard] = useState(null);

  const [deepContextCard, setDeepContextCard] = useState(null);

  const [loading, setLoading] = useState(true);

  const [loadingCard, setLoadingCard] = useState(null);

  const [analysisData, setAnalysisData] = useState({});


  // Fetch News
  useEffect(() => {

    window.scrollTo(0, 0);

    const fetchNews = async () => {

      try {

        setLoading(true);

        const response = await fetch(
          `https://ai-news-backend-ty0t.onrender.com/api/news?region=${selectedRegion}&category=${selectedCategory}`
        );

        const data = await response.json();

        setArticles(
          data.news ||
          data.articles ||
          []
        );

      } catch (error) {

        console.error("Error fetching news:", error);

      } finally {

        setLoading(false);
      }
    };

    fetchNews();

  }, [selectedRegion, selectedCategory, refreshKey]);


  // Analyze Article
  const analyzeArticle = async (article) => {

    const uniqueId = article.link || article.title;

    try {

      setLoadingCard(uniqueId);

      const response = await fetch(
        "https://ai-news-backend-ty0t.onrender.com/api/analyze",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            url: article.link
          })
        }
      );

      const data = await response.json();

      console.log("ANALYZE DATA:", data);

      setAnalysisData((prev) => ({
        ...prev,

        [uniqueId]: {

          summary:
            data.analysis?.explanation ||
            "AI Summary unavailable right now.",

          deepContext:
            data.analysis?.deep_context ||
            "Deep Context unavailable right now."
        }
      }));

    } catch (error) {

      console.error("Analysis error:", error);

    } finally {

      setLoadingCard(null);
    }
  };


  // Expand Article
  const handleExpand = async (article) => {

    const uniqueId = article.link || article.title;

    // Close if same clicked
    if (expandedCard === uniqueId) {

      setExpandedCard(null);

      setDeepContextCard(null);

      return;
    }

    // Open clicked article only
    setExpandedCard(uniqueId);

    // Close deep context
    setDeepContextCard(null);

    // Generate analysis
    await analyzeArticle(article);
  };


  return (

    <section className="relative z-10 px-4 sm:px-6 lg:px-10 pb-20">

      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8 mt-6">

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
          {selectedRegion} {selectedCategory} News
        </h2>

        <p className="text-gray-400 mt-3 text-sm sm:text-base lg:text-lg">
          Real-time AI-enhanced news intelligence dashboard.
        </p>

      </div>


      {/* Loading */}
      {loading ? (

        <div className="text-center text-gray-400 py-20">
          Loading AI News Intelligence...
        </div>

      ) : (

        <div className="max-w-6xl mx-auto flex flex-col gap-5">

          {articles.map((article) => {

            const uniqueId = article.link || article.title;

            const isExpanded = expandedCard === uniqueId;

            const analysis = analysisData[uniqueId];

            return (

              <div
                key={`${uniqueId}-${selectedCategory}-${selectedRegion}`}
                className={`
                  bg-white/5
                  border
                  rounded-2xl
                  backdrop-blur-xl
                  transition-all
                  duration-300
                  overflow-hidden

                  ${
                    isExpanded
                      ? "border-purple-400/30"
                      : "border-white/10 hover:border-purple-400/20"
                  }
                `}
              >

                {/* Top Feed Card */}
                <div
                  onClick={() => handleExpand(article)}
                  className="
                    cursor-pointer
                    p-5
                    sm:p-6
                    flex
                    flex-col
                    gap-4
                  "
                >

                  {/* Source + Category */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">

                    <div className="flex items-center gap-3 flex-wrap">

                      <span
                        className="
                          px-3 py-1
                          rounded-full
                          bg-purple-500/20
                          text-purple-200
                          text-xs
                        "
                      >
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
                    className="
                      text-white
                      text-xl
                      sm:text-2xl
                      font-bold
                      leading-snug
                    "
                  >
                    {article.title}
                  </h3>


                  {/* Description */}
                  <p
                    className="
                      text-gray-300
                      text-sm
                      sm:text-base
                      leading-7
                    "
                  >
                    {article.description}
                  </p>

                </div>


                {/* Expandable AI Section */}
                <div
                  className={`
                    transition-all
                    duration-500
                    overflow-hidden

                    ${
                      isExpanded
                        ? "max-h-[2500px] opacity-100"
                        : "max-h-0 opacity-0"
                    }
                  `}
                >

                  <div className="px-5 sm:px-6 pb-6">

                    {/* AI Loading */}
                    {loadingCard === uniqueId && !analysis && (

                      <div
                        className="
                          bg-white/5
                          border border-white/10
                          rounded-2xl
                          p-5
                          text-gray-300
                          animate-pulse
                        "
                      >
                        Generating AI Intelligence...
                      </div>

                    )}


                    {/* AI Analysis */}
                    {analysis && (

                      <div className="flex flex-col gap-5">

                        {/* AI Summary */}
                        <div
                          className="
                            bg-purple-500/10
                            border border-purple-400/20
                            rounded-2xl
                            p-5
                          "
                        >

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
                                deepContextCard === uniqueId
                                  ? null
                                  : uniqueId
                              );
                            }}

                            className="
                              w-full
                              py-3
                              rounded-xl
                              bg-indigo-500/10
                              border border-indigo-400/20
                              text-indigo-200
                              font-medium
                              hover:bg-indigo-500/20
                              transition-all
                            "
                          >
                            {deepContextCard === uniqueId
                              ? "Hide Deep Context"
                              : "View Deep Context"}
                          </button>


                          {/* Deep Context Content */}
                          <div
                            className={`
                              overflow-hidden
                              transition-all
                              duration-500

                              ${
                                deepContextCard === uniqueId
                                  ? "max-h-[400px] opacity-100 mt-4"
                                  : "max-h-0 opacity-0"
                              }
                            `}
                          >

                            <div
                                className="
                                bg-indigo-500/10
                                border border-indigo-400/20
                                rounded-2xl
                                p-5
                                max-h-[400px]
                                overflow-y-auto
                                "
                            >

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

                          <button
                            className="
                              w-full
                              py-3.5
                              rounded-xl
                              bg-gradient-to-r
                              from-purple-500
                              to-indigo-500
                              text-white
                              font-semibold
                              hover:opacity-90
                              transition-all
                            "
                          >
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