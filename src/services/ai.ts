declare global {
  interface Window {
    ai: any;
  }
}

const FALLBACK_ROASTS = [
    "Congratulations, idiot! 5 more minutes on {domain} and you win the failure of the year award.",
    "Your boss should fire you right now for being on {domain}. The duck would approve.",
    "While you waste oxygen on {domain}, a 5-year-old child codes better than you.",
    "Quack! Get off {domain} or I'll peck your keyboard until it breaks.",
    "Your career is slowly dying because of {domain} and it's exclusively your fault.",
    "You are pathetic. {domain} won't give you a future, but unemployment will.",
    "Look at you... procrastinating on {domain} again. What a shame for your species.",
    "Working is good, right? Slacker. Close {domain} now."
];

export const generateRoast = async (url: string): Promise<string> => {
  const hostname = new URL(url).hostname;
  
  try {
    if (window.ai) {
      const prompt = `Generate an EXTREMELY AGRESSIVE, humiliating roast for someone slacking off on the site ${hostname}. Have no mercy. Use strong language if needed (no explicit swears, but very offensive). Max 25 words. IN ENGLISH.`;
      
      let session;
      if (window.ai.languageModel) {
        session = await window.ai.languageModel.create();
      } else if (window.ai.createTextSession) {
        session = await window.ai.createTextSession();
      }

      if (session) {
        return await session.prompt(prompt);
      }
    }
    console.log("[DuckTator] AI not available/compatible, using fallback.");
  } catch (e) {
    console.error("[DuckTator] AI generation failed", e);
  }

  return FALLBACK_ROASTS[Math.floor(Math.random() * FALLBACK_ROASTS.length)].replace('{domain}', hostname);
};
