import React from "react";
import { HashRouter, Route, Routes } from "react-router-dom";

import Admin from "./pages/Admin";
import Display from "./pages/Display";
import Login from "./pages/Login";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Display />} />
        <Route path="/admin" element={<Login />} />
        <Route path="/admin/dashboard" element={<Admin />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
