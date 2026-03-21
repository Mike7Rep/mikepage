//components/motionSchriftzug.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";

export default function MotionSchriftzug({ text }: { text: string }) {
    const x = useMotionValue(0);
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const [w, setW] = useState(0);

    useEffect(() => {
        if (!wrapRef.current || !contentRef.current) return;

        const measure = () => {
            const width = contentRef.current!.getBoundingClientRect().width;
            setW(width);
        };

        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(contentRef.current);
        window.addEventListener("resize", measure);

        return () => {
            ro.disconnect();
            window.removeEventListener("resize", measure);
        };
    }, []);

    useEffect(() => {
        if (!w) return;

        const controls = animate(x, [-0, -w], {
            ease: "linear",
            duration: 120,
            repeat: Infinity,
            onRepeat: () => x.set(0),
        });

        return () => controls.stop();
    }, [w, x]);

    return (
        <div ref={wrapRef} className="w-screen overflow-hidden">
            <motion.div style={{ x }} className="flex whitespace-nowrap text-[15vh]">
                <div ref={contentRef} className="flex">
                    <span className="pr-10">{text}</span>
                    <span className="pr-10">{text}</span>
                    <span className="pr-10">{text}</span>
                    <span className="pr-10">{text}</span>
                </div>

                <div className="flex" aria-hidden="true">
                    <span className="pr-10">{text}</span>
                    <span className="pr-10">{text}</span>
                    <span className="pr-10">{text}</span>
                    <span className="pr-10">{text}</span>
                </div>
            </motion.div>
        </div>
    );
}