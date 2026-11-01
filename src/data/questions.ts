export type GameQuestionSeed = {
  id: string;
  categorySlug: "appearance" | "accessories" | "identity";
  labelAr: string;
  labelEn: string;
  attributeKey: string;
  expectedValue: boolean | string;
  sortOrder: number;
};

export const gameQuestionSeeds: GameQuestionSeed[] = [
  { id: "hat", categorySlug: "accessories", labelAr: "هل يرتدي قبعة؟", labelEn: "Is the character wearing a hat?", attributeKey: "hasHat", expectedValue: true, sortOrder: 1 },
  { id: "glasses", categorySlug: "accessories", labelAr: "هل يرتدي نظارة؟", labelEn: "Does the character wear glasses?", attributeKey: "hasGlasses", expectedValue: true, sortOrder: 2 },
  { id: "beard", categorySlug: "appearance", labelAr: "هل لديه لحية؟", labelEn: "Does the character have a beard?", attributeKey: "hasBeard", expectedValue: true, sortOrder: 3 },
  { id: "male", categorySlug: "identity", labelAr: "هل الشخصية رجل؟", labelEn: "Is the character male?", attributeKey: "gender", expectedValue: "male", sortOrder: 4 },
  { id: "female", categorySlug: "identity", labelAr: "هل الشخصية امرأة؟", labelEn: "Is the character female?", attributeKey: "gender", expectedValue: "female", sortOrder: 5 },
  { id: "shortHair", categorySlug: "appearance", labelAr: "هل شعره قصير؟", labelEn: "Does the character have short hair?", attributeKey: "hairLength", expectedValue: "short", sortOrder: 6 },
  { id: "longHair", categorySlug: "appearance", labelAr: "هل شعره طويل؟", labelEn: "Does the character have long hair?", attributeKey: "hairLength", expectedValue: "long", sortOrder: 7 },
  { id: "bald", categorySlug: "appearance", labelAr: "هل الشخصية صلعاء؟", labelEn: "Is the character bald?", attributeKey: "hairLength", expectedValue: "none", sortOrder: 8 },
  { id: "blackHair", categorySlug: "appearance", labelAr: "هل شعره أسود؟", labelEn: "Does the character have black hair?", attributeKey: "hairColor", expectedValue: "black", sortOrder: 9 },
  { id: "brownHair", categorySlug: "appearance", labelAr: "هل شعره بني؟", labelEn: "Does the character have brown hair?", attributeKey: "hairColor", expectedValue: "brown", sortOrder: 10 },
  { id: "blondeHair", categorySlug: "appearance", labelAr: "هل شعره أشقر؟", labelEn: "Does the character have blonde hair?", attributeKey: "hairColor", expectedValue: "blonde", sortOrder: 11 },
  { id: "redHair", categorySlug: "appearance", labelAr: "هل شعره أحمر؟", labelEn: "Does the character have red hair?", attributeKey: "hairColor", expectedValue: "red", sortOrder: 12 },
  { id: "grayHair", categorySlug: "appearance", labelAr: "هل شعره رمادي؟", labelEn: "Does the character have gray hair?", attributeKey: "hairColor", expectedValue: "gray", sortOrder: 13 },
  { id: "lightSkin", categorySlug: "appearance", labelAr: "هل بشرته فاتحة؟", labelEn: "Does the character have light skin?", attributeKey: "skin", expectedValue: "light", sortOrder: 14 },
  { id: "mediumSkin", categorySlug: "appearance", labelAr: "هل بشرته متوسطة؟", labelEn: "Does the character have medium skin?", attributeKey: "skin", expectedValue: "medium", sortOrder: 15 },
  { id: "darkSkin", categorySlug: "appearance", labelAr: "هل بشرته داكنة؟", labelEn: "Does the character have dark skin?", attributeKey: "skin", expectedValue: "dark", sortOrder: 16 },
  { id: "blueEyes", categorySlug: "appearance", labelAr: "هل عيناه زرقاوان؟", labelEn: "Does the character have blue eyes?", attributeKey: "eyeColor", expectedValue: "blue", sortOrder: 17 },
  { id: "greenEyes", categorySlug: "appearance", labelAr: "هل عيناه خضراوان؟", labelEn: "Does the character have green eyes?", attributeKey: "eyeColor", expectedValue: "green", sortOrder: 18 },
  { id: "brownEyes", categorySlug: "appearance", labelAr: "هل عيناه بنيتان؟", labelEn: "Does the character have brown eyes?", attributeKey: "eyeColor", expectedValue: "brown", sortOrder: 19 }
];
