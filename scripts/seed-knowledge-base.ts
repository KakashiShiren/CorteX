import { execFile } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";

type SeedRecord = {
  title: string;
  content: string;
  keywords: readonly string[];
  source: string;
  category: string;
};

type TargetConfig = {
  parser: string;
  url: string;
  minimumRecords: number;
  fallback: readonly SeedRecord[];
};

type AliasUpdate = {
  matchTitle: string;
  updatedKeywords: readonly string[];
  updatedContent: string;
};

type SupabaseServiceClient = NonNullable<
  ReturnType<typeof import("../lib/supabase/server").getSupabaseServiceClient>
>;

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const message =
      "message" in error && typeof error.message === "string"
        ? error.message
        : JSON.stringify(error, null, 2);
    return message || "Unknown error";
  }

  return "Unknown error";
}

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const targets: readonly TargetConfig[] = [
  {
    parser: "libcal_hours",
    url: "https://clarku.libcal.com/hours",
    minimumRecords: 3,
    fallback: [
      {
        title: "Goddard Library Hours - Weekdays",
        content:
          "Goddard Library is open Monday through Thursday from 8:00 AM until midnight (12:00 AM), and Friday from 8:00 AM to 8:00 PM.",
        keywords: [
          "library",
          "goddard",
          "hours",
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "weekday",
          "open",
          "close"
        ],
        source: "https://clarku.libcal.com/hours",
        category: "hours"
      },
      {
        title: "Goddard Library Hours - Weekend",
        content:
          "Goddard Library is open Saturday from 10:00 AM to 6:00 PM and Sunday from noon (12:00 PM) until midnight.",
        keywords: ["library", "goddard", "hours", "saturday", "sunday", "weekend", "open", "close"],
        source: "https://clarku.libcal.com/hours",
        category: "hours"
      },
      {
        title: "Library Study Room Booking",
        content:
          "Students can reserve study rooms at Goddard Library through the online booking system at clarku.libcal.com. Rooms can be booked up to 7 days in advance for up to 2 hours per session.",
        keywords: [
          "study room",
          "reserve",
          "book",
          "library",
          "group study",
          "reservation",
          "booking",
          "study space",
          "room booking",
          "libcal"
        ],
        source: "https://clarku.libcal.com",
        category: "booking"
      }
    ]
  },
  {
    parser: "athletics_hours",
    url: "https://clarkathletics.com/sports/2023/4/5/facilities-Facility-Hours.aspx",
    minimumRecords: 2,
    fallback: [
      {
        title: "Gym Hours - Facility Hours Policy",
        content:
          "Clark Athletics notes that posted facility hours show when the building is open, but areas such as the gym or fields may still be unavailable during those times.",
        keywords: ["gym", "athletics", "hours", "facility", "open"],
        source: "https://clarkathletics.com/sports/2023/4/5/facilities-Facility-Hours.aspx",
        category: "hours"
      },
      {
        title: "Gym Hours - Official Source",
        content:
          "Students should use the Clark Athletics facility-hours page for the latest Kneller and recreation schedules because hours may change throughout the year.",
        keywords: ["gym", "kneller", "fitness", "hours", "schedule", "athletics"],
        source: "https://clarkathletics.com/sports/2023/4/5/facilities-Facility-Hours.aspx",
        category: "hours"
      },
      {
        title: "Athletics Contact",
        content:
          "Clark Athletics is based at 57 Downing Street and can be reached at 508-793-7161 or athletics@clarku.edu.",
        keywords: ["athletics", "contact", "phone", "email", "downing"],
        source: "https://clarkathletics.com/sports/2023/4/5/facilities-Facility-Hours.aspx",
        category: "contact"
      }
    ]
  },
  {
    parser: "health_services",
    url: "https://www.clarku.edu/offices/health-services/",
    minimumRecords: 4,
    fallback: [
      {
        title: "Health Center Hours",
        content:
          "Clark Health Services is open Monday through Friday from 9:00 AM to 5:00 PM during the academic year and is closed when the University is closed.",
        keywords: ["health", "health center", "hours", "monday", "friday"],
        source: "https://www.clarku.edu/offices/health-services/",
        category: "hours"
      },
      {
        title: "Health Center Appointments",
        content:
          "To make a Health Services appointment, call 508-793-7467. Students are often seen within one to two business days, and many are seen the same day.",
        keywords: ["health", "appointment", "phone", "same day", "clinic"],
        source: "https://www.clarku.edu/offices/health-services/",
        category: "contact"
      },
      {
        title: "Health Center Emergencies",
        content:
          "For an on-campus medical emergency, call Campus Police at 508-793-7575. If you are off campus, call 911.",
        keywords: ["health", "emergency", "campus police", "911"],
        source: "https://www.clarku.edu/offices/health-services/",
        category: "emergency"
      },
      {
        title: "Health Center Contact Details",
        content:
          "Clark Health Services is located at 501 Park Ave and can be reached at healthservices@clarku.edu or 508-793-7467.",
        keywords: ["health", "contact", "email", "park ave", "phone"],
        source: "https://www.clarku.edu/offices/health-services/",
        category: "contact"
      }
    ]
  },
  {
    parser: "its_help",
    url: "https://www.clarku.edu/offices/information-technology/",
    minimumRecords: 3,
    fallback: [
      {
        title: "IT Help Desk Contact",
        content:
          "The ITS Help Desk can be reached at 508-793-7745 or helpdesk@clarku.edu.",
        keywords: ["it", "its", "help desk", "phone", "email"],
        source: "https://www.clarku.edu/offices/information-technology/",
        category: "contact"
      },
      {
        title: "IT Help Desk Location",
        content:
          "The ITS Help Desk is located in Academic Commons on the Plaza Level of Goddard Library.",
        keywords: ["it", "its", "help desk", "location", "goddard", "academic commons"],
        source: "https://www.clarku.edu/offices/information-technology/",
        category: "building"
      },
      {
        title: "IT Help Desk Hours",
        content:
          "ITS Help Desk hours are typically Monday through Thursday 8:00 AM to midnight, Friday 8:00 AM to 5:00 PM, Saturday noon to 5:00 PM, and Sunday noon to midnight.",
        keywords: ["it", "its", "hours", "help desk", "saturday", "sunday"],
        source: "https://www.clarku.edu/offices/information-technology/",
        category: "hours"
      },
      {
        title: "IT Help - Common Tasks",
        content:
          "ITS supports common student tasks such as activating your Clark account, connecting to the campus network, and checking system status.",
        keywords: ["it", "account", "network", "system status", "help"],
        source: "https://www.clarku.edu/offices/information-technology/",
        category: "services"
      }
    ]
  },
  {
    parser: "registrar",
    url: "https://www.clarku.edu/offices/registrar/",
    minimumRecords: 3,
    fallback: [
      {
        title: "Registrar Responsibilities",
        content:
          "The Registrar's Office maintains student academic records, including transcripts, enrollment verification, and degree certifications.",
        keywords: ["registrar", "transcript", "records", "degree certification"],
        source: "https://www.clarku.edu/offices/registrar/",
        category: "services"
      },
      {
        title: "Registrar Services",
        content:
          "The Registrar's Office manages registration, degree audits, grade submissions, and updates to majors, minors, and concentrations.",
        keywords: ["registrar", "registration", "degree audit", "grades", "major"],
        source: "https://www.clarku.edu/offices/registrar/",
        category: "services"
      },
      {
        title: "Registrar Contact",
        content:
          "The Registrar's Office is in 939 Main Street, Room 305. Call 508-793-7426 or email registrar@clarku.edu.",
        keywords: ["registrar", "contact", "phone", "email", "location"],
        source: "https://www.clarku.edu/offices/registrar/",
        category: "contact"
      },
      {
        title: "Registrar Office Hours",
        content:
          "Registrar office hours are Monday through Friday from 9:30 AM to 4:00 PM.",
        keywords: ["registrar", "hours", "monday", "friday"],
        source: "https://www.clarku.edu/offices/registrar/",
        category: "hours"
      }
    ]
  },
  {
    parser: "dining",
    url: "https://clark.nmcfood.com/locations/the-table-at-higgins/",
    minimumRecords: 3,
    fallback: [
      {
        title: "The Table at Higgins Overview",
        content:
          "The Table at Higgins is Clark's main dining hall and offers an all-you-care-to-eat selection throughout the week.",
        keywords: ["dining", "higgins", "cafeteria", "main dining hall"],
        source: "https://clark.nmcfood.com/locations/the-table-at-higgins/",
        category: "dining"
      },
      {
        title: "The Table at Higgins Menu",
        content:
          "The official dining page publishes the current Higgins menu, including rotating dishes and nutrition details.",
        keywords: ["dining", "menu", "higgins", "nutrition", "food"],
        source: "https://clark.nmcfood.com/locations/the-table-at-higgins/",
        category: "dining"
      },
      {
        title: "The Table at Higgins Location",
        content:
          "The Table at Higgins is located inside Higgins University Center and is one of the main student dining locations on campus.",
        keywords: ["dining", "higgins", "location", "student center"],
        source: "https://clark.nmcfood.com/locations/the-table-at-higgins/",
        category: "building"
      }
    ]
  },
  {
    parser: "higgins_university_center",
    url: "https://www.clarku.edu/offices/student-engagement/higgins-university-center/",
    minimumRecords: 4,
    fallback: [
      {
        title: "Higgins University Center Overview",
        content:
          "Higgins University Center is a four-story student union that serves as a gathering place for student organizations, events, dining, and campus services.",
        keywords: ["higgins", "university center", "student union", "events"],
        source: "https://www.clarku.edu/offices/student-engagement/higgins-university-center/",
        category: "building"
      },
      {
        title: "Higgins University Center Hours - Academic Year",
        content:
          "During the academic year, Higgins University Center is typically open Monday through Thursday 7:00 AM to 12:00 AM, Friday 7:00 AM to 2:00 AM, Saturday 8:00 AM to 2:00 AM, and Sunday 8:00 AM to 12:00 AM.",
        keywords: ["higgins", "hours", "academic year", "weekend"],
        source: "https://www.clarku.edu/offices/student-engagement/higgins-university-center/",
        category: "hours"
      },
      {
        title: "Higgins Information Desk Hours - Academic Year",
        content:
          "During the academic year, the Higgins Information Desk is typically open Monday through Thursday 8:00 AM to 12:00 AM, Friday 8:00 AM to 1:00 AM, Saturday 11:00 AM to 1:00 AM, and Sunday 11:00 AM to 12:00 AM.",
        keywords: ["higgins", "information desk", "hours", "weekend"],
        source: "https://www.clarku.edu/offices/student-engagement/higgins-university-center/",
        category: "hours"
      },
      {
        title: "Higgins University Center First Floor",
        content:
          "The first floor of Higgins includes the Information Desk, The Table at Higgins, the Bistro, Student Council, conference rooms, and the main concourse.",
        keywords: ["higgins", "first floor", "dining", "student council", "conference room"],
        source: "https://www.clarku.edu/offices/student-engagement/higgins-university-center/",
        category: "services"
      },
      {
        title: "Higgins University Center Contact",
        content:
          "Student Leadership and Programming is located in Higgins University Center, 3rd Floor, Asher Suite, 950 Main Street. Call 508-793-7549.",
        keywords: ["higgins", "contact", "student leadership", "asher suite"],
        source: "https://www.clarku.edu/offices/student-engagement/higgins-university-center/",
        category: "contact"
      }
    ]
  },
  {
    parser: "campus_map",
    url: "https://www.clarku.edu/map/",
    minimumRecords: 3,
    fallback: [
      {
        title: "Campus Map Download",
        content:
          "Clark's campus map page includes a downloadable printable campus map for students and visitors.",
        keywords: ["map", "campus map", "download", "printable"],
        source: "https://www.clarku.edu/map/",
        category: "map"
      },
      {
        title: "Campus Map Popular Spots",
        content:
          "The campus map highlights popular spots such as the Center for Media Arts, Computing, and Design, the Center for Counseling and Personal Growth, and Goddard Library.",
        keywords: ["map", "popular spots", "goddard library", "counseling", "cmacd"],
        source: "https://www.clarku.edu/map/",
        category: "building"
      },
      {
        title: "Visitor Parking",
        content:
          "The campus map links to visitor parking information so guests can find the correct Clark parking area before arriving.",
        keywords: ["parking", "visitor parking", "campus map", "guest"],
        source: "https://www.clarku.edu/map/",
        category: "parking"
      },
      {
        title: "Clark Main Campus Address",
        content:
          "Clark University's main campus address is 950 Main St, Worcester, MA 01610.",
        keywords: ["address", "main campus", "map", "worcester"],
        source: "https://www.clarku.edu/map/",
        category: "contact"
      }
    ]
  },
  {
    parser: "public_safety",
    url: "https://www.clarku.edu/offices/public-safety/",
    minimumRecords: 3,
    fallback: [
      {
        title: "Public Safety Emergency Number",
        content:
          "For an emergency on campus, call Clark University Police at 508-793-7575.",
        keywords: ["public safety", "university police", "emergency", "phone"],
        source: "https://www.clarku.edu/offices/public-safety/",
        category: "emergency"
      },
      {
        title: "Public Safety Non-Emergency Contact",
        content:
          "For non-emergency public safety help, call 508-793-7598. Safety Escort Dispatch is available at 508-793-7777.",
        keywords: ["public safety", "non-emergency", "escort", "dispatch"],
        source: "https://www.clarku.edu/offices/public-safety/",
        category: "contact"
      },
      {
        title: "Public Safety Location",
        content:
          "Campus Police and Public Safety are located in Bullock Hall Basement at 939 Main Street.",
        keywords: ["public safety", "bullock hall", "location", "campus police"],
        source: "https://www.clarku.edu/offices/public-safety/",
        category: "building"
      },
      {
        title: "University Police Availability",
        content:
          "Clark University Police operates 24 hours a day, 365 days a year to support campus safety.",
        keywords: ["public safety", "university police", "24/7", "hours"],
        source: "https://www.clarku.edu/offices/public-safety/",
        category: "hours"
      }
    ]
  },
  {
    parser: "academic_calendar",
    url: "https://www.clarku.edu/academics/academic-calendar/",
    minimumRecords: 4,
    fallback: [
      {
        title: "Academic Calendar - Fall 2025 Classes Begin",
        content:
          "For academic year 2025-2026, Clark's Fall 2025 semester begins on August 25, 2025.",
        keywords: ["academic calendar", "fall 2025", "classes begin", "august 25"],
        source: "https://www.clarku.edu/academics/academic-calendar/",
        category: "academic_calendar"
      },
      {
        title: "Academic Calendar - Fall 2025 Breaks",
        content:
          "For Fall 2025, Clark lists Fall Break on October 13-14, 2025 and Thanksgiving Break on November 26-28, 2025.",
        keywords: ["academic calendar", "fall break", "thanksgiving", "fall 2025"],
        source: "https://www.clarku.edu/academics/academic-calendar/",
        category: "academic_calendar"
      },
      {
        title: "Academic Calendar - Spring 2026 Classes Begin",
        content:
          "For academic year 2025-2026, Clark's Spring 2026 semester begins on January 12, 2026.",
        keywords: ["academic calendar", "spring 2026", "classes begin", "january 12"],
        source: "https://www.clarku.edu/academics/academic-calendar/",
        category: "academic_calendar"
      },
      {
        title: "Academic Calendar - Spring 2026 Break",
        content:
          "Clark's Spring 2026 break runs from March 2 through March 6, 2026.",
        keywords: ["academic calendar", "spring break", "march 2026"],
        source: "https://www.clarku.edu/academics/academic-calendar/",
        category: "academic_calendar"
      },
      {
        title: "Academic Calendar - Commencement",
        content:
          "Clark's 2026 commencement is scheduled for Monday, May 18, 2026.",
        keywords: ["academic calendar", "commencement", "may 18 2026", "graduation"],
        source: "https://www.clarku.edu/academics/academic-calendar/",
        category: "academic_calendar"
      }
    ]
  }
] as const;

