import nodemailer from "nodemailer";

let transporter:ReturnType<typeof nodemailer.createTransport>|null=null;

function smtpConfigured(){
  return Boolean(process.env.SMTP_HOST&&process.env.SMTP_PORT&&process.env.SMTP_USER&&process.env.SMTP_PASSWORD&&process.env.EMAIL_FROM);
}
function transport(){
  if(!smtpConfigured())return null;
  if(!transporter){
    const port=Number(process.env.SMTP_PORT||587);
    transporter=nodemailer.createTransport({
      host:process.env.SMTP_HOST!,
      port,
      secure:process.env.SMTP_SECURE==="true"||port===465,
      auth:{user:process.env.SMTP_USER!,pass:process.env.SMTP_PASSWORD!},
      tls:{minVersion:"TLSv1.2"}
    });
  }
  return transporter;
}
export async function sendEmail(to:string,subject:string,html:string){
  const tx=transport();
  if(!tx)return {configured:false,ok:false};
  try{
    const info=await tx.sendMail({from:process.env.EMAIL_FROM!,to,subject,html});
    return {configured:true,ok:Boolean(info.messageId)};
  }catch(error){
    console.error("SMTP send failed",error);
    return {configured:true,ok:false};
  }
}
export async function verifyEmailTransport(){
  const tx=transport();
  if(!tx)return {configured:false,ok:false};
  try{await tx.verify();return {configured:true,ok:true}}catch{return {configured:true,ok:false}}
}
