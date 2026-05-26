import { HiSparkles } from "react-icons/hi2";

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-4 sm:px-6 md:px-10 pt-5">

      <div
        className="
        max-w-7xl
        mx-auto
        flex items-center justify-between
        backdrop-blur-xl
        bg-white/10
        border border-white/10
        rounded-2xl
        px-4 sm:px-6
        py-4
        shadow-lg
      "
      >

        {/* Logo */}
        <div className="flex items-center gap-3 min-w-0">

          <div
            className="
            w-11 h-11
            rounded-xl
            bg-purple-500/20
            flex items-center justify-center
            border border-purple-400/30
            flex-shrink-0
          "
          >
            <HiSparkles className="text-2xl text-purple-300" />
          </div>

          <div className="min-w-0">
            <h1
              className="
              text-white
              font-bold
              text-base sm:text-lg md:text-xl
              truncate
            "
            >
              AI News Intelligence
            </h1>

            <p
              className="
              text-gray-300
              text-xs sm:text-sm
              truncate
            "
            >
              Real-Time AI News Insights
            </p>
          </div>

        </div>

        {/* Status */}
        <div className="hidden sm:flex items-center gap-2">

          <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>

          <span className="text-gray-300 text-sm">
            Live Intelligence
          </span>

        </div>

      </div>

    </nav>
  )
}

export default Navbar;