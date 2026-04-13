import { useState, useEffect, useCallback, useRef } from "react";
import { load, save, cloudLoad, cloudSave, migrateLocalToCloud } from "../utils/storage";

export function useCloudSync(user) {
  const [data, setData] = useState(() => load());
  const userRef = useRef(user);
  userRef.current = user;

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
      const localCount = local.matches?.length || 0;
      const cloudCount = cloud?.matches?.length || 0;

      if (cloudCount > localCount) {
        setData(cloud);
        save(cloud);
      } else if (localCount > cloudCount) {
        setData(local);
        cloudSave(user.id, local);
      } else if (cloud) {
        setData(cloud);
        save(cloud);
      }
    };
    init();

    return () => { cancelled = true; };
  }, [user]);

  const saveData = useCallback((d) => {
    setData(d);
    save(d);

    if (userRef.current) {
      cloudSave(userRef.current.id, d).catch(() => {
        // Network or Supabase failure — local save already persisted,
        // next saveData call will retry naturally.
      });
    }
  }, []);

  return { data, saveData };
}
