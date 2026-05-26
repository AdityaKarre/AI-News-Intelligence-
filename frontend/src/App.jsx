import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import NewsDashboard from "./pages/NewsDashboard";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/news" element={<NewsDashboard />} />

      </Routes>

    </BrowserRouter>
  )
}

export default App;