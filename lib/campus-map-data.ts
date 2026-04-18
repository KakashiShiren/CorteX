export type CampusMapCategory =
  | "academic"
  | "dining"
  | "athletics"
  | "health"
  | "residential"
  | "admin"
  | "arts"
  | "safety"
  | "services";

export type CampusMapBuilding = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  category: CampusMapCategory;
  description: string;
};

export const campusMapCenter = { lat: 42.2516, lng: -71.8262 };

export const campusMapCategoryColors: Record<CampusMapCategory, string> = {
  academic: "#4A90D9",
  dining: "#D9A13B",
  athletics: "#5E9E64",
  health: "#C65A52",
  residential: "#8D6FB4",
  admin: "#748189",
  arts: "#D4658C",
  safety: "#D07A3B",
  services: "#2F8F8B"
};

export const campusMapBuildings: CampusMapBuilding[] = [
  {
    id: 1,
    name: "Bassett Admissions Center",
    lat: 42.2494699,
    lng: -71.8241509,
    category: "admin",
    description: "Main admissions office for prospective and new students."
  },
  {
    id: 3,
    name: "Campus Store (Shaich Family Center)",
    lat: 42.2513391,
    lng: -71.820535,
    category: "services",
    description: "Clark merchandise, textbooks, and supplies."
  },
  {
    id: 13,
    name: "Health Services",
    lat: 42.2528788,
    lng: -71.8273919,
    category: "health",
    description: "Medical appointments and wellness services. Call (508) 793-7467. Open Mon-Fri 8:30AM-5PM."
  },
  {
    id: 21,
    name: "Goddard Library",
    lat: 42.2517489,
    lng: -71.8230683,
    category: "academic",
    description: "Main university library. Open Mon-Thu until midnight, Fri until 8PM, Sat 10AM-6PM, Sun noon-midnight."
  },
  {
    id: 24,
    name: "Higgins University Center",
    lat: 42.250354,
    lng: -71.8231992,
    category: "dining",
    description: "Main student center (also called Higgins Hall or HUC). Houses The Table at Higgins dining hall, student offices, and event spaces."
  },
  {
    id: 28,
    name: "Jefferson Academic Center",
    lat: 42.2509844,
    lng: -71.8216935,
    category: "academic",
    description: "Major academic building with classrooms and faculty offices. Also called JAC."
  },
  {
    id: 29,
    name: "Johnson Sanford Center",
    lat: 42.2534171,
    lng: -71.8232029,
    category: "residential",
    description: "Residence hall and academic facility. Also called Johnson Hall or JSC."
  },
  {
    id: 30,
    name: "Jonas Clark Hall",
    lat: 42.250988,
    lng: -71.8230045,
    category: "academic",
    description: "Main academic building with classrooms and faculty offices. Also called JCH."
  },
  {
    id: 31,
    name: "Kneller Athletic Center",
    lat: 42.252198,
    lng: -71.823871,
    category: "athletics",
    description: "Main gym and rec center. Open Mon-Fri 6AM-10PM, Sat-Sun 9AM-8PM."
  },
  {
    id: 32,
    name: "Lasry Center for Bioscience",
    lat: 42.2505067,
    lng: -71.8242619,
    category: "academic",
    description: "Main biology and bioscience academic and research building. Also called the bio building."
  },
  {
    id: 34,
    name: "Math/Physics Building",
    lat: 42.2505067,
    lng: -71.8242619,
    category: "academic",
    description: "Houses the Mathematics and Physics departments, classrooms, and faculty offices."
  },
  {
    id: 38,
    name: "Sackler Sciences Center",
    lat: 42.2507152,
    lng: -71.8237845,
    category: "academic",
    description: "Major science research building. Also home to Health Services."
  },
  {
    id: 39,
    name: "Traina Center for the Arts",
    lat: 42.2539944,
    lng: -71.8246898,
    category: "arts",
    description: "Main arts building with studios and performance spaces."
  },
  {
    id: 41,
    name: "University Police",
    lat: 42.250988,
    lng: -71.8230045,
    category: "safety",
    description: "Campus police department. Emergency line: (508) 793-7575."
  },
  {
    id: 43,
    name: "Center for Media Arts & Design",
    lat: 42.2519966,
    lng: -71.8210626,
    category: "academic",
    description: "Computer labs, media arts studios, and design programs. Also called MACD."
  },
  {
    id: 7,
    name: "Blackstone Residence Hall",
    lat: 42.2500489,
    lng: -71.8263492,
    category: "residential",
    description: "Student residence hall (dormitory)."
  },
  {
    id: 8,
    name: "Bullock Residence Hall",
    lat: 42.2511823,
    lng: -71.8237033,
    category: "residential",
    description: "Student residence hall (dormitory)."
  },
  {
    id: 25,
    name: "Hughes Residence Hall",
    lat: 42.2517824,
    lng: -71.8246864,
    category: "residential",
    description: "Student residence hall (dormitory)."
  },
  {
    id: 19,
    name: "Maywood Residence Hall",
    lat: 42.2517006,
    lng: -71.8251412,
    category: "residential",
    description: "Student residence hall (dormitory)."
  },
  {
    id: 42,
    name: "Wright Residence Hall",
    lat: 42.2523163,
    lng: -71.8225125,
    category: "residential",
    description: "Student residence hall (dormitory)."
  },
  {
    id: 48,
    name: "Red Square",
    lat: 42.2520353,
    lng: -71.8245381,
    category: "services",
    description: "Central outdoor gathering space on campus. Hub for events and student activity."
  },
  {
    id: 36,
    name: "Parking Garage",
    lat: 42.2522404,
    lng: -71.8245202,
    category: "services",
    description: "Main covered parking structure on campus."
  },
  {
    id: 22,
    name: "Granger Field",
    lat: 42.2483305,
    lng: -71.8302562,
    category: "athletics",
    description: "Outdoor athletic field and baseball field used for sports and recreation."
  },
  {
    id: 47,
    name: "Dolan Field House",
    lat: 42.2492556,
    lng: -71.8286891,
    category: "athletics",
    description: "Indoor athletic facility used for sports and recreation."
  }
];
