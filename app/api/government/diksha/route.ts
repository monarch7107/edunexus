import { NextResponse, type NextRequest } from "next/server";
import { dikshaAdapter } from "@/lib/government/diksha";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query") || undefined;
  const subject = searchParams.get("subject") || undefined;
  const gradeLevel = searchParams.get("grade") || undefined;
  const id = searchParams.get("id");

  if (id) {
    const resource = await dikshaAdapter.getResource(id);
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }
    const metadata = await dikshaAdapter.getMetadata(id);
    const attribution = await dikshaAdapter.getAttribution(id);
    return NextResponse.json({ resource, metadata, attribution });
  }

  const results = await dikshaAdapter.searchResources({
    query,
    subject,
    gradeLevel,
  });

  return NextResponse.json(results);
}