const campusMapSource = "Clark University Campus Map";

const buildingRecords: readonly SeedRecord[] = [
  {
    title: "Bassett Admissions Center - Location",
    content:
      "Bassett Admissions Center is building number 1 on the Clark University campus map. It is the main admissions office where prospective students and new students go for enrollment information.",
    keywords: [
      "bassett",
      "admissions",
      "admissions center",
      "enrollment",
      "apply",
      "prospective",
      "new student",
      "where",
      "location",
      "building"
    ],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Shaich Family Alumni and Student Engagement Center / Campus Store - Location",
    content:
      "The Shaich Family Alumni and Student Engagement Center and Campus Store is building number 3 on the Clark University campus map. It houses the campus store where students can buy Clark merchandise, textbooks, and supplies.",
    keywords: [
      "shaich",
      "alumni",
      "student engagement",
      "campus store",
      "bookstore",
      "clark store",
      "merchandise",
      "textbooks",
      "supplies",
      "where",
      "location"
    ],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Anderson House - Location",
    content: "Anderson House is building number 4 on the Clark University campus map.",
    keywords: ["anderson", "anderson house", "where", "location", "building"],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Atwood Hall - Location",
    content:
      "Atwood Hall is building number 5 on the Clark University campus map. It is a campus building used for academic and administrative purposes.",
    keywords: ["atwood", "atwood hall", "where", "location", "building"],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Beck House - Location",
    content: "Beck House is building number 6 on the Clark University campus map.",
    keywords: ["beck", "beck house", "where", "location", "building"],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Blackstone Residence Hall - Location",
    content:
      "Blackstone Residence Hall is building number 7 on the Clark University campus map. It is a student residence hall (dormitory) on campus.",
    keywords: [
      "blackstone",
      "blackstone hall",
      "blackstone residence",
      "dorm",
      "dormitory",
      "residence hall",
      "housing",
      "where",
      "location"
    ],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Bullock Residence Hall - Location",
    content:
      "Bullock Residence Hall is building number 8 on the Clark University campus map. It is a student residence hall (dormitory) on campus.",
    keywords: [
      "bullock",
      "bullock hall",
      "bullock residence",
      "dorm",
      "dormitory",
      "residence hall",
      "housing",
      "where",
      "location"
    ],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Carlson Hall - Location",
    content:
      "Carlson Hall is building number 9 on the Clark University campus map. It is used for academic purposes.",
    keywords: ["carlson", "carlson hall", "where", "location", "building", "academic"],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Carriage House - Location",
    content: "Carriage House is building number 10 on the Clark University campus map.",
    keywords: ["carriage", "carriage house", "where", "location", "building"],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Cohen-Lasry House - Location",
    content: "Cohen-Lasry House is building number 11 on the Clark University campus map.",
    keywords: ["cohen", "lasry", "cohen-lasry", "cohen lasry house", "where", "location", "building"],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Corner House - Location",
    content: "Corner House is building number 12 on the Clark University campus map.",
    keywords: ["corner house", "corner", "where", "location", "building"],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Health Services - Location",
    content:
      "Health Services is building number 13 on the Clark University campus map. This is where students go for medical appointments, health consultations, and wellness services.",
    keywords: [
      "health services",
      "health center",
      "medical",
      "nurse",
      "doctor",
      "sick",
      "appointment",
      "wellness",
      "clinic",
      "healthcare",
      "where",
      "location"
    ],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Dana Commons - Location",
    content: "Dana Commons is building number 14 on the Clark University campus map.",
    keywords: ["dana commons", "dana", "commons", "where", "location", "building"],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Dana Residence Hall - Location",
    content:
      "Dana Residence Hall is building number 15 on the Clark University campus map. It is a student residence hall (dormitory) on campus.",
    keywords: [
      "dana",
      "dana hall",
      "dana residence",
      "dorm",
      "dormitory",
      "residence hall",
      "housing",
      "where",
      "location"
    ],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Dodd Residence Hall - Location",
    content:
      "Dodd Residence Hall is building number 16 on the Clark University campus map. It is a student residence hall (dormitory) on campus.",
    keywords: [
      "dodd",
      "dodd hall",
      "dodd residence",
      "dorm",
      "dormitory",
      "residence hall",
      "housing",
      "where",
      "location"
    ],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Estabrook Hall - Location",
    content:
      "Estabrook Hall is building number 17 on the Clark University campus map. It is used for academic and administrative purposes.",
    keywords: ["estabrook", "estabrook hall", "where", "location", "building", "academic"],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Gates House - Location",
    content: "Gates House is building number 18 on the Clark University campus map.",
    keywords: ["gates", "gates house", "where", "location", "building"],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "George Perkins Marsh Institute / Jeanne X. Kasperson Research Library - Location",
    content:
      "The George Perkins Marsh Institute and Jeanne X. Kasperson Research Library is building number 19 on the Clark University campus map. It houses research programs and a specialized research library.",
    keywords: [
      "marsh institute",
      "kasperson",
      "research library",
      "george perkins",
      "marsh",
      "research",
      "where",
      "location",
      "building"
    ],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Geography Building - Location",
    content:
      "The Geography Building is building number 20 on the Clark University campus map. It houses the Geography department and related academic programs.",
    keywords: [
      "geography",
      "geography building",
      "geography department",
      "where",
      "location",
      "building",
      "academic"
    ],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Goddard Library - Location",
    content:
      "Goddard Library is building number 21 on the Clark University campus map. It is the main university library where students study, borrow books, access research databases, and reserve study rooms.",
    keywords: [
      "goddard",
      "goddard library",
      "library",
      "the lib",
      "study",
      "clark library",
      "books",
      "research",
      "study room",
      "where",
      "location"
    ],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Granger Field - Location",
    content:
      "Granger Field is building number 22 on the Clark University campus map. It is an outdoor athletic field used for sports and recreation.",
    keywords: [
      "granger",
      "granger field",
      "field",
      "athletic field",
      "sports field",
      "outdoor",
      "where",
      "location"
    ],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Harrington House - Location",
    content: "Harrington House is building number 23 on the Clark University campus map.",
    keywords: ["harrington", "harrington house", "where", "location", "building"],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Higgins University Center - Location",
    content:
      "Higgins University Center (also commonly called Higgins Hall or HUC) is building number 24 on the Clark University campus map. It is the main student center on campus, housing the main dining hall, student organization offices, lounges, and event spaces.",
    keywords: [
      "higgins",
      "higgins hall",
      "higgins university center",
      "huc",
      "student center",
      "university center",
      "dining hall",
      "dining",
      "cafeteria",
      "food",
      "student union",
      "where",
      "location"
    ],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Hughes Residence Hall - Location",
    content:
      "Hughes Residence Hall is building number 25 on the Clark University campus map. It is a student residence hall (dormitory) on campus.",
    keywords: [
      "hughes",
      "hughes hall",
      "hughes residence",
      "dorm",
      "dormitory",
      "residence hall",
      "housing",
      "where",
      "location"
    ],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Clark Labs (IDRISI) - Location",
    content:
      "Clark Labs, also known as IDRISI, is building number 26 on the Clark University campus map. It is home to Clark's geospatial software and research lab.",
    keywords: ["clark labs", "idrisi", "gis", "geospatial", "clark lab", "where", "location", "building"],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Department of Sustainability and Social Justice - Location",
    content:
      "The Department of Sustainability and Social Justice is building number 27 on the Clark University campus map.",
    keywords: [
      "sustainability",
      "social justice",
      "sustainability department",
      "where",
      "location",
      "building"
    ],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Jefferson Academic Center - Location",
    content:
      "Jefferson Academic Center is building number 28 on the Clark University campus map. It is a major academic building used for classes and faculty offices.",
    keywords: [
      "jefferson",
      "jefferson academic",
      "jac",
      "jefferson center",
      "academic building",
      "classes",
      "classroom",
      "where",
      "location"
    ],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Johnson Sanford Center - Location",
    content:
      "Johnson Sanford Center is building number 29 on the Clark University campus map. It is a residence and academic facility on campus.",
    keywords: [
      "johnson",
      "sanford",
      "johnson sanford",
      "jsc",
      "johnson hall",
      "sanford hall",
      "where",
      "location",
      "building"
    ],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Jonas Clark Hall - Location",
    content:
      "Jonas Clark Hall is building number 30 on the Clark University campus map. It is one of the main academic buildings on campus, housing classrooms and faculty offices.",
    keywords: [
      "jonas clark",
      "jonas clark hall",
      "jch",
      "jonas",
      "main academic",
      "classroom",
      "academic building",
      "where",
      "location"
    ],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Kneller Athletic Center - Location",
    content:
      "Kneller Athletic Center is building number 31 on the Clark University campus map. It is the main gym and athletics facility on campus, featuring a fitness center, pool, courts, and recreational spaces.",
    keywords: [
      "kneller",
      "kneller athletic",
      "gym",
      "athletic center",
      "rec center",
      "recreation center",
      "fitness",
      "fitness center",
      "workout",
      "pool",
      "sports",
      "basketball",
      "where",
      "location"
    ],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Lasry Center for Bioscience - Location",
    content:
      "Lasry Center for Bioscience is building number 32 on the Clark University campus map. It is the main biology and bioscience academic and research building on campus.",
    keywords: [
      "lasry",
      "bioscience",
      "lasry center",
      "bio building",
      "biology",
      "science center",
      "bio",
      "lab",
      "research",
      "where",
      "location"
    ],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Little Center - Location",
    content:
      "Little Center is building number 33 on the Clark University campus map. It is used for academic and administrative purposes.",
    keywords: ["little center", "little", "where", "location", "building"],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Math/Physics Building - Location",
    content:
      "The Math/Physics Building is building number 34 on the Clark University campus map. It houses the Mathematics and Physics departments, classrooms, and faculty offices.",
    keywords: [
      "math",
      "physics",
      "math building",
      "physics building",
      "math physics",
      "mathematics",
      "department",
      "classroom",
      "where",
      "location"
    ],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Maywood Residence Hall - Location",
    content:
      "Maywood Residence Hall is building number 35 on the Clark University campus map. It is a student residence hall (dormitory) on campus.",
    keywords: [
      "maywood",
      "maywood hall",
      "maywood residence",
      "dorm",
      "dormitory",
      "residence hall",
      "housing",
      "where",
      "location"
    ],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Parking Garage - Location",
    content:
      "The Parking Garage is building number 36 on the Clark University campus map. It is the main covered parking structure on campus.",
    keywords: ["parking garage", "parking", "garage", "park", "car", "vehicle", "where", "location"],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Sackler Sciences Center - Location",
    content:
      "Sackler Sciences Center is building number 38 on the Clark University campus map. It is a major science academic and research building on campus, also home to the Health Services office.",
    keywords: [
      "sackler",
      "sciences center",
      "sackler sciences",
      "science hall",
      "science building",
      "research",
      "health services",
      "where",
      "location"
    ],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Traina Center for the Arts - Location",
    content:
      "Traina Center for the Arts is building number 39 on the Clark University campus map. It is the main arts building on campus, housing art studios, performance spaces, and the arts faculty.",
    keywords: [
      "traina",
      "arts center",
      "traina center",
      "art",
      "arts",
      "performance",
      "studio",
      "theatre",
      "theater",
      "where",
      "location"
    ],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "University Police - Location",
    content:
      "University Police is building number 41 on the Clark University campus map. This is where the Clark University campus police department is located. For emergencies call 508-793-7575.",
    keywords: [
      "university police",
      "campus police",
      "police",
      "security",
      "safety",
      "emergency",
      "where",
      "location"
    ],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Wright Residence Hall - Location",
    content:
      "Wright Residence Hall is building number 42 on the Clark University campus map. It is a student residence hall (dormitory) on campus.",
    keywords: [
      "wright",
      "wright hall",
      "wright residence",
      "dorm",
      "dormitory",
      "residence hall",
      "housing",
      "where",
      "location"
    ],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Center for Media Arts, Computing, and Design - Location",
    content:
      "The Center for Media Arts, Computing, and Design is building number 43 on the Clark University campus map. It houses computer labs, media arts studios, and the computing and design programs.",
    keywords: [
      "media arts",
      "computing",
      "design",
      "macd",
      "computer lab",
      "media center",
      "arts computing",
      "where",
      "location",
      "building"
    ],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Dolan Field House - Location",
    content:
      "Dolan Field House is located on the Clark University campus near the athletic fields. It is an indoor athletic facility used for sports and recreation.",
    keywords: [
      "dolan",
      "dolan field house",
      "field house",
      "athletic",
      "indoor sports",
      "where",
      "location"
    ],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Red Square - Location",
    content:
      "Red Square is the central outdoor gathering space at Clark University. It is a hub for campus events, student activities, and everyday campus life. Most students pass through Red Square daily.",
    keywords: [
      "red square",
      "red",
      "square",
      "outdoor",
      "gathering",
      "campus center",
      "events",
      "where",
      "location"
    ],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Sculpture Studio - Location",
    content:
      "The Sculpture Studio is building number 49 on the Clark University campus map. It is used by arts students for sculpture work.",
    keywords: ["sculpture studio", "sculpture", "studio", "art", "where", "location"],
    source: campusMapSource,
    category: "building"
  }
] as const;

