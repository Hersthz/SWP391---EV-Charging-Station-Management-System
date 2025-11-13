// src/debug/global-error-tap.ts
if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => {
    console.error("[WINDOW.ERROR]", e.message, e.error);
  });
  window.addEventListener("unhandledrejection", (e) => {
    console.error("[UNHANDLED REJECTION]", e.reason);
  });
}
