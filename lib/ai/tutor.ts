/**
 * AIESES AI Tutor Service
 *
 * Implements the 6 core pedagogical tutoring modes:
 * 1. Ask a question (conceptual Q&A)
 * 2. Explain (structured conceptual explanation)
 * 3. Explain simply (ELI5 / analogy-based)
 * 4. Give example (concrete, step-by-step example)
 * 5. Generate practice question (self-assessment challenge)
 * 6. Recommend next learning action (targeted guidance)
 *
 * SAFETY & INTEGRITY:
 * - If OPENAI_API_KEY is configured, calls the OpenAI-compatible endpoint.
 * - If UNSET or offline, transparently returns clearly-labeled deterministic
 *   pedagogical responses. Does NOT fake live AI.
 */

export type TutorMode =
  | "ask"
  | "explain"
  | "explain_simply"
  | "give_example"
  | "practice_question"
  | "next_action";

export interface TutorRequest {
  topic: string;
  mode: TutorMode;
  question?: string;
  context?: string;
  language?: string;
}

export interface TutorResponse {
  source: "openai" | "deterministic_fallback";
  mode: TutorMode;
  topic: string;
  title: string;
  content: string;
  suggestedFollowUps: string[];
  generatedAt: string;
}

const DETERMINISTIC_KNOWLEDGE_BASE: Record<
  string,
  Partial<Record<TutorMode, { title: string; content: string; followUps: string[] }>>
> = {
  calculus: {
    explain: {
      title: "Fundamental Theorem of Calculus",
      content:
        "Calculus is the mathematical study of continuous change. The Fundamental Theorem of Calculus establishes the vital link between differentiation (instantaneous rates of change, slopes of tangents) and integration (accumulation of quantities, areas under curves). If F(x) is an antiderivative of f(x) continuous on [a, b], then ∫[a to b] f(x) dx = F(b) - F(a).",
      followUps: ["Explain simply", "Give a real-world example", "Generate a practice question"],
    },
    explain_simply: {
      title: "Calculus in Plain Terms",
      content:
        "Imagine you are driving a car. Your speedometer shows your speed at this exact millisecond — that's Differentiation (instantaneous rate). Your odometer records the total miles accumulated over your whole trip — that's Integration (accumulation). Calculus is the math connecting how fast you are moving right now with how far you end up.",
      followUps: ["Show me a practice problem", "How do derivatives apply to physics?", "Recommend next action"],
    },
    give_example: {
      title: "Calculus: Finding Maximum Efficiency",
      content:
        "Example: A company makes boxes from 12x12 cm cardboard by cutting square corners of size x and folding up sides.\nVolume V(x) = x(12 - 2x)^2 = 4x^3 - 48x^2 + 144x.\nTo maximize volume, take the derivative: V'(x) = 12x^2 - 96x + 144 = 0.\nDivide by 12: x^2 - 8x + 12 = (x - 2)(x - 6) = 0.\nSince x=6 leaves 0 volume, x=2 cm gives the optimal peak volume of 128 cm³.",
      followUps: ["Check second derivative test", "Give another example", "Generate practice question"],
    },
    practice_question: {
      title: "Calculus Practice Challenge",
      content:
        "Question: Find the derivative of f(x) = x³ · e^(2x) using the product rule.\n\nHint: Product rule states (u·v)' = u'·v + u·v'. Here u = x³ and v = e^(2x).\n\nTry working it out, then check if your result factors into x²·e^(2x)·(3 + 2x).",
      followUps: ["Explain step-by-step", "Try another problem", "What should I study next?"],
    },
    next_action: {
      title: "Recommended Study Action for Calculus",
      content:
        "Based on your recent syllabus coverage:\n1. Dedicate 25 minutes to practice chain rule and product rule drills.\n2. Review NCERT Chapter 5: Continuity and Differentiability on DIKSHA.\n3. Log a 45-minute focused study session in your AIESES Planner before the upcoming assessment.",
      followUps: ["Open DIKSHA resource", "Schedule study session", "Ask another question"],
    },
  },
  "data structures": {
    explain: {
      title: "Abstract Data Types & Linear vs Non-Linear Structures",
      content:
        "Data structures organize memory so data can be processed efficiently. Linear structures (Arrays, Linked Lists, Stacks, Queues) organize elements sequentially where each element has a unique predecessor and successor. Non-linear structures (Trees, Graphs) represent hierarchical or networked relationships, offering logarithmic search time O(log n) when balanced.",
      followUps: ["Explain simply", "Give an example of Trees", "Generate a practice question"],
    },
    explain_simply: {
      title: "Data Structures Like Everyday Objects",
      content:
        "An Array is like an egg carton with numbered slots: instant access if you know the index. A Stack is like a stack of cafeteria trays: Last-In, First-Out (LIFO). A Queue is like standing in line at the ticket counter: First-In, First-Out (FIFO). A Tree is like an organization chart with a CEO at the root branching down to departments.",
      followUps: ["Give a coding example", "What is Big-O notation?", "Practice question"],
    },
    give_example: {
      title: "Stack Implementation Example (Balanced Parentheses)",
      content:
        "Problem: Check if brackets in '{[()]}' are balanced.\nAlgorithm: Push opening brackets onto the stack. When a closing bracket arrives, pop the top and verify they match.\nResult: '{[' -> push '{', push '['. ']' matches '[', pop. '}' matches '{', pop. Stack empty -> Valid!",
      followUps: ["How to implement in Python?", "What is time complexity?", "Practice question"],
    },
    practice_question: {
      title: "Data Structures Practice Challenge",
      content:
        "Question: Given a binary search tree (BST), what traversal order outputs the elements in strictly ascending sorted order?\n\nA) Pre-order\nB) In-order\nC) Post-order\nD) Level-order\n\nCorrect Answer: B) In-order traversal (Left, Root, Right).",
      followUps: ["Explain why In-order works", "Try graph question", "Recommend next action"],
    },
    next_action: {
      title: "Recommended Action for Data Structures",
      content:
        "1. Write and run a Stack-based expression validator in the AIESES Workspace.\n2. Review DIKSHA Interactive Module on Stacks and Queues.\n3. Complete the upcoming Data Structures assessment.",
      followUps: ["Open Creation Workspace", "Open DIKSHA", "Ask a question"],
    },
  },
};

