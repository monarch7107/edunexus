"use client";

import { useEffect, useState } from "react";
import {
  Code2,
  FileText,
  Play,
  Plus,
  Printer,
  Save,
  ShieldCheck,
  Terminal,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/components/providers/app-data";
import {
  listDocuments,
  saveDocument,
  deleteDocument,
  type WorkspaceDocument,
} from "@/lib/workspace/documents";
import { runCodeSafely, type ExecutionResult } from "@/lib/workspace/runner";

export default function WorkspacePage() {
  const { user, subjects } = useApp();
  const userId = user?.id || "demo-user";

  const [activeTab, setActiveTab] = useState<"docs" | "ide">("docs");

  // Document state
  const [docs, setDocs] = useState<WorkspaceDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [projectName, setProjectName] = useState("");
  const [content, setContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // IDE state
  const [codeLang, setCodeLang] = useState<"javascript" | "python">("javascript");
  const [code, setCode] = useState<string>(
    `// JavaScript Isolated Sandbox (Runs safely in browser)
function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

const numbers = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
const target = 23;
console.log("Array:", numbers);
console.log("Searching for:", target);
console.log("Found at index:", binarySearch(numbers, target));`,
  );
  const [running, setRunning] = useState(false);
  const [execResult, setExecResult] = useState<ExecutionResult | null>(null);

  useEffect(() => {
    const initialDocs = listDocuments(userId);
    setDocs(initialDocs);
    if (initialDocs.length > 0) {
      loadDoc(initialDocs[0]);
    }
  }, [userId]);

  function loadDoc(doc: WorkspaceDocument) {
    setSelectedDocId(doc.id);
    setTitle(doc.title);
    setProjectName(doc.projectName);
    setContent(doc.content);
    setSaveStatus(null);
  }

  function handleCreateNewDoc() {
    const newDoc: WorkspaceDocument = {
      id: `doc-${Date.now()}`,
      userId,
      title: "Untitled Study Project Note",
      content: "# New Project Notes\n\nStart documenting your project or study summary here...",
      projectName: "General Project",
      subjectId: subjects[0]?.id || null,
      language: "markdown",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveDocument(newDoc);
    const updated = listDocuments(userId);
    setDocs(updated);
    loadDoc(newDoc);
  }

  function handleSaveCurrentDoc() {
    if (!selectedDocId) return;
    const current = docs.find((d) => d.id === selectedDocId);
    const updatedDoc: WorkspaceDocument = {
      id: selectedDocId,
      userId,
      title: title.trim() || "Untitled Document",
      content,
      projectName: projectName.trim() || "General",
      subjectId: current?.subjectId || null,
      language: "markdown",
      createdAt: current?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveDocument(updatedDoc);
    setDocs(listDocuments(userId));
    setSaveStatus("Saved to workspace.");
    setTimeout(() => setSaveStatus(null), 3000);
  }

  function handleDeleteCurrentDoc() {
    if (!selectedDocId) return;
    deleteDocument(selectedDocId, userId);
    const remaining = listDocuments(userId);
    setDocs(remaining);
    if (remaining.length > 0) {
      loadDoc(remaining[0]);
    } else {
      setSelectedDocId("");
      setTitle("");
      setContent("");
      setProjectName("");
    }
  }

  function handlePrintOrPdf() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  async function handleRunCode() {
    setRunning(true);
    try {
      const res = await runCodeSafely(code, codeLang);
      setExecResult(res);
    } finally {
      setRunning(false);
    }
  }

  function handleSwitchLang(lang: "javascript" | "python") {
    setCodeLang(lang);
    if (lang === "python") {
      setCode(`# Python 3 Isolated Client-Side Runner
def calculate_fibonacci(n):
    sequence = [0, 1]
    for i in range(2, n):
        sequence.append(sequence[i-1] + sequence[i-2])
    return sequence

print("Fibonacci Sequence (First 10 Numbers):")
print(calculate_fibonacci(10))
print("Done!")
`);
    } else {
      setCode(`// JavaScript Isolated Sandbox (Runs safely in browser)
console.log("Calculus Derivative Approximation:");
const f = (x) => x * x + 3 * x;
const h = 0.0001;
const x = 5;
const derivative = (f(x + h) - f(x)) / h;
console.log("f(x) = x² + 3x at x =", x);
console.log("f'(" + x + ") ≈", derivative.toFixed(4));
`);
    }
    setExecResult(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Student Workspace"
        title="Creation Workspace & IDE"
        description="Write project documentation, take markdown study notes, export PDFs, and test code in a secure, isolated sandbox."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === "docs" ? "primary" : "outline"}
              size="sm"
              onClick={() => setActiveTab("docs")}
            >
              <FileText className="size-3.5 mr-1" /> Document Studio
            </Button>
            <Button
              variant={activeTab === "ide" ? "primary" : "outline"}
              size="sm"
              onClick={() => setActiveTab("ide")}
            >
              <Code2 className="size-3.5 mr-1" /> Coding Playground
            </Button>
          </div>
        }
      />

      {activeTab === "docs" ? (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Document Sidebar */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                My Documents ({docs.length})
              </span>
              <Button size="sm" variant="outline" onClick={handleCreateNewDoc}>
                <Plus className="size-3.5 mr-1" /> New
              </Button>
            </div>
            <div className="space-y-1.5">
              {docs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => loadDoc(doc)}
                  className={`w-full text-left rounded-lg p-3 text-xs transition-colors border ${
                    selectedDocId === doc.id
                      ? "border-brand-500 bg-brand-50 font-semibold text-brand-900"
                      : "border-line bg-surface text-ink hover:bg-slate-50"
                  }`}
                >
                  <p className="truncate font-medium">{doc.title}</p>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-muted">
                    <span>{doc.projectName || "General"}</span>
                    <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Document Editor Area */}
          <div className="flex flex-col gap-4">
            <Card>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                  <div className="flex-1 min-w-[200px] flex gap-3">
                    <Input
                      placeholder="Document title..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="font-semibold text-base"
                    />
                    <Input
                      placeholder="Project tag..."
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="max-w-[160px] text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {saveStatus && (
                      <span className="text-xs text-emerald-600 font-medium">
                        {saveStatus}
                      </span>
                    )}
                    <Button size="sm" onClick={handleSaveCurrentDoc}>
                      <Save className="size-3.5 mr-1" /> Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={handlePrintOrPdf}>
                      <Printer className="size-3.5 mr-1" /> Print / PDF
                    </Button>
                    {docs.length > 1 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={handleDeleteCurrentDoc}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2 min-h-[480px]">
                  {/* Editor */}
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
                      Markdown Source
                    </span>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write your study notes, assignment drafts, or project specs in Markdown..."
                      className="flex-1 w-full resize-none rounded-lg border border-line bg-canvas p-3 font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  {/* Live Formatted Preview */}
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
                      Live Document Preview
                    </span>
                    <div className="flex-1 overflow-y-auto rounded-lg border border-line bg-surface p-4 text-xs leading-relaxed">
                      <div className="prose prose-sm max-w-none space-y-2">
                        {content.split("\n\n").map((block, i) => {
                          if (block.startsWith("# ")) {
                            return (
                              <h1 key={i} className="text-lg font-bold border-b border-line pb-1 text-ink">
                                {block.replace("# ", "")}
                              </h1>
                            );
                          }
                          if (block.startsWith("## ")) {
                            return (
                              <h2 key={i} className="text-sm font-bold text-ink mt-3">
                                {block.replace("## ", "")}
                              </h2>
                            );
                          }
                          if (block.startsWith("### ")) {
                            return (
                              <h3 key={i} className="text-xs font-bold text-ink mt-2">
                                {block.replace("### ", "")}
                              </h3>
                            );
                          }
                          if (block.startsWith("- ") || block.startsWith("* ")) {
                            return (
                              <ul key={i} className="list-disc list-inside space-y-1 text-muted">
                                {block.split("\n").map((line, li) => (
                                  <li key={li}>{line.replace(/^[-*]\s*/, "")}</li>
                                ))}
                              </ul>
                            );
                          }
                          if (block.startsWith("```")) {
                            return (
                              <pre key={i} className="rounded bg-slate-900 text-slate-100 p-2.5 font-mono text-[11px] overflow-x-auto">
                                {block.replace(/```[a-z]*\n?/g, "")}
                              </pre>
                            );
                          }
                          return (
                            <p key={i} className="text-slate-700 leading-normal">
                              {block}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* IDE / Code Execution Section */
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader
              title="Secure Isolated Code Runner"
              description="Test algorithmic logic and assignments in an isolated client-side environment. Server-side code execution is strictly restricted for security."
              action={
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800">
                    <ShieldCheck className="size-3 mr-1 inline text-emerald-600" />
                    Isolated Sandbox
                  </Badge>
                  <Button
                    size="sm"
                    variant={codeLang === "javascript" ? "primary" : "outline"}
                    onClick={() => handleSwitchLang("javascript")}
                  >
                    JavaScript
                  </Button>
                  <Button
                    size="sm"
                    variant={codeLang === "python" ? "primary" : "outline"}
                    onClick={() => handleSwitchLang("python")}
                  >
                    Python (Simulated)
                  </Button>
                  <Button size="sm" onClick={handleRunCode} loading={running} loadingLabel="Running...">
                    <Play className="size-3.5 mr-1" /> Run Code
                  </Button>
                </div>
              }
            />
            <CardContent className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <span className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2 block">
                    Source Code ({codeLang.toUpperCase()})
                  </span>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-[360px] resize-none rounded-lg border border-line bg-slate-950 text-emerald-400 p-3.5 font-mono text-xs leading-relaxed focus:outline-none"
                    spellCheck={false}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
                      <Terminal className="size-3.5" /> Console Output
                    </span>
                    {execResult && (
                      <span className="text-[11px] text-muted">
                        Duration: {execResult.durationMs}ms
                      </span>
                    )}
                  </div>
                  <div className="h-[360px] overflow-y-auto rounded-lg border border-line bg-slate-900 text-slate-100 p-3.5 font-mono text-xs leading-relaxed">
                    {execResult ? (
                      <>
                        {execResult.stdout && (
                          <pre className="text-emerald-400 whitespace-pre-wrap">
                            {execResult.stdout}
                          </pre>
                        )}
                        {execResult.stderr && (
                          <pre className="text-red-400 mt-2 whitespace-pre-wrap">
                            {execResult.stderr}
                          </pre>
                        )}
                      </>
                    ) : (
                      <p className="text-slate-500 italic">
                        Click &quot;Run Code&quot; to execute and view stdout/stderr output in the sandbox.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
