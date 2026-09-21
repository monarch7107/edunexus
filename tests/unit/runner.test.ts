import { describe, expect, it } from "vitest";
import { runCodeSafely } from "@/lib/workspace/runner";

describe("AIESES Secure Code Runner", () => {
  it("executes safe JavaScript code and captures stdout", async () => {
    const code = `
      const x = 10;
      const y = 20;
      console.log("Result:", x + y);
    `;
    const result = await runCodeSafely(code, "javascript");
    expect(result.status).toBe("success");
    expect(result.stdout).toContain("Result: 30");
    expect(result.isolation).toBe("client_isolated_sandbox");
  });

  it("safely catches runtime errors in JavaScript without throwing", async () => {
    const code = `
      nonExistentVariable.callMethod();
    `;
    const result = await runCodeSafely(code, "javascript");
    expect(result.status).toBe("error");
    expect(result.stderr).toContain("nonExistentVariable is not defined");
  });

  it("executes Python code in simulated client runner", async () => {
    const pyCode = `
      # Python test
      print("Hello AIESES")
      print(40 + 2)
    `;
    const result = await runCodeSafely(pyCode, "python");
    expect(result.status).toBe("success");
    expect(result.stdout).toContain("Hello AIESES");
    expect(result.stdout).toContain("42");
    expect(result.isolation).toBe("simulated_python_runner");
  });
});
