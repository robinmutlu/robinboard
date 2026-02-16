import React from "react";

const Ticker = ({ text }) => {
  return (
    <div className="flex-1 overflow-hidden relative h-full flex items-center">
      <div className="animate-ticker whitespace-nowrap text-white text-xl font-medium">
        <span className="mr-32">{text}</span>
        <span className="mr-32">{text}</span>
      </div>

      <style>{`
        .animate-ticker {
          animation: ticker 30s linear infinite;
        }
        @keyframes ticker {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
};

export default Ticker;
