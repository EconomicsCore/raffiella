"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Sparkles } from "lucide-react";

interface Winner {
  name: string;
  prize: string;
  position: number;
  isAnonymous?: boolean;
}

interface Props {
  winners: Winner[];
  onComplete?: () => void;
}

const SPIN_DURATION = 3000;

export default function DrawAnimation({ winners, onComplete }: Props) {
  const [phase, setPhase] = useState<"spinning" | "reveal" | "done">("spinning");
  const [revealed, setRevealed] = useState<number[]>([]);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("reveal"), SPIN_DURATION);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (phase !== "reveal") return;
    winners.forEach((_, i) => {
      setTimeout(() => {
        setRevealed((prev) => [...prev, i]);
        if (i === winners.length - 1) {
          setTimeout(() => {
            setPhase("done");
            onComplete?.();
          }, 1500);
        }
      }, i * 1200);
    });
  }, [phase, winners, onComplete]);

  const positionColors = ["from-amber-400 to-yellow-500", "from-gray-300 to-gray-400", "from-amber-600 to-orange-500"];
  const positionLabels = ["🥇 1st Prize", "🥈 2nd Prize", "🥉 3rd Prize"];

  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-900 p-8 text-white">
      <AnimatePresence mode="wait">
        {phase === "spinning" && (
          <motion.div
            key="spinning"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10"
            >
              <Trophy className="h-12 w-12 text-amber-400" />
            </motion.div>
            <div className="text-center">
              <h3 className="text-2xl font-bold">Drawing winners…</h3>
              <p className="mt-1 text-blue-200 text-sm">Random selection in progress</p>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-2 w-2 rounded-full bg-blue-300"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.3 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {(phase === "reveal" || phase === "done") && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full space-y-4"
          >
            <div className="flex items-center justify-center gap-2 text-center">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <h3 className="text-xl font-bold">Winners Announced!</h3>
              <Sparkles className="h-5 w-5 text-amber-400" />
            </div>

            {winners.map((winner, i) => (
              <AnimatePresence key={i}>
                {revealed.includes(i) && (
                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`rounded-xl bg-gradient-to-r ${positionColors[i] ?? "from-blue-500 to-blue-600"} p-4 shadow-lg`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                          {positionLabels[i] ?? `Prize ${i + 1}`}
                        </p>
                        <p className="mt-0.5 text-lg font-bold">
                          {winner.isAnonymous ? "Anonymous Winner 🎉" : `${winner.name} 🎉`}
                        </p>
                        <p className="text-sm opacity-90">{winner.prize}</p>
                      </div>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 400 }}
                        className="text-4xl"
                      >
                        {["🏆", "🥈", "🥉"][i] ?? "🎁"}
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
