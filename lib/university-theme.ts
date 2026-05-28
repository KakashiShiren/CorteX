export type UniversityThemeKey = "clark" | "northeastern" | "wpi" | "bu";

export type UniversityTheme = {
  key: UniversityThemeKey;
  name: string;
  shortName: string;
};

const universityThemes: Record<string, UniversityTheme> = {
  "clarku.edu": {
    key: "clark",
    name: "Clark University",
    shortName: "Clark"
  },
  "northeastern.edu": {
    key: "northeastern",
    name: "Northeastern University",
    shortName: "Northeastern"
  },
  "wpi.edu": {
    key: "wpi",
    name: "Worcester Polytechnic Institute",
    shortName: "WPI"
  },
  "bu.edu": {
    key: "bu",
    name: "Boston University",
    shortName: "BU"
  }
};

export function getUniversityTheme(domain?: string | null): UniversityTheme {
  return universityThemes[domain?.trim().toLowerCase() ?? ""] ?? universityThemes["clarku.edu"];
}
