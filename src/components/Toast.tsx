import { motion, AnimatePresence } from "motion/react";
import { ToastMessage } from "../types";
import { AlertTriangle, CheckCircle, Info, X, XCircle } from "lucide-react";
import { useEffect } from "react";

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export default function ToastContainer({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-md w-full px-4 sm:px-0 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastItemProps {
  key?: string;
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  useEffect(() => {
    const duration = toast.duration || 6000;
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const config = {
    success: {
      bg: "bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/65 shadow-emerald-100/10 dark:shadow-none",
      text: "text-emerald-800 dark:text-emerald-400",
      subtext: "text-slate-600 dark:text-slate-300",
      icon: (
        <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-450" />
        </div>
      ),
    },
    error: {
      bg: "bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-900/65 shadow-rose-100/10 dark:shadow-none",
      text: "text-rose-800 dark:text-rose-400",
      subtext: "text-slate-600 dark:text-slate-300",
      icon: (
        <div className="p-1.5 bg-rose-50 dark:bg-rose-950/50 rounded-xl animate-pulse">
          <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-450" />
        </div>
      ),
    },
    warning: {
      bg: "bg-amber-50/95 dark:bg-slate-900 border-amber-300 dark:border-amber-900/80 shadow-amber-100/15 dark:shadow-none ring-2 ring-amber-500/20",
      text: "text-amber-900 dark:text-amber-400",
      subtext: "text-amber-800 dark:text-slate-305 font-semibold",
      icon: (
        <div className="p-1.5 bg-amber-100 dark:bg-amber-950/50 rounded-xl animate-bounce">
          <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-405" />
        </div>
      ),
    },
    info: {
      bg: "bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900/65 shadow-indigo-100/10 dark:shadow-none",
      text: "text-indigo-850 dark:text-indigo-400",
      subtext: "text-slate-600 dark:text-slate-300",
      icon: (
        <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl">
          <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-440" />
        </div>
      ),
    },
  }[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 25, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9, transition: { duration: 0.2 } }}
      className={`pointer-events-auto flex items-start gap-4 p-4 rounded-2xl border shadow-xl ${config.bg} backdrop-blur-md max-w-md w-full relative group overflow-hidden`}
    >
      <div className="shrink-0">{config.icon}</div>
      <div className="flex-1 min-w-0 pr-6">
        <h4 className={`text-xs font-black uppercase tracking-widest ${config.text}`}>
          {toast.title}
        </h4>
        <p className={`text-xs mt-1.5 leading-relaxed font-sans ${config.subtext}`}>
          {toast.message}
        </p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors absolute right-2 top-2 shrink-0 cursor-pointer"
        aria-label="Remover notificação"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800">
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: (toast.duration || 6000) / 1000, ease: "linear" }}
          className={`h-full ${
            toast.type === "success"
              ? "bg-emerald-500"
              : toast.type === "error"
              ? "bg-rose-500"
              : toast.type === "warning"
              ? "bg-amber-500"
              : "bg-indigo-500"
          }`}
        />
      </div>
    </motion.div>
  );
}