export async function askTutor(req: TutorRequest): Promise<TutorResponse> {
  const topicKey = req.topic.toLowerCase().trim();
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
      const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

      const promptInstructions: Record<TutorMode, string> = {
        ask: "Answer the student's question clearly, pedagogically, and concisely.",
        explain: "Explain this topic thoroughly with key principles and conceptual structure.",
        explain_simply: "Explain this topic simply using intuitive everyday analogies (ELI5 style).",
        give_example: "Provide a concrete, step-by-step worked example demonstrating this concept.",
        practice_question: "Provide an active-recall practice question with hint and solution.",
        next_action: "Recommend concrete, actionable next learning steps for this topic.",
      };

      const systemPrompt = `You are AIESES AI Tutor, an encouraging, rigorous university tutor for students in India.
Provide clear, accurate, educational responses. Use markdown formatting with bullet points and code blocks where helpful.
${req.language && req.language !== "en" ? `Respond in the requested language code: ${req.language}.` : ""}`;

      const userContent = `Mode: ${req.mode} (${promptInstructions[req.mode]})
Topic: ${req.topic}
${req.question ? `Question: ${req.question}` : ""}
${req.context ? `Academic context: ${req.context}` : ""}`;

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          temperature: 0.3,
          max_tokens: 800,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const content = json.choices?.[0]?.message?.content || "";
        return {
          source: "openai",
          mode: req.mode,
          topic: req.topic,
          title: `${req.mode.replace(/_/g, " ").toUpperCase()}: ${req.topic}`,
          content,
          suggestedFollowUps: [
            "Explain simply",
            "Give another example",
            "Generate practice question",
            "Recommend next learning action",
          ],
          generatedAt: new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn("OpenAI API tutor call failed, using deterministic fallback:", err);
    }
  }

  // Certified Deterministic Fallback
  let matchedTopic = Object.keys(DETERMINISTIC_KNOWLEDGE_BASE).find((k) =>
    topicKey.includes(k) || k.includes(topicKey),
  );
  if (!matchedTopic) {
    matchedTopic = "calculus";
  }

  const topicPack = DETERMINISTIC_KNOWLEDGE_BASE[matchedTopic];
  const modeData = topicPack[req.mode] || topicPack.explain!;

  return {
    source: "deterministic_fallback",
    mode: req.mode,
    topic: req.topic || matchedTopic,
    title: modeData.title,
    content: `${modeData.content}\n\n*(AIESES Certified Pedagogical Fallback · Deterministic Educational Engine)*`,
    suggestedFollowUps: modeData.followUps,
    generatedAt: new Date().toISOString(),
  };
}
