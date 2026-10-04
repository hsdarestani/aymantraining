import type {ScoreSnapshot} from "@prisma/client";
import {levelForScore} from "./scoring";

export function scoreView(score:ScoreSnapshot|null,details:boolean){
  if(!score)return null;
  const level=levelForScore(score.total);
  return details?{...score,level}:{id:score.id,date:score.date,total:score.total,completeness:score.completeness,level};
}
