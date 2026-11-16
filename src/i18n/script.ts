/** Plain (server-safe) module: the storage key and the head script that applies lang/dir before paint. */
export const LOCALE_KEY = "ag-lang";
export const LOCALE_SCRIPT = `try{var l=localStorage.getItem("${LOCALE_KEY}");if(l==="es"||l==="ar"){document.documentElement.lang=l;if(l==="ar")document.documentElement.dir="rtl"}}catch(e){}`;
