import {language,translate} from "./i18n/translate";
import {prisma} from "./db";
import {localMinutes} from "./timezone";

function minutes(value:string|null|undefined){
  if(!value)return null;
  const [h,m]=value.split(":").map(Number);
  return h*60+m;
}
function inQuietHours(current:number,from?:string|null,to?:string|null){
  const start=minutes(from??"22:00"),end=minutes(to??"07:00");
  if(start==null||end==null)return false;
  return start<=end?current>=start&&current<end:current>=start||current<end;
}
export async function queueNotification(input:{
  userId:string;category:string;title:string;body:string;
  data?:Record<string,string|number|boolean|null>;urgent?:boolean;sendAt?:Date;
}){
  const [pref,user]=await Promise.all([
    prisma.pushPreference.findUnique({where:{userId_category:{userId:input.userId,category:input.category}}}),
    prisma.user.findUnique({where:{id:input.userId},select:{timezone:true,locale:true}})
  ]);
  if(pref&&!pref.enabled)return null;
  const now=new Date();
  const target=input.sendAt??now;
  const timezone=user?.timezone||"Europe/Berlin";
  if(!input.urgent&&inQuietHours(localMinutes(target,timezone),pref?.quietFrom,pref?.quietTo))return null;

  const settings=await prisma.systemSetting.findUnique({where:{key:"notification_limits"}});
  const dailyMax=Math.max(1,Math.min(5,Number((settings?.value as {dailyMax?:number}|null)?.dailyMax??3)));
  const since=new Date(now.getTime()-24*60*60*1000);
  const count=await prisma.notification.count({where:{userId:input.userId,createdAt:{gte:since}}});
  if(!input.urgent&&count>=dailyMax)return null;

  return prisma.notification.create({data:{
    userId:input.userId,category:input.category,title:translate(input.title,language(user?.locale)),body:translate(input.body,language(user?.locale)),data:input.data,sendAt:target
  }});
}
