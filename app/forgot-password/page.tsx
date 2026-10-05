"use client";
import {Copy} from "../components/Locale";

import Link from "next/link";
import {FormEvent,useState} from "react";
export default function Forgot(){
  const [status,setStatus]=useState("");
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    const f=new FormData(e.currentTarget);
    await fetch("/api/auth/forgot-password",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:f.get("email")})});
    setStatus("Wenn das Konto existiert, wurde ein Link zum Zurücksetzen verschickt.");
  }
  return <main className="auth-shell">
    <Link className="brand" href="/login">BE <span>DIFFERENT</span></Link>
    <form className="auth-card" onSubmit={submit}>
      <span className="eyebrow"><Copy text={"KONTO WIEDERHERSTELLEN"}/></span><h1><Copy text={"Passwort vergessen?"}/></h1>
      <p><Copy text={"Wir senden einen einmaligen Link, sobald E Mail Versand konfiguriert ist."}/></p>
      <label><Copy text={"E Mail"}/><input name="email" type="email" required/></label>
      <button className="primary"><Copy text={"LINK SENDEN →"}/></button>
      {status&&<small><Copy text={status}/></small>}
      <small><Link href="/login"><Copy text={"Zurück zur Anmeldung"}/></Link></small>
    </form>
  </main>;
}
