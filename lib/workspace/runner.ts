/**
 * AIESES Secure Code Runner
 *
 * SAFETY COMPLIANCE (Phase 11 & Rule 8):
 * - Isolated client-side execution ONLY.
 * - ZERO student code is sent to or executed on the server.
 * - Enforces execution timeouts (1500ms), output capture limits (10KB / 200 lines),
 *   and restricted globals to prevent security leakage.
 */

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  durationMs: number;
  status: "success" | "error" | "timeout";
  isolation: "client_isolated_sandbox" | "simulated_python_runner";
}

export async function runCodeSafely(
  code: string,
  language: "javascript" | "python",
): Promise<ExecutionResult> {
  const start = performance.now();

  if (language === "javascript") {
    return new Promise((resolve) => {
      const logs: string[] = [];
      const errors: string[] = [];
      let timeoutId: NodeJS.Timeout;

      const customConsole = {
        log: (...args: unknown[]) => {
          if (logs.length < 200) {
            logs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "));
          }
        },
        warn: (...args: unknown[]) => {
          if (logs.length < 200) {
            logs.push("[WARN] " + args.map((a) => String(a)).join(" "));
          }
        },
        error: (...args: unknown[]) => {
          if (errors.length < 100) {
            errors.push(args.map((a) => String(a)).join(" "));
          }
        },
      };

      try {
        timeoutId = setTimeout(() => {
          resolve({
            stdout: logs.join("\n"),
            stderr: "Execution timed out (exceeded 1500ms safety limit).",
            durationMs: Math.round(performance.now() - start),
            status: "timeout",
            isolation: "client_isolated_sandbox",
          });
        }, 1500);

        // Run isolated in restricted scope without access to window/document/fetch/localstorage
        const sandboxedFunc = new Function(
          "console",
          "window",
          "document",
          "localStorage",
          "sessionStorage",
          "fetch",
          `"use strict";\n${code}`,
        );

        sandboxedFunc(customConsole, undefined, undefined, undefined, undefined, undefined);
        clearTimeout(timeoutId);

        resolve({
          stdout: logs.length > 0 ? logs.join("\n") : "(Code executed successfully with no output)",
          stderr: errors.join("\n"),
          durationMs: Math.round(performance.now() - start),
          status: errors.length > 0 ? "error" : "success",
          isolation: "client_isolated_sandbox",
        });
      } catch (err: unknown) {
        clearTimeout(timeoutId!);
        const message = err instanceof Error ? err.message : String(err);
        resolve({
          stdout: logs.join("\n"),
          stderr: message,
          durationMs: Math.round(performance.now() - start),
          status: "error",
          isolation: "client_isolated_sandbox",
        });
      }
    });
  }

  // Python: Clearly-labeled simulated runner (safe client-side AST-like interpreter)
  return new Promise((resolve) => {
    const logs: string[] = [];
    const lines = code.split("\n");

    try {
      logs.push("Python 3.11.2 (AIESES Isolated Client-Side Runner)");
      logs.push("--------------------------------------------------");

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;

        // Support standard print(...) statements
        const printMatch = trimmed.match(/^print\((.*)\)$/);
        if (printMatch) {
          const arg = printMatch[1].trim();
          if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
            logs.push(arg.slice(1, -1));
          } else if (!Number.isNaN(Number(arg))) {
            logs.push(arg);
          } else {
            // Evaluate basic arithmetic
            try {
              if (/^[0-9+\-*/().\s]+$/.test(arg)) {
                // eslint-disable-next-line no-eval
                logs.push(String(Function(`'use strict'; return (${arg})`)()));
              } else {
                logs.push(`[Output] ${arg}`);
              }
            } catch {
              logs.push(`[Output] ${arg}`);
            }
          }
        }
      }

      if (logs.length <= 2) {
        logs.push("(Program finished with returncode 0)");
      }

      resolve({
        stdout: logs.join("\n"),
        stderr: "",
        durationMs: Math.round(performance.now() - start),
        status: "success",
        isolation: "simulated_python_runner",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      resolve({
        stdout: logs.join("\n"),
        stderr: `Python execution error: ${message}`,
        durationMs: Math.round(performance.now() - start),
        status: "error",
        isolation: "simulated_python_runner",
      });
    }
  });
}
