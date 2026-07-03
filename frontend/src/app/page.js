'use client';

import { useState, useEffect } from 'react';
import { RotateCw, ArrowUp, ExternalLink, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  // Application Phase state: false = Pure Landing Home Page, true = Active Articles Portal
  const [hasExplored, setHasExplored] = useState(false);

  // Data & Filtering States
  const [articles, setArticles] = useState([]);
  const [region, setRegion] = useState('India');
  const [category, setCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [loadingMessage, setLoadingMessage] = useState(
  "🌍 Connecting to Global News Sources..."
  );
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Expanded Article States
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showDeepContext, setShowDeepContext] = useState(false);

  const categories = ['all', 'technology', 'business', 'sports', 'entertainment', 'politics'];

  // Fetch news data directly from our decoupled Python FastAPI microservice
  const fetchNewsFeed = async (currentRegion, currentCategory, isRefreshAction = false) => {
    if (isRefreshAction) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      // const API_URL = "https://ai-news-intelligence-platform-2.onrender.com";
      const API_URL = "https://ai-news-backend-ty0t.onrender.com"
      // const API_URL = "http://127.0.0.1:8000";

const response = await fetch(
  `${API_URL}/api/news?region=${currentRegion}&category=${currentCategory}&refresh=${isRefreshAction}`
);
      
      const result = await response.json();

      alert(JSON.stringify(result, null, 2));

      console.log("Backend Response:", result);
      console.log("Response Status:", response.status);
      
      if (result.status === "success") {

    console.log("Articles received:", result.news.length);

    setArticles(result.news);

    } else {

    console.error("Backend server error:", result);

  }
    } catch (err) {
      console.error("Failed to connect to backend server node:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Trigger data synchronization when portal active and filters change
  useEffect(() => {
    if (hasExplored) {
      fetchNewsFeed(region, category);
    }
  }, [region, category, hasExplored]);



  useEffect(() => {
    const handleScroll = () => {
        setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
        window.removeEventListener("scroll", handleScroll);
    };
  }, []);



  useEffect(() => {
  if (!isLoading) return;

  const messages = [
    "🌍 Connecting to Global News Sources...",
    "📰 Fetching Latest Headlines...",
    "🧠 AI Analyzing Headlines...",
    "📖 Building Context & Insights...",
    "🚀 Preparing Your News Feed..."
  ];

  let index = 0;

  const timer = setInterval(() => {
    index = (index + 1) % messages.length;
    setLoadingMessage(messages[index]);
  }, 1800);

  return () => clearInterval(timer);
  }, [isLoading]);

  // Handle Region Selection Dropdown
  const handleRegionChange = (newRegion) => {
    setRegion(newRegion);
    setCategory('all'); // Enforces category reset back to 'All' matching blueprint mechanics
  };

  const handleRefresh = () => {
    fetchNewsFeed(region, category, true);
  };

  // 🛡️ HIERARCHICAL HARDWARE BACK-BUTTON INTERCEPT STACK
  useEffect(() => {
    const handlePopState = () => {
  if (showDeepContext) {
    setShowDeepContext(false);
  } else if (selectedArticle) {
    setSelectedArticle(null);
  } else if (hasExplored) {
    setHasExplored(false);
  }
};

    if (hasExplored || selectedArticle || showDeepContext) {
      window.addEventListener('popstate', handlePopState);
    }
    return () => window.removeEventListener('popstate', handlePopState);
  }, [hasExplored, selectedArticle, showDeepContext]);

  const openArticleCard = (article) => {
  window.history.pushState(
    { state: "articleOpen" },
    ""
  );

  setSelectedArticle(article);
  setShowDeepContext(false);
  };

  return (
    <div className="relative min-h-screen bg-[#1A1833] text-slate-100 font-sans selection:bg-purple-500/30 selection:text-purple-200 overflow-x-hidden">
      
      {/* 🔮 BACKGROUND PURPLE AMBIENT RADIAL GLOWS */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#4c1d95]/20 blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[20%] right-[-15%] w-[45vw] h-[45vw] rounded-full bg-[#1e1b4b]/40 blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-[#2e1065]/15 blur-[120px] pointer-events-none z-0" />

      {/* FIXED GLASS HEADER NAVBAR */}

      {/* ANIME CONTAINER ANIMATION SWITCH FOR MULTI-STAGE NAVIGATION */}
      <AnimatePresence mode="wait">
        
        {!hasExplored ? (
          <motion.header 
            key="landing-page"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 max-w-4xl mx-auto text-center min-h-[85vh] px-4 sm:px-6 flex flex-col items-center justify-center py-12"
          >
            {/* STAGE A: PURE HOME PAGE LANDING SCREEN */}
            <div className="mb-6 px-4 py-1.5 rounded-full bg-[#13112b]/60 border border-purple-500/10 text-[10px] sm:text-[11px] font-semibold text-slate-400 tracking-wide text-center backdrop-blur-sm shadow-inner">
              AI-Powered Real-Time News Intelligence
            </div>
            
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.2] sm:leading-[1.15] mb-6 max-w-3xl">
              Understand News <br />
              <span className="bg-gradient-to-r from-[#9b82f3] via-[#b39dfb] to-[#818cf8] bg-clip-text text-transparent">
                Beyond Headlines
              </span>
            </h1>

            <p className="text-slate-400 text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed font-medium mb-8">
              Experience AI-driven news intelligence with smart summaries, deep contextual analysis, 
              real-time global coverage, and trusted news insights.
            </p>

            <button 
              onClick={() => {
                window.history.pushState(
                { state: "feedOpen" },
                ""
                );
              setHasExplored(true);
            }}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-sm tracking-wide bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-white shadow-xl shadow-purple-600/30 hover:opacity-95 active:scale-95 transition-all"
            >
              Explore Live News
            </button>
          </motion.header>
        ) : (
          <motion.div
            key="portal-feed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-24"
          >
            {/* STAGE B: ACTIVE ARTICLES INTERACTIVE PORTAL FEED */}
            <div className="max-w-2xl mx-auto mb-4 flex flex-col sm:flex-row sm:items-center justify-between px-1 gap-2">
              <button
                onClick={() => setHasExplored(false)}
                className="self-start flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition"
              >
                ← Back To Home
              </button>
              <span className="text-[11px] sm:text-xs font-bold text-purple-400/80 capitalize">
                Viewing Feed: {region} ({category === 'all' ? 'All Channels' : category})
              </span>
            </div>

            {/* CONTROL INPUT DOCK */}
            <section className="max-w-2xl mx-auto mb-10 p-4 sm:p-6 rounded-2xl bg-[#39356B]/85 border border-white/[0.04] backdrop-blur-xl shadow-2xl shadow-black/40">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="relative">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 tracking-wide">Region</label>
                  <div className="relative">
                    <select
                      value={region}
                      onChange={(e) => handleRegionChange(e.target.value)}
                      className="w-full bg-[#120f2d] border border-white/[0.05] text-sm text-slate-100 rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-purple-500/50 cursor-pointer transition"
                    >
                      <option value="India">India</option>
                      <option value="World">World</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 tracking-wide">Category</label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#120f2d] border border-white/[0.05] text-sm text-slate-100 rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-purple-500/50 cursor-pointer transition capitalize"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat === 'all' ? 'All' : cat}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

            <button
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              className={`w-full relative flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-300
                ${
                  isRefreshing
                  ? "opacity-60 cursor-not-allowed bg-purple-600/70 text-white"
                  : "bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.35)]"
                }`}
              > 
                <RotateCw
                  className={`w-4 h-4 ${
                  isRefreshing ? "animate-spin" : ""
                  }`}
              />

              {isRefreshing ? "Refreshing..." : "Refresh News"}
            </button>
            </section>

            {/* THE DYNAMIC NEWS CARDS VERTICAL FEED LAYER */}
            {isLoading ? (
            <>
            <div className="text-center mb-6">
              <p className="text-purple-300 text-sm font-semibold tracking-wide transition-all duration-500">
              {loadingMessage}
              </p>
            </div>

            <div className="max-w-3xl mx-auto flex flex-col gap-4 animate-pulse">
              {[...Array(6)].map((_, index) => (
              <div
              key={index}
              className="rounded-xl bg-[#2D2A55]/80 border border-white/[0.04] p-5"
            >
            {/* Category */}
            <div className="w-20 h-3 rounded bg-purple-400/20 mb-4"></div>

            {/* Title */}
            <div className="w-full h-5 rounded bg-white/10 mb-3"></div>
            <div className="w-4/5 h-5 rounded bg-white/10 mb-5"></div>

            {/* Button */}
            <div className="flex justify-end">
            <div className="w-28 h-4 rounded bg-purple-400/20"></div>
            </div>
          </div>
            ))}
          </div>
          <p className="text-white text-center text-xl">
                Articles State: {articles.length}
              </p>
           </>
           
          ) : articles.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-white/[0.03] rounded-2xl bg-[#0b081e]/20 max-w-3xl mx-auto">
                <p className="text-slate-400 text-xs font-medium">No breaking updates cataloged in this channel right now.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5 max-w-3xl mx-auto">
                {articles.map((article) => (
                  <div
                    key={article.url}
                    onClick={() => openArticleCard(article)}
                    className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-xl bg-[#2D2A55]/80 hover:-translate-y-1 border border-white/[0.04] hover:border-purple-500/20 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-black/40 gap-3 sm:gap-4"
                    style={{ backdropFilter: 'blur(16px)' }}
                  >
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/[0.01] to-purple-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    <div className="flex-1 min-w-0">

                      {category === 'all' && (
                        <div className="mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                            {article.category}
                          </span>
                        </div>
                      )}

                      <h3 className="text-sm sm:text-base font-bold leading-snug text-slate-200 group-hover:text-[#b39dfb] transition-colors duration-200 break-words">
                        {article.title}
                      </h3>

                    </div>

                    <div className="pt-2.5 sm:pt-0 sm:pl-4 border-t sm:border-t-0 sm:border-l border-white/[0.03] shrink-0 flex items-center justify-between sm:justify-start gap-2 text-xs font-bold text-purple-400 group-hover:text-purple-300 transition-colors">
                      <span>View Analysis</span>
                      <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔮 4. INTELLIGENCE VIEW MODAL */}
      <AnimatePresence>
        {selectedArticle && (
          <div 
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md cursor-pointer p-0 sm:p-4"
            onClick={() => setSelectedArticle(null)}
          >
            <motion.div 
              initial={{ opacity: 0, y: window.innerWidth < 640 ? '100%' : 15, scale: window.innerWidth < 640 ? 1 : 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: window.innerWidth < 640 ? '100%' : 10, scale: window.innerWidth < 640 ? 1 : 0.97 }}
              transition={{ type: 'spring', damping: 26, stiffness: 240 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl h-[88vh] sm:h-auto sm:max-h-[85vh] bg-[#120f2d] border-t sm:border border-white/[0.06] rounded-t-2xl sm:rounded-2xl p-5 sm:p-8 overflow-y-auto flex flex-col shadow-2xl shadow-black/90 cursor-default scrollbar-thin scrollbar-thumb-purple-500/20"
            >
              {/* Header Metadata Strip */}
              <div className="flex items-center justify-between mb-4 border-b border-white/[0.02] pb-3 shrink-0">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/10 capitalize">
                  {selectedArticle.category}
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold tracking-wider text-purple-400/90 px-3 py-1 rounded-full bg-purple-950/30 border border-purple-500/20">
                  • Feed Verified: {new Date(selectedArticle.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>

              {/* Main Headline */}
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-snug mb-4 shrink-0 break-words">
                {selectedArticle.title}
              </h2>

              {/* MUTUALLY EXCLUSIVE CONTENT STREAM LAYER */}
              <div className="flex-1 overflow-y-auto mb-4 min-h-[180px]">
                <AnimatePresence mode="wait">
                  {!showDeepContext ? (
                    /* VIEW A: EXECUTIVE AI SUMMARY CARD */
                    <motion.div
                      key="ai-summary-pane"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="w-full p-4 sm:p-5 rounded-xl bg-[#1B1742]/85 border border-white/[0.04] shadow-inner"
                    >
                      <h4 className="text-xs font-black uppercase tracking-widest text-[#b39dfb] mb-2.5">
                        AI Summary
                      </h4>
                      <p className="text-xs sm:text-sm leading-relaxed text-slate-300 font-medium">
                        {selectedArticle.ai_summary}
                      </p>
                    </motion.div>
                  ) : (
                    /* VIEW B: DETAILED DEEP CONTEXT COMPONENT */
                    <motion.div
                      key="deep-context-pane"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="w-full p-4 sm:p-5 rounded-xl bg-[#1B1742]/85 border border-white/[0.04]"
                    >
                      <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-3">
                        Deep Context
                      </h4>
                      
                      <div className="space-y-3.5 text-xs sm:text-sm leading-relaxed text-slate-300">
                        <p className="break-words">{selectedArticle.key_drivers}</p>
                        <p className="break-words">{selectedArticle.broader_context}</p>
                        <p className="break-words">{selectedArticle.potential_outcomes}</p>
                        {/* 🚀 STRATEGIC INTELLIGENCE INTERFACE HOOK EXTRACTED CLEANLY AS REQUESTED */}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* TOGGLE CONTROLLER BUTTON */}
              <button
                onClick={() => {
                if (!showDeepContext) {
                window.history.pushState(
                { state: "deepContextOpen" },
                ""
              );
              }

              setShowDeepContext(!showDeepContext);
              }}
                className={`w-full py-3 mb-5 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all active:scale-[0.99] shrink-0 ${showDeepContext ? 'bg-purple-600/20 border-purple-500/40 text-purple-200' : 'bg-[#151233]/70 border-white/[0.05] text-purple-300 hover:bg-[#17143a]/70 hover:text-white'}`}
              >
                {showDeepContext ? 'Return to Summary' : 'Open Intelligence Analysis'}
              </button>

              {/* ERGONOMIC ACCESSIBILITY ACTION ROW */}
              <div className="pt-3 border-t border-white/[0.04] flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                <a
                  href={selectedArticle.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs sm:text-sm font-bold tracking-wide text-white bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] shadow-lg shadow-purple-600/20 hover:opacity-95 active:scale-[0.99] transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Read Original Source
                </a>
                
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="py-3.5 sm:px-6 rounded-xl text-xs sm:text-sm font-bold tracking-wide bg-[#120f2d] border border-white/[0.05] text-slate-400 hover:text-white hover:border-red-500/20 transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" /> Close Briefing
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING SMOOTH BACK TO TOP BUTTON */}
      <AnimatePresence>
        {showScrollTop && hasExplored && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 15 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-5 right-5 z-40 p-3 rounded-full bg-purple-900/30 border border-purple-500/20 text-purple-300 shadow-2xl backdrop-blur-md hover:bg-purple-600 hover:text-white transition-all active:scale-90"
          >
            <ArrowUp className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
