"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnvironment } from "@/lib/env";

export function GoogleSignIn() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const configured = hasSupabaseEnvironment();

  async function signIn() {
    if (!configured) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/studio`;
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (authError) {
      setError(authError.message);
      setBusy(false);
    }
  }

  return (
    <div className="auth-actions">
      <button className="button button--gold" type="button" onClick={signIn} disabled={!configured || busy}>
        {busy ? "Menyambung…" : "Log masuk dengan Google"}
      </button>
      {!configured && <p className="form-error">Supabase belum dikonfigurasi.</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}
