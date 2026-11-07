import {readFile} from "node:fs/promises";
import {join} from "node:path";

export const dynamic = "force-dynamic";

export async function GET() {
  const worker = await readFile(join(process.cwd(), "pwa/worker.js"), "utf8");
  return new Response("const BD_RELEASE = " + JSON.stringify(process.env.BD_RELEASE) + ";\n" + worker, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