const specialLocationRecords: readonly SeedRecord[] = [
  {
    title: "Clark University Main Address",
    content:
      "Clark University is located at 950 Main Street, Worcester, MA 01610. The main campus entrance is on Downing Street off Main Street.",
    keywords: [
      "clark university",
      "address",
      "location",
      "worcester",
      "main street",
      "950 main",
      "directions",
      "campus address",
      "where is clark"
    ],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Campus Parking",
    content:
      "Parking on campus is available at the Parking Garage (building 36) and designated P lots marked on the campus map. Students should check with University Police for parking permits.",
    keywords: [
      "parking",
      "park",
      "car",
      "permit",
      "parking lot",
      "garage",
      "vehicle",
      "drive",
      "where to park"
    ],
    source: campusMapSource,
    category: "facility"
  },
  {
    title: "Residence Halls on Campus",
    content:
      "Clark University residence halls include: Blackstone Hall, Bullock Hall, Carlson Hall, Dana Hall, Dodd Hall, Estabrook Hall, Hughes Hall, Johnson Sanford Center, Maywood Hall, and Wright Hall. For housing inquiries contact Residential Life.",
    keywords: [
      "dorm",
      "dorms",
      "residence hall",
      "housing",
      "live on campus",
      "where to live",
      "freshman housing",
      "residential",
      "dormitory"
    ],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Academic Buildings on Campus",
    content:
      "Main academic buildings at Clark University include Jonas Clark Hall, Jefferson Academic Center, Sackler Sciences Center, Lasry Center for Bioscience, Math/Physics Building, Geography Building, and the Center for Media Arts Computing and Design.",
    keywords: [
      "academic building",
      "classroom",
      "class",
      "lecture",
      "where is my class",
      "academic",
      "building"
    ],
    source: campusMapSource,
    category: "building"
  },
  {
    title: "Athletic Facilities on Campus",
    content:
      "Clark University athletic facilities include the Kneller Athletic Center (main gym), Dolan Field House (indoor athletics), Granger Field (outdoor field), and Corash Tennis Courts.",
    keywords: [
      "athletics",
      "sports",
      "gym",
      "fitness",
      "recreation",
      "athletic facilities",
      "tennis",
      "field",
      "workout",
      "exercise"
    ],
    source: campusMapSource,
    category: "facility"
  }
] as const;

