import { useEffect, useState } from "react";

const KEY = "agnivega:simulated_delay";

export function useSimulatedDelay(): [number | null, (val: number | null) => void] {
  const [delay, setDelay] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(KEY);
    return raw ? Number(raw) : null;
  });

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === KEY) {
        setDelay(e.newValue ? Number(e.newValue) : null);
      }
    }

    function onCustom() {
      const raw = localStorage.getItem(KEY);
      setDelay(raw ? Number(raw) : null);
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener("agnivega:delay", onCustom);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("agnivega:delay", onCustom);
    };
  }, []);

  const setGlobalDelay = (val: number | null) => {
    if (val === null) {
      localStorage.removeItem(KEY);
    } else {
      localStorage.setItem(KEY, String(val));
    }
    setDelay(val);
    window.dispatchEvent(new CustomEvent("agnivega:delay"));
  };

  return [delay, setGlobalDelay];
}
