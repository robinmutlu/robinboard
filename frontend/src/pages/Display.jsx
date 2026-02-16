import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import io from "socket.io-client";
import { FaCode } from "react-icons/fa";

import Emergency from "../components/Emergency";
import InfoPanel from "../components/InfoPanel";
import Slider from "../components/Slider";
import Ticker from "../components/Ticker";

const socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin);
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
const DUTY_LOCATIONS = ["Bahçe", "Zemin", "1.Kat", "2.Kat"];
const LOCATION_ALIASES = {
  Bahçe: ["Bahçe", "Bahce"],
  Zemin: ["Zemin"],
  "1.Kat": ["1.Kat"],
  "2.Kat": ["2.Kat"],
};

const pickByDay = (source, dayName) => {
  if (!source || typeof source !== "object") {
    return undefined;
  }
  const candidates = DAY_ALIASES[dayName] || [dayName];
  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      return source[key];
    }
  }
  return undefined;
};

const normalizeDutyDay = (dayDuty) => {
  const normalized = {};

  for (const location of DUTY_LOCATIONS) {
    const keys = LOCATION_ALIASES[location] || [location];
    const sourceKey = keys.find((candidate) =>
      Object.prototype.hasOwnProperty.call(dayDuty || {}, candidate)
    );
    normalized[location] = sourceKey ? dayDuty[sourceKey] || "" : "";
  }

  return normalized;
};

const parseLocalIsoDate = (isoDate) => {
  if (!isoDate || typeof isoDate !== "string") {
    return null;
  }

  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

const getMondayOfWeek = (dateValue) => {
  const monday = new Date(dateValue);
  monday.setHours(0, 0, 0, 0);
  const offset = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - offset);
  return monday;
};

const getDutyRotationOffset = (rotationStartDate, nowDate = new Date()) => {
  const start = parseLocalIsoDate(rotationStartDate);
  if (!start) {
    return 0;
  }

  const thisWeekMonday = getMondayOfWeek(nowDate);
  const diffMs = thisWeekMonday.getTime() - start.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  const cycleLength = DUTY_LOCATIONS.length;
  return ((diffWeeks % cycleLength) + cycleLength) % cycleLength;
};

