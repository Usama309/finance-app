"use client";

import { motion, AnimatePresence } from "motion/react";

/** Animated wrapper for tab content. Fades + slides in. */
export function PageTransition({ id, children }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/** Staggered list — children animate in one by one. */
export function StaggerList({ children, className = "" }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.06 } },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Single item in a stagger list. */
export function StaggerItem({ children, className = "" }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Animated card — scales up slightly on appear. */
export function AnimatedCard({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.97, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/** Number counter animation. */
export function AnimatedNumber({ value, className = "" }) {
  return (
    <motion.span
      className={className}
      key={value}
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {value}
    </motion.span>
  );
}

/** Checkbox check animation wrapper. */
export function CheckPop({ checked, children }) {
  return (
    <motion.div
      animate={checked ? { scale: [1, 1.08, 1] } : {}}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
}

/** Floating action button with bounce entrance. */
export function AnimatedFAB({ children, onClick, className = "" }) {
  return (
    <motion.button
      className={className}
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.3 }}
      whileTap={{ scale: 0.85 }}
    >
      {children}
    </motion.button>
  );
}

/** Modal sheet with slide-up animation. */
export function ModalSheet({ show, onClose, children }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white dark:bg-slate-900 rounded-t-3xl w-full max-w-lg p-6 pb-10 max-h-[90vh] overflow-y-auto"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-4" />
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
