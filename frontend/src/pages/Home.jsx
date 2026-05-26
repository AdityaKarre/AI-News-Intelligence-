import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";

function Home() {

  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">

      {/* Background Glow */}
      <div
        className="
        absolute top-[-120px] left-[-120px]
        w-[300px] md:w-[450px]
        h-[300px] md:h-[450px]
        bg-purple-500/20
        blur-3xl
        rounded-full
      "
      ></div>

      <div
        className="
        absolute bottom-[-120px] right-[-120px]
        w-[300px] md:w-[450px]
        h-[300px] md:h-[450px]
        bg-indigo-500/20
        blur-3xl
        rounded-full
      "
      ></div>

      {/* Navbar */}
      <Navbar />

      {/* Hero */}
      <section
        className="
        relative z-10
        min-h-screen
        flex flex-col
        items-center
        justify-center
        text-center
        px-5 sm:px-6 md:px-10
        pt-36 md:pt-44
        pb-16
      "
      >

        {/* Badge */}
        <div
          className="
          mb-6
          px-4 py-2
          rounded-full
          border border-purple-400/20
          bg-white/5
          backdrop-blur-lg
          text-purple-200
          text-xs sm:text-sm
          shadow-lg
        "
        >
          AI-Powered Real-Time News Intelligence
        </div>

        {/* Heading */}
        <h1
          className="
          text-4xl
          sm:text-5xl
          md:text-7xl
          font-extrabold
          leading-tight
          max-w-5xl
        "
        >

          <span className="text-white">
            Understand News
          </span>

          <br />

          <span
            className="
            bg-gradient-to-r
            from-purple-300
            via-violet-400
            to-indigo-400
            bg-clip-text
            text-transparent
          "
          >
            Beyond Headlines
          </span>

        </h1>

        {/* Subtitle */}
        <p
          className="
          mt-8
          text-gray-300
          text-base
          sm:text-lg
          md:text-xl
          max-w-3xl
          leading-relaxed
        "
        >
          Experience AI-driven news intelligence with smart summaries,
          deep contextual analysis, real-time global coverage,
          and trusted news insights.
        </p>

        {/* Button */}
        <div className="mt-10">

          <button
            onClick={() => navigate("/news")}
            className="
              px-7 sm:px-8
              py-3 sm:py-4
              rounded-2xl
              bg-gradient-to-r
              from-purple-500
              to-indigo-500
              hover:scale-105
              transition-all
              duration-300
              shadow-xl
              font-semibold
              text-sm sm:text-base
            "
          >
            Explore Live News
          </button>

        </div>

      </section>

    </div>
  )
}

export default Home;