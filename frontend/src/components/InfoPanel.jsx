import React, { useEffect, useMemo, useState } from "react";

const DAYS_TR = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const DAY_ALIASES = {
  Pazar: ["Pazar"],
  Pazartesi: ["Pazartesi"],
  Salı: ["Salı", "Sali"],
  Çarşamba: ["Çarşamba", "Carsamba", "Çarsamba"],
  Perşembe: ["Perşembe", "Persembe"],
  Cuma: ["Cuma"],
  Cumartesi: ["Cumartesi"],
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

const DEFAULT_BELL_CONFIG = {
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

const parseStartTime = (value) => {
  const [hourText, minuteText] = String(value || "08:00").split(":");
  const hour = toNumber(hourText, 8);
  const minute = toNumber(minuteText, 0);
  return hour * 60 + minute;
};

const normalizeBellConfig = (config) => {
  if (config?.days) {
    return {
      days: DAYS_TR.reduce((acc, day) => {
        const aliases = DAY_ALIASES[day] || [day];
        const foundKey = aliases.find((candidate) =>
          Object.prototype.hasOwnProperty.call(config.days || {}, candidate)
        );
        const existingDay = foundKey ? config.days?.[foundKey] || {} : {};
        const defaults = DEFAULT_BELL_CONFIG.days[day];
        acc[day] = {
          startTime: existingDay.startTime || defaults.startTime,
          blocks: Array.isArray(existingDay.blocks) ? existingDay.blocks : defaults.blocks,
        };
        return acc;
      }, {}),
    };
  }

  // Eski yapıdan (tekil alanlar) yeni gün bazlı yapıya geçiş.
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

const buildEvents = (startTime, blocks) => {
  let currentMinute = parseStartTime(startTime);
  let lessonCounter = 0;
  const events = [];

  for (const block of blocks || []) {
    const duration = Math.max(1, toNumber(block.duration, 10));
    const end = currentMinute + duration;
    let name = "BLOK";

    if (block.type === "lesson") {
      lessonCounter += 1;
      name = `${lessonCounter}. DERS`;
    } else if (block.type === "break") {
      name = "TENEFFÜS";
    } else if (block.type === "lunch") {
      name = "ÖĞLE ARASI";
    }

    events.push({
      type: block.type || "lesson",
      name,
      start: currentMinute,
      end,
    });
    currentMinute = end;
  }

  return events;
};

const InfoPanel = ({ bellConfig }) => {
  const [time, setTime] = useState(new Date());
  const [status, setStatus] = useState({
    label: "HESAPLANIYOR",
    subLabel: "...",
    minutesLeft: 0,
    progress: 0,
    color: "text-gray-400",
    stroke: "stroke-gray-300",
  });

  const normalizedConfig = useMemo(
    () => normalizeBellConfig(bellConfig || DEFAULT_BELL_CONFIG),
    [bellConfig]
  );

  useEffect(() => {
    const calculateStatus = (now) => {
      const dayName = DAYS_TR[now.getDay()];
      const dayConfig = normalizedConfig.days?.[dayName] || { startTime: "08:00", blocks: [] };
      const events = buildEvents(dayConfig.startTime, dayConfig.blocks);

      if (events.length === 0) {
        setStatus({
          label: "BUGÜN DERS YOK",
          subLabel: dayName.toLocaleUpperCase("tr-TR"),
          minutesLeft: "--",
          progress: 100,
          color: "text-gray-500",
          stroke: "stroke-gray-300",
        });
        return;
      }

      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const activeEvent = events.find(
        (event) => currentMinutes >= event.start && currentMinutes < event.end
      );

      if (!activeEvent) {
        if (currentMinutes < events[0].start) {
          setStatus({
            label: "GÜNAYDIN",
            subLabel: "DERS BAŞLAMADI",
            minutesLeft: "--",
            progress: 0,
            color: "text-gray-500",
            stroke: "stroke-gray-300",
          });
        } else {
          setStatus({
            label: "İYİ AKŞAMLAR",
            subLabel: "OKUL BİTTİ",
            minutesLeft: "--",
            progress: 100,
            color: "text-gray-500",
            stroke: "stroke-gray-300",
          });
        }
        return;
      }

      const total = activeEvent.end - activeEvent.start;
      const elapsed = currentMinutes - activeEvent.start;
      const secondsInMinute = now.getSeconds();
      const percent = ((elapsed * 60 + secondsInMinute) / (total * 60)) * 100;

      let color = "text-emerald-600";
      let stroke = "stroke-emerald-500";
      let subLabel = "BLOK BİTİMİNE";
      if (activeEvent.type === "lesson") {
        subLabel = "DERSİN BİTİMİNE";
      } else if (activeEvent.type === "break") {
        color = "text-blue-600";
        stroke = "stroke-blue-500";
        subLabel = "DERS BAŞLANGICINA";
      } else if (activeEvent.type === "lunch") {
        color = "text-orange-500";
        stroke = "stroke-orange-500";
        subLabel = "ÖĞLE ARASI BİTİMİNE";
      }

      setStatus({
        label: activeEvent.name,
        subLabel,
        minutesLeft: Math.max(0, Math.ceil(total - elapsed)),
        progress: percent,
        color,
        stroke,
      });
    };

    const timer = setInterval(() => {
      const now = new Date();
      setTime(now);
      calculateStatus(now);
    }, 1000);

    calculateStatus(new Date());
    return () => clearInterval(timer);
  }, [normalizedConfig]);

  const timeStr = time.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  const dateStr = time.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" });
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (status.progress / 100) * circumference;

  return (
    <div className="w-full h-full flex overflow-hidden">
      <div className="w-1/2 flex flex-col items-center justify-center border-r border-gray-100 bg-gradient-to-br from-white to-gray-50">
        <h2 className="text-6xl lg:text-7xl font-black text-gray-800 tracking-tighter leading-none tabular-nums">
          {timeStr}
        </h2>
        <p className="text-gray-500 text-xs font-bold tracking-wider mt-2 text-center px-2 uppercase">
          {dateStr.toLocaleUpperCase("tr-TR")}
        </p>
      </div>
      <div className="w-1/2 flex flex-col items-center justify-center bg-white relative">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="transform -rotate-90 w-full h-full">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              className="text-gray-100"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`${status.stroke} transition-all duration-1000 ease-linear`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-black ${status.color}`}>{status.minutesLeft}</span>
            <span className="text-[8px] text-gray-400 font-bold uppercase">DK</span>
          </div>
        </div>
        <div className="text-center mt-1">
          <div className={`text-sm font-black ${status.color}`}>
            {status.label.toLocaleUpperCase("tr-TR")}
          </div>
          <div className="text-[8px] font-bold text-gray-400 tracking-widest">
            {status.subLabel.toLocaleUpperCase("tr-TR")}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;

