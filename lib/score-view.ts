import type {ScoreSnapshot} from "@prisma/client";

// Keep the legacy `level` response key for older native clients, but it may
// contain only a confirmed Journey stage, never a threshold-based BD Score band.
export function scoreView(score:ScoreSnapshot|null,details:boolean,confirmedLevel:string|null=null){
  if(!score)return null;
  const level=confirmedLevel;
  return details?{...score,level}:{id:score.id,date:score.date,total:score.total,completeness:score.completeness,level};
}
