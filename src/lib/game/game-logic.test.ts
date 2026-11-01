import { describe, expect, it } from "vitest";
import { characters } from "../../data/characters";
import { getEliminatedCharacterIds, questionTests } from "./game-logic";

describe("Guess Arena game logic", () => {
  it("provides exactly 45 characters with unique ids", () => {
    expect(characters).toHaveLength(45);
    expect(new Set(characters.map(character => character.id)).size).toBe(45);
  });

  it("keeps the secret character when filtering a yes answer", () => {
    const secret = characters.find(character => character.hasHat);
    expect(secret).toBeDefined();
    const eliminated = getEliminatedCharacterIds(characters, new Set(), questionTests.hat, true);
    expect(eliminated).not.toContain(secret?.id);
    expect(eliminated.length).toBe(characters.filter(character => !character.hasHat).length);
  });

  it("keeps the secret character when filtering a no answer", () => {
    const secret = characters.find(character => !character.hasHat);
    expect(secret).toBeDefined();
    const eliminated = getEliminatedCharacterIds(characters, new Set(), questionTests.hat, false);
    expect(eliminated).not.toContain(secret?.id);
    expect(eliminated.length).toBe(characters.filter(character => character.hasHat).length);
  });

  it("does not include cards that were already eliminated", () => {
    const alreadyEliminated = new Set([characters[0].id]);
    const eliminated = getEliminatedCharacterIds(characters, alreadyEliminated, questionTests.male, true);
    expect(eliminated).not.toContain(characters[0].id);
  });

  it("covers all nineteen question predicates", () => {
    expect(Object.keys(questionTests)).toHaveLength(19);
    for (const character of characters) {
      for (const predicate of Object.values(questionTests)) {
        expect(typeof predicate(character)).toBe("boolean");
      }
    }
  });
});
