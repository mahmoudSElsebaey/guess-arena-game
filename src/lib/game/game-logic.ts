import type { Character } from "../../data/characters";

export const questionTests: Record<string, (character: Character) => boolean> = {
  hat: character => character.hasHat,
  glasses: character => character.hasGlasses,
  beard: character => character.hasBeard,
  male: character => character.gender === "male",
  female: character => character.gender === "female",
  shortHair: character => character.hairLength === "short",
  longHair: character => character.hairLength === "long",
  bald: character => character.hairLength === "none",
  blackHair: character => character.hairColor === "black",
  brownHair: character => character.hairColor === "brown",
  blondeHair: character => character.hairColor === "blonde",
  redHair: character => character.hairColor === "red",
  grayHair: character => character.hairColor === "gray",
  lightSkin: character => character.skin === "light",
  mediumSkin: character => character.skin === "medium",
  darkSkin: character => character.skin === "dark",
  blueEyes: character => character.eyeColor === "blue",
  greenEyes: character => character.eyeColor === "green",
  brownEyes: character => character.eyeColor === "brown"
};

export function getEliminatedCharacterIds(
  characters: Character[],
  alreadyEliminated: Set<string>,
  matchesAnswer: (character: Character) => boolean,
  answer: boolean
): string[] {
  return characters
    .filter(character => !alreadyEliminated.has(character.id) && matchesAnswer(character) !== answer)
    .map(character => character.id);
}
