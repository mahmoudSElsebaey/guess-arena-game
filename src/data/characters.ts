export type Character = {
  id: string;
  name: string;
  avatar: string;
  skin: "light" | "medium" | "dark";
  hairColor: "black" | "brown" | "blonde" | "red" | "gray";
  hairLength: "short" | "long" | "none";
  hasHat: boolean;
  hasGlasses: boolean;
  hasBeard: boolean;
  gender: "male" | "female";
  eyeColor: "brown" | "blue" | "green";
};

const avatars = ["👨🏻","👩🏻","👨🏽","👩🏽","👨🏿","👩🏿","🧑🏻","🧑🏽","🧑🏿"];
const names = ["Alex","Maya","Omar","Lina","Noah","Sara","Adam","Nora","Leo","Zara","Ethan","Aya","Ryan","Mila","Sam","Layla","Adam","Jana","Daniel","Hana","Yousef","Mona","Kareem","Rana","Lucas","Yara","Owen","Salma","Amir","Nadia","Finn","Mariam","Ben","Reem","Ibrahim","Sofia","Tariq","Dina","Hassan","Maya","Omar","Lara","Adam","Nour","Ziad"];

export const characters: Character[] = Array.from({ length: 45 }, (_, index) => {
  const gender = index % 2 === 0 ? "male" : "female";
  return {
    id: `character-${index + 1}`,
    name: names[index],
    avatar: avatars[index % avatars.length],
    skin: (["light","medium","dark"] as const)[index % 3],
    hairColor: (["black","brown","blonde","red","gray"] as const)[index % 5],
    hairLength: (["short","long","none"] as const)[index % 3],
    hasHat: index % 4 === 0,
    hasGlasses: index % 5 === 0 || index % 11 === 0,
    hasBeard: gender === "male" && index % 3 === 0,
    gender,
    eyeColor: (["brown","blue","green"] as const)[index % 3]
  };
});
