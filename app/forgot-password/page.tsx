"use client";
import Link from "next/link";
import {FormEvent,useState} from "react";
export default function Forgot(){
  const [status,setStatus]=useState("");
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    const f=new FormData(e.currentTarget);
    await fetch("/api/auth/forgot-password",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:f.get("email")})});
    setStatus("Wenn das Konto existiert, wurde ein Reset-Link verschickt.");
  }
  return <main className="auth-shell">
    <Link className="brand" href="/login">BE <span>DIFFERENT</span></Link>
    <form className="auth-card" onSubmit={submit}>
      <span className="eyebrow">ACCOUNT RECOVERY</span><h1>Passwort vergessen?</h1>
      <p>Wir senden einen einmaligen Link, sobald E-Mail Versand konfiguriert ist.</p>
      <label>E-Mail<input name="email" type="email" required/></label>
      <button className="primary">RESET LINK SENDEN →</button>
      {status&&<small>{status}</small>}
      <small><Link href="/login">Zurück zum Login</Link></small>
    </form>
  </main>;
}
