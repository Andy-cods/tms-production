"use client";

import { useEffect, useState } from "react";

export default function MyTasksBadge() {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    fetch("/api/my-tasks/count", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setCount(typeof data?.count === "number" ? data.count : 0);
      })
      .catch(() => {
        if (!mounted) return;
        setCount(0);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (count === 0) return null;

  return (
    <span className="px-2 py-0.5 bg-accent-500 text-white text-xs font-medium rounded-full">
      {count}
    </span>
  );
}
