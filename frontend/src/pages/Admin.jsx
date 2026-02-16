import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaBars,
  FaCalendarAlt,
  FaChalkboardTeacher,
  FaClock,
  FaCog,
  FaImages,
  FaSignOutAlt,
  FaTimes,
  FaUserGraduate,
} from "react-icons/fa";

import BellScheduleTab from "../components/admin/BellScheduleTab";
import DutyTab from "../components/admin/DutyTab";
import MediaTab from "../components/admin/MediaTab";
import ScheduleTab from "../components/admin/ScheduleTab";
import SettingsTab from "../components/admin/SettingsTab";
import StudentsTab from "../components/admin/StudentsTab";

const Admin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("settings");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let active = true;

    const checkAuth = async () => {
      try {
        const res = await axios.get("/api/auth/status");
        if (!res.data?.authenticated) {
          navigate("/admin");
          return;
        }
      } catch {
        navigate("/admin");
        return;
      }

      if (active) {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
    return () => {
      active = false;
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
    } catch {
      // Çıkış isteği başarısız olsa da login sayfasına yönlendir.
    }
    navigate("/admin");
  };

  const getTitle = () => {
    switch (activeTab) {
      case "settings":
        return "Genel Ayarlar";
      case "media":
        return "Medya Yönetimi";
      case "duty":
        return "Nöbet Çizelgesi";
      case "students":
        return "Öğrenci Listesi";
      case "schedule":
        return "Ders Programı";
      case "bells":
        return "Zil Saatleri";
      default:
        return "Panel";
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="h-screen w-screen bg-[#121212] text-white flex items-center justify-center">
        Yetki kontrol ediliyor...
      </div>
    );
  }

  return (
    <div className="h-screen bg-robin-dark text-white flex font-sans overflow-hidden relative">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 w-72 bg-robin-card border-r border-gray-800 p-6 flex flex-col shadow-2xl z-40 transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white md:hidden"
        >
          <FaTimes size={24} />
        </button>

        <div className="mb-10 flex items-center gap-3 px-2 mt-4 md:mt-0">
          <div className="w-10 h-10 bg-robin-green rounded-lg flex items-center justify-center text-black font-black text-xl">
            R
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">RobinBoard</h1>
            <p className="text-xs text-gray-500 font-medium">Yönetim Paneli</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <MenuButton
            icon={<FaCog />}
            label="Genel Ayarlar"
            active={activeTab === "settings"}
            onClick={() => {
              setActiveTab("settings");
              setIsSidebarOpen(false);
            }}
          />
          <MenuButton
            icon={<FaImages />}
            label="Duyuru / Medya"
            active={activeTab === "media"}
            onClick={() => {
              setActiveTab("media");
              setIsSidebarOpen(false);
            }}
          />
          <div className="pt-4 pb-2">
            <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
              Okul İşlemleri
            </p>
          </div>
          <MenuButton
            icon={<FaChalkboardTeacher />}
            label="Nöbet Çizelgesi"
            active={activeTab === "duty"}
            onClick={() => {
              setActiveTab("duty");
              setIsSidebarOpen(false);
            }}
          />
          <MenuButton
            icon={<FaUserGraduate />}
            label="Öğrenci Listesi"
            active={activeTab === "students"}
            onClick={() => {
              setActiveTab("students");
              setIsSidebarOpen(false);
            }}
          />
          <MenuButton
            icon={<FaCalendarAlt />}
            label="Ders Programı"
            active={activeTab === "schedule"}
            onClick={() => {
              setActiveTab("schedule");
              setIsSidebarOpen(false);
            }}
          />
          <MenuButton
            icon={<FaClock />}
            label="Zil Saatleri"
            active={activeTab === "bells"}
            onClick={() => {
              setActiveTab("bells");
              setIsSidebarOpen(false);
            }}
          />
        </nav>

        <div className="mt-auto border-t border-gray-700 pt-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <FaSignOutAlt /> <span className="font-medium">Güvenli Çıkış</span>
          </button>
        </div>
      </div>

      <div className="flex-1 bg-[#121212] flex flex-col h-screen overflow-hidden w-full">
        <header className="h-20 bg-robin-card/50 backdrop-blur-md border-b border-gray-800 flex items-center px-4 md:px-10 justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="text-white md:hidden hover:bg-gray-800 p-2 rounded-lg transition-colors"
            >
              <FaBars size={24} />
            </button>
            <h2 className="text-xl md:text-2xl font-bold text-white truncate">{getTitle()}</h2>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-robin-green to-emerald-600 border-2 border-white/10 shrink-0" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 scrollbar-thin scrollbar-thumb-gray-700">
          <div className="max-w-6xl mx-auto pb-20">
            {activeTab === "settings" && <SettingsTab />}
            {activeTab === "media" && <MediaTab />}
            {activeTab === "duty" && <DutyTab />}
            {activeTab === "students" && <StudentsTab />}
            {activeTab === "schedule" && <ScheduleTab />}
            {activeTab === "bells" && <BellScheduleTab />}
          </div>
        </main>
      </div>
    </div>
  );
};

const MenuButton = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${active ? "bg-robin-green text-white font-bold" : "text-gray-400 hover:bg-gray-800"}`}
  >
    <span className="text-xl">{icon}</span>
    <span>{label}</span>
  </button>
);

export default Admin;
