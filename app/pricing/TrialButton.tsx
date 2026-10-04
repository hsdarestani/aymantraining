"use client";
import {useState} from "react";

export default function TrialButton(){
  const [status,setStatus]=useState("");
  function openApp(){
    setStatus("Öffne BE DIFFERENT und starte den 7 Tage Test im App Store oder Play Store.");
    window.location.href="bedifferent://membership";
  }
  return <div>
    <button className="primary" onClick={openApp}>7 TAGE PRO IN DER APP TESTEN →</button>
    {status&&<small className="muted" style={{display:"block",marginTop:10}}>{status}</small>}
  </div>;
}