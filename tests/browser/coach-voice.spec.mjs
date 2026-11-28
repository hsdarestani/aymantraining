import {test,expect} from '@playwright/test';
import {PrismaClient} from '@prisma/client';
import bcrypt from 'bcryptjs';
const db=new PrismaClient();
test('recorded voice library authorization, language, audience, ranges and preference',async({request})=>{
 if(!process.env.DATABASE_URL?.includes('bedifferent_test'))throw Error('Isolated test database required');
 const stamp=Date.now(),password='IsolatedAudioAcceptance123!',passwordHash=await bcrypt.hash(password,4),users=[],items=[];
 async function member(role,sex){const u=await db.user.create({data:{email:('voice-'+role+'-'+sex+'-'+stamp+'@example.invalid').toLowerCase(),passwordHash,role,sex,onboardingCompleted:true}});users.push(u.id);const res=await request.post('/api/auth/login',{headers:{'x-bd-client':'mobile'},data:{email:u.email,password}});expect(res.status()).toBe(200);return {Authorization:'Bearer '+(await res.json()).sessionToken,'x-bd-client':'mobile'};}
 const route='/api/voice-guidance',pref='/api/voice-preference';
 const body=(audience,locale,active,id)=>({title:'Audio QA',category:'COOL_DOWN',audience,locale,active:String(active),...(id?{id}:{}),file:{name:'fixture.mp3',mimeType:'audio/mpeg',buffer:Buffer.from('ID3contract-test-fixture')}});
 let admin;
 try{
  admin=await member('ADMIN',null);const male=await member('ATHLETE','male'),female=await member('ATHLETE','female');
  expect((await (await request.get(pref,{headers:male})).json()).enabled).toBe(false);
  expect((await request.patch(pref,{headers:male,data:{enabled:true}})).status()).toBe(200);
  expect((await (await request.get(pref,{headers:male})).json()).enabled).toBe(true);
  expect((await (await request.get(pref,{headers:female})).json()).enabled).toBe(false);
  expect((await request.post(route,{headers:male,multipart:body('MALE','de',true)})).status()).toBe(403);
  const created=await request.post(route,{headers:admin,multipart:body('MALE','de',false)});expect(created.status()).toBe(201);const item=(await created.json()).item;items.push(item.id);
  expect((await request.get(route+'?id='+item.id,{headers:male})).status()).toBe(404);
  expect((await request.patch(route,{headers:admin,multipart:body('MALE','de',true,item.id)})).status()).toBe(200);
  for(const [headers,locale,expected] of [[male,'de',true],[male,'en',false],[female,'de',false]]){const list=await request.get(route+'?playback=1&locale='+locale,{headers});expect(list.status()).toBe(200);expect((await list.json()).items.some(x=>x.id===item.id)).toBe(expected)}
  const range=await request.get(route+'?id='+item.id,{headers:{...male,Range:'bytes=0-2'}});expect(range.status()).toBe(206);expect((await range.body()).toString()).toBe('ID3');
  expect((await request.delete(route+'?id='+item.id,{headers:male})).status()).toBe(403);
  expect((await request.delete(route+'?id='+item.id,{headers:admin})).status()).toBe(200);items.splice(items.indexOf(item.id),1);
  expect((await request.get(route+'?id='+item.id,{headers:male})).status()).toBe(404);
 } finally {
  if(admin)for(const id of items)await request.delete(route+'?id='+id,{headers:admin}).catch(()=>{});
  await db.systemSetting.deleteMany({where:{key:{in:users.map(x=>'voice_preference:'+x)}}});
  await db.authSession.deleteMany({where:{userId:{in:users}}});await db.user.deleteMany({where:{id:{in:users}}});await db.$disconnect();
 }
});
