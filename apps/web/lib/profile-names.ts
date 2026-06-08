import "server-only";

import {
  containsArabicScript,
  type ProfileNameSource,
} from "@/lib/profile-display-name";

export type LocalizedProfileNames = {
  full_name: string;
  full_name_ar: string;
  full_name_en: string;
};

export type { ProfileNameSource };

async function translateWithOpenAI(
  name: string,
  targetLang: "ar" | "en",
  apiKey: string,
): Promise<string | null> {
  const targetLabel = targetLang === "ar" ? "Arabic" : "English";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You translate personal names for a Saudi car service app. Return ONLY the translated name without quotes or explanation. Keep common international names recognizable.",
        },
        {
          role: "user",
          content: `Translate this person's name to ${targetLabel}: ${name}`,
        },
      ],
    }),
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = payload.choices?.[0]?.message?.content?.trim();
  return text || null;
}

async function translateWithMyMemory(
  name: string,
  targetLang: "ar" | "en",
): Promise<string | null> {
  const sourceLang = containsArabicScript(name) ? "ar" : "en";
  if (sourceLang === targetLang) return name;

  const langpair = `${sourceLang}|${targetLang}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(name)}&langpair=${langpair}`;
  const response = await fetch(url, { next: { revalidate: 0 } });
  if (!response.ok) return null;

  const payload = (await response.json()) as {
    responseData?: { translatedText?: string };
  };
  const translated = payload.responseData?.translatedText?.trim();
  if (!translated) return null;
  if (translated.toUpperCase() === name.toUpperCase()) return null;
  return translated;
}

export async function translatePersonName(
  name: string,
  targetLang: "ar" | "en",
): Promise<string> {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;

  const sourceIsArabic = containsArabicScript(trimmed);
  if (targetLang === "ar" && sourceIsArabic) return trimmed;
  if (targetLang === "en" && !sourceIsArabic) return trimmed;

  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  if (openAiKey) {
    try {
      const translated = await translateWithOpenAI(trimmed, targetLang, openAiKey);
      if (translated) return translated;
    } catch (error) {
      console.error("[translatePersonName] openai:", error);
    }
  }

  try {
    const translated = await translateWithMyMemory(trimmed, targetLang);
    if (translated) return translated;
  } catch (error) {
    console.error("[translatePersonName] mymemory:", error);
  }

  return trimmed;
}

export async function resolveProfileNamesFromFields(
  arInput: string,
  enInput: string,
): Promise<LocalizedProfileNames> {
  const full_name_ar = arInput.trim();
  const full_name_en = enInput.trim();

  if (full_name_ar && full_name_en) {
    return { full_name: full_name_ar, full_name_ar, full_name_en };
  }

  if (full_name_ar) {
    return {
      full_name: full_name_ar,
      full_name_ar,
      full_name_en: await translatePersonName(full_name_ar, "en"),
    };
  }

  if (full_name_en) {
    const translated_ar = await translatePersonName(full_name_en, "ar");
    return {
      full_name: translated_ar,
      full_name_ar: translated_ar,
      full_name_en,
    };
  }

  return { full_name: "", full_name_ar: "", full_name_en: "" };
}

export async function resolveLocalizedProfileNames(
  inputName: string,
): Promise<LocalizedProfileNames> {
  const input = inputName.trim();
  if (!input) {
    return { full_name: "", full_name_ar: "", full_name_en: "" };
  }

  if (containsArabicScript(input)) {
    const full_name_ar = input;
    const full_name_en = await translatePersonName(input, "en");
    return {
      full_name: full_name_ar,
      full_name_ar,
      full_name_en,
    };
  }

  const full_name_en = input;
  const full_name_ar = await translatePersonName(input, "ar");
  return {
    full_name: full_name_ar,
    full_name_ar,
    full_name_en,
  };
}
