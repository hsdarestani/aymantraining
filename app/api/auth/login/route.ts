import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../../lib/db";
import {createSession, verifyPassword, SESSION_COOKIE} from "../../../../lib/auth";
import {errorJson, isSameOrigin, safeIpHash} from "../../../../lib/http";
import {authRedirect, isAuthForm, readAuthPayload} from "../../../../lib/auth-form";

const schema = z.object({
  email:z.string().email().max(254).transform(v=>v.trim().toLowerCase()),
  password:z.string().min(1).max(128),
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return errorJson("Ungültige Anfrage.",403);
  const form = isAuthForm(request);
  const parsed = schema.safeParse(await readAuthPayload(request));
  const invalid = () => form ? authRedirect("/login?status=invalid") : errorJson("E-Mail oder Passwort ungültig.",401);
  if (!parsed.success) return invalid();

  const identifier = safeIpHash(request) + ":" + parsed.data.email;
  const windowStart = new Date();
  windowStart.setUTCMinutes(Math.floor(windowStart.getUTCMinutes()/15)*15,0,0);
  const key = {identifier,windowStart};
  try {
    const throttle = await prisma.authThrottle.findUnique({where:{identifier_windowStart:key}});
    if (throttle?.blockedUntil && throttle.blockedUntil > new Date()) {
      return form ? authRedirect("/login?status=wait") : errorJson("Zu viele Versuche. Bitte später erneut versuchen.",429);
    }

    const user = await prisma.user.findUnique({where:{email:parsed.data.email}});
    if (!user || !await verifyPassword(parsed.data.password,user.passwordHash)) {
      const attempts = (throttle?.attempts??0)+1;
      const blockedUntil = attempts>=5 ? new Date(Date.now()+15*60*1000) : null;
      await prisma.authThrottle.upsert({where:{identifier_windowStart:key},update:{attempts,blockedUntil},create:{...key,attempts,blockedUntil}});
      return invalid();
    }

    await prisma.authThrottle.deleteMany({where:{identifier}}).catch(()=>undefined);
    const {token,expiresAt} = await createSession(user.id);
    const mobile = request.headers.get("x-bd-client")==="mobile";
    const response = form ? authRedirect(user.role==="ATHLETE" ? "/dashboard" : "/admin") : NextResponse.json({
      ok:true,user:{id:user.id,name:user.name,role:user.role,tier:user.subscriptionTier,onboardingCompleted:user.onboardingCompleted},
      ...(mobile ? {sessionToken:token,expiresAt:expiresAt.toISOString()} : {}),
    },{headers:{"Cache-Control":"no-store"}});
    response.cookies.set(SESSION_COOKIE,token,{
      httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",expires:expiresAt,
    });
    return response;
  } catch {
    return form ? authRedirect("/login?status=unavailable") : errorJson("Verbindung fehlgeschlagen. Bitte versuche es erneut.",503);
  }
}
