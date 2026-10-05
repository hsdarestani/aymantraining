"use client";
import {Copy} from "../components/Locale";


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
      <span className="eyebrow"><Copy text={"ANDERS STARTEN"}/></span>
      <h1><Copy text={"Dein Athlet beginnt hier."}/></h1>
      <p><Copy text={"Du startest im kostenlosen Tarif. PRO kann später freigeschaltet werden."}/></p>

      <label>Name<input name="name" autoComplete="name" minLength={2} required /></label>
      <label><Copy text={"E Mail"}/><input name="email" type="email" autoComplete="email" required /></label>
      <label><Copy text={"Passwort"}/><input name="password" type="password" autoComplete="new-password" minLength={10} required /><small><Copy text={"Mindestens 10 Zeichen"}/></small></label>
      <label><Copy text={"Ziel"}/><select name="goal" defaultValue="Athletik"><option><Copy text={"Muskelaufbau"}/></option><option><Copy text={"Fettabbau"}/></option><option><Copy text={"Athletik"}/></option><option><Copy text={"Fußball"}/></option><option>Calisthenics</option><option><Copy text={"Gesundheit"}/></option></select></label>

      {error && <div className="form-error"><Copy text={error}/></div>}
      <button className="primary" disabled={busy}><Copy text={busy ? "BITTE WARTEN…" : "KONTO ERSTELLEN →"}/></button>
      <small><Copy text={"Schon dabei?"}/><Link href="/login"><Copy text={"Anmelden"}/></Link></small>
    </form>
  </main>;
}
