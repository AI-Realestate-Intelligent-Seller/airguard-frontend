/*
 * Light / dark theme: a `dark` class on <html>. Kept out of the client toggle so the
 * server layout can inline THEME_SCRIPT as a plain string.
 */
export const THEME_STORAGE_KEY = "theme";

/** Runs before first paint: applies the saved choice, else the system setting. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;
