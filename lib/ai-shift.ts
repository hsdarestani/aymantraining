import {prisma} from './db';
import {aiPolicySchema,defaultAiPolicy,coachAvailable} from './ai-policy';
import {openAiHandoff} from './ai-handoff';
export async function handOffNightConversations(now=new Date()){
 const row=await prisma.systemSetting.findUnique({where:{key:'ai_policy'}}),policy=aiPolicySchema.safeParse(row?.value??{}).data??defaultAiPolicy;
 if(!policy.afterHoursOnly||!coachAvailable(policy,now))return 0;
 const latest=await prisma.aiMessage.findMany({where:{role:'assistant',coachReviewedAt:null,createdAt:{gte:new Date(now.getTime()-86400000)}},orderBy:{createdAt:'desc'},distinct:['userId'],take:500});let created=0;
 for(const message of latest){
  const source=(message.sourceContext as any)?.source;if(!['ai','rules'].includes(source))continue;
  const lastResolved=await prisma.aiHandoff.findFirst({where:{userId:message.userId,status:'RESOLVED',createdAt:{gte:message.createdAt}},select:{id:true}});if(lastResolved)continue;
  const request=await prisma.aiMessage.findFirst({where:{userId:message.userId,role:'user',createdAt:{lte:message.createdAt}},orderBy:{createdAt:'desc'},select:{content:true}});
  await openAiHandoff(message.userId,'SHIFT_HANDOVER',request?.content??message.content);created++;
 }
 return created;
}
