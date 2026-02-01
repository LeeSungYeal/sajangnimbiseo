"use client";

import { motion, type Easing } from "framer-motion";

export const Logo = ({
    animated = false,
    className = "",
}: {
    animated?: boolean;
    className?: string;
}) => {
    // Easing for the main breathing animation
    const breathTransition = {
        duration: 3,
        repeat: Infinity,
        repeatDelay: 0.5,
        ease: "easeInOut" as Easing,
        times: [0, 0.5, 1]
    };

    // Even Blunter Star Path
    // Designed to have very rounded, soft tips
    const bigStarPath = `
        M 20 4
        C 22 14 26 18 36 20
        C 26 22 22 26 20 36
        C 18 26 14 22 4 20
        C 14 18 18 14 20 4
        Z
    `;

    // Small Star Path
    const smallStarPath = `
        M 34 5
        C 35 7 36 8 38 9
        C 36 10 35 11 34 13
        C 33 11 32 10 30 9
        C 32 8 33 7 34 5
        Z
    `;

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <svg
                width="44"
                height="44"
                viewBox="3 3 38 38"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    {/* Electric Blue Gradient */}
                    <linearGradient id="main-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#5548F9" /> {/* Electric Blue */}
                        <stop offset="100%" stopColor="#8075FF" /> {/* Slightly Lighter Electric Blue for depth */}
                    </linearGradient>

                    {/* Shine Gradient */}
                    <linearGradient id="shine-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="white" stopOpacity="0" />
                        <stop offset="50%" stopColor="white" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="white" stopOpacity="0" />
                    </linearGradient>

                    <mask id="big-star-mask">
                        <path d={bigStarPath} fill="white" />
                    </mask>
                </defs>

                {/* Main Big Star */}
                <motion.path
                    d={bigStarPath}
                    fill="url(#main-gradient)"
                    initial={{ scale: 1 }}
                    animate={animated ? { scale: [1, 0.85, 1] } : {}}
                    transition={breathTransition}
                    style={{ originX: "20px", originY: "20px" }}
                />

                {/* Shine Effect passing through Big Star */}
                <motion.rect
                    x="0" y="0" width="40" height="40"
                    fill="url(#shine-gradient)"
                    mask="url(#big-star-mask)"
                    initial={{ x: -40, opacity: 0 }}
                    animate={animated ? {
                        x: [-40, 40, 40], // Move across
                        opacity: [0, 1, 0]
                    } : {}}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatDelay: 0.5,
                        times: [0.3, 0.6, 1], // Shine during the middle of the 'shrink' phase
                        ease: "linear" as Easing
                    }}
                />

                {/* Small Star (Top Right) - Breaths together */}
                <motion.path
                    d={smallStarPath}
                    fill="url(#main-gradient)"
                    initial={{ scale: 1 }}
                    animate={animated ? { scale: [1, 0.85, 1] } : {}}
                    transition={breathTransition}
                    style={{ originX: "34px", originY: "9px" }}
                />

                {/* Surrounding Tiny Sparkles - Appear when stars are smallest (approx time 0.5) */}
                {/* Sparkle 1: Top Left */}
                <motion.circle cx="10" cy="10" r="1.5" fill="#5548F9"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={animated ? { scale: [0, 1.2, 0], opacity: [0, 1, 0] } : {}}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 0.5, times: [0.3, 0.5, 0.7] }}
                />
                {/* Sparkle 2: Bottom Right */}
                <motion.circle cx="30" cy="30" r="1.5" fill="#6A5DF9"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={animated ? { scale: [0, 1.2, 0], opacity: [0, 1, 0] } : {}}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 0.5, times: [0.35, 0.55, 0.75] }}
                />
                {/* Sparkle 3: Bottom Left */}
                <motion.circle cx="12" cy="28" r="1" fill="#8075FF"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={animated ? { scale: [0, 1.2, 0], opacity: [0, 1, 0] } : {}}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 0.5, times: [0.4, 0.6, 0.8] }}
                />

            </svg>
            <div className="flex flex-col">
                <motion.span
                    className="text-xl font-bold tracking-tight text-slate-900"
                    initial={animated ? { opacity: 0, x: -10 } : { opacity: 1, x: 0 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                >
                    사장님비서
                </motion.span>
            </div>
        </div>
    );
};
