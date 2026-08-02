#!/usr/bin/env node

const baseUrl = process.env.AI_BASE_URL ?? "http://localhost:3010";

async function requestJson(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  return { ok: response.ok, status: response.status, body };
}

function printResult(label, result) {
  if (result.ok) {
    console.log(`PASS ${label} (${result.status})`);
    return;
  }

  const errorMessage =
    result.body && typeof result.body === "object" && "error" in result.body
      ? String(result.body.error)
      : "Unknown error";

  console.log(`FAIL ${label} (${result.status}) - ${errorMessage}`);
}

async function run() {
  console.log(`AI validation target: ${baseUrl}`);

  const health = await requestJson("/api/ai/health", { method: "GET" });
  printResult("health", health);

  if (health.ok && health.body && typeof health.body === "object") {
    const provider = String(health.body.provider ?? "unknown");
    const textModel = String(health.body.textModel ?? "unknown");
    const imageModel = String(health.body.imageModel ?? "unknown");
    const keyConfigured = Boolean(health.body.keyConfigured);
    const keySource = String(health.body.keySource ?? "none");

    console.log(
      `Health details: provider=${provider} textModel=${textModel} imageModel=${imageModel} keyConfigured=${keyConfigured} keySource=${keySource}`
    );
  }

  const layout = await requestJson("/api/ai/suggest-layout", {
    method: "POST",
    body: JSON.stringify({
      purpose: "quick smoke test social post",
      canvasWidth: 1080,
      canvasHeight: 1080,
    }),
  });
  printResult("suggest-layout", layout);

  const image = await requestJson("/api/ai/generate-image", {
    method: "POST",
    body: JSON.stringify({
      prompt: "simple geometric icon",
      width: 512,
      height: 512,
    }),
  });
  printResult("generate-image", image);

  const background = await requestJson("/api/ai/generate-background", {
    method: "POST",
    body: JSON.stringify({
      prompt: "soft abstract gradient background",
      width: 1024,
      height: 576,
    }),
  });
  printResult("generate-background", background);

  const failed = [health, layout, image, background].some(result => !result.ok);

  if (failed) {
    process.exitCode = 1;
    console.log("AI validation failed. Check the Veronica AI API key, base URL, and model configuration, then retry.");
    return;
  }

  console.log("AI validation passed.");
}

run().catch(error => {
  console.error("AI validation crashed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
