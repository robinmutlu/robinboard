import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FaCalendarDay, FaClock, FaPlus, FaTrash } from "react-icons/fa";

const DAYS_TR = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const DAY_ALIASES = {
  Pazartesi: ["Pazartesi"],
  Salı: ["Salı", "Sali"],
  Çarşamba: ["Çarşamba", "Carsamba", "Çarsamba"],
  Perşembe: ["Perşembe", "Persembe"],
  Cuma: ["Cuma"],
  Cumartesi: ["Cumartesi"],
  Pazar: ["Pazar"],
};

const buildDefaultBlocks = ({
  lessonDuration = 40,
  breakDuration = 10,
  lunchDuration = 40,
  lunchAfter = 5,
  afternoonBreakDuration,
} = {}) => {
  const blocks = [];
  for (let lesson = 1; lesson <= 8; lesson += 1) {
    blocks.push({ type: "lesson", duration: lessonDuration });
    if (lesson === 8) {
      continue;
    }

    if (lesson === lunchAfter) {
      blocks.push({ type: "lunch", duration: lunchDuration });
    } else {
      const selectedBreak =
        typeof afternoonBreakDuration === "number" && lesson > lunchAfter
          ? afternoonBreakDuration
          : breakDuration;
      blocks.push({ type: "break", duration: selectedBreak });
    }
  }
  return blocks;
};

const DEFAULT_CONFIG = {
  days: {
    Pazartesi: { startTime: "08:00", blocks: buildDefaultBlocks() },
    Salı: { startTime: "08:00", blocks: buildDefaultBlocks() },
    Çarşamba: { startTime: "08:00", blocks: buildDefaultBlocks() },
    Perşembe: { startTime: "08:00", blocks: buildDefaultBlocks() },
    Cuma: {
      startTime: "08:00",
      blocks: buildDefaultBlocks({ lunchDuration: 50, afternoonBreakDuration: 5 }),
    },
    Cumartesi: { startTime: "08:00", blocks: [] },
    Pazar: { startTime: "08:00", blocks: [] },
  },
};

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeConfig = (config) => {
  if (config?.days) {
    return {
      days: DAYS_TR.reduce((acc, day) => {
        const aliases = DAY_ALIASES[day] || [day];
        const foundKey = aliases.find((candidate) =>
          Object.prototype.hasOwnProperty.call(config.days || {}, candidate)
        );
        const incomingDay = foundKey ? config.days?.[foundKey] || {} : {};
        const defaults = DEFAULT_CONFIG.days[day];
        acc[day] = {
          startTime: incomingDay.startTime || defaults.startTime,
          blocks: Array.isArray(incomingDay.blocks) ? incomingDay.blocks : defaults.blocks,
        };
        return acc;
      }, {}),
    };
  }

  const legacy = config || {};
  return {
    days: {
      Pazartesi: {
        startTime: legacy.startTime || "08:00",
        blocks: buildDefaultBlocks({
          lessonDuration: toNumber(legacy.lessonDuration, 40),
          breakDuration: toNumber(legacy.breakDuration, 10),
          lunchDuration: toNumber(legacy.lunchDuration, 40),
          lunchAfter: toNumber(legacy.lunchAfter, 5),
        }),
      },
      Salı: {
        startTime: legacy.startTime || "08:00",
        blocks: buildDefaultBlocks({
          lessonDuration: toNumber(legacy.lessonDuration, 40),
          breakDuration: toNumber(legacy.breakDuration, 10),
          lunchDuration: toNumber(legacy.lunchDuration, 40),
          lunchAfter: toNumber(legacy.lunchAfter, 5),
        }),
      },
      Çarşamba: {
        startTime: legacy.startTime || "08:00",
        blocks: buildDefaultBlocks({
          lessonDuration: toNumber(legacy.lessonDuration, 40),
          breakDuration: toNumber(legacy.breakDuration, 10),
          lunchDuration: toNumber(legacy.lunchDuration, 40),
          lunchAfter: toNumber(legacy.lunchAfter, 5),
        }),
      },
      Perşembe: {
        startTime: legacy.startTime || "08:00",
        blocks: buildDefaultBlocks({
          lessonDuration: toNumber(legacy.lessonDuration, 40),
          breakDuration: toNumber(legacy.breakDuration, 10),
          lunchDuration: toNumber(legacy.lunchDuration, 40),
          lunchAfter: toNumber(legacy.lunchAfter, 5),
        }),
      },
      Cuma: {
        startTime: legacy.startTime || "08:00",
        blocks: buildDefaultBlocks({
          lessonDuration: toNumber(legacy.fridayLessonDuration, legacy.lessonDuration || 40),
          breakDuration: toNumber(legacy.fridayBreakDuration, legacy.breakDuration || 10),
          lunchDuration: toNumber(legacy.fridayLunchDuration, legacy.lunchDuration || 40),
          lunchAfter: toNumber(legacy.fridayLunchAfter, legacy.lunchAfter || 5),
          afternoonBreakDuration: toNumber(
            legacy.fridayAfternoonBreakDuration,
            legacy.fridayBreakDuration || legacy.breakDuration || 10
          ),
        }),
      },
      Cumartesi: { startTime: "08:00", blocks: [] },
      Pazar: { startTime: "08:00", blocks: [] },
    },
  };
};