const criticalUrlRecords: readonly SeedRecord[] = [
  {
    title: "Library Study Room Booking",
    content:
      "Students can reserve study rooms at Goddard Library through the online booking system at clarku.libcal.com. Rooms can be booked up to 7 days in advance for up to 2 hours per session.",
    keywords: [
      "study room",
      "reserve",
      "book",
      "library",
      "group study",
      "reservation",
      "booking",
      "study space",
      "room booking",
      "libcal"
    ],
    source: "https://clarku.libcal.com",
    category: "booking"
  },
  {
    title: "Goddard Library Hours - Weekdays",
    content:
      "Goddard Library is open Monday through Thursday from 8:00 AM until midnight (12:00 AM), and Friday from 8:00 AM to 8:00 PM.",
    keywords: [
      "library",
      "goddard",
      "hours",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "open",
      "close",
      "weekday"
    ],
    source: "https://clarku.libcal.com/hours",
    category: "hours"
  },
  {
    title: "Goddard Library Hours - Weekend",
    content:
      "Goddard Library is open Saturday from 10:00 AM to 6:00 PM and Sunday from noon (12:00 PM) until midnight.",
    keywords: ["library", "goddard", "hours", "saturday", "sunday", "weekend", "open", "close"],
    source: "https://clarku.libcal.com/hours",
    category: "hours"
  },
  {
    title: "Kneller Athletic Center Hours",
    content:
      "The Kneller Athletic Center gym is open Monday through Friday from 6:00 AM to 10:00 PM, and Saturday and Sunday from 9:00 AM to 8:00 PM.",
    keywords: [
      "gym",
      "kneller",
      "athletic",
      "recreation",
      "fitness",
      "hours",
      "open",
      "close",
      "workout",
      "rec center"
    ],
    source: "https://clarkathletics.com/sports/2023/4/5/facilities-Facility-Hours.aspx",
    category: "hours"
  },
  {
    title: "The Table at Higgins Dining Hours",
    content:
      "The Table at Higgins (main dining hall) is open for breakfast Monday through Friday 7:30 AM to 10:00 AM, lunch 11:00 AM to 2:00 PM, and dinner 5:00 PM to 8:00 PM. Weekend hours may vary.",
    keywords: [
      "dining",
      "cafeteria",
      "food",
      "meal",
      "breakfast",
      "lunch",
      "dinner",
      "hours",
      "open",
      "table",
      "higgins",
      "dining hall"
    ],
    source: "https://clark.nmcfood.com/locations/the-table-at-higgins/",
    category: "hours"
  },
  {
    title: "Health Services Hours and Contact",
    content:
      "Clark University Health Services is open Monday through Friday from 9:00 AM to 5:00 PM during the academic year. Phone number: (508) 793-7467. Located at 501 Park Ave and available to students for appointments and general health support.",
    keywords: [
      "health services",
      "health center",
      "medical",
      "hours",
      "open",
      "appointment",
      "clinic",
      "nurse",
      "doctor",
      "phone",
      "contact",
      "number",
      "call"
    ],
    source: "https://www.clarku.edu/health-services/",
    category: "hours"
  },
  {
    title: "University Police Contact",
    content:
      "Clark University Police can be reached at (508) 793-7575 for emergencies and non-emergencies. University Police building is number 41 on campus.",
    keywords: [
      "police",
      "university police",
      "campus safety",
      "emergency",
      "security",
      "phone",
      "call",
      "contact",
      "number",
      "safe ride"
    ],
    source: "https://www.clarku.edu/offices/public-safety/",
    category: "contact"
  },
  {
    title: "Campus WiFi",
    content:
      "Clark University provides free WiFi across all campus buildings. The main network is ClarkU-Secure. IT support: helpdesk@clarku.edu.",
    keywords: [
      "wifi",
      "internet",
      "network",
      "clarku",
      "wireless",
      "it",
      "helpdesk",
      "connect",
      "wi-fi",
      "password",
      "login"
    ],
    source: "https://www.clarku.edu/offices/information-technology/",
    category: "facility"
  },
  {
    title: "Clark University Main Address",
    content:
      "Clark University is located at 950 Main Street, Worcester, MA 01610. The main campus entrance is on Downing Street off Main Street.",
    keywords: [
      "clark university",
      "address",
      "location",
      "worcester",
      "main street",
      "950 main",
      "directions",
      "campus address",
      "where is clark"
    ],
    source: "https://www.clarku.edu",
    category: "contact"
  },
  {
    title: "Campus Store Location",
    content:
      "The Campus Store is located in the Shaich Family Alumni and Student Engagement Center (building 3). Students can buy Clark merchandise, textbooks, school supplies, and snacks there.",
    keywords: [
      "campus store",
      "bookstore",
      "clark store",
      "merchandise",
      "textbooks",
      "books",
      "supplies",
      "store",
      "buy",
      "shop"
    ],
    source: "https://www.clarku.edu/offices/student-engagement/",
    category: "facility"
  }
] as const;

