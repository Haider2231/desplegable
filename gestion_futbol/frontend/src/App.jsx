import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Layout/Header";
import NavBar from "./components/Layout/NavBar";
import Footer from "./components/Layout/Footer"; // <-- Importa Footer
import Home from "./pages/Home";
import Courts from "./pages/Courts";
import Community from "./pages/Community";
import Info from "./pages/Info";
import About from "./pages/About";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Verify from "./components/Auth/Verify";
import ReserveCourt from "./pages/ReserveCourt";
import ManageCourts from "./pages/ManageCourts";
import ForgotPassword from "./components/Auth/ForgotPassword";
import ResetPassword from "./components/Auth/ResetPassword";
import Estadisticas from "./pages/Estadisticas";

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fd" }}>
              <Login />
            </div>
          }
        />
        <Route
          path="/register"
          element={
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fd" }}>
              <Register />
            </div>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <ForgotPassword />
          }
        />
        <Route
          path="/reset-password"
          element={
            <ResetPassword />
          }
        />
        <Route
          path="*"
          element={
            <div
              style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #e0f7fa 0%, #f8fffe 100%)",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <Header />
              <NavBar />
              <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column" }}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/courts" element={<Courts />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/info" element={<Info />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/verify" element={<Verify />} />
                  <Route path="/reservar" element={<ReserveCourt />} />
                  <Route path="/manage-courts" element={<ManageCourts />} />
                  <Route path="/estadisticas" element={
                    <div style={{ margin: "32px auto", maxWidth: 600 }}>
                      <Estadisticas />
                    </div>
                  } />
                </Routes>
              </div>
              <Footer />
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
