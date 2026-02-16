import React, { useEffect, useState } from "react";
import axios from "axios";

const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"];
const LOCATIONS = ["Bahçe", "Zemin", "1.Kat", "2.Kat"];

const DAY_ALIASES = {
  Pazartesi: ["Pazartesi"],
  Salı: ["Salı", "Sali"],
  Çarşamba: ["Çarşamba", "Carsamba", "Çarsamba"],
  Perşembe: ["Perşembe", "Persembe"],
  Cuma: ["Cuma"],
};

const LOCATION_ALIASES = {
  Bahçe: ["Bahçe", "Bahce"],
  Zemin: ["Zemin"],
  "1.Kat": ["1.Kat"],
  "2.Kat": ["2.Kat"],
};

const emptySchedule = () => {
  const initial = {};
  DAYS.forEach((day) => {
    initial[day] = {};
    LOCATIONS.forEach((location) => {
      initial[day][location] = "";
    });
  });
  return initial;
};

const normalizeDutySchedule = (incoming = {}) => {
  const normalized = emptySchedule();

  for (const day of DAYS) {
    const dayCandidates = DAY_ALIASES[day] || [day];
    const foundDayKey = dayCandidates.find((candidate) =>
      Object.prototype.hasOwnProperty.call(incoming, candidate)
    );
    const daySource = foundDayKey ? incoming[foundDayKey] || {} : {};

    for (const location of LOCATIONS) {
      const locationCandidates = LOCATION_ALIASES[location] || [location];
      const foundLocation = locationCandidates.find((candidate) =>
        Object.prototype.hasOwnProperty.call(daySource, candidate)
      );
      normalized[day][location] = foundLocation ? daySource[foundLocation] || "" : "";
    }
  }

  return normalized;
};

const getMondayIso = (date = new Date()) => {
  const local = new Date(date);
  local.setHours(0, 0, 0, 0);
  const mondayOffset = (local.getDay() + 6) % 7;
  local.setDate(local.getDate() - mondayOffset);
  const year = local.getFullYear();
  const month = String(local.getMonth() + 1).padStart(2, "0");
  const day = String(local.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateTr = (isoDate) => {
  if (!isoDate) {
    return "-";
  }

  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) {
    return isoDate;
  }

  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("tr-TR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const DutyTab = () => {
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(false);
  const [rotationStartDate, setRotationStartDate] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get("/api/settings");
        if (res.data?.dutySchedule) {
          setSchedule(normalizeDutySchedule(res.data.dutySchedule));
        } else {
          setSchedule(emptySchedule());
        }

        setRotationStartDate(res.data?.dutyRotationStartDate || getMondayIso());
      } catch {
        setSchedule(emptySchedule());
        setRotationStartDate(getMondayIso());
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (day, location, value) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [location]: value },
    }));
  };

  const handleResetCycleStart = () => {
    setRotationStartDate(getMondayIso());
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.post("/api/settings/update", {
        dutySchedule: schedule,
        dutyRotationStartDate: rotationStartDate || getMondayIso(),
      });
      alert("Çizelge kaydedildi.");
    } catch {
      alert("Kaydetme hatası.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <h3 className="text-xl font-bold text-white">Haftalık Nöbet Çizelgesi</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetCycleStart}
            className="bg-gray-700 px-4 py-2 rounded-lg font-bold text-white hover:bg-gray-600 transition-colors"
          >
            Döngüyü Bu Haftadan Başlat
          </button>
          <button
            onClick={handleSave}
            className="bg-robin-green px-6 py-2 rounded-lg font-bold text-white hover:bg-emerald-600 transition-colors"
          >
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-300 bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2">
        Yerler her hafta otomatik 1 adım döner. Başlangıç haftası: <strong>{formatDateTr(rotationStartDate)}</strong>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="p-3 border-b border-gray-700 text-gray-400">Günler</th>
              {LOCATIONS.map((location) => (
                <th key={location} className="p-3 border-b border-gray-700 text-robin-green">
                  {location}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day) => (
              <tr key={day} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="p-3 font-bold text-white">{day}</td>
                {LOCATIONS.map((location) => (
                  <td key={location} className="p-2">
                    <input
                      type="text"
                      className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:border-robin-green focus:outline-none"
                      value={schedule[day]?.[location] || ""}
                      onChange={(event) => handleChange(day, location, event.target.value)}
                      placeholder="Öğretmen Adı"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DutyTab;