const rotateDutyLocations = (dayDuty, offset) => {
  const normalized = normalizeDutyDay(dayDuty);
  const values = DUTY_LOCATIONS.map((location) => normalized[location] || "");

  const rotated = {};
  DUTY_LOCATIONS.forEach((location, index) => {
    const sourceIndex = (index - offset + values.length) % values.length;
    rotated[location] = values[sourceIndex];
  });

  return rotated;
};
const AutoScrollList = ({
  items,
  renderItem,
  rowHeight = 40,
  speed = 3000,
  loopWhenFits = false,
}) => {
  const [offset, setOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [containerHeight, setContainerHeight] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return undefined;
    }

    const updateHeight = (next) => {
      setContainerHeight((prev) => (Math.abs(prev - next) < 0.5 ? prev : next));
    };

    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect?.height ?? element.clientHeight;
      updateHeight(next);
    });
    observer.observe(element);

    const rafId = requestAnimationFrame(() => updateHeight(element.clientHeight));
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [items.length]);

  const needsScroll = containerHeight > 0 && items.length * rowHeight > containerHeight;
  const isScrollable = items.length > 1 && (loopWhenFits || needsScroll);

  useEffect(() => {
    if (!isScrollable) {
      return;
    }

    const interval = setInterval(() => {
      setOffset((prev) => {
        const totalHeight = items.length * rowHeight;
        const nextOffset = prev + rowHeight;
        if (nextOffset >= totalHeight) {
          setTimeout(() => {
            setIsTransitioning(false);
            setOffset(0);
            setTimeout(() => setIsTransitioning(true), 50);
          }, 500);
          return nextOffset;
        }
        return nextOffset;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [isScrollable, items.length, rowHeight, speed]);

  const renderList = isScrollable ? [...items, ...items, ...items] : items;
  return (
    <div className="flex-1 relative overflow-hidden" ref={containerRef}>
      <div
        style={{
          transform: `translateY(-${offset}px)`,
          transition: isTransitioning ? "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
        }}
      >
        {renderList.map((item, index) => renderItem(item, index))}
      </div>
    </div>
  );
};
const Display = () => {
  const [settings, setSettings] = useState({});
  const [weather, setWeather] = useState(null);
  const [schedule, setSchedule] = useState({});
  const [todaysBirthdays, setTodaysBirthdays] = useState([]);
  const [includesWeekendPreview, setIncludesWeekendPreview] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const [settingsRes, weatherRes, scheduleRes, bdayRes] = await Promise.all([
          axios.get("/api/settings"),
          axios.get("/api/weather"),
          axios.get("/api/schedule/get"),
          axios.get("/api/birthdays/today"),
        ]);

        if (!mounted) {
          return;
        }

        setSettings(settingsRes.data || {});
        setWeather(weatherRes.data || null);
        setSchedule(scheduleRes.data || {});

        const birthdayText = bdayRes.data?.hasBirthday ? bdayRes.data.text : "";
        setTodaysBirthdays(
          birthdayText
            ? birthdayText
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : []
        );
        setIncludesWeekendPreview(Boolean(bdayRes.data?.includesWeekendPreview));
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
    const pollTimer = setInterval(fetchData, 60000);

    socket.on("settingsChanged", (data) => setSettings((prev) => ({ ...prev, ...data })));
    socket.on("scheduleChanged", (data) => setSchedule(data || {}));

    return () => {
      mounted = false;
      clearInterval(pollTimer);
      socket.off("settingsChanged");
      socket.off("scheduleChanged");
    };
  }, []);

  if (settings.isEmergency) {
    return <Emergency message={settings.emergencyMessage || "Acil durum bildirimi"} />;
  }

  const dayName = DAYS_TR[new Date().getDay()];
  const isWeekend = dayName === "Cumartesi" || dayName === "Pazar";
  const todaysSchedule = pickByDay(schedule, dayName) || [];

  const rotationOffset = getDutyRotationOffset(settings.dutyRotationStartDate, new Date());
  const todaysDutyBase = pickByDay(settings.dutySchedule, dayName) || {};
  const todaysDuty = rotateDutyLocations(todaysDutyBase, rotationOffset);
  const dutyList = DUTY_LOCATIONS.map((location) => [location, todaysDuty[location]])
    .filter(([, value]) => String(value || "").trim());

  return (
    <div className="h-screen w-screen bg-gray-100 p-4 flex flex-col gap-4 font-sans text-gray-800 overflow-hidden box-border">
      <div className="grid grid-cols-12 gap-4 h-20 shrink-0">
        <div className="col-span-7 bg-white rounded-2xl flex items-center px-6 border border-gray-200 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-40 bg-gradient-to-l from-emerald-50 to-transparent skew-x-12 opacity-50 group-hover:opacity-100 transition-opacity" />
          <img
            src="/logo.png"
            className="h-16 w-auto object-contain mr-6 relative z-10 drop-shadow-sm"
            onError={(event) => {
              event.target.style.display = "none";
            }}
            alt="logo"
          />
          <div className="relative z-10 flex flex-col justify-center h-full pt-1">
            <h1 className="text-3xl font-black text-emerald-800 tracking-tighter leading-none mb-0.5">
              {(settings.schoolName || "DİJİTAL PANO").toLocaleUpperCase("tr-TR")}
            </h1>
            <div className="flex items-center gap-2 opacity-70">
              <span className="h-[2px] w-6 bg-emerald-500 rounded-full" />
              <p className="text-[10px] font-bold text-emerald-600 tracking-[0.3em] uppercase">
                DİJİTAL PANO SİSTEMİ
              </p>
            </div>
          </div>
        </div>

        <div className="col-span-5 bg-white rounded-2xl flex items-center justify-between px-6 border border-gray-200 shadow-sm">
          {weather && weather.temp !== "--" ? (
            <>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-400 tracking-wider">
                  {(settings.weatherCity || "").toLocaleUpperCase("tr-TR")}
                </span>
                <span className="text-xl font-bold text-gray-800 leading-none">
                  {(weather.status || "").toLocaleUpperCase("tr-TR")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-4xl font-black text-emerald-600 tracking-tighter">
                  {weather.temp}°
                </span>
                <img src={weather.icon} className="w-12 h-12" alt="weather" />
              </div>
            </>
          ) : (
            <div className="text-gray-400 font-bold text-sm">Hava Durumu...</div>
          )}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        <div className="col-span-7 bg-black rounded-2xl overflow-hidden shadow-lg relative border border-gray-300 h-full">
          <Slider socket={socket} />
        </div>

        <div className="col-span-5 flex flex-col gap-4 h-full min-h-0">
          <div className="h-[25%] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden shrink-0">
            <InfoPanel bellConfig={settings.bellConfig} />
          </div>

          <div className="h-[25%] grid grid-cols-2 gap-4 shrink-0">
            <div className="bg-white rounded-2xl p-0 shadow-sm border border-gray-200 flex flex-col overflow-hidden relative">
              <div className="bg-emerald-600 text-white text-xs font-bold py-1.5 text-center tracking-wider shrink-0">
                {"N\u00d6BET\u00c7\u0130 \u00d6\u011eRETMENLER"}
              </div>
              <div className="flex-1 bg-white p-2 overflow-hidden flex flex-col">
                {isWeekend ? (
                  <div className="h-full flex items-center justify-center text-xs text-gray-500 font-bold">
                    Hafta sonu nöbetçi öğretmen yok.
                  </div>
                ) : dutyList.length > 0 ? (
                  <AutoScrollList
                    items={dutyList}
                    rowHeight={44}
                    speed={3000}
                    renderItem={([location, teacher], index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center bg-emerald-50/50 px-3 py-2 rounded mb-2 border-l-4 border-emerald-500 h-[36px]"
                      >
                        <span className="text-[10px] font-black text-gray-400 w-16">
                          {String(location).toLocaleUpperCase("tr-TR")}
                        </span>
                        <span className="text-base font-bold text-gray-800 truncate flex-1 text-right">
                          {teacher}
                        </span>
                      </div>
                    )}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">
                    Bugün nöbetçi öğretmen girilmedi.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl p-2 shadow-sm border border-pink-200 flex flex-col text-white relative overflow-hidden">
              <div className="text-[10px] font-bold text-center bg-white/20 rounded py-1 mb-1">
                {"DO\u011eUM G\u00dcN\u00dc KUTLAMA"}
              </div>
              {includesWeekendPreview && (
                <div className="text-[9px] text-center font-semibold bg-black/20 rounded py-1 mb-1">
                  Cuma: hafta sonu doğum günleri de listelenir
                </div>
              )}
              <div className="flex-1 flex items-center justify-center text-center p-1">
                {todaysBirthdays.length > 0 ? (
                  <div className="text-sm font-bold leading-snug drop-shadow-md">
                    {todaysBirthdays.slice(0, 6).map((birthday, index) => (
                      <div key={index}>{birthday}</div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs opacity-70 italic">Bugün doğum günü olan öğrenci yok</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden min-h-0">
            <div className="bg-gray-800 text-white px-3 py-1 flex justify-between items-center shrink-0 z-10 border-b border-gray-700">
              <span className="font-bold text-xs tracking-wider">DERS PROGRAMI</span>
              <span className="text-[10px] bg-gray-600 px-2 py-0.5 rounded text-gray-200">
                {dayName.toLocaleUpperCase("tr-TR")}
              </span>
            </div>
            <div className="grid grid-cols-[3rem_1fr] bg-emerald-50 border-b border-emerald-100 text-[9px] font-black text-emerald-800 tracking-wider shrink-0">
              <div className="py-1.5 text-center border-r border-emerald-200">SINIF</div>
              <div className="grid grid-cols-8">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="text-center py-1.5 border-r border-emerald-100 last:border-0"
                  >
                    {index + 1}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 bg-white overflow-hidden relative">
              {todaysSchedule.length > 0 ? (
                <AutoScrollList
                  items={todaysSchedule}
                  rowHeight={44}
                  speed={3000}
                  loopWhenFits
                  renderItem={(row, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[3rem_1fr] border-b border-gray-100 items-center box-border h-[44px]"
                    >
                      <div className="flex items-center justify-center h-full bg-gray-50 text-gray-900 font-bold text-sm border-r border-gray-200">
                        {row.className}
                      </div>
                      <div className="grid grid-cols-8 h-full">
                        {Array.from({ length: 8 }).map((_, lessonIndex) => (
                          <div
                            key={lessonIndex}
                            className="flex items-center justify-center border-r border-gray-100 last:border-0 p-0.5"
                          >
                            {row.lessons?.[lessonIndex] ? (
                              <span className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-800 rounded-sm text-[10px] font-bold truncate">
                                {row.lessons[lessonIndex]}
                              </span>
                            ) : (
                              <span className="text-gray-200 text-[10px]">-</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
                  Program girilmedi.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="h-12 bg-emerald-800 rounded-xl flex items-center justify-between px-4 shadow-md text-white overflow-hidden shrink-0 relative">
        <div className="flex items-center flex-1 overflow-hidden mr-4">
          <div className="bg-emerald-600 px-3 py-1 rounded font-black text-xs mr-4 shrink-0 animate-pulse">
            DUYURULAR
          </div>
          <Ticker
            text={
              settings.marqueeText
                ? settings.marqueeText.replace(/\n/g, "  +++  ")
                : "Hoş geldiniz..."
            }
          />
        </div>
        <div className="shrink-0 flex items-center gap-2 pl-4 border-l border-emerald-600/50">
          <div className="text-[10px] font-medium text-emerald-200 opacity-80 flex flex-col items-end leading-tight">
            <span>Software by</span>
            <span className="font-mono font-bold text-sm text-white tracking-tighter">
              rob1n<span className="text-emerald-400">.dev</span>
            </span>
          </div>
          <FaCode className="text-emerald-400 text-lg opacity-80" />
        </div>
      </div>
    </div>
  );
};

export default Display;




