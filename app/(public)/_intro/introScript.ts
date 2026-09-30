const SEEN_KEY = "avis-intro-vue";

/**
 * Runs before the page is painted (inline script in the root layout's <head>).
 * On the first visit to the home page, marks <html data-intro> so the opening
 * screen shows; never when the phone asks for reduced motion. Without
 * JavaScript, or when storage is blocked, there is no opening screen.
 */
export const INTRO_SCRIPT = `try{if(location.pathname==="/"&&!localStorage.getItem("${SEEN_KEY}")){
localStorage.setItem("${SEEN_KEY}","1");
if(!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.setAttribute("data-intro","")}}catch(e){}`;