const aliasUpdates: readonly AliasUpdate[] = [
  {
    matchTitle: "Goddard Library",
    updatedKeywords: [
      "goddard",
      "goddard library",
      "library",
      "the lib",
      "study",
      "clark library",
      "books",
      "research",
      "study room",
      "printing",
      "reserve room",
      "where",
      "location"
    ],
    updatedContent:
      "Goddard Library (also called 'the library' or 'the lib') is building number 21 on the Clark University campus map. It is the main university library where students study, borrow books, access research databases, reserve study rooms, and use printing services."
  },
  {
    matchTitle: "Higgins University Center",
    updatedKeywords: [
      "higgins",
      "higgins hall",
      "higgins university center",
      "huc",
      "student center",
      "university center",
      "dining hall",
      "dining",
      "cafeteria",
      "food",
      "the table",
      "eat",
      "student union",
      "lounge",
      "where",
      "location"
    ],
    updatedContent:
      "Higgins University Center (also commonly called Higgins Hall or HUC) is building number 24 on the Clark University campus map. It is the main student center on campus, housing the main dining hall known as The Table at Higgins, student organization offices, lounges, and event spaces."
  },
  {
    matchTitle: "Kneller Athletic Center",
    updatedKeywords: [
      "kneller",
      "kneller athletic",
      "gym",
      "athletic center",
      "rec center",
      "recreation center",
      "fitness",
      "fitness center",
      "workout",
      "pool",
      "sports",
      "basketball",
      "exercise",
      "weights",
      "treadmill",
      "where",
      "location"
    ],
    updatedContent:
      "Kneller Athletic Center (also called the gym or rec center) is building number 31 on the Clark University campus map. It is the main gym and athletics facility on campus, featuring a fitness center, pool, basketball courts, and recreational spaces."
  },
  {
    matchTitle: "Lasry Center for Bioscience",
    updatedKeywords: [
      "lasry",
      "bioscience",
      "lasry center",
      "bio building",
      "biology building",
      "biology",
      "science center",
      "bio",
      "lab",
      "science lab",
      "bioscience building",
      "where",
      "location"
    ],
    updatedContent:
      "Lasry Center for Bioscience (also called the bio building or science center) is building number 32 on the Clark University campus map. It is the main biology and bioscience academic and research building on campus."
  },
  {
    matchTitle: "Sackler Sciences Center",
    updatedKeywords: [
      "sackler",
      "sciences center",
      "sackler sciences",
      "science hall",
      "science building",
      "sciences building",
      "research",
      "chemistry",
      "physics lab",
      "where",
      "location"
    ],
    updatedContent:
      "Sackler Sciences Center (also called the sciences building or science hall) is building number 38 on the Clark University campus map. It is a major science academic and research building on campus, also home to Health Services."
  },
  {
    matchTitle: "Jonas Clark Hall",
    updatedKeywords: [
      "jonas clark",
      "jonas clark hall",
      "jch",
      "jonas",
      "main academic building",
      "classroom",
      "academic building",
      "clark hall",
      "where",
      "location"
    ],
    updatedContent:
      "Jonas Clark Hall (also called JCH or Jonas Clark) is building number 30 on the Clark University campus map. It is one of the main academic buildings on campus, housing classrooms and faculty offices."
  },
  {
    matchTitle: "Jefferson Academic Center",
    updatedKeywords: [
      "jefferson",
      "jefferson academic",
      "jac",
      "jefferson center",
      "academic building",
      "classes",
      "classroom",
      "lecture hall",
      "where",
      "location"
    ],
    updatedContent:
      "Jefferson Academic Center (also called JAC or Jefferson) is building number 28 on the Clark University campus map. It is a major academic building used for classes and faculty offices."
  },
  {
    matchTitle: "Johnson Sanford Center",
    updatedKeywords: [
      "johnson",
      "sanford",
      "johnson sanford",
      "jsc",
      "johnson hall",
      "sanford hall",
      "johnson sanford center",
      "where",
      "location",
      "residence"
    ],
    updatedContent:
      "Johnson Sanford Center (also called Johnson Hall, Sanford Hall, or JSC) is building number 29 on the Clark University campus map. It is a residence and academic facility on campus."
  },
  {
    matchTitle: "Health Services",
    updatedKeywords: [
      "health services",
      "health center",
      "medical",
      "nurse",
      "doctor",
      "sick",
      "appointment",
      "wellness",
      "clinic",
      "healthcare",
      "health office",
      "infirmary",
      "where",
      "location"
    ],
    updatedContent:
      "Health Services (also called the health center or clinic) is building number 13 on the Clark University campus map. This is where students go for medical appointments, health consultations, and wellness services. It is also located within the Sackler Sciences Center."
  },
  {
    matchTitle: "Center for Media Arts, Computing, and Design",
    updatedKeywords: [
      "media arts",
      "computing",
      "design",
      "macd",
      "computer lab",
      "media center",
      "arts computing",
      "mac lab",
      "design lab",
      "media building",
      "where",
      "location"
    ],
    updatedContent:
      "The Center for Media Arts, Computing, and Design (also called MACD or the media arts building) is building number 43 on the Clark University campus map. It houses computer labs, media arts studios, and the computing and design programs."
  }
] as const;

