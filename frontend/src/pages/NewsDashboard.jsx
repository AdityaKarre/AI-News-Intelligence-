import { useState } from "react";
import { ArrowUp, Home } from "lucide-react";

import Navbar from "../components/Navbar";
import NewsControls from "../components/NewsControls";
import NewsSection from "../components/NewsSection";

function NewsDashboard() {

  const [selectedRegion, setSelectedRegion] = useState("India");

  const [selectedCategory, setSelectedCategory] = useState("All");

  const [refreshKey, setRefreshKey] = useState(0);

  const [showTopButton, setShowTopButton] = useState(false);


  // Refresh Latest News
  const handleRefresh = () => {

    setRefreshKey(prev => prev + 1);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  useEffect(() => {

  const handleScroll = () => {

    setShowTopButton(window.scrollY > 300);
  };

  window.addEventListener("scroll", handleScroll);

  return () => window.removeEventListener("scroll", handleScroll);

  }, []);


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


      {/* Controls */}
      <div className="relative z-10 mt-4 px-4 sm:px-6 lg:px-10">

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
      <div className="relative z-10 mt-4">

        <NewsSection
          selectedRegion={selectedRegion}
          selectedCategory={selectedCategory}
          refreshKey={refreshKey}
        />

      </div>



      {/* Floating Buttons */}
<div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3">

  {/* Home Button */}
  <button
    onClick={() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }}
    className="
      w-12
      h-12
      rounded-full
      bg-purple-500
      text-white
      flex
      items-center
      justify-center
      shadow-xl
      hover:scale-105
      transition-all
    "
  >
    <Home size={20} />
  </button>


  {/* Back To Top */}
  {showTopButton && (

    <button
      onClick={() => {
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      }}
      className="
        w-12
        h-12
        rounded-full
        bg-indigo-500
        text-white
        flex
        items-center
        justify-center
        shadow-xl
        hover:scale-105
        transition-all
      "
    >
      <ArrowUp size={20} />
    </button>

  )}

</div>


    </div>
  );
}

export default NewsDashboard;