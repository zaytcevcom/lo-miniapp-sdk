import type { Host } from "./types.js";
export function bindAppearance(
  host: Host | null,
  options: {
    colors?: { header: string; background: string };
    themeEvent?: string;
    backgroundVariable?: string;
  } = {},
): () => void {
  if (typeof window === "undefined") return () => {};
  const sdk = host?.sdk;
  const colors = options.colors;
  const themeEvent = options.themeEvent ?? "lo:theme";
  const update = () => {
    const preference = document.documentElement.dataset.preference;
    const dark =
      preference === "dark" ||
      (preference !== "light" &&
        (sdk?.colorScheme === "dark" ||
          (!sdk?.colorScheme &&
            matchMedia("(prefers-color-scheme: dark)").matches)));
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    // Use the same opaque color as the page, including the user's theme override.
    const background = getComputedStyle(document.documentElement)
      .getPropertyValue(options.backgroundVariable ?? "--page-background")
      .trim();
    if (/^#[0-9a-f]{6}$/i.test(background)) {
      try {
        sdk?.setHeaderColor?.(colors?.header ?? background);
        sdk?.setBackgroundColor?.(colors?.background ?? background);
      } catch {
        /* Older hosts may not support custom chrome colors. */
      }
    }
    document.documentElement.style.setProperty(
      "--host-top",
      `${Math.max(sdk?.safeAreaInset?.top ?? 0, sdk?.contentSafeAreaInset?.top ?? 0)}px`,
    );
    document.documentElement.style.setProperty(
      "--host-bottom",
      `${Math.max(sdk?.safeAreaInset?.bottom ?? 0, sdk?.contentSafeAreaInset?.bottom ?? 0)}px`,
    );
  };
  update();
  window.addEventListener(themeEvent, update);
  const events = [
    "themeChanged",
    "viewportChanged",
    "safeAreaChanged",
    "contentSafeAreaChanged",
  ];
  events.forEach((event) => sdk?.onEvent?.(event, update));
  const media = matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", update);
  try {
    sdk?.ready?.();
    sdk?.expand?.();
  } catch {
    /* Native UI is optional. */
  }
  return () => {
    window.removeEventListener(themeEvent, update);
    events.forEach((event) => sdk?.offEvent?.(event, update));
    media.removeEventListener("change", update);
  };
}
