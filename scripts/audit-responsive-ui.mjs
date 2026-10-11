import {chromium} from "@playwright/test";

const site="https://bedifferent.smarbiz.sbs";
const email="admin@bedifferent.smarbiz.sbs";
const password=process.env.BD_ADMIN_PASSWORD||"";
if(password.length<8)throw new Error("Demo admin secret missing from CI");
const checks=[
"/admin","/admin/customers","/admin/plans","/admin/exercises",
"/admin/inbox","/admin/team","/admin/events","/admin/briefs",
"/admin/ai","/admin/kpi","/admin/settings","/admin/campaigns",
"/admin/subscriptions","/admin/norms","/admin/rules",
"/dashboard","/progress","/training","/tests","/lifestyle",
"/fuel","/report","/community","/athlete","/focus","/wearables","/coach","/ai"
];
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const failures=[];
try{
 for(const vp of [
  {width:360,height:800,isMobile:true,hasTouch:true},
  {width:390,height:844,isMobile:true,hasTouch:true},
  {width:1280,height:900,isMobile:false,hasTouch:false}
 ]){
  const ctx=await browser.newContext({viewport:{width:vp.width,height:vp.height},isMobile:vp.isMobile,hasTouch:vp.hasTouch,deviceScaleFactor:1});
  const page=await ctx.newPage();
  await page.goto(site+"/login",{waitUntil:"domcontentloaded",timeout:30000});
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"],form button').first().click();
  await page.waitForURL(/\/admin(?:[/?]|$)/,{timeout:30000});
  console.log("SIGNED_IN_VIEWPORT="+vp.width);
  for(const route of checks){
   try{
    const response=await page.goto(site+route,{waitUntil:"domcontentloaded",timeout:25000});
    if(!response||response.status()!==200){failures.push(vp.width+":"+route+":HTTP_"+response?.status());continue}
    await page.waitForTimeout(120);
    const info=await page.evaluate(()=>{
      const width=document.documentElement.clientWidth;
      const scroll=document.documentElement.scrollWidth;
      const visiblyBroken=[];
      for(const selector of [".admin-content .athlete-row>a.secondary",".admin-content .attention-action",".admin-content .customer-action"]){
        for(const a of document.querySelectorAll(selector)){
          const r=a.getBoundingClientRect(),style=getComputedStyle(a);
          if(style.display!=="none"&&r.width>0&&(r.width<84||r.height<39))
           visiblyBroken.push(selector+":too_small");
          if(style.display!=="none"&&r.width>0&&(r.left<-3||r.right>width+3))
           visiblyBroken.push(selector+":offscreen");
        }
      }
      for(const x of document.querySelectorAll(".customer-email")){
       const parent=x.closest(".body-stats>div"),r=x.getBoundingClientRect(),p=parent?.getBoundingClientRect();
       if(p&&r.width&&r.right>p.right+3)visiblyBroken.push("customer_email_overflow");
      }
      return {width,scroll,broken:visiblyBroken.slice(0,6)};
    });
    if(route==="/admin"){
      const demoButtons=await page.locator(".attention-row .attention-action").count();
      console.log("DEMO_ATTENTION_BUTTONS_VISIBLE",vp.width,demoButtons);
      if(demoButtons<1)failures.push(vp.width+":demo_attention_buttons_missing");
    }
    const overflow=info.scroll>info.width+10;
    console.log("MOBILE_LAYOUT",vp.width,route,"OVERFLOW",overflow,"ACTIONS_OK",info.broken.length===0);
    if(overflow||info.broken.length)failures.push(vp.width+":"+route+":"+(overflow?"horizontal_overflow":"broken_action_"+info.broken.join("|")));
   }catch(e){failures.push(vp.width+":"+route+":navigation_error_"+String(e).slice(0,80))}
  }
  // Check a real long demo email fits in its card, not just regular page HTML.
  await page.goto(site+"/admin/customers",{waitUntil:"domcontentloaded",timeout:25000});
  const first=page.locator("a.customer-action").first();
  if(await first.count()){
    await first.click();
    await page.waitForURL(/\/admin\/customers\/[^/?#]+/,{timeout:20000});
    await page.locator(".customer-email").waitFor({state:"visible",timeout:15000});
    await page.waitForTimeout(180);
    const geometry=await page.evaluate(()=>{
      const e=document.querySelector(".customer-email"),p=e?.parentElement;
      if(!e||!p)return {ok:false,reason:"missing element or card"};
      const er=e.getBoundingClientRect(),pr=p.getBoundingClientRect();
      return {ok:er.left>=pr.left-1&&er.right<=pr.right+1&&er.width>10,
        emailLeft:Math.round(er.left),emailRight:Math.round(er.right),
        cardLeft:Math.round(pr.left),cardRight:Math.round(pr.right),
        emailWidth:Math.round(er.width),cardWidth:Math.round(pr.width)};
    });
    console.log("CUSTOMER_EMAIL_GEOMETRY",vp.width,JSON.stringify(geometry));
    console.log("CUSTOMER_LONG_EMAIL_FITS",vp.width,geometry.ok);
    if(!geometry.ok)failures.push(vp.width+":customer_email_overflow");
  }else failures.push(vp.width+":missing_customer_detail_link");
  await ctx.close();
 }
 console.log("MOBILE_LAYOUT_TESTED_ROUTES="+checks.length);
 console.log("MOBILE_LAYOUT_PROBLEMS="+JSON.stringify(failures));
 if(failures.length)process.exitCode=1;
 else console.log("ALL_LAYOUT_CHECKS_PASS");
}finally{await browser.close()}
