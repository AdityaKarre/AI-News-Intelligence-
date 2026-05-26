import { useState } from "react";

import Navbar from "../components/Navbar";
import NewsControls from "../components/NewsControls";
import NewsSection from "../components/NewsSection";

function NewsDashboard() {

  const [selectedRegion, setSelectedRegion] = useState("World");

  const [selectedCategory, setSelectedCategory] = useState("All");

  const [refreshKey, setRefreshKey] = useState(0);


  // Refresh Latest News
  const handleRefresh = () => {

    setRefreshKey(prev => prev + 1);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };


  return (

    <div className="min-h-screen relative overflow-hidden bg-[#050816] pb-20">

      {/* Background Glow */}
      <div
        className="
          absolute
          top-[-120px]
          left-[-120px]
          w-[280px]
          md:w-[420px]
          h-[280px]
          md:h-[420px]
          bg-purple-500/20
          blur-3xl
          rounded-full
        "
      ></div>

      <div
        className="
          absolute
          bottom-[-120px]
          right-[-120px]
          w-[280px]
          md:w-[420px]
          h-[280px]
          md:h-[420px]
          bg-indigo-500/20
          blur-3xl
          rounded-full
        "
      ></div>


      {/* Navbar */}
      <Navbar />


      {/* Dashboard Header */}
      <div className="relative z-10 pt-36 sm:pt-40 px-4 sm:px-6 lg:px-10">

        <div className="max-w-6xl mx-auto">

          <h1
            className="
              text-3xl
              sm:text-4xl
              lg:text-5xl
              font-bold
              text-white
            "
          >
            Live AI News Dashboard
          </h1>

          <p
            className="
              text-gray-400
              mt-4
              text-sm
              sm:text-base
              lg:text-lg
              leading-7
            "
          >
            Real-time AI-powered news intelligence with smart summaries,
            deep contextual analysis, and trusted global coverage.
          </p>

        </div>

      </div>


      {/* Controls */}
      <div className="relative z-10 mt-8 px-4 sm:px-6 lg:px-10">

        <div className="max-w-6xl mx-auto">

          <NewsControls
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}

            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}

            onRefresh={handleRefresh}
          />

        </div>

      </div>


      {/* News Feed */}
      <div className="relative z-10 mt-8">

        <NewsSection
          selectedRegion={selectedRegion}
          selectedCategory={selectedCategory}
          refreshKey={refreshKey}
        />

      </div>

    </div>
  );
}

export default NewsDashboard;