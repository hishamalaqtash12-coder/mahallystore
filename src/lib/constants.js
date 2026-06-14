export const JORDAN_GOVERNORATES = [
  "Amman",
  "Zarqa",
  "Irbid",
  "Aqaba",
  "Madaba",
  "Balqa",
  "Mafraq",
  "Jerash",
  "Ajloun",
  "Karak",
  "Tafileh",
  "Ma'an"
];

export const DEFAULT_SHIPPING_DATA = JORDAN_GOVERNORATES.reduce((acc, gov) => {
  acc[gov] = { fee: 2.0, free_over: null }; // Default 2 JOD fee
  return acc;
}, {});

export const GOVERNORATES_MAP_AR = {
  "Amman": "عمان",
  "Zarqa": "الزرقاء",
  "Irbid": "إربد",
  "Aqaba": "العقبة",
  "Madaba": "مأدبا",
  "Balqa": "البلقاء",
  "Mafraq": "المفرق",
  "Jerash": "جرش",
  "Ajloun": "عجلون",
  "Karak": "الكرك",
  "Tafileh": "الطفيلة",
  "Ma'an": "معان"
};

