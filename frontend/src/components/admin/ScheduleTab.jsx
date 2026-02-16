import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaPlus, FaSave, FaTable, FaTrash } from "react-icons/fa";

const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const DAY_ALIASES = {
  Pazartesi: ["Pazartesi"],
  Salı: ["Salı", "Sali"],
  Çarşamba: ["Çarşamba", "Carsamba", "Çarsamba"],
  Perşembe: ["Perşembe", "Persembe"],
  Cuma: ["Cuma"],
  Cumartesi: ["Cumartesi"],
  Pazar: ["Pazar"],
};

const normalizeScheduleDays = (incoming = {}) => {
  const normalized = {};
  for (const day of DAYS) {
    const candidates = DAY_ALIASES[day] || [day];
    const found = candidates.find((candidate) =>
      Object.prototype.hasOwnProperty.call(incoming, candidate)
    );
    normalized[day] = found ? incoming[found] || [] : [];
  }
  return normalized;
};

const ScheduleTab = () => {
  const [scheduleData, setScheduleData] = useState({});
  const [selectedDay, setSelectedDay] = useState("Pazartesi");
  const [currentRows, setCurrentRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await axios.get("/api/schedule/get");
        if (res.data) {
          setScheduleData(normalizeScheduleDays(res.data));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSchedule();
  }, []);

  useEffect(() => {
    if (scheduleData[selectedDay]) {
      setCurrentRows(JSON.parse(JSON.stringify(scheduleData[selectedDay])));
    } else {
      setCurrentRows([]);
    }
  }, [selectedDay, scheduleData]);

  const handleCellChange = (rowIndex, colIndex, value) => {
    const updated = [...currentRows];
    if (colIndex === -1) {
      updated[rowIndex].className = value;
    } else {
      updated[rowIndex].lessons[colIndex] = value;
    }
    setCurrentRows(updated);
  };

  const addRow = () =>
    setCurrentRows([...currentRows, { className: "Yeni Sınıf", lessons: Array(8).fill("") }]);

  const removeRow = (index) => {
    setCurrentRows(currentRows.filter((_, rowIndex) => rowIndex !== index));
  };

  const handleSave = async () => {
    setLoading(true);
    const newSchedule = { ...scheduleData, [selectedDay]: currentRows };
    setScheduleData(newSchedule);
    try {
      await axios.post("/api/schedule/update", newSchedule);
      alert(`âœ… ${selectedDay} kaydedildi.`);
    } catch {
      alert("Hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-white font-sans h-[calc(100vh-180px)] flex flex-col">
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-700 shrink-0">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-5 py-2 rounded-t-lg font-bold transition-all whitespace-nowrap ${
              selectedDay === day ? "bg-emerald-600 text-white border-b-2 border-white" : "text-gray-400 hover:bg-gray-800"
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center shrink-0">
        <h3 className="font-bold text-xl flex items-center gap-2">
          <FaTable className="text-emerald-500" /> {selectedDay} Programı
        </h3>
        <div className="flex gap-2">
          <button
            onClick={addRow}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold flex items-center gap-2 text-sm"
          >
            <FaPlus /> Sınıf Ekle
          </button>
          <button
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-700 px-6 py-2 rounded font-bold flex items-center gap-2 text-sm shadow-lg"
          >
            {loading ? "..." : (
              <>
                <FaSave /> KAYDET
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-900 border border-gray-700 rounded-xl">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="bg-gray-800 text-gray-400 sticky top-0 z-10">
            <tr>
              <th className="p-3 border-b border-gray-700 w-32">Sınıf</th>
              {Array.from({ length: 8 }).map((_, index) => (
                <th key={index} className="p-3 border-b border-gray-700 text-center w-24">
                  {index + 1}
                </th>
              ))}
              <th className="p-3 border-b border-gray-700 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {currentRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-800/50">
                <td className="p-2 border-r border-gray-800">
                  <input
                    type="text"
                    value={row.className}
                    onChange={(event) => handleCellChange(rowIndex, -1, event.target.value)}
                    className="w-full bg-black/30 border border-gray-700 rounded p-2 text-emerald-400 font-bold text-center focus:border-emerald-500 outline-none"
                  />
                </td>
                {row.lessons.map((lesson, colIndex) => (
                  <td key={colIndex} className="p-1">
                    <input
                      type="text"
                      value={lesson || ""}
                      onChange={(event) => handleCellChange(rowIndex, colIndex, event.target.value)}
                      className="w-full bg-transparent border border-transparent hover:border-gray-600 focus:bg-black focus:border-emerald-500 rounded p-2 text-center text-sm outline-none transition-all"
                      placeholder="-"
                    />
                  </td>
                ))}
                <td className="p-2 text-center">
                  <button
                    onClick={() => removeRow(rowIndex)}
                    className="text-red-500 hover:bg-red-500/20 p-2 rounded"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
            {currentRows.length === 0 && (
              <tr>
                <td colSpan="10" className="text-center py-20 text-gray-500">
                  Kayıt yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScheduleTab;

