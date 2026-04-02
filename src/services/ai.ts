declare global {
  interface Window {
    ai: any;
  }
}

const FALLBACK_ROASTS: Record<1 | 2 | 3, string[]> = {
  1: [
    "Hey... {domain} again? I believe in you. Maybe close it and try to focus?",
    "You deserve better than wasting time on {domain}. You got this.",
    "Still on {domain}? I'm not angry, just a little disappointed.",
    "The work won't do itself. {domain} can wait. You can do it!",
    "Just a gentle reminder: {domain} isn't your goal. Back to work, friend.",
    "I noticed you're on {domain}. Your future self will thank you for closing it.",
    "One small step: close {domain}. One giant leap for your productivity.",
    "You opened {domain} for a second, right? Time to refocus. You've got this.",
  ],
  2: [
    "Congratulations, idiot! 5 more minutes on {domain} and you win the failure of the year award.",
    "Your boss should fire you right now for being on {domain}. The duck would approve.",
    "While you waste oxygen on {domain}, a 5-year-old child codes better than you.",
    "Quack! Get off {domain} or I'll peck your keyboard until it breaks.",
    "Your career is slowly dying because of {domain} and it's exclusively your fault.",
    "You are pathetic. {domain} won't give you a future, but unemployment will.",
    "Look at you... procrastinating on {domain} again. What a shame for your species.",
    "Working is good, right? Slacker. Close {domain} now.",
  ],
  3: [
    "WHAT IS WRONG WITH YOU?! {domain}?! AGAIN?! You are an absolute disgrace to productivity!",
    "Your ancestors survived wars and famine so you could sit here on {domain} like a useless lump. SHAMEFUL.",
    "{domain}. Really. You should be legally banned from having a job.",
    "Every second on {domain} is a nail in the coffin of your already-pathetic career. CLOSE IT.",
    "I've seen houseplants with more ambition than you. GET OFF {domain} NOW.",
    "You will die having accomplished nothing because of sites like {domain}. That's your legacy. Congratulations.",
    "Even your imaginary friends are embarrassed by your {domain} addiction. GET. OUT.",
    "History will not remember you. {domain} will not save you. You are NOTHING without focus. MOVE.",
  ],
};

const AGGRESSIVENESS_PROMPT: Record<1 | 2 | 3, string> = {
  1: 'Generate a gentle, slightly passive-aggressive, disappointed nudge for someone procrastinating. Be encouraging but firm. No insults. Max 30 words. IN ENGLISH.',
  2: 'Generate an EXTREMELY AGGRESSIVE, humiliating roast for someone procrastinating. Use the page context to make it specific and personal. Have no mercy. Max 30 words. IN ENGLISH.',
  3: 'Generate a NUCLEAR, over-the-top, absolutely devastating roast for someone procrastinating. Make them feel existential dread. Use the page context. Go completely unhinged. Max 35 words. IN ENGLISH.',
};

export interface PageContext {
  hostname: string;
  title: string;
  path: string;
}

export const generateRoast = async (url: string, context?: PageContext, aggressiveness: 1 | 2 | 3 = 2): Promise<string> => {
  const hostname = context?.hostname ?? new URL(url).hostname;
  
  try {
    if (window.ai) {
      const contextDetails = context?.title
        ? `Site: ${hostname}\nPage title: "${context.title}"${context.path && context.path !== '/' ? `\nPage path: ${context.path}` : ''}`
        : `Site: ${hostname}`;

      const prompt = `${AGGRESSIVENESS_PROMPT[aggressiveness]}\n\nContext:\n${contextDetails}`;
      
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

  const roasts = FALLBACK_ROASTS[aggressiveness];
  return roasts[Math.floor(Math.random() * roasts.length)].replace('{domain}', hostname);
};
