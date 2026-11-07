import {NextResponse} from "next/server";

export function isAuthForm(request: Request) {
  return /^application\/x-www-form-urlencoded(?:;|$)/i.test(request.headers.get("content-type") ?? "");
}

export async function readAuthPayload(request: Request) {
  if (!isAuthForm(request)) return request.json().catch(() => null);
  const data = await request.formData().catch(() => null);
  return data ? Object.fromEntries(data) : null;
}

export function authRedirect(path: string) {
  return new NextResponse(null,{status:303,headers:{Location:path,"Cache-Control":"no-store"}});
}
