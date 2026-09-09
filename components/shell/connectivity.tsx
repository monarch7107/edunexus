"use client";

import { useEffect, useState } from "react";
import {
  activeQueueOwner,
  connectivityLabel,
  loadQueue,
  type Connectivity,
} from "@/lib/offline/queue";

export function ConnectivityBar() {
  const [state, setState] = useState<Connectivity>("online");
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const sync = () => {
      const online = navigator.onLine;
      const owner = activeQueueOwner();
      const q = owner
        ? loadQueue(owner).filter((i) => i.status === "pending" || i.status === "conflict" || i.status === "needs_attention")
        : [];
      setPending(q.length);
      if (!online) setState("offline");
      else if (q.some((i) => i.status === "conflict" || i.status === "failed" || i.status === "needs_attention"))
        setState("error");
      else setState("online");
    };
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const label = connectivityLabel(state, pending);
  return (
    <p
      className="hidden text-[10px] text-muted sm:block"
      role="status"
      aria-live="polite"
      data-connectivity={state}
    >
      {label}
    </p>
  );
}