function normalizeRecord(record: SeedRecord): SeedRecord {
  const keywords: string[] = [];
  const seen = new Set<string>();

  for (const rawKeyword of record.keywords) {
    const phrase = rawKeyword.trim().toLowerCase();
    if (phrase && !seen.has(phrase)) {
      seen.add(phrase);
      keywords.push(phrase);
    }

    for (const token of rawKeyword
      .split(/[^a-zA-Z0-9]+/)
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value.length > 2)) {
      if (!seen.has(token)) {
        seen.add(token);
        keywords.push(token);
      }
    }
  }

  return {
    title: record.title.trim(),
    content: record.content.trim(),
    keywords: keywords.slice(0, 48),
    source: record.source.trim(),
    category: record.category.trim()
  };
}

async function loadEnvFile(filename: string) {
  const fullPath = path.join(projectRoot, filename);

  try {
    const content = await readFile(fullPath, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }

      const separatorIndex = line.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // Ignore missing env files.
  }
}

async function resolvePythonExecutable() {
  const candidates = process.platform === "win32" ? ["python", "py"] : ["python3", "python"];

  for (const candidate of candidates) {
    try {
      await execFileAsync(candidate, ["--version"], { cwd: projectRoot, timeout: 10_000 });
      return candidate;
    } catch {
      continue;
    }
  }

  return null;
}

