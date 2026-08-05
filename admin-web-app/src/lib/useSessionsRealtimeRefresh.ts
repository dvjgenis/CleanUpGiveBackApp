"use client";

/**
 * Subscribes to Supabase Realtime for `public.sessions` INSERT/UPDATE and
 * triggers a Next.js server-component refetch, so a session logged on mobile
 * (or approved/declined from another admin tab) appears without a manual
 * reload. Requires the `admin_read_all_sessions` RLS policy and
 * `supabase_realtime` publication membership added in
 * `admin/db/008_admin_sessions_realtime_read.sql` — without them the
 * subscription connects but silently receives no events.
 */
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function useSessionsRealtimeRefresh() {
  const router = useRouter();
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Debounce so a burst of checkpoint/finalize writes for one session
    // collapses into a single refetch instead of one per row change.
    function scheduleRefresh() {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => {
        router.refresh();
      }, 400);
    }

    const channel = supabase
      .channel("admin-sessions-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sessions" },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sessions" },
        scheduleRefresh,
      )
      .subscribe();

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      supabase.removeChannel(channel);
    };
  }, [router]);
}
