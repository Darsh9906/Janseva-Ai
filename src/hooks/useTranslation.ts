"use client";

import { useCallback } from "react";
import { useLanguageStore } from "@/store/languageStore";
import { translations } from "@/translations";

export function useTranslation() {
  const lang = useLanguageStore((s) => s.lang);

  const t = useCallback((keyPath: string, variables?: Record<string, string | number>): any => {
    const keys = keyPath.split(".");
    
    let value = getNestedValue(translations[lang], keys);
    
    if (value === undefined) {
      value = getNestedValue(translations["en"], keys);
    }
    
    if (value === undefined) {
      return keyPath;
    }
    
    if (variables && typeof value === "string") {
      let result = value;
      Object.entries(variables).forEach(([k, v]) => {
        result = result.replace(new RegExp(`{${k}}`, "g"), String(v));
      });
      return result;
    }
    
    return value;
  }, [lang]);

  return { t, lang };
}

function getNestedValue(obj: any, keys: string[]): any {
  let current = obj;
  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  return current;
}
