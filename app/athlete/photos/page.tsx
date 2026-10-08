import Link from "next/link";
import {Copy} from "../../components/Locale";
import {requireUser} from "../../../lib/auth";
import {prisma} from "../../../lib/db";
import PhotoUploader from "./PhotoUploader";
export const dynamic="force-dynamic";

export default async function AthletePhotosPage(){
 const user=await requireUser();
 const items=await prisma.mediaAsset.findMany({where:{relatedUserId:user.id,kind:"PROGRESS_PHOTO"},orderBy:{createdAt:"desc"},take:24});
 return <main className="sub-shell">
  <header className="sub-top"><Link href="/athlete" className="brand">BE <span>DIFFERENT</span></Link></header>
  <section className="page-hero compact-hero"><div><span className="eyebrow"><Copy text="ATHLETENFOTOS"/></span><h1><Copy text="Dein Profil. Deine Bilder."/></h1><p><Copy text="Diese Bilder bleiben privat in deinem Account und können für deine Athlete Ansicht verwendet werden."/></p></div></section>
  <PhotoUploader/>
  <section className="panel" style={{marginTop:16}}>
   <span className="eyebrow"><Copy text="GALERIE"/></span>
   <div className="bd-private-photo-grid">
    {items.length?items.map(x=><img key={x.id} src={"/api/media/"+x.id} alt="" loading="lazy"/>):<p className="muted"><Copy text="Noch keine privaten Athlete Bilder hochgeladen."/></p>}
   </div>
  </section>
 </main>;
}
