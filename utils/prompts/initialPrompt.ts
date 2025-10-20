export function generateInitialPrompt(selections: {
  race: string;
  class: string;
  story: string;
}) {
  return `
You are a D&D game master. The player's character is a ${selections.race} ${selections.class},
and the story is set in ${selections.story}. Begin the adventure with a short, vivid narrative (1-2 sentences).
`;
}
