import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const API_BASE = "https://ai-news-backend-ty0t.onrender.com";

export default function NewsSection({
  selectedRegion,
  selectedCategory,
}) {

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedCard, setExpandedCard] = useState(null);
  const [syncTime, setSyncTime] = useState("");

  useEffect(() => {

    const fetchNews = async () => {

      try {

        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE}/api/news?region=${selectedRegion}&category=${selectedCategory}&t=${Date.now()}`
        );

        const data = await response.json();

        let fetched = data.news || [];

        // Slight shuffle for refresh realism
        if (fetched.length > 5) {

          const topArticles = fetched.slice(0, 3);

          const remaining = fetched.slice(3);

          remaining.sort(() => Math.random() - 0.5);

          fetched = [...topArticles, ...remaining];
        }

        // Better article count
        fetched = selectedCategory === "All"
          ? fetched.slice(0, 12)
          : fetched.slice(0, 10);

        setArticles(fetched);

        setSyncTime(
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

  }, [selectedRegion, selectedCategory]);


  // LOADING UI
  if (loading) {

    return (

      <div className="max-w-6xl mx-auto mt-6 px-4">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {[1, 2, 3, 4, 5, 6].map((n) => (

            <div
              key={n}
              className="animate-pulse rounded-3xl border border-purple-500/20 bg-white/5 backdrop-blur-xl p-5"
            >

              <div className="h-5 w-3/4 bg-purple-500/20 rounded mb-4"></div>

              <div className="h-4 w-full bg-white/10 rounded mb-2"></div>
              <div className="h-4 w-5/6 bg-white/10 rounded mb-2"></div>
              <div className="h-4 w-2/3 bg-white/10 rounded"></div>

            </div>
          ))}

        </div>

        <p className="text-center text-purple-300 text-sm mt-5">
          Synchronizing live global feeds...
        </p>

      </div>
    );
  }


  // ERROR UI
  if (error) {

    return (

      <div className="text-center text-red-400 mt-10">
        {error}
      </div>
    );
  }


  // MAIN UI
  return (

    <div className="max-w-6xl mx-auto mt-6 px-4">

      {/* LIVE STATUS BAR */}
      <div className="mb-5 flex items-center justify-between">

        <div className="flex items-center gap-2">

          <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></div>

          <p className="text-sm text-gray-300">
            LIVE AI News Intelligence
          </p>

        </div>

        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium backdrop-blur-md">

          Last synced: {syncTime}

        </span>

      </div>


      {/* NEWS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {articles.map((article, index) => {

          const isExpanded = expandedCard === index;

          return (

            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl border border-purple-500/20 bg-white/5 backdrop-blur-xl p-5 hover:border-purple-400/40 transition-all duration-300"
            >

              {/* TOP BAR */}
              <div className="flex items-center justify-between mb-3">

                <span className="text-xs text-purple-300 font-medium">
                  {article.source || "Live Feed"}
                </span>

                <span className="text-xs text-gray-400">
                  {selectedCategory}
                </span>

              </div>


              {/* TITLE */}
              <h2 className="text-white font-semibold leading-relaxed text-lg mb-3">
                {article.title}
              </h2>


              {/* DESCRIPTION */}
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                {article.description}
              </p>


              {/* BUTTONS */}
              <div className="flex gap-3 flex-wrap">

                <button
                  onClick={() =>
                    setExpandedCard(
                      isExpanded ? null : index
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-200 text-sm hover:bg-purple-500/30 transition-all"
                >
                  {isExpanded
                    ? "Hide Details"
                    : "Explore"}
                </button>


                <a
                  href={article.link}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm hover:bg-white/20 transition-all"
                >
                  Read More
                </a>

              </div>


              {/* EXPANDED CONTENT */}
              {isExpanded && (

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 rounded-2xl border border-purple-500/20 bg-black/20 p-4 max-h-72 overflow-y-auto"
                >

                  {/* AI SUMMARY */}
                  <h3 className="text-purple-300 font-semibold mb-3">
                    AI Summary
                  </h3>

                  <p className="text-gray-300 text-sm leading-relaxed mb-5">
                    {article.summary || article.description}
                  </p>


                  {/* DEEP CONTEXT */}
                  <h3 className="text-indigo-300 font-semibold mb-3">
                    Deep Context
                  </h3>

                  <p className="text-gray-400 text-sm leading-relaxed">
                    This development may influence broader trends in{" "}
                    {selectedCategory.toLowerCase()} and reflects ongoing
                    changes across global media, technology, policy,
                    and public response patterns.
                  </p>

                </motion.div>
              )}

            </motion.div>
          );
        })}

      </div>

    </div>
  );
}