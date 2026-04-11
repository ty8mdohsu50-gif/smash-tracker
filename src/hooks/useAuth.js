import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useAuth() {
  const [user, setUser] = useState(undefined);
  const [skippedAuth, setSkippedAuth] = useState(
    () => localStorage.getItem("smash-skipped-auth") === "1",
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSkippedAuth(false);
    localStorage.removeItem("smash-skipped-auth");
  };

  const handleSkip = () => {
    window.scrollTo(0, 0);
    setSkippedAuth(true);
    localStorage.setItem("smash-skipped-auth", "1");
  };

  return { user, loading, skippedAuth, handleLogout, handleSkip };
}
