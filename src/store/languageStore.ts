import { create } from "zustand";

interface LanguageState {
  lang: string;
  setLanguage: (lang: string) => void;
  initLanguage: () => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  lang: "en",
  setLanguage: (lang) => {
    set({ lang });
    if (typeof window !== "undefined") {
      localStorage.setItem("janseva_lang", lang);
      updateHtmlAttributes(lang);
    }
  },
  initLanguage: () => {
    if (typeof window !== "undefined") {
      let persisted = localStorage.getItem("janseva_lang") || "en";
      const isSupported = ["en", "hi"].includes(persisted);
      if (!isSupported) {
        persisted = "en";
        localStorage.setItem("janseva_lang", "en");
      }
      set({ lang: persisted });
      updateHtmlAttributes(persisted);
    }
  },

}));
function updateHtmlAttributes(lang: string) {
  if (typeof document !== "undefined") {
    const html = document.documentElement;
    html.setAttribute("lang", lang);
    const isRtl = ["ur"].includes(lang);
    html.setAttribute("dir", isRtl ? "rtl" : "ltr");
  }
}
