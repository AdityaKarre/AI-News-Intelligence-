function NewsControls({

  selectedRegion,
  setSelectedRegion,

  selectedCategory,
  setSelectedCategory,

  onRefresh

}) {

  // Reduced Clean Categories
  const categories = [
    "All",
    "Technology",
    "Politics",
    "Business",
    "Entertainment",
    "Sports"
  ];


  // Regions
  const regions = [
    "World",
    "India"
  ];


  return (

    <div
      className="
        bg-white/5
        border border-white/10
        backdrop-blur-xl
        rounded-2xl
        p-4 sm:p-5
      "
    >

      <div
        className="
          flex
          flex-col
          lg:flex-row
          gap-4
          lg:items-center
          lg:justify-between
        "
      >

        {/* Left Controls */}
        <div
          className="
            flex
            flex-col
            sm:flex-row
            gap-4
            w-full
          "
        >

          {/* Region Dropdown */}
          <div className="w-full sm:w-[220px]">

            <label
              className="
                block
                text-sm
                text-gray-400
                mb-2
              "
            >
              Region
            </label>

            <select

              value={selectedRegion}

              onChange={(e) =>
                setSelectedRegion(e.target.value)
              }

              className="
                w-full
                bg-[#111827]
                border border-white/10
                rounded-xl
                px-4
                py-3
                text-white
                outline-none
                focus:border-purple-400/40
              "
            >

              {regions.map((region) => (

                <option
                  key={region}
                  value={region}
                >
                  {region}
                </option>

              ))}

            </select>

          </div>


          {/* Category Dropdown */}
          <div className="w-full sm:w-[260px]">

            <label
              className="
                block
                text-sm
                text-gray-400
                mb-2
              "
            >
              Category
            </label>

            <select

              value={selectedCategory}

              onChange={(e) =>
                setSelectedCategory(e.target.value)
              }

              className="
                w-full
                bg-[#111827]
                border border-white/10
                rounded-xl
                px-4
                py-3
                text-white
                outline-none
                focus:border-purple-400/40
              "
            >

              {categories.map((category) => (

                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>

              ))}

            </select>

          </div>

        </div>


        {/* Refresh Button */}
        <div className="w-full lg:w-auto">

          <button

            onClick={onRefresh}

            className="
              w-full
              lg:w-auto
              px-6
              py-3
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
            Refresh News
          </button>

        </div>

      </div>

    </div>
  );
}

export default NewsControls;