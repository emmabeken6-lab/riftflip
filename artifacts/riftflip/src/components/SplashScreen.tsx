import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 800);
    const t2 = setTimeout(() => setPhase("out"), 2200);
    const t3 = setTimeout(() => onDone(), 2900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === "out" ? 0 : 1 }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "#0b0c10" }}
    >
      {/* Glow halo behind text */}
      <div
        style={{
          position: "absolute",
          width: 340,
          height: 120,
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(160,200,255,0.18) 0%, rgba(100,160,255,0.08) 50%, transparent 80%)",
          filter: "blur(18px)",
          pointerEvents: "none",
        }}
      />

      {/* Logo text */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: phase === "out" ? 0 : 1, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative flex items-baseline gap-0 select-none"
        style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
      >
        <span
          style={{
            fontSize: 48,
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-1px",
            textShadow: "0 0 40px rgba(200,220,255,0.5)",
          }}
        >
          Rift
        </span>
        <span
          style={{
            fontSize: 48,
            fontWeight: 400,
            color: "#7c9abc",
            letterSpacing: "-1px",
          }}
        >
          flip
        </span>
      </motion.div>
    </motion.div>
  );
}
