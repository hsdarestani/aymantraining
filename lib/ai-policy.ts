import {z} from "zod";
import {zonedParts} from "./timezone";
export const aiPolicySchema=z.object({enabled:z.boolean().default(true),afterHoursOnly:z.boolean().default(true),coachFrom:z.number().int().min(0).max(23).default(8),coachTo:z.number().int().min(1).max(24).default(18),timezone:z.string().refine(s=>{try{new Intl.DateTimeFormat('en',{timeZone:s});return true}catch{return false}}).default("Europe/Berlin"),tone:z.string().trim().max(600).default("Kurz, konkret, motivierend und respektvoll."),dailyLimit:z.number().int().min(1).max(100).default(30)}).refine(p=>p.coachFrom<p.coachTo,"Invalid coach hours");
export const defaultAiPolicy=aiPolicySchema.parse({});
export function coachAvailable(policy:z.infer<typeof aiPolicySchema>,now=new Date()){
 const p=zonedParts(now,policy.timezone);return !["Sat","Sun"].includes(p.weekday)&&p.hour>=policy.coachFrom&&p.hour<policy.coachTo;
}
export function handoffReason(message:string,explicit=false){
 if(explicit||/\b(trainer sprechen|menschlichen trainer|echten trainer|coach sprechen|human coach|talk to (my |a )?coach|speak to (my |a )?coach)\b/i.test(message))return "REQUESTED";
 if(/schmerz|\bpain\b|brustschmerz|chest pain|atemnot|shortness of breath|ohnmacht|fainting|diagnos|medikament|medication|verletzung|injur/i.test(message))return "HEALTH_CONCERN";
 if(/(änder|change|replace|anpass).{0,35}(trainingsplan|training plan|workout plan)|(trainingsplan|training plan|workout plan).{0,35}(änder|change|replace|anpass)/i.test(message))return "PLAN_CHANGE";
 return null;
}
export function extractAiText(data:any){return (data?.output||[]).flatMap((x:any)=>x.content||[]).filter((p:any)=>p.type==="output_text"&&typeof p.text==="string").map((p:any)=>p.text).join("\n").trim().slice(0,4000)}
export function safeAiAnswer(answer:string){return answer.length>0&&!/(your |my |the )?(training |workout )?plan (has been|is|was) (changed|updated|replaced)|dein.{0,20}plan (wurde|ist).{0,20}(geändert|angepasst)|ich (habe|werde).{0,35}(plan|training).{0,35}(geändert|ändern)|i (have |will ).{0,35}(changed|change|updated|update).{0,35}(plan|workout)/i.test(answer)}
