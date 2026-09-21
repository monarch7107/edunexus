import { NextResponse, type NextRequest } from "next/server";
import { askTutor, type TutorRequest, type TutorMode } from "@/lib/ai/tutor";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TutorRequest;
    if (!body || !body.topic) {
      return NextResponse.json(
        { error: "Missing required topic field." },
        { status: 400 },
      );
    }
    const mode: TutorMode = body.mode || "explain";
    const result = await askTutor({
      topic: body.topic,
      mode,
      question: body.question,
      context: body.context,
      language: body.language,
    });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
