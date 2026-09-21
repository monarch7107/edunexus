/**
 * Workspace Document Store
 * Manages student markdown documents, project notes, and code snippets.
 */

export interface WorkspaceDocument {
  id: string;
  userId: string;
  title: string;
  content: string;
  projectName: string;
  subjectId: string | null;
  language?: "markdown" | "javascript" | "python";
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY_PREFIX = "aieses_workspace_docs_";

export function listDocuments(userId: string = "default"): WorkspaceDocument[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    if (!raw) return getDefaultDocuments(userId);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return getDefaultDocuments(userId);
  }
}

export function saveDocument(doc: WorkspaceDocument): void {
  if (typeof window === "undefined") return;
  try {
    const docs = listDocuments(doc.userId);
    const index = docs.findIndex((d) => d.id === doc.id);
    if (index >= 0) {
      docs[index] = { ...doc, updatedAt: new Date().toISOString() };
    } else {
      docs.unshift({ ...doc, updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${doc.userId}`, JSON.stringify(docs));
  } catch (err) {
    console.error("Failed to save workspace document:", err);
  }
}

export function deleteDocument(docId: string, userId: string = "default"): void {
  if (typeof window === "undefined") return;
  try {
    const docs = listDocuments(userId).filter((d) => d.id !== docId);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(docs));
  } catch (err) {
    console.error("Failed to delete workspace document:", err);
  }
}

function getDefaultDocuments(userId: string): WorkspaceDocument[] {
  return [
    {
      id: "doc-sample-1",
      userId,
      title: "SIH 2026 Project Notes — AIESES Architecture",
      content: `# AIESES: AI-Enabled Integrated Smart Education System
**SIH 2026 · Problem Statement 26207 · Team Vision Forge**

## Key Capabilities
1. **Core Learning**: Subjects, tasks, deadlines, and smart study sessions.
2. **EduAdapt**: Rule-based weak area detection and personalized study roadmaps.
3. **AI Tutor**: Six pedagogical modes with transparent deterministic fallback.
4. **Government Content**: DIKSHA NCERT curriculum explorer with official attribution.
5. **Creation Workspace**: Full markdown document editor and secure isolated code runner.

## Next Steps
- [x] Complete SIH 2026 Rebranding to AIESES
- [x] Integrate DIKSHA curriculum adapter
- [x] Test student and teacher workflows
`,
      projectName: "SIH 2026",
      subjectId: null,
      language: "markdown",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "doc-sample-2",
      userId,
      title: "Binary Search Tree Algorithm Implementation",
      content: `# Binary Search Tree (BST) Notes

A binary search tree is a rooted binary tree data structure with the key property:
- Left subtree contains values strictly **less than** root.
- Right subtree contains values strictly **greater than** root.

### Time Complexities
| Operation | Average | Worst Case |
|---|---|---|
| Search | O(log n) | O(n) |
| Insertion | O(log n) | O(n) |
| Deletion | O(log n) | O(n) |
`,
      projectName: "Data Structures",
      subjectId: null,
      language: "markdown",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}
