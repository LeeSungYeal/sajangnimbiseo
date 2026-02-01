"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "./logo";
import { useEffect, useState } from "react";

export const IntroAnimation = ({ onComplete }: { onComplete: () => void }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 500); // Wait for exit animation
        }, 2500); // Total animation time
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-white"
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="scale-150 transform">
                        <Logo animated={true} />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
