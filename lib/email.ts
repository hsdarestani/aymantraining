export async function sendEmail(to:string,subject:string,html:string){
  if(!process.env.RESEND_API_KEY||!process.env.EMAIL_FROM) return {configured:false,ok:false};
  const response=await fetch("https://api.resend.com/emails",{
    method:"POST",
    headers:{"authorization":`Bearer ${process.env.RESEND_API_KEY}`,"content-type":"application/json"},
    body:JSON.stringify({from:process.env.EMAIL_FROM,to:[to],subject,html})
  });
  return {configured:true,ok:response.ok};
}