const BLOCK_LABELS = {
  lesson: "Ders",
  break: "Teneffüs",
  lunch: "Öğle Arası",
};

const BellScheduleTab = () => {
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState("Pazartesi");
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get("/api/settings");
        setConfig(normalizeConfig(res.data?.bellConfig));
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();
  }, []);

  const dayConfig = useMemo(
    () => config.days?.[selectedDay] || { startTime: "08:00", blocks: [] },
    [config, selectedDay]
  );

  const updateDay = (updater) => {
    setConfig((prev) => {
      const current = prev.days?.[selectedDay] || { startTime: "08:00", blocks: [] };
      return {
        ...prev,
        days: {
          ...prev.days,
          [selectedDay]: updater(current),
        },
      };
    });
  };

  const updateStartTime = (value) => {
    updateDay((current) => ({ ...current, startTime: value }));
  };

  const addBlock = (type) => {
    const defaultDuration = type === "lesson" ? 40 : type === "break" ? 10 : 40;
    updateDay((current) => ({
      ...current,
      blocks: [...(current.blocks || []), { type, duration: defaultDuration }],
    }));
  };

  const updateBlock = (index, patch) => {
    updateDay((current) => ({
      ...current,
      blocks: (current.blocks || []).map((block, blockIndex) =>
        blockIndex === index ? { ...block, ...patch } : block
      ),
    }));
  };

  const removeBlock = (index) => {
    updateDay((current) => ({
      ...current,
      blocks: (current.blocks || []).filter((_, blockIndex) => blockIndex !== index),
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.post("/api/settings/update", { bellConfig: config });
      alert("Zil saatleri güncellendi.");
    } catch {
      alert("Kaydetme hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-white max-w-5xl mx-auto pb-20">
      <div className="flex justify-between items-center border-b border-gray-700 pb-4">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <FaClock className="text-emerald-500" /> Zil Planı (Gün Bazlı)
        </h3>
        <button
          onClick={handleSave}
          className="bg-emerald-600 hover:bg-emerald-700 px-6 py-2 rounded-lg font-bold shadow-lg transition-colors"
        >
          {loading ? "KAYDEDİLİYOR..." : "KAYDET"}
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-700">
        {DAYS_TR.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              selectedDay === day ? "bg-emerald-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            <FaCalendarDay className="inline mr-2" />
            {day}
          </button>
        ))}
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-5">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
            Ders Başlangıç Saati
          </label>
          <input
            type="time"
            value={dayConfig.startTime}
            onChange={(event) => updateStartTime(event.target.value)}
            className="w-48 bg-gray-900 border border-gray-600 rounded p-2 text-white outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => addBlock("lesson")}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold text-sm"
          >
            <FaPlus className="inline mr-2" />
            Ders Ekle
          </button>
          <button
            onClick={() => addBlock("break")}
            className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded font-bold text-sm"
          >
            <FaPlus className="inline mr-2" />
            Teneffüs Ekle
          </button>
          <button
            onClick={() => addBlock("lunch")}
            className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded font-bold text-sm"
          >
            <FaPlus className="inline mr-2" />
            Öğle Arası Ekle
          </button>
        </div>

        <div className="space-y-3">
          {dayConfig.blocks.length === 0 ? (
            <div className="text-sm text-gray-400 bg-gray-900 rounded p-4 border border-gray-700">
              Bu gün için blok tanımlı değil. Ders veya teneffüs ekleyin.
            </div>
          ) : (
            dayConfig.blocks.map((block, index) => (
              <div
                key={`${block.type}-${index}`}
                className="grid grid-cols-12 gap-3 items-center bg-gray-900 border border-gray-700 rounded p-3"
              >
                <div className="col-span-12 md:col-span-1 text-xs font-bold text-gray-400">
                  #{index + 1}
                </div>
                <div className="col-span-12 md:col-span-5">
                  <label className="block text-[10px] uppercase text-gray-500 mb-1">Tür</label>
                  <select
                    value={block.type}
                    onChange={(event) => updateBlock(index, { type: event.target.value })}
                    className="w-full bg-black/40 border border-gray-700 rounded p-2 text-sm outline-none"
                  >
                    <option value="lesson">{BLOCK_LABELS.lesson}</option>
                    <option value="break">{BLOCK_LABELS.break}</option>
                    <option value="lunch">{BLOCK_LABELS.lunch}</option>
                  </select>
                </div>
                <div className="col-span-12 md:col-span-4">
                  <label className="block text-[10px] uppercase text-gray-500 mb-1">Süre (Dakika)</label>
                  <input
                    type="number"
                    min={1}
                    value={block.duration}
                    onChange={(event) =>
                      updateBlock(index, { duration: Math.max(1, Number(event.target.value) || 1) })
                    }
                    className="w-full bg-black/40 border border-gray-700 rounded p-2 text-sm outline-none"
                  />
                </div>
                <div className="col-span-12 md:col-span-2 text-right">
                  <button
                    onClick={() => removeBlock(index)}
                    className="w-full md:w-auto text-red-400 hover:bg-red-500/10 p-2 rounded"
                    title="Sil"
                  >
                    <FaTrash className="inline mr-1" />
                    Sil
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BellScheduleTab;

