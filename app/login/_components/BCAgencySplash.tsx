"use client";

import { useState, useEffect } from "react";

export function BCAgencySplash() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showUnderline, setShowUnderline] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [visibleLetterCount, setVisibleLetterCount] = useState(0);
  const [glowIntensity, setGlowIntensity] = useState(0);

  const text = "BC AGENCY";
  const letters = text.split("");

  useEffect(() => {
    // Sequence animation:
    // 0-0.2s: Background appears
    // 0.2s: Start letter-by-letter animation
    // 0.8s: All letters visible, start glow pulse
    // 1.2s: Underline appears with slide
    // 1.5s: Particles appear
    // 2s: Full glow effect
    // 4s: Start exit animation
    // 5s: Completely hidden

    let glowInterval: NodeJS.Timeout | null = null;

    // Letter-by-letter reveal
    letters.forEach((_, index) => {
      setTimeout(() => {
        setVisibleLetterCount(index + 1);
      }, 200 + index * 80);
    });

    // Text container appears
    const textTimer = setTimeout(() => {
      setShowText(true);
    }, 200);

    // Glow pulse animation - start after all letters are visible
    const glowStartTimer = setTimeout(() => {
      setGlowIntensity(1);
      glowInterval = setInterval(() => {
        setGlowIntensity((prev) => (prev === 1 ? 0.7 : 1));
      }, 1500);
    }, 1000);

    const underlineTimer = setTimeout(() => {
      setShowUnderline(true);
    }, 1200);

    const particlesTimer = setTimeout(() => {
      setShowParticles(true);
    }, 1500);

    const fadeTimer = setTimeout(() => {
      setIsFading(true);
      if (glowInterval) {
        clearInterval(glowInterval);
      }
    }, 4000);

    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(underlineTimer);
      clearTimeout(particlesTimer);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
      clearTimeout(glowStartTimer);
      if (glowInterval) {
        clearInterval(glowInterval);
      }
    };
  }, []);

  if (!isVisible) return null;

  // Use default green theme instead of seasonal
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400 transition-opacity duration-700 ${
        isFading ? "opacity-0" : "opacity-100"
      }`}
      style={{
        pointerEvents: isFading ? "none" : "auto",
      }}
    >
      {/* Seasonal effects - DISABLED: Only colors, no floating icons */}

      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float transition-opacity duration-1000 ${
          showParticles ? "opacity-100" : "opacity-0"
        }`} />
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float transition-opacity duration-1000 ${
          showParticles ? "opacity-100" : "opacity-0"
        }`} style={{ animationDelay: '1s' }} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl animate-float transition-opacity duration-1000 ${
          showParticles ? "opacity-100" : "opacity-0"
        }`} style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Animated particles */}
      {showParticles && (
        <>
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/40 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </>
      )}

      {/* BC AGENCY Text with enhanced animation */}
      <div className="relative z-10 text-center">
        <div className="relative inline-block">
          {/* Multiple glow layers for depth */}
          <div
            className={`absolute inset-0 bg-white/30 blur-3xl rounded-full transition-all duration-1500 ${
              showText ? "opacity-100 scale-150" : "opacity-0 scale-50"
            }`}
            style={{
              filter: "blur(50px)",
              animation: showText ? "pulse-glow 2s ease-in-out infinite" : "none",
            }}
          />
          <div
            className={`absolute inset-0 bg-white/20 blur-2xl rounded-full transition-all duration-1500 ${
              showText ? "opacity-100 scale-125" : "opacity-0 scale-50"
            }`}
            style={{
              filter: "blur(30px)",
              animation: showText ? "pulse-glow 2s ease-in-out infinite 0.5s" : "none",
            }}
          />
          
          {/* Main text with letter-by-letter animation */}
          <h1
            className={`relative text-7xl md:text-9xl lg:text-[12rem] font-extrabold text-white mb-6 transition-all duration-1000 ${
              showText 
                ? "opacity-100 scale-100 translate-y-0" 
                : "opacity-0 scale-50 translate-y-10"
            } ${
              isFading ? "scale-75 opacity-0 blur-sm" : ""
            }`}
            style={{
              textShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 ${60 * glowIntensity}px rgba(255, 255, 255, ${0.3 * glowIntensity}), 0 0 ${100 * glowIntensity}px rgba(255, 255, 255, ${0.2 * glowIntensity})`,
              letterSpacing: "0.15em",
              fontFamily: "system-ui, -apple-system, sans-serif",
              transform: showText && !isFading ? "perspective(1000px) rotateX(0deg)" : "perspective(1000px) rotateX(90deg)",
              transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            {letters.map((letter, index) => (
              <span
                key={index}
                className={`inline-block transition-all duration-300 ${
                  index < visibleLetterCount
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 translate-y-10 scale-0"
                } ${
                  isFading ? "opacity-0 scale-75 blur-sm" : ""
                }`}
                style={{
                  animation: index < visibleLetterCount
                    ? `letter-bounce 0.6s ease-out ${index * 0.08}s both`
                    : "none",
                  transformOrigin: "center bottom",
                }}
              >
                {letter === " " ? "\u00A0" : letter}
              </span>
            ))}
          </h1>

          {/* Animated underline with slide and glow */}
          <div className="relative mt-4">
            <div
              className={`h-2 bg-gradient-to-r from-transparent via-white to-transparent mx-auto rounded-full transition-all duration-1200 ${
                showUnderline 
                  ? "w-64 opacity-100 scale-x-100" 
                  : "w-0 opacity-0 scale-x-0"
              } ${
                isFading ? "scale-x-0 opacity-0" : ""
              }`}
              style={{
                boxShadow: "0 4px 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 255, 255, 0.6)",
                transformOrigin: "center",
                animation: showUnderline && !isFading ? "underline-glow 2s ease-in-out infinite" : "none",
              }}
            />
            {/* Animated shine effect on underline */}
            <div
              className={`absolute inset-0 h-2 bg-white/80 blur-lg mx-auto rounded-full transition-all duration-1200 ${
                showUnderline ? "w-64 opacity-100" : "w-0 opacity-0"
              }`}
              style={{
                animation: showUnderline && !isFading ? "shine-slide 2s ease-in-out infinite" : "none",
              }}
            />
          </div>
        </div>
      </div>

      {/* Enhanced decorative elements */}
      <div className={`absolute top-10 left-10 w-24 h-24 border-2 border-white/40 rounded-full transition-all duration-1000 ${
        showParticles ? "opacity-100 scale-100 animate-pulse" : "opacity-0 scale-0"
      }`} style={{
        boxShadow: "0 0 20px rgba(255, 255, 255, 0.3)",
      }} />
      <div className={`absolute bottom-10 right-10 w-20 h-20 border-2 border-white/40 rounded-full transition-all duration-1000 ${
        showParticles ? "opacity-100 scale-100 animate-pulse" : "opacity-0 scale-0"
      }`} style={{
        animationDelay: '0.5s',
        boxShadow: "0 0 20px rgba(255, 255, 255, 0.3)",
      }} />
      <div className={`absolute top-10 right-10 w-16 h-16 border-2 border-white/30 rounded-full transition-all duration-1000 ${
        showParticles ? "opacity-100 scale-100 animate-pulse" : "opacity-0 scale-0"
      }`} style={{
        animationDelay: '1s',
        boxShadow: "0 0 15px rgba(255, 255, 255, 0.2)",
      }} />
      <div className={`absolute bottom-10 left-10 w-16 h-16 border-2 border-white/30 rounded-full transition-all duration-1000 ${
        showParticles ? "opacity-100 scale-100 animate-pulse" : "opacity-0 scale-0"
      }`} style={{
        animationDelay: '1.5s',
        boxShadow: "0 0 15px rgba(255, 255, 255, 0.2)",
      }} />

      {/* Radial gradient overlay for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.1)_100%)]" />
    </div>
  );
}

