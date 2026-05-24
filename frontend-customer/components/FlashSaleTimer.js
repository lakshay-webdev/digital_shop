import { useEffect, useState } from "react";

function TimeBox({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Main box */}
        <div className="w-16 h-16 md:w-20 md:h-20 bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center shadow-inner">
          <span className="text-2xl md:text-4xl font-bold text-white font-mono tabular-nums">
            {String(value).padStart(2, "0")}
          </span>
        </div>
        {/* Divider line in middle (classic flip-clock look) */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-black/20 pointer-events-none" />
      </div>
      <span className="mt-2 text-[11px] md:text-xs text-white/60 uppercase tracking-widest font-semibold">
        {label}
      </span>
    </div>
  );
}

function Colon() {
  return (
    <span className="text-2xl md:text-3xl font-bold text-white/50 mb-5 select-none">:</span>
  );
}

export default function FlashSaleTimer({ endTime }) {
  const [remaining, setRemaining] = useState(Math.max(endTime - Date.now(), 0));

  useEffect(() => {
    if (remaining === 0) return;
    const interval = setInterval(() => {
      const left = Math.max(endTime - Date.now(), 0);
      setRemaining(left);
      if (left === 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const hours   = Math.floor(remaining / 1000 / 60 / 60);
  const minutes = Math.floor((remaining / 1000 / 60) % 60);
  const seconds = Math.floor((remaining / 1000) % 60);
  const isEnded = remaining === 0;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#e94560] via-[#c0392b] to-[#922b21] px-6 py-8 md:px-12 md:py-10">

      {/* Background decorations */}
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-black/10 rounded-full pointer-events-none" />
      <div className="absolute top-3 right-6 text-white/5 text-9xl font-bold pointer-events-none select-none">⚡</div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">

        {/* Left: heading */}
        <div className="text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
            {/* Pulsing dot */}
            {!isEnded && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
              </span>
            )}
            <span className="text-white/80 text-xs uppercase tracking-widest font-semibold">
              {isEnded ? "Sale Ended" : "Live Now"}
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
            ⚡ Flash Sale
          </h2>
          <p className="text-white/70 text-sm mt-1">
            {isEnded
              ? "This sale has ended. Check back soon!"
              : "Hurry! Grab deals before time runs out."}
          </p>
        </div>

        {/* Right: Timer */}
        {isEnded ? (
          <div className="bg-white/10 border border-white/20 rounded-2xl px-8 py-5 text-center">
            <p className="text-white font-bold text-lg">⏰ Time's Up!</p>
            <p className="text-white/60 text-sm mt-1">Next sale coming soon</p>
          </div>
        ) : (
          <div className="flex items-end gap-2 md:gap-3">
            <TimeBox value={hours}   label="Hours" />
            <Colon />
            <TimeBox value={minutes} label="Mins" />
            <Colon />
            <TimeBox value={seconds} label="Secs" />
          </div>
        )}
      </div>

      {/* Urgency bar — fills as time runs out */}
      {!isEnded && (
        <div className="relative z-10 mt-6 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-1000"
            style={{ width: `${(remaining / (5 * 60 * 60 * 1000)) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}