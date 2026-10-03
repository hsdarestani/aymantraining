"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError("");

    const data = new FormData(event.currentTarget);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          password: data.get("password"),
          name: data.get("name"),
          goal: data.get("goal")
        }),
        signal: controller.signal
      });

      const text = await response.text();
      let json: { error?: string; ok?: boolean } = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        json = {};
      }

      if (!response.ok) {
        setError(json.error || "Registrierung fehlgeschlagen. Bitte versuche es erneut.");
        return;
      }

      window.location.href = "/onboarding";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Die Anfrage dauert zu lange. Bitte versuche es erneut.");
      } else {
        setError("Verbindung fehlgeschlagen. Bitte versuche es erneut.");
      }
    } finally {
      window.clearTimeout(timeout);
      setBusy(false);
    }
  }

  return <main className="auth-shell">
    <Link className="brand" href="/">BE <span>DIFFERENT</span></Link>
    <form className="auth-card" onSubmit={submit}>
      <span className="eyebrow">START DIFFERENT</span>
      <h1>Dein Athlete beginnt hier.</h1>
      <p>Du startest im FREE Plan. PRO kann später freigeschaltet werden.</p>

      <label>Name<input name="name" autoComplete="name" minLength={2} required /></label>
      <label>E Mail<input name="email" type="email" autoComplete="email" required /></label>
      <label>Passwort<input name="password" type="password" autoComplete="new-password" minLength={10} required /><small>Mindestens 10 Zeichen</small></label>
      <label>Ziel<select name="goal" defaultValue="Athletik"><option>Muskelaufbau</option><option>Fettabbau</option><option>Athletik</option><option>Fußball</option><option>Calisthenics</option><option>Gesundheit</option></select></label>

      {error && <div className="form-error">{error}</div>}
      <button className="primary" disabled={busy}>{busy ? "BITTE WARTEN…" : "KONTO ERSTELLEN →"}</button>
      <small>Schon dabei? <Link href="/login">Anmelden</Link></small>
    </form>
  </main>;
}
