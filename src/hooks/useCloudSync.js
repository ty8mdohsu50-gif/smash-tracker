import { useState, useEffect, useCallback, useRef } from "react";
import { load, save, cloudLoad, cloudSave, migrateLocalToCloud } from "../utils/storage";
import { useToast } from "../contexts/ToastContext";
import { useI18n } from "../i18n/index.jsx";
import { DEBOUNCE_LOCAL_MS, DEBOUNCE_CLOUD_MS } from "../constants/timings";

export function useCloudSync(user) {
  const [data, setData] = useState(() => load());
  const userRef = useRef(user);
  userRef.current = user;

  const toast = useToast();
  const { t } = useI18n();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const tRef = useRef(t);
  tRef.current = t;

  const localTimerRef = useRef(null);
  const cloudTimerRef = useRef(null);
  const pendingRef = useRef(null);
  const cloudErrorShownRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    const vp = document.querySelector('meta[name="viewport"]');
    if (vp) {
      vp.setAttribute("content", "width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no,viewport-fit=cover");
    }
    window.scrollTo(0, 0);

    let cancelled = false;
    const init = async () => {
      await migrateLocalToCloud(user.id);
      const cloud = await cloudLoad(user.id);
      if (cancelled) return;

      const local = load();

      try {
        const localStamp = local?._updatedAt || 0;
        const cloudStamp = cloud?._updatedAt || 0;

        // Prefer whichever side was edited most recently. When neither
        // carries a timestamp (legacy data) fall back to match-count so
        // we don't strand earlier users.
        if (!cloud) {
          setData(local);
          if (localStamp) cloudSave(user.id, local);
        } else if (!localStamp && !cloudStamp) {
          const winner = (cloud.matches?.length || 0) >= (local.matches?.length || 0) ? cloud : local;
          setData(winner);
          if (winner === cloud) save(winner);
          else cloudSave(user.id, winner);
        } else if (cloudStamp > localStamp) {
          setData(cloud);
          save(cloud);
        } else if (localStamp > cloudStamp) {
          setData(local);
          cloudSave(user.id, local);
        } else {
          setData(cloud);
          save(cloud);
        }
      } catch {
        toastRef.current.error(tRef.current("common.errors.saveLocal"));
      }
    };
    init();

    return () => { cancelled = true; };
  }, [user]);

  const flushLocal = useCallback(() => {
    if (!pendingRef.current) return;
    try {
      save(pendingRef.current);
    } catch {
      toastRef.current.error(tRef.current("common.errors.saveLocal"));
    }
  }, []);

  const flushCloud = useCallback(() => {
    if (!pendingRef.current || !userRef.current) return;
    cloudSave(userRef.current.id, pendingRef.current)
      .then((ok) => {
        if (!ok && !cloudErrorShownRef.current) {
          cloudErrorShownRef.current = true;
          toastRef.current.error(tRef.current("common.errors.saveCloud"));
        } else if (ok) {
          cloudErrorShownRef.current = false;
        }
      })
      .catch(() => {
        if (!cloudErrorShownRef.current) {
          cloudErrorShownRef.current = true;
          toastRef.current.error(tRef.current("common.errors.saveCloud"));
        }
      });
  }, []);

  const saveData = useCallback((d) => {
    // Stamp every save with a monotonic timestamp so the init flow can
    // pick the most recently edited side (local vs cloud) on next load
    // instead of guessing from match counts.
    const stamped = { ...d, _updatedAt: Date.now() };
    setData(stamped);
    pendingRef.current = stamped;

    if (localTimerRef.current) clearTimeout(localTimerRef.current);
    localTimerRef.current = setTimeout(flushLocal, DEBOUNCE_LOCAL_MS);

    if (userRef.current) {
      if (cloudTimerRef.current) clearTimeout(cloudTimerRef.current);
      cloudTimerRef.current = setTimeout(flushCloud, DEBOUNCE_CLOUD_MS);
    }
  }, [flushLocal, flushCloud]);

  useEffect(() => {
    const onUnload = () => {
      if (localTimerRef.current) {
        clearTimeout(localTimerRef.current);
        localTimerRef.current = null;
        flushLocal();
      }
      if (cloudTimerRef.current) {
        clearTimeout(cloudTimerRef.current);
        cloudTimerRef.current = null;
        flushCloud();
      }
    };
    // pagehide is the reliable signal on mobile Safari (and BFCache);
    // beforeunload is desktop-only in practice. Listen to both so a
    // pending debounce never strands user data on either platform.
    window.addEventListener("pagehide", onUnload);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("pagehide", onUnload);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [flushLocal, flushCloud]);

  useEffect(() => {
    return () => {
      if (localTimerRef.current) {
        clearTimeout(localTimerRef.current);
        flushLocal();
      }
      if (cloudTimerRef.current) {
        clearTimeout(cloudTimerRef.current);
        flushCloud();
      }
    };
  }, [flushLocal, flushCloud]);

  return { data, saveData };
}
