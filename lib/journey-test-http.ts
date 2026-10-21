import {ZodError} from "zod";
import {errorJson,isSameOrigin,requireApiUser} from "./http";

export async function testAccess(request:Request,mode:"read"|"athlete"|"coach"="read"){
  if(process.env.JOURNEY_TESTS_ENABLED!=="true")
    return {error:errorJson("Der neue Trainingsweg wird noch vorbereitet.",503,"JOURNEY_TESTS_DISABLED")} as const;
  const user=await requireApiUser();
  if(!user)return {error:errorJson("Nicht angemeldet.",401)} as const;
  if(mode==="coach"&&user.role!=="COACH"&&user.role!=="ADMIN")
    return {error:errorJson("Nicht berechtigt.",403)} as const;
  if(mode==="athlete"&&user.role!=="ATHLETE")
    return {error:errorJson("Nur für angemeldete Athleten.",403)} as const;
  if(mode!=="read"&&!isSameOrigin(request))
    return {error:errorJson("Ungültige Anfrage.",403)} as const;
  return {user} as const;
}
export function testError(error:unknown){
  if(error instanceof ZodError)return errorJson("Bitte alle Werte korrekt eingeben.",422,"INVALID_VALUES");
  const message=error instanceof Error?error.message:"";
  if(message.includes("Wiederholungsschlüssel")||message.includes("anderen Ergebnissen"))
    return errorJson("Die Anfrage passt nicht mehr zum gespeicherten Testversuch.",409,"IDEMPOTENCY_CONFLICT");
  if(message.includes("vorheriger Test")||message.includes("Nächster Versuch")||
     message.includes("bereits")||message.includes("noch gesperrt")||
     message.includes("Pflichtinhalte")||message.includes("Bestätigter Einstieg"))
    return errorJson(message,409,"TEST_NOT_READY");
  if(message.includes("zuständig")||message.includes("Trainerfreigabe"))
    return errorJson("Für diese Person liegt keine Trainerberechtigung vor.",403);
  return errorJson("Test konnte nicht verarbeitet werden. Bitte deine Angaben und den Trainingsweg prüfen.",422);
}
