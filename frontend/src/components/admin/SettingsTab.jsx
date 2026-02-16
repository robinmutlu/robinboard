import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaCloudSun, FaKey, FaMapMarkerAlt, FaSave } from "react-icons/fa";

const SettingsTab = () => {
  const [settings, setSettings] = useState({
    schoolName: "",
    weatherCity: "",
    weatherApiKey: "",
    marqueeText: "",
    isEmergency: false,
    emergencyMessage: "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get("/api/settings");
        if (res.data) {
          setSettings((prev) => ({ ...prev, ...res.data }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;
    setSettings((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      await axios.post("/api/settings/update", settings);
      setMsg("Ayarlar kaydedildi.");
    } catch {
      setMsg("Kaydetme hatası.");
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const getLineNumbers = () => {
    if (!settings.marqueeText) {
      return "1";
    }
    const lines = settings.marqueeText.split("\n").length;
    const count = Math.max(lines, 10);
    return Array.from({ length: count }, (_, index) => index + 1).join("\n");
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto text-white">
      <form
        onSubmit={handleSave}
        className="bg-gray-800 p-8 rounded-2xl border border-gray-700 space-y-8 shadow-xl"
      >
        <h3 className="text-2xl font-bold border-b border-gray-700 pb-4">Genel Ayarlar</h3>

        <div>
          <label className="block text-gray-400 text-sm font-bold mb-2 uppercase">Okul Adı</label>
          <input
            type="text"
            name="schoolName"
            value={settings.schoolName || ""}
            onChange={handleChange}
            className="w-full bg-gray-900 text-white border border-gray-600 rounded-lg px-4 py-3 focus:border-emerald-500 outline-none"
          />
        </div>

        <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700">
          <h4 className="flex items-center gap-2 font-bold text-lg mb-4 text-blue-400">
            <FaCloudSun /> Hava Durumu Ayarları
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-400 text-sm font-bold mb-2 flex items-center gap-2">
                <FaMapMarkerAlt /> Şehir
              </label>
              <input
                type="text"
                name="weatherCity"
                value={settings.weatherCity || ""}
                onChange={handleChange}
                placeholder="Mardin"
                className="w-full bg-gray-900 text-white border border-gray-600 rounded-lg px-4 py-3 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-bold mb-2 flex items-center gap-2">
                <FaKey /> API Key
              </label>
              <input
                type="text"
                name="weatherApiKey"
                value={settings.weatherApiKey || ""}
                onChange={handleChange}
                placeholder="OpenWeatherMap API Key"
                className="w-full bg-gray-900 text-white border border-gray-600 rounded-lg px-4 py-3 font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700">
          <h4 className="font-bold text-lg mb-4 text-red-400">Acil Durum Ekranı</h4>
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              name="isEmergency"
              checked={Boolean(settings.isEmergency)}
              onChange={handleChange}
              className="h-4 w-4"
            />
            <span className="text-sm font-medium">Acil durum ekranını aktif et</span>
          </label>
          <textarea
            name="emergencyMessage"
            value={settings.emergencyMessage || ""}
            onChange={handleChange}
            rows="3"
            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-sm resize-y"
            placeholder="Acil durum mesajı"
          />
        </div>

        <div>
          <label className="block text-gray-400 text-sm font-bold mb-2">Alt Duyuru Bandı</label>
          <div className="flex bg-gray-900 border border-gray-600 rounded-lg overflow-hidden">
            <div className="bg-gray-800 text-gray-500 p-3 text-right select-none text-sm font-mono border-r border-gray-600 w-12 flex-shrink-0 leading-6">
              <pre className="m-0 font-inherit">{getLineNumbers()}</pre>
            </div>
            <textarea
              name="marqueeText"
              value={settings.marqueeText || ""}
              onChange={handleChange}
              rows="10"
              className="w-full bg-transparent p-3 text-sm leading-6 resize-y focus:outline-none text-white whitespace-pre"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
          <span className="text-green-400 font-medium">{msg}</span>
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 shadow-lg"
          >
            <FaSave /> {loading ? "KAYDEDİLİYOR..." : "AYARLARI KAYDET"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsTab;
