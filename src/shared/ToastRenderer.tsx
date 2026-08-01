import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";
import { useToastStore } from "../store/toastStore";

const iconMap = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  info: InformationCircleIcon,
};

/* ---------- tweak these to taste ---------- */
const GAP = 12; // vertical gap between cards
const SHIFT = 0.95; // scale multiplier per step
const FADE = 0.85; // opacity multiplier per step
/* ----------------------------------------- */

export default function ToastRenderer() {
  const { toasts, remove } = useToastStore();

  return (
    /* 1. absolute container so cards can overlap */
    <div className="fixed top-6 right-6 z-9999 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t, idx) => {
          const Icon = iconMap[t.type];

          /* 2. visual depth based on position in the stack */
          const distance = toasts.length - 1 - idx; // top card = 0
          const y = distance * GAP;
          const scale = Math.pow(SHIFT, distance);
          const opacity = Math.pow(FADE, distance);

          return (
            <motion.div
              key={t.id}
              layoutId={t.id} // keeps identity across re-sorts
              initial={{ opacity: 0, x: 100 }}
              animate={{
                opacity: 1,
                x: 0,
                y,
                scale,
                filter: `blur(${distance * 0.3}px)`,
              }}
              exit={{
                opacity: 0,
                x: 100,
                scale: 0.8,
                filter: "blur(4px)",
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
              }}
              className="absolute right-0 flex items-center gap-3 rounded-xl bg-primary/80 backdrop-blur-lg text-white shadow-lg px-4 py-3 min-w-[280px] pointer-events-auto"
              style={{ originY: 1 }} // keeps the stack anchored at the bottom
            >
              <Icon className="w-6 h-6 shrink-0" />
              <p className="text-sm font-medium">{t.message}</p>
              <button
                onClick={() => remove(t.id)}
                className="ml-auto text-gray-400 hover:text-white cursor-pointer"
              >
                ×
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
