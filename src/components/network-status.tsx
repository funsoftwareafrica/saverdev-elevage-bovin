"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertTriangle, Check } from "@/lib/icons";
import { syncPending, countPending } from "@/lib/offline-db";
import { toast } from "sonner";

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== "undefined" ? navigator.onLine : true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await syncPending((done, total) => { toast.info(`Synchronisation... ${done}/${total}`, { id: "sync" }); });
      setPendingCount(0);
      if (result.synced > 0) { toast.success(`${result.synced} saisie(s) synchronisée(s)`, { id: "sync", description: "Vos données sont maintenant à jour sur le serveur" }); }
      if (result.failed > 0) { toast.error(`${result.failed} saisie(s) non synchronisée(s)`, { id: "sync-fail" }); }
    } catch { /* ignore */ }
    setSyncing(false);
  }, []);

  const refreshPendingCount = useCallback(() => { countPending().then((n) => setPendingCount(n)).catch(() => {}); }, []);

  useEffect(() => {
    if (isOnline && pendingCount > 0) { handleSync(); setTimeout(refreshPendingCount, 2000); }
  }, [isOnline, pendingCount, handleSync, refreshPendingCount]);

  useEffect(() => {
    const handleOnlineChange = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnlineChange);
    window.addEventListener("offline", handleOnlineChange);
    return () => { window.removeEventListener("online", handleOnlineChange); window.removeEventListener("offline", handleOnlineChange); };
  }, []);

  useEffect(() => { refreshPendingCount(); const interval = setInterval(refreshPendingCount, 5000); return () => clearInterval(interval); }, [refreshPendingCount]);

  return (
    <>
      <AnimatePresence>
        {!isOnline && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-xs">
              <HugeiconsIcon icon={AlertTriangle} size={14} />
              <span className="font-medium">Mode hors ligne — vos saisies sont enregistrées sur cet appareil{pendingCount > 0 && ` (${pendingCount} en attente)`}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {isOnline && pendingCount > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-4 right-4 z-50">
          <button onClick={handleSync} disabled={syncing} className="flex items-center gap-2 rounded-full bg-primary text-white px-4 py-2 text-xs font-medium shadow-lg hover:bg-primary/90 transition-colors">
            {syncing ? (<><motion.span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />Sync en cours...</>) : (<><HugeiconsIcon icon={Check} size={14} />{pendingCount} saisie{pendingCount > 1 ? "s" : ""} à synchroniser</>)}
          </button>
        </motion.div>
      )}
    </>
  );
}