async function scrapeWithPython(url: string, parser: string): Promise<SeedRecord[]> {
  const python = await resolvePythonExecutable();
  if (!python) {
    throw new Error("Python is not available on PATH");
  }

  const helperPath = path.join(projectRoot, "scripts", "seed_knowledge_base.py");
  await access(helperPath);

  const pythonArgs =
    python === "py"
      ? ["-3", helperPath, "--url", url, "--parser", parser]
      : [helperPath, "--url", url, "--parser", parser];

  const { stdout, stderr } = await execFileAsync(python, pythonArgs, {
    cwd: projectRoot,
    timeout: 60_000,
    maxBuffer: 5 * 1024 * 1024
  });

  if (stderr.trim()) {
    console.warn(stderr.trim());
  }

  return JSON.parse(stdout) as SeedRecord[];
}

async function collectRecords() {
  const results: SeedRecord[] = [];

  for (const target of targets) {
    try {
      const scraped = await scrapeWithPython(target.url, target.parser);
      if (scraped.length < target.minimumRecords) {
        throw new Error(
          `Scraper returned ${scraped.length} records, below minimum ${target.minimumRecords}`
        );
      }

      console.log(`[seed] scraped ${scraped.length} records from ${target.url}`);
      results.push(...scraped.map(normalizeRecord));
    } catch (error) {
      console.warn(
        `[seed] falling back for ${target.url}: ${error instanceof Error ? error.message : "unknown scrape error"}`
      );
      results.push(...target.fallback.map(normalizeRecord));
    }
  }

  console.log(`[seed] adding ${buildingRecords.length} campus map building records`);
  results.push(...buildingRecords.map(normalizeRecord));

  console.log(`[seed] adding ${specialLocationRecords.length} special campus location records`);
  results.push(...specialLocationRecords.map(normalizeRecord));

  console.log(`[seed] applying ${criticalUrlRecords.length} URL-backed detail overrides`);
  results.push(...criticalUrlRecords.map(normalizeRecord));

  return results;
}

