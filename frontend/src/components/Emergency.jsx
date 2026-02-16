import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";

const Emergency = ({ message }) => (
  <div className="h-screen w-screen bg-red-700 flex flex-col items-center justify-center p-10 z-50 overflow-hidden relative">
    <div className="absolute inset-0 bg-red-900 animate-pulse opacity-60" />
    <div className="z-10 text-center text-white space-y-8">
      <FaExclamationTriangle className="text-9xl mx-auto mb-4 animate-bounce" />
      <h1 className="text-7xl font-black uppercase tracking-tight drop-shadow-lg">Acil Durum</h1>
      <p className="text-3xl font-bold bg-black/30 px-8 py-4 rounded-xl inline-block border-2 border-white/20">
        {message}
      </p>
    </div>
  </div>
);

export default Emergency;