function dedupeRecords(records: SeedRecord[]) {
  const map = new Map<string, SeedRecord>();

  for (const record of records) {
    map.set(record.title, record);
  }

  return Array.from(map.values());
}

function chunk<T>(items: readonly T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

async function fetchExistingRecordsByTitles(
  supabase: SupabaseServiceClient,
  titles: readonly string[]
) {
  const existing = new Map<string, SeedRecord>();
  const uniqueTitles = Array.from(new Set(titles.map((title) => title.trim()).filter(Boolean)));

  for (const titleChunk of chunk(uniqueTitles, 100)) {
    const query = await supabase
      .from("ai_knowledge_base")
      .select("title, content, keywords, source, category")
      .in("title", titleChunk);

    if (query.error) {
      throw new Error(formatError(query.error));
    }

    for (const row of (query.data ?? []) as SeedRecord[]) {
      existing.set(row.title, row);
    }
  }

  return existing;
}

async function upsertRecordsByTitle(
  supabase: SupabaseServiceClient,
  records: readonly SeedRecord[],
  label: string
) {
  if (!records.length) {
    console.log(`[seed] no ${label} records to seed`);
    return { inserted: 0, updated: 0 };
  }

  const existing = await fetchExistingRecordsByTitles(
    supabase,
    records.map((record) => record.title)
  );

  const inserted = records.filter((record) => !existing.has(record.title)).length;
  const updated = records.length - inserted;

  const upsertResult = await supabase
    .from("ai_knowledge_base")
    .upsert(records, { onConflict: "title" });

  if (!upsertResult.error) {
    console.log(
      `✅ Seeded ${records.length} ${label} records successfully (${inserted} inserted, ${updated} updated)`
    );
    return { inserted, updated };
  }

  const message = formatError(upsertResult.error);
  const shouldFallback =
    /constraint|on conflict|no unique|no exclusion/i.test(message) ||
    (typeof upsertResult.error === "object" &&
      upsertResult.error !== null &&
      "code" in upsertResult.error &&
      upsertResult.error.code === "42P10");

  if (!shouldFallback) {
    throw new Error(message);
  }

  console.warn(
    `[seed] upsert by title is unavailable for ${label}; falling back to update/insert by title`
  );

  for (const record of records) {
    if (existing.has(record.title)) {
      const updateResult = await supabase
        .from("ai_knowledge_base")
        .update({
          content: record.content,
          keywords: record.keywords,
          source: record.source,
          category: record.category
        })
        .eq("title", record.title);

      if (updateResult.error) {
        throw new Error(formatError(updateResult.error));
      }
    }
  }

  const recordsToInsert = records.filter((record) => !existing.has(record.title));
  if (recordsToInsert.length) {
    const insertResult = await supabase.from("ai_knowledge_base").insert(recordsToInsert);
    if (insertResult.error) {
      throw new Error(formatError(insertResult.error));
    }
  }

  console.log(
    `✅ Seeded ${records.length} ${label} records successfully (${inserted} inserted, ${updated} updated)`
  );
  return { inserted, updated };
}

function buildAliasUpdateRecordsFromExisting(
  existing: ReadonlyMap<string, SeedRecord>
) {
  return aliasUpdates.map((update) => {
    const locationTitle = `${update.matchTitle} - Location`;
    const targetTitle = existing.has(update.matchTitle)
      ? update.matchTitle
      : existing.has(locationTitle)
        ? locationTitle
        : locationTitle;
    const current = existing.get(targetTitle);

    return normalizeRecord({
      title: targetTitle,
      content: update.updatedContent,
      keywords: update.updatedKeywords,
      source: current?.source ?? campusMapSource,
      category: current?.category ?? "building"
    });
  });
}

async function buildAliasUpdateRecords(supabase: SupabaseServiceClient) {
  const candidateTitles = aliasUpdates.flatMap((update) => [
    update.matchTitle,
    `${update.matchTitle} - Location`
  ]);
  const existing = await fetchExistingRecordsByTitles(supabase, candidateTitles);
  return buildAliasUpdateRecordsFromExisting(existing);
}

async function main() {
  await loadEnvFile(".env.local");
  await loadEnvFile(".env");

  const dryRun = process.argv.includes("--dry-run");
  const { getSupabaseServiceClient } = await import("../lib/supabase/server");

  const supabase = getSupabaseServiceClient();
  const records = dedupeRecords(await collectRecords());

  if (!records.length) {
    throw new Error("No knowledge-base records were generated");
  }

  const previewRecordMap = new Map(records.map((record) => [record.title, record]));
  const previewAliasRecords = buildAliasUpdateRecordsFromExisting(previewRecordMap);
  for (const record of previewAliasRecords) {
    previewRecordMap.set(record.title, record);
  }

  console.log(`[seed] prepared ${previewRecordMap.size} knowledge-base records`);

  if (dryRun) {
    console.log(JSON.stringify(Array.from(previewRecordMap.values()), null, 2));
    return;
  }

  if (!supabase) {
    throw new Error("Supabase environment variables are missing. Add them to .env.local before seeding.");
  }

  const campusMapRecords = dedupeRecords([
    ...buildingRecords.map(normalizeRecord),
    ...specialLocationRecords.map(normalizeRecord)
  ]);
  const nonMapRecords = records.filter(
    (record) => !campusMapRecords.some((mapRecord) => mapRecord.title === record.title)
  );

  const nonMapStats = await upsertRecordsByTitle(supabase, nonMapRecords, "scraped and fallback");
  const campusMapStats = await upsertRecordsByTitle(supabase, campusMapRecords, "campus map");
  const aliasRecords = await buildAliasUpdateRecords(supabase);
  const aliasStats = await upsertRecordsByTitle(supabase, aliasRecords, "alias update");

  const totalInserted = nonMapStats.inserted + campusMapStats.inserted + aliasStats.inserted;
  const totalUpdated = nonMapStats.updated + campusMapStats.updated + aliasStats.updated;

  console.log(
    `[seed] finished seeding ai_knowledge_base (${totalInserted} inserted, ${totalUpdated} updated)`
  );
}

main().catch((error) => {
  console.error(`[seed] ${formatError(error)}`);
  process.exit(1);
});
