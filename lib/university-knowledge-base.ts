// lib/university-knowledge-base.ts
// Grove AI Knowledge Base - All Universities
// Last updated: May 2025

export type UniversityKnowledge = {
  name: string
  domain: string
  location: string
  address: string
  coordinates: { lat: number; lng: number }
  campus_size: string
  enrollment: string
  mascot: string
  colors: string
  nickname: string
  motto: string
  founded: number
  website: string
  emergency: {
    police: string
    non_emergency: string
    mental_health_after_hours?: string
  }
  wifi: Record<string, string>
  student_id_name: string
  currency_name: string
  buildings: Record<string, BuildingInfo>
  dining: DiningInfo
  study_spots: StudySpot[]
  hangout_spots: HangoutSpot[]
  late_night_food: LateNightOption[]
  nearby_food: NearbyFood[]
  transit: TransitInfo
  athletics: AthleticsInfo
  academic_culture: string
  student_vibe: string
  famous_for: string[]
  pro_tips: string[]
  common_questions: QAEntry[]
}

export type BuildingInfo = {
  name: string
  nickname?: string
  location?: string
  coordinates?: { lat: number; lng: number }
  hours?: string
  description: string
  features?: string[]
  floors?: Record<string, string>
  pro_tip?: string
  hidden_gem?: boolean
}

export type DiningInfo = {
  main_halls: DiningHall[]
  late_night?: LateNightDining[]
  meal_plan_currency?: string
  pro_tips?: string[]
}

export type DiningHall = {
  name: string
  location: string
  hours: { breakfast?: string; lunch?: string; dinner?: string; late_night?: string }
  features?: string[]
}

export type LateNightDining = {
  name: string
  hours: string
  features?: string[]
}

export type StudySpot = {
  name: string
  location: string
  vibe: 'quiet' | 'moderate' | 'social'
  hours: string
  features: string[]
  pro_tip?: string
  hidden_gem?: boolean
}

export type HangoutSpot = {
  name: string
  nickname?: string
  location?: string
  description: string
  best_for: string[]
  hours?: string
}

export type LateNightOption = {
  name: string
  hours: string
  distance: string
  what_to_get?: string
  price_range?: string
  pro_tip?: string
  maps_url?: string
  hidden_gem?: boolean
}

export type NearbyFood = {
  name: string
  type: string
  distance: string
  price: string
  known_for?: string
  hours?: string
  maps_url?: string
}

export type TransitInfo = {
  on_campus?: string[]
  public_transit?: string[]
  free_for_students?: boolean
  transit_pass_name?: string
  pro_tips?: string[]
}

export type AthleticsInfo = {
  division: string
  gym_name: string
  gym_hours?: string
  facilities: string[]
  free_for_students: boolean
  pro_tip?: string
}

export type QAEntry = {
  question: string
  answer: string
}

const clarkUniversity: UniversityKnowledge = {
  name: 'Clark University',
  domain: 'clarku.edu',
  location: 'Worcester, Massachusetts',
  address: '950 Main Street, Worcester, MA 01610',
  coordinates: { lat: 42.2520, lng: -71.8245 },
  campus_size: '50 acres',
  enrollment: '~3,000 undergraduates',
  mascot: 'Cougar',
  colors: 'Crimson and Gold',
  nickname: 'Clarkies',
  motto: 'Toward Truth',
  founded: 1887,
  website: 'www.clarku.edu',
  emergency: {
    police: '911',
    non_emergency: '(508) 793-7777',
  },
  wifi: {
    'ClarkWifi': 'Main student network. Use your Clark credentials (username = your Clark email). Works everywhere on campus.',
    'ClarkGuest': 'Guest network. No password needed - just open your browser and log in via the portal. Works for visitors.',
  },
  student_id_name: 'Clark ID',
  currency_name: 'Clark Dollars',
  buildings: {
    'goddard-library': {
      name: 'Goddard Library',
      nickname: 'The Lib',
      coordinates: { lat: 42.2517489, lng: -71.8230683 },
      hours: '24/7 during the semester. Reduced hours during breaks - check clarku.edu for exact hours.',
      description: 'The main university library. Open 24/7 during semester. Your go-to for studying, printing, and group rooms.',
      features: [
        'Open 24/7 during semester',
        'Printing available throughout - $0.05 per page (black & white)',
        'Color printing available at the main floor desk',
        'Group study rooms - bookable online at clarku.edu',
        'WiFi everywhere (ClarkWifi + ClarkGuest)',
        'Computers available for student use',
        'Multiple floors with different noise levels',
        'Phone charging stations available',
      ],
      floors: {
        '1st': 'Main entrance, circulation desk, computers, printing',
        '2nd': 'Regular study area, moderate noise okay',
        '3rd': 'Quieter study floor',
        '4th': 'Great windows overlooking Red Square - beautiful view, popular study spot. Room 402 is a hidden gem students love.',
        '5th-6th': 'Silent floors - no eating, no talking. Best for serious studying.',
      },
      pro_tip: 'Room 402 on the 4th floor has a beautiful view of campus and is less crowded than the main floors. For guaranteed quiet, go to the 5th or 6th floor. Group study rooms fill up fast - book online in advance.',
    },
    'huc': {
      name: 'Higgins University Center',
      nickname: 'HUC or The Hig',
      coordinates: { lat: 42.2503540, lng: -71.8231992 },
      hours: 'Generally open from early morning to late night. Basement (The Grind) has extended hours.',
      description: 'The main student center. Home to dining, The Grind, the bookstore, and student life offices. Heart of campus social life.',
      features: [
        'Main student hangout building',
        'Dining hall on ground floor',
        'Campus bookstore',
        'Student life offices',
        'Mail/package pickup',
        'The Grind in basement',
        'Asher Suite on 3rd floor',
      ],
      floors: {
        'Basement': 'THE GRIND - pool tables, Pac-Man arcade machine, ping-pong table, board games. The iconic Clark hangout. Open late. No cost to use.',
        '1st': 'Main entrance, dining hall (The Table at Higgins), bookstore, mailroom',
        '2nd': 'Student life offices, meeting rooms',
        '3rd': 'Asher Suite - comfortable lounge with sofas and TVs. Great for relaxing or casual study.',
      },
      pro_tip: 'The Grind in the basement is THE place to be when you\'re bored. Free pool, free Pac-Man, board games in the cabinet. If it\'s your first time, the Pac-Man machine has been there for years - it\'s a Clark tradition.',
    },
    'macd': {
      name: 'Center for Media Arts & Design',
      nickname: 'MACD',
      coordinates: { lat: 42.2519966, lng: -71.8210626 },
      hours: 'Open late most nights. Great for late-night studying.',
      description: 'Arts and media building with Xbox, PlayStation, board games, and creative spaces. Second home for many Clark students.',
      features: [
        'Xbox and PlayStation on 2nd floor (in cupboards - ask around or explore)',
        'Board games on 2nd floor',
        'Creative studio spaces',
        'Corner room always open - no booking needed',
        'Good late-night study spot',
        'Art and media labs',
      ],
      floors: {
        '2nd': 'Xbox, PlayStation, board games in cupboards. Gaming hub - students regularly hang out here at night.',
        'Corner room': 'Always open, no booking required. Comfortable chill spot. Students use it to hang out, study, or just decompress.',
      },
      pro_tip: 'The 2nd floor gaming setup is student-only knowledge. The Xbox and PlayStation are in cupboards on the 2nd floor - just open them. Great spot for a gaming session when you need a break.',
    },
    'kneller': {
      name: 'Kneller Athletic Center',
      nickname: 'The Gym',
      coordinates: { lat: 42.2521980, lng: -71.8238710 },
      hours: 'Gym: Mon-Fri 6am-10pm, Sat-Sun 10am-8pm (verify on clarku.edu as hours change seasonally). Pool: 10am-3pm on select days.',
      description: 'Main athletic center. Free for all Clark students. Has everything: gym, pool, basketball, squash, badminton.',
      features: [
        'Full gym with weights and cardio equipment - FREE for students',
        'Olympic swimming pool - FREE for students',
        'Basketball courts',
        'Squash courts',
        'Badminton courts (also available at Dolan Field House)',
        'Locker rooms',
        'No extra fee - included in tuition',
      ],
      pro_tip: 'All facilities are FREE for Clark students - just bring your ID. The pool schedule is limited (10am-3pm) so check before going. For badminton, both Kneller and Dolan Field House have courts - Dolan is often less busy.',
    },
    'jac': {
      name: 'Jefferson Academic Center',
      nickname: 'JAC',
      coordinates: { lat: 42.2509844, lng: -71.8216935 },
      hours: 'Class hours plus some evening access',
      description: 'Main STEM and computer science building. Lecture halls and computer labs.',
      features: ['CS department', 'Computer labs', 'Lecture halls', 'Study spaces between classes'],
    },
    'jch': {
      name: 'Jonas Clark Hall',
      nickname: 'JCH or Jonas Clark',
      coordinates: { lat: 42.2509880, lng: -71.8230045 },
      hours: 'Class hours',
      description: 'Historic main academic building. One of the oldest on campus. Home to humanities.',
    },
    'sackler': {
      name: 'Sackler Sciences Center',
      coordinates: { lat: 42.2507152, lng: -71.8237845 },
      hours: 'Class hours plus lab access',
      description: 'Biology and chemistry labs. Main science building.',
      features: ['Biology labs', 'Chemistry labs', 'Research spaces'],
    },
    'lasry': {
      name: 'Lasry Center for Bioscience',
      nickname: 'The Bio Building',
      coordinates: { lat: 42.2505067, lng: -71.8242619 },
      hours: 'Class and lab hours',
      description: 'Life sciences research center. Newest science building on campus.',
    },
    'traina': {
      name: 'Traina Center for the Arts',
      coordinates: { lat: 42.2539944, lng: -71.8246898 },
      hours: 'Class hours and performance times',
      description: 'Arts building with studios, theater, and performance spaces.',
      features: ['Art studios', 'Theater', 'Music practice rooms', 'Performances open to students'],
    },
    'health-services': {
      name: 'Health Services',
      coordinates: { lat: 42.2528788, lng: -71.8273919 },
      hours: 'Mon-Fri 9am-5pm. Closed weekends. For after-hours emergencies call Campus Police.',
      description: 'Student health center. Doctor visits, counseling, mental health support. All included with student health fee.',
      features: [
        'Doctor/nurse appointments',
        'Mental health counseling',
        'Urgent care during business hours',
        'Prescriptions',
        'STI testing',
        'Physical exams',
      ],
      pro_tip: 'Book appointments online at clarku.edu. For mental health, wait times can be long - book early in the semester. For after-hours medical emergencies, call Campus Police at (508) 793-7777.',
    },
    'bassett': {
      name: 'Bassett Admissions Center',
      coordinates: { lat: 42.2494699, lng: -71.8241509 },
      hours: 'Mon-Fri 9am-5pm, some Saturdays during recruitment season',
      description: 'Admissions office. Where visitors and new students go.',
    },
    'dolan': {
      name: 'Dolan Field House',
      coordinates: { lat: 42.2492556, lng: -71.8286891 },
      hours: 'Athletic hours - check with athletics department',
      description: 'Indoor athletic facility. Badminton courts, indoor track.',
      features: ['Badminton courts', 'Indoor track', 'Athletic events'],
    },
    'red-square': {
      name: 'Red Square',
      coordinates: { lat: 42.2520353, lng: -71.8245381 },
      hours: 'Always accessible',
      description: 'The central brick courtyard of campus. Social heart of Clark. Where everyone gathers on nice days.',
      features: [
        'Central gathering spot',
        'Frisbee and outdoor games on nice days',
        'Club fairs and outdoor events',
        'Concerts and movie screenings in warm weather',
        'Beautiful in fall when leaves change',
        'Best place to people-watch and meet friends',
      ],
      pro_tip: 'On nice days, Red Square is where Clark\'s social life happens. Bring a frisbee or just sit and you\'ll inevitably run into people you know. Clubs set up tables here regularly.',
    },
    'campus-store': {
      name: 'Shaich Campus Store',
      coordinates: { lat: 42.2513391, lng: -71.8205350 },
      hours: 'Mon-Fri 8:30am-5pm (check for current hours)',
      description: 'University bookstore. Textbooks, Clark gear, snacks, school supplies.',
      pro_tip: 'Textbooks here are EXPENSIVE. Always check Amazon, Chegg, or VitalSource first. The Clark gear and snacks are fine though.',
    },
    'university-police': {
      name: 'University Police',
      coordinates: { lat: 42.2509880, lng: -71.8228000 },
      hours: '24/7',
      description: 'Campus safety and police. Emergency: 911. Non-emergency: (508) 793-7777.',
    },
  },
  dining: {
    main_halls: [
      {
        name: 'The Table at Higgins (HUC Dining)',
        location: 'Higgins University Center, 1st floor',
        hours: {
          breakfast: '7:00am - 10:00am',
          lunch: '11:00am - 2:00pm',
          dinner: '4:30pm - 7:00pm (closed on some weekends - check for updated hours)',
        },
        features: [
          'All-you-can-eat with meal swipe',
          'Rotating menu - changes daily',
          'Salad bar always available',
          'Vegetarian and vegan options',
          'Gluten-free options available - ask staff',
          'Gets crowded 12-1pm for lunch - go early or late',
        ],
      },
    ],
    meal_plan_currency: 'Clark Dining Dollars',
    pro_tips: [
      'Dining hall closes at 7pm - do NOT be late for dinner or you\'ll be hunting off-campus.',
      'Breakfast is the quietest and most chill meal - great if you want to eat without crowds.',
      'The salad bar is always there even when the hot food isn\'t great.',
      'Dining Dollars roll over each semester but NOT each year - spend them before May.',
    ],
  },
  study_spots: [
    {
      name: 'Goddard Library - 4th floor, Room 402',
      location: 'Goddard Library, 4th floor',
      vibe: 'quiet',
      hours: '24/7',
      features: ['Beautiful windows overlooking campus', 'Less crowded than main floors', 'Great natural light', 'Quiet atmosphere'],
      pro_tip: 'Room 402 is the secret spot Clark students love. The view of campus is stunning especially at sunset. Usually less crowded than other floors.',
      hidden_gem: true,
    },
    {
      name: 'Goddard Library - 5th & 6th floors',
      location: 'Goddard Library, top floors',
      vibe: 'quiet',
      hours: '24/7',
      features: ['Completely silent', 'No food, no talking', 'Best for deep focus work', 'Least crowded floors'],
      pro_tip: 'If you need to actually focus for 4+ hours, go to the 5th or 6th floor. No one talks, no one eats. It\'s serious studying territory.',
    },
    {
      name: 'MACD 2nd Floor',
      location: 'Center for Media Arts & Design, 2nd floor',
      vibe: 'moderate',
      hours: 'Open late most nights',
      features: ['Gaming breaks available (Xbox/PlayStation)', 'Less crowded than library', 'Creative environment', 'Good for arts/media students'],
      pro_tip: 'When the library feels suffocating, MACD 2nd floor is the move. Study for a bit, take a gaming break, study more. Good energy.',
    },
    {
      name: 'MACD Corner Room',
      location: 'Center for Media Arts & Design, ground floor corner',
      vibe: 'moderate',
      hours: 'Always open',
      features: ['No booking required', 'Comfortable space', 'Always accessible', 'Good for small groups'],
      hidden_gem: true,
    },
    {
      name: 'Asher Suite',
      location: 'HUC 3rd floor',
      vibe: 'social',
      hours: 'HUC building hours',
      features: ['Comfortable sofas', 'TVs', 'Relaxed atmosphere', 'Good for casual reading or relaxing between classes'],
    },
    {
      name: 'Dana Commons',
      location: 'Near residential area',
      vibe: 'quiet',
      hours: 'Building hours',
      features: ['Quieter than main library', 'Less known so often empty', 'Good for solo work'],
      hidden_gem: true,
    },
  ],
  hangout_spots: [
    {
      name: 'The Grind',
      location: 'HUC Basement',
      description: 'THE iconic Clark hangout. Pool tables, vintage Pac-Man arcade, ping-pong, board games. Free to use. Open late. This is where Clark students go when they\'re bored, social, or need to decompress.',
      best_for: ['Killing time between classes', 'Meeting people', 'Group hangouts', 'Late night fun', 'Stress relief'],
      hours: 'Open late - usually until building closes',
    },
    {
      name: 'MACD 2nd Floor Gaming',
      location: 'Center for Media Arts & Design, 2nd floor',
      description: 'Xbox and PlayStation in the cupboards on the 2nd floor. Open to all students. Bring friends for gaming sessions.',
      best_for: ['Gaming', 'Creative students', 'Late night hangouts'],
      hours: 'Open late most nights',
    },
    {
      name: 'Red Square',
      location: 'Central campus courtyard',
      description: 'The beating heart of campus on nice days. Frisbee, picnics, people-watching. Where campus life happens outdoors.',
      best_for: ['Nice weather hangouts', 'Meeting people', 'Outdoor events', 'Club fairs'],
    },
    {
      name: 'Asher Suite',
      location: 'HUC 3rd floor',
      description: 'Comfortable lounge with sofas and TVs. Good for relaxing without the chaos of The Grind.',
      best_for: ['Chilling out', 'Watching TV', 'Casual hangouts'],
    },
    {
      name: 'Campus Park / Pond Area',
      location: 'Behind residential halls',
      description: 'Nice green space with a small pond. Good for walks, outdoor studying, or just decompressing.',
      best_for: ['Nice weather', 'Walks', 'Peace and quiet outside', 'Studying outdoors'],
    },
  ],
  late_night_food: [
    {
      name: 'Ziggy Bomb',
      hours: 'Open until 1-2am (varies by night)',
      distance: '~10 minute drive from campus, near Worcester City Hall',
      what_to_get: 'The burgers - famous among Clark students. Worth every penny.',
      price_range: '$8-15',
      pro_tip: 'Clark students have been going here for years. Best late-night burger in Worcester. Worth the Uber if you\'re craving something real at midnight.',
    },
    {
      name: '7-Eleven',
      hours: '24/7',
      distance: 'Park Avenue, ~5-10 min walk from campus',
      what_to_get: 'Snacks, drinks, instant food. The true late-night staple.',
      price_range: '$2-10',
      pro_tip: 'The closest 24/7 option. Not exciting but always there when you need it at 3am.',
    },
    {
      name: 'Family Farms',
      hours: 'Open late (check hours)',
      distance: 'Park Avenue, close to 7-Eleven',
      what_to_get: 'Better selection than 7-Eleven. Local convenience store.',
      price_range: '$2-15',
    },
    {
      name: 'DoorDash / Uber Eats',
      hours: 'Available until 2-3am depending on restaurant',
      distance: 'Delivered to your dorm',
      pro_tip: 'Many Worcester restaurants deliver to Clark until late. Search your app and sort by "open now" late at night.',
    },
  ],
  nearby_food: [
    {
      name: 'Shrewsbury Street',
      type: 'Restaurant row',
      distance: '~2 miles from campus',
      price: '$$ - $$$',
      known_for: 'Worcester\'s "Restaurant Row" - 40+ restaurants, all cuisines. The best dining destination near Clark.',
      maps_url: 'https://www.google.com/maps/search/restaurants+shrewsbury+street+worcester+ma/',
    },
    {
      name: 'Canal District',
      type: 'Entertainment and dining district',
      distance: '~1.5 miles from campus',
      price: '$$ - $$$',
      known_for: 'Nightlife, bars, restaurants. Good for weekend evenings. Live music venues.',
    },
    {
      name: 'Main Street restaurants',
      type: 'Various near campus',
      distance: 'Walking distance',
      price: '$ - $$',
      known_for: 'Ethiopian, Indian, Vietnamese, and other international cuisines near campus. Diverse options.',
    },
    {
      name: 'Crompton Place',
      type: 'Local market and shops',
      distance: '~5 min drive',
      price: '$ - $$',
      known_for: 'Birchtree Bread Company, Seed to Stem, Bedlam Book Cafe, Crompton Collective. Local gems.',
    },
  ],
  transit: {
    on_campus: [
      'Campus is entirely walkable - 15 minutes to cross the whole campus',
      'No shuttle needed on campus',
    ],
    public_transit: [
      'WRTA (Worcester Regional Transit Authority) buses serve the campus area',
      'Bus routes connect Clark to downtown Worcester, Shrewsbury Street, and beyond',
      'Union Station (downtown Worcester) has commuter rail to Boston',
    ],
    free_for_students: false,
    pro_tips: [
      'Worcester is not a very transit-friendly city - having a bike or car helps a lot',
      'Uber and Lyft are available and reasonably priced within Worcester',
      'For Boston day trips: commuter rail from Union Station (~$10 each way)',
      'Zipcar is available for longer trips - useful for outlet shopping, hiking, etc.',
    ],
  },
  athletics: {
    division: 'NCAA Division III',
    gym_name: 'Kneller Athletic Center',
    gym_hours: 'Mon-Fri 6am-10pm, Sat-Sun 10am-8pm (verify seasonally)',
    facilities: [
      'Full weight room and cardio equipment',
      'Olympic swimming pool',
      'Basketball courts',
      'Squash courts',
      'Badminton courts',
      'Dolan Field House (indoor track, additional courts)',
      'Granger Field (outdoor soccer, lacrosse, field hockey)',
    ],
    free_for_students: true,
    pro_tip: 'Everything at Kneller is FREE for Clark students. Just bring your ID. Go early or late to avoid the rush. The pool hours are more limited - check the schedule online.',
  },
  academic_culture: 'Small, intimate, liberal arts-focused. Professors know students by name. Strong research culture - undergrads often work directly with professors on research. Collaborative, not cutthroat. Clark was the first US university to award a PhD (1886). Strong in psychology, geography, biology, and international development.',
  student_vibe: 'Quirky, alternative, laid-back, open-minded. Students here tend to be passionate about specific things. Less of a party school, more of a "deep conversation at 2am" school. Small enough that you know a lot of people by sophomore year. The kind of place where professors remember your name and weird interests are celebrated.',
  famous_for: [
    'The Grind - iconic student hangout in HUC basement',
    'First US university to grant a PhD (1886)',
    'Strong geography and international development programs',
    'Intimate campus where everyone knows each other',
    'Red Square as social hub',
    'LEEP (Liberal Education and Effective Practice) experiential learning program',
    'Clark Pride Month in September (so students can participate before leaving for summer)',
    'Hadwen Arboretum - beautiful nature area Clark students can explore',
  ],
  pro_tips: [
    'The dining hall closes at 7pm sharp - if you have evening classes, eat before or plan for off-campus.',
    'ClarkWifi can be spotty in some dorms - get a WiFi extender.',
    'Check the Corq app for campus events - it has everything from game nights to club fairs.',
    'The library is 24/7 but gets PACKED during finals - find your spot early.',
    'Room 402 in the library has the best view on campus - less people know about it.',
    'The MACD corner room is always open and never needs a booking.',
    'For free entertainment: The Grind (pool/Pac-Man), MACD 2nd floor (Xbox/PlayStation), Red Square (good weather).',
    'Textbooks at the campus store are expensive - always check Amazon/Chegg first.',
    'Health Services is free with your student health fee - use it, that\'s what it\'s there for.',
    'Mental health counseling books up fast - schedule early in the semester if you think you\'ll need it.',
    'Worcester mispronunciation: locals say "WOOS-ter" not "War-Chester".',
    'Bus to Boston: Take WRTA to Union Station, then commuter rail. About $10-15 each way.',
    'Shrewsbury Street = restaurant row. Best food near Clark. A must-visit.',
  ],
  common_questions: [
    {
      question: 'Where is The Grind?',
      answer: 'The Grind is in the basement of Higgins University Center (HUC). It has pool tables, a vintage Pac-Man arcade machine, ping-pong, and board games. It\'s the most iconic hangout spot at Clark. Open late, free to use.',
    },
    {
      question: 'What is there to do when I\'m bored?',
      answer: 'Top options: (1) The Grind in HUC basement - pool, Pac-Man, ping-pong, board games, free. (2) MACD 2nd floor - Xbox and PlayStation in the cupboards. (3) Asher Suite on HUC 3rd floor - comfortable lounge with TVs. (4) Red Square - outdoor hangout on nice days. (5) Check the Corq app for events like game nights, movie screenings, and club events.',
    },
    {
      question: 'Where can I eat late at night?',
      answer: 'Late night options: (1) Ziggy Bomb - near City Hall, open until 1-2am, famous burgers, ~$10. (2) 7-Eleven on Park Ave - 24/7, walking distance. (3) Family Farms on Park Ave - open late, local convenience store. (4) DoorDash/Uber Eats - many Worcester restaurants deliver until 2-3am. The dining hall closes at 7pm sharp.',
    },
    {
      question: 'Where is the best place to study?',
      answer: 'Best study spots: (1) Goddard Library is open 24/7 - Room 402 on 4th floor is a hidden gem with great views and less crowded. 5th-6th floors are completely silent for serious studying. (2) MACD 2nd floor - good for studying with gaming breaks. (3) MACD corner room - always open, no booking needed. (4) Asher Suite in HUC - casual studying atmosphere.',
    },
    {
      question: 'How do I connect to campus WiFi?',
      answer: 'Two options: ClarkWifi - use your Clark credentials (username@clarku.edu). This is the main student network. ClarkGuest - no password needed, just open your browser and log in through the portal. Both work across campus.',
    },
    {
      question: 'Is the gym free?',
      answer: 'Yes! Kneller Athletic Center is completely free for Clark students. Just bring your Clark ID. You have access to the weight room, pool, basketball courts, squash courts, and badminton courts. The pool has limited hours (usually 10am-3pm) - check the schedule online.',
    },
    {
      question: 'How do I print?',
      answer: 'Printing is available at Goddard Library and other locations on campus. Cost: $0.05 per page for black and white. Color printing available too at the main desk. Make sure you have funds on your Clark account.',
    },
    {
      question: 'What is there to do in Worcester?',
      answer: 'Worcester highlights: (1) Shrewsbury Street - restaurant row with 40+ restaurants, the best food near Clark. (2) Canal District - bars, nightlife, live music. (3) Crompton Place - local shops, Birchtree Bread, cool cafes. (4) DCU Center - concerts and events. (5) Hanover Theatre - Broadway shows. (6) Worcester Art Museum - free for Clark students sometimes. (7) Polar Park - home of the WooSox (minor league baseball).',
    },
    {
      question: 'How do I get to Boston from Clark?',
      answer: 'Take a WRTA bus to Union Station (downtown Worcester), then take the commuter rail to Boston\'s South Station. Total cost ~$10-15 each way. Takes about 1-1.5 hours. You can also Uber/Lyft to Union Station (about $10-15 from campus). Commuter rail schedule at mbta.com.',
    },
    {
      question: 'Where is health services?',
      answer: 'Health Services is on the north side of campus. Hours: Mon-Fri 9am-5pm. Closed weekends. Book appointments at clarku.edu. For after-hours medical issues, call Campus Police at (508) 793-7777 and they\'ll help connect you with resources. For mental health, same location - book early in semester as appointments fill up.',
    },
  ],
}

const northeasternUniversity: UniversityKnowledge = {
  name: 'Northeastern University',
  domain: 'northeastern.edu',
  location: 'Boston, Massachusetts',
  address: '360 Huntington Avenue, Boston, MA 02115',
  coordinates: { lat: 42.3398, lng: -71.0892 },
  campus_size: '73 acres',
  enrollment: '~20,000+ undergraduates',
  mascot: 'Husky',
  colors: 'Red and Black',
  nickname: 'Huskies',
  motto: 'The Light of Truth',
  founded: 1898,
  website: 'www.northeastern.edu',
  emergency: { police: '911', non_emergency: '(617) 373-2121' },
  wifi: {
    'HuskyNet': 'Main student WiFi. Use your Northeastern username and password. Fastest and most reliable.',
    'NU-Guest': 'Guest WiFi. Open access for visitors.',
  },
  student_id_name: 'Husky Card',
  currency_name: 'NUFlex Dollars',
  buildings: {
    'snell-library': {
      name: 'Snell Library',
      coordinates: { lat: 42.3398, lng: -71.0892 },
      hours: 'Extended hours during semester. 24/7 during finals. Check library.northeastern.edu.',
      description: 'Main university library. Huge, multiple floors, recently renovated 3rd floor. The go-to study hub.',
      features: ['24/7 during finals week', 'Multiple floors with different noise levels', 'Recently renovated 3rd floor study spaces', 'Computer labs throughout', 'Group study rooms - book online', 'Printing stations (cost per page)', 'Cafe inside', 'WiFi everywhere'],
      pro_tip: 'Can get VERY crowded, especially during midterms and finals. Go to the Law Library instead if Snell is packed - it\'s a hidden gem with tons of tables, couches, and natural light (open to all Northeastern students).',
    },
    'curry-student-center': {
      name: 'Curry Student Center',
      hours: 'Open daily, extended hours',
      description: 'Main student hub. Dining, shops, student organizations, Afterhours cafe, koi pond outside.',
      features: ['Student organizations offices', 'Afterhours - coffee shop by day, music venue by night (inside Curry)', 'Multiple dining options inside', 'Roof terrace - great outdoor study spot in good weather', 'Koi pond outside - good for zen moment before a big exam', 'Curry Sculpture Yard for outdoor relaxation'],
      pro_tip: 'Afterhours inside Curry is a hidden gem - cozy cafe space for finishing assignments between classes. The roof terrace (weather permitting) has outlets by the doors and is a great social study spot.',
    },
    'northeastern-tunnels': {
      name: 'Underground Tunnel System',
      hours: 'Building hours',
      description: '16,705+ feet of tunnels connecting 11 campus buildings. A game-changer in winter. Primary entrance at Curry Student Center.',
      features: ['Connects Snell Library to Cabot Center and beyond', 'Primary entrance at Curry Student Center', 'Stay warm between buildings in Boston winters without going outside', 'Students call this "the tunnel system" or just "the tunnels"'],
      pro_tip: 'CRITICAL Boston winter hack: learn the tunnel system. When it\'s -10°F in January, you can get between most buildings without going outside. It connects 11 buildings. Enter from Curry Student Center.',
    },
    'west-village-h': {
      name: 'West Village H (WVH)',
      hours: 'Class hours plus extended access',
      description: 'Computer science building with hidden study spots on upper floors. Great alternative to Snell.',
      features: ['CS department (CCIS)', '2nd-4th floors have study tables and mini desks - hidden gem', 'Glass windows overlooking Huntington Ave', 'Gets quiet during non-CS-deadline times', 'Great during finals (CS students elsewhere)'],
      pro_tip: 'Hidden study gem. The 2nd, 3rd, and 4th floors of WVH have study spaces that most non-CS students don\'t know about. During finals it\'s often quieter than Snell.',
      hidden_gem: true,
    },
    'marino-recreation': {
      name: 'Marino Recreation Center',
      hours: 'Daily 6am-11pm (check marino.northeastern.edu for current hours)',
      description: 'Main gym. Can get very crowded, especially evenings. Free for students.',
      features: ['Full gym - weights, cardio', 'Olympic swimming pool', 'Basketball courts', 'Racquetball courts', 'Group fitness classes', 'Free for students with Husky Card'],
      pro_tip: 'Can be VERY overcrowded in the evenings. Go 6-9am or 10am-noon for shorter waits. Alternative: SquashBusters at 795 Columbus Ave - smaller, less crowded, open 6am-midnight Mon-Thu.',
    },
    'law-library': {
      name: 'Northeastern School of Law Library',
      hours: 'Extended hours - check website',
      description: 'Hidden gem study spot open to ALL Northeastern students. Tons of tables, couches, natural light.',
      features: ['Open to ALL Northeastern students (not just law students)', 'Much less crowded than Snell', 'Tons of tables, couches, natural light', 'Quiet atmosphere', 'NOTE: Printers only work for law students'],
      pro_tip: 'This is THE secret study spot at Northeastern. Beautiful space, way less crowded than Snell, open to everyone. Just remember printers are law-only - use your regular print cards elsewhere.',
      hidden_gem: true,
    },
    'cabot-center': {
      name: 'Cabot Center',
      hours: 'Athletic hours',
      description: 'Main arena. Ice hockey, basketball games. Can be reserved for working out.',
      features: ['Ice hockey rink', 'Basketball arena', 'Athletic events'],
    },
    'mfa': {
      name: 'Museum of Fine Arts (MFA)',
      hours: 'Wed-Mon 10am-5pm, Thu until 10pm. Closed Tuesday.',
      description: 'World-class art museum just steps from campus. FREE for Northeastern students with Husky Card.',
      features: ['FREE for Northeastern students', 'One of the top art museums in the US', '5-minute walk from campus on Huntington Ave', 'Great for stress relief and culture', 'MFA restaurant and gift shop'],
      pro_tip: 'The MFA is free with your Husky Card and literally across the street from campus. Don\'t miss it - it\'s one of the best perks of going to Northeastern.',
    },
  },
  dining: {
    main_halls: [
      { name: 'Stetson West', location: 'West Village area', hours: { breakfast: '7:00am - 11:00am', lunch: '11:00am - 4:00pm', dinner: '4:00pm - 8:00pm' }, features: ['Large dining hall', 'Multiple food stations', 'Vegetarian/vegan options', 'Smoothie bar'] },
      { name: 'International Village Dining', location: 'International Village', hours: { breakfast: '7:00am - 11:00am', lunch: '11:00am - 3:00pm', dinner: '5:00pm - 8:00pm' }, features: ['International cuisines', 'Large selection', 'Open seating'] },
    ],
    late_night: [{ name: 'Late Night at Stetson', hours: 'Until midnight (check dining.northeastern.edu)', features: ['Late night dining hall option', 'Lighter menu than regular hours'] }],
    meal_plan_currency: 'NUFlex Dollars',
    pro_tips: ['Check huntnewsnu.com for dining updates - the student newspaper covers this.', 'Wollaston\'s Market on campus has great sandwiches named after NEU places (try "The Huntington" or "The Marino Fitness").', 'El Jefe\'s Taqueria is the classic late-night Huntington Ave spot - open late, $7-10 burritos.', 'Chicken Lou\'s on Forsyth Street is an upperclassman secret - great breakfast/lunch, very affordable, not crowded.'],
  },
  study_spots: [
    { name: 'Snell Library - 3rd Floor (newly renovated)', location: 'Snell Library', vibe: 'moderate', hours: '24/7 during finals', features: ['Newly renovated', 'Modern study spaces', 'Group rooms available', 'Computers available'], pro_tip: 'Book a group room in advance. Walk-in spots on 3rd floor are first-come-first-served.' },
    { name: 'Law Library', location: 'School of Law building', vibe: 'quiet', hours: 'Extended hours', features: ['Open to all NEU students', 'Very spacious', 'Natural light', 'Couches and tables', 'Quiet atmosphere'], pro_tip: 'The best-kept secret at Northeastern for studying. Almost always has seats when Snell is full.', hidden_gem: true },
    { name: 'West Village H - 2nd-4th floors', location: 'West Village H', vibe: 'moderate', hours: 'Building hours', features: ['Study tables overlooking Huntington Ave', 'Less crowded than Snell', 'Good natural light'], hidden_gem: true },
    { name: 'Curry Student Center Roof Terrace', location: 'Curry Student Center, top floor', vibe: 'social', hours: 'Curry hours, weather permitting', features: ['Outdoor study spot', 'Outlets by the doors', 'Social atmosphere', 'Great views'], pro_tip: 'Weather dependent. Best in spring and fall. Outlets by the doors - bring your charger.' },
    { name: 'Panera Bread Basement (Huntington Ave)', location: 'Huntington Ave, near campus', vibe: 'social', hours: 'Open late', features: ['Lots of booths', 'Good for group study', 'Buy something to justify staying', 'Open late'], pro_tip: 'Lots of booths - good for groups. Open late. WiFi can be spotty so bring a hotspot or download materials offline.' },
    { name: 'Afterhours (inside Curry)', location: 'Curry Student Center', vibe: 'social', hours: 'Business hours for coffee, evening for music', features: ['Cozy cafe vibe', 'Coffee', 'Good for between-class work', 'Music venue at night'] },
    { name: 'Horticulture Hall', location: '300 Massachusetts Ave, across from Symphony Hall', vibe: 'quiet', hours: 'Business hours', features: ['Lesser-known spot', 'Quiet', 'Tables available', 'Near Symphony Hall T stop'], hidden_gem: true },
    { name: 'Boston Public Library', location: 'Copley Square (2 T stops away)', vibe: 'quiet', hours: 'Mon-Thu 9am-9pm, Fri-Sat 9am-5pm, Sun 1-5pm', features: ['FREE for NEU students (get a library card)', 'Historic and beautiful building', 'Incredible ceiling work', 'Multiple study floors', 'Near great food on Boylston St'], pro_tip: 'NEU students get a Boston Public Library card for free. The main reading room is stunning. Great for a change of scenery from campus.' },
  ],
  hangout_spots: [
    { name: 'Koi Pond (Curry Sculpture Yard)', location: 'Outside Curry Student Center', description: 'Peaceful outdoor space with a koi pond. Great for decompressing before a big exam.', best_for: ['Stress relief', 'Quick outdoor break', 'Peaceful moment between classes'] },
    { name: 'Speare Hall Front Yard', location: 'Speare Hall', description: 'Nice grassy area. Owners often bring dogs to play fetch - great mood booster.', best_for: ['Relaxing outside', 'Nice weather', 'Dog-watching (seriously)'] },
    { name: 'Afterhours', location: 'Inside Curry Student Center', description: 'Cozy cafe by day, music venue by night. One of the best chill spots on campus.', best_for: ['Coffee breaks', 'Casual hangouts', 'Live music events in the evenings'] },
    { name: 'Matthews Arena', location: 'On campus', description: 'Ice hockey and events. Great for watching Huskies hockey - one of the best NCAA D1 hockey programs.', best_for: ['Hockey games', 'Campus events'] },
  ],
  late_night_food: [
    { name: 'El Jefe\'s Taqueria', hours: 'Open late on Huntington Ave', distance: 'On or near Huntington Ave', what_to_get: 'Burrito - $7-10, customizable, delicious', price_range: '$7-11', pro_tip: 'The go-to late night option for many NEU students. Get the burrito - it\'s huge and will keep you going through a late-night study session.' },
    { name: 'Wollaston\'s Market', hours: 'Extended hours', distance: 'On campus', what_to_get: '"The Huntington" or "The Marino Fitness" sandwich', price_range: '$6-12', pro_tip: 'Hidden gem on campus. Great sandwiches named after Northeastern places.' },
    { name: 'Chicken Lou\'s', hours: 'Breakfast and lunch only', distance: 'Forsyth Street (near Marino)', what_to_get: 'Breakfast sandwich or lunch special', price_range: '$5-10', pro_tip: 'Upperclassman secret. Walk past the Bank of America ATM heading toward Marino and look for it. Cheap, great breakfast and lunch.', hidden_gem: true },
    { name: 'Symphony Sushi', hours: 'Dinner hours', distance: 'Near Symphony Hall, walking distance', what_to_get: 'Party Boat for groups - get a big group together', price_range: '$15-25/person' },
    { name: 'Pavement Coffeehouse (Gainsborough Street)', hours: 'Morning and afternoon', distance: 'Walking distance from campus', what_to_get: 'Iced matcha latte and rosemary salt bagel (student favorite)', price_range: '$5-12', pro_tip: 'Student favorite for a reason. Great coffee, free WiFi. Good for morning studying.' },
    { name: 'Late Nite Cafe (Stetson West)', hours: 'Until midnight', distance: 'On campus', price_range: '$5-12 (dining points accepted)', pro_tip: 'Best on-campus late night option. Accepts meal plan and dining points.' },
  ],
  nearby_food: [
    { name: 'Huntington Avenue restaurants', type: 'Various', distance: 'On campus corridor', price: '$ - $$', known_for: 'Many options right on Huntington. Sprout for healthy food, various spots for quick bites.' },
    { name: 'Chinatown Boston', type: 'Asian cuisine district', distance: '5 minute T ride', price: '$', known_for: 'Cheap, authentic Chinese food. Bubble tea. Great for late night food (some spots open until 4am). Dim sum on weekends.' },
    { name: 'Back Bay (Newbury Street / Boylston)', type: 'Trendy restaurants and cafes', distance: '10-15 minute walk or 2 T stops', price: '$$ - $$$', known_for: 'Trendy cafes, upscale restaurants, Pavement Coffee. Use your Husky Card at Madewell and J.Crew for 15% student discount.' },
    { name: 'Allston', type: 'College neighborhood', distance: 'Green Line, 20 min', price: '$', known_for: 'Cheap food, dive bars, college scene. Great for a Saturday night out. Spike\'s Junkyard Dogs is famous.' },
  ],
  transit: {
    on_campus: ['Campus is walkable - most things within 10-15 minutes on foot', 'Underground tunnel system connects 11 buildings - use in winter'],
    public_transit: ['Green Line (E branch) stops right at campus - Northeastern station and Museum of Fine Arts station', 'MBTA bus routes throughout the area', 'Easy access to all of Boston, Cambridge, and beyond', 'Airport accessible via T (no Uber needed to/from Logan)'],
    free_for_students: true,
    transit_pass_name: 'MBTA U-Pass (Charlie Card)',
    pro_tips: ['FREE T pass (MBTA U-Pass) is included with student fees - pick it up at the Husky Card office. This alone is worth $90/month.', 'Green Line E train stops right at campus - use it constantly.', 'Get a Boston Public Library card - it\'s free for NEU students and gives access to a massive card.', 'Bring your Husky Card shopping - J.Crew and Madewell give 15% discount to students.', 'The MBTA is included in your fees - so use it constantly. Go explore Boston.'],
  },
  athletics: {
    division: 'NCAA Division I',
    gym_name: 'Marino Recreation Center',
    gym_hours: 'Mon-Thu 6am-11pm, Fri 6am-9pm, Sat-Sun 8am-8pm',
    facilities: ['Full weight room and cardio', 'Olympic swimming pool', 'Basketball courts', 'Racquetball courts', 'Group fitness classes', 'Indoor track (Cabot Center)'],
    free_for_students: true,
    pro_tip: 'Marino gets very crowded evenings. Use SquashBusters at 795 Columbus Ave as an alternative - smaller gym, less crowded, open 6am-midnight Mon-Thu.',
  },
  academic_culture: 'Famous for the co-op program (paid 6-month full-time internships integrated into degree). Apply for first co-op in sophomore year using NUWorks. 100 application cap on NUWorks as of fall 2024. Competitive - especially for CS/engineering co-ops. Strong emphasis on experiential learning. Large university with 20,000+ students so can feel impersonal at first. Professors vary widely in accessibility. Strong career placement rates.',
  student_vibe: 'Urban, professional, driven, career-focused. Students here are constantly thinking about the next co-op or job. Diverse - international students make up a huge portion of the student body. Campus is in Boston so students are exposed to real city life. Active social scene tied to the city. Boston sports culture is STRONG here.',
  famous_for: ['Co-op program - paid 6-month work terms built into degree', 'Urban Boston location with Green Line T access', 'Free MBTA U-Pass for all students', 'Free Museum of Fine Arts access with Husky Card', 'Underground tunnel system connecting 11 buildings', 'NCAA D1 hockey - historically strong program', 'NUWorks platform for co-op and job searching', 'Free access to New York Times, WSJ, Washington Post, FT with Northeastern email', '15% discount at Madewell and J.Crew with Husky Card', 'Husky Card discount at many Prudential Center stores'],
  pro_tips: ['GET YOUR FREE T PASS. The MBTA U-Pass is included in student fees and saves you $90/month. Pick it up at the Husky Card office ASAP.', 'The tunnel system is a winter lifesaver - learn it during orientation, thank yourself in January.', 'Co-op tip: Apply on NUWorks early and intentionally - there\'s a 100 application cap now. Network, not just mass-apply.', 'Free Museum of Fine Arts with your Husky Card. Walk there on a slow Tuesday afternoon.', 'Law Library for studying - huge, less crowded than Snell, open to all students.', 'Free NYT, WSJ, Washington Post, and FT with your Northeastern email - go to the library website to activate.', 'Chicken Lou\'s on Forsyth - cheap, great breakfast and lunch. Hidden gem most freshmen miss.', 'Koi pond outside Curry is surprisingly peaceful for a quick 5-minute break.', 'Check CSI (Center for Student Involvement) Instagram for events - they do things like $35 Boston Calling tickets and free Ben & Jerry\'s.', 'West Village H 2nd-4th floors are a quiet study alternative to Snell when it\'s packed.', 'SquashBusters on Columbus Ave - alternative to packed Marino gym. Open 6am-midnight.', 'Boston Calling, Red Sox games at Fenway, Celtics, Bruins - you\'re in Boston. USE IT.'],
  common_questions: [
    { question: 'What is the co-op program?', answer: 'Co-op (cooperative education) is Northeastern\'s signature program. You alternate between full-time semesters of classes and 6-month paid full-time work experiences. You typically do 1-2 co-ops during your undergraduate years. Apply through NUWorks in your sophomore year. Pay ranges from $15-30/hour or higher depending on the company. It\'s what makes NEU degrees so valuable - you graduate with real work experience.' },
    { question: 'How do I get around Boston for free?', answer: 'Use your MBTA U-Pass (included in student fees). Pick it up at the Husky Card office. The Green Line E branch stops right at campus (Northeastern station). This gets you everywhere in Boston - Chinatown, Back Bay, downtown, airport connection. Also, the BU Bridge connects to Cambridge for biking.' },
    { question: 'Where should I study when Snell Library is full?', answer: 'Three alternatives: (1) Law Library - tons of tables, couches, natural light, open to ALL students, much less crowded. (2) West Village H 2nd-4th floors - study tables overlooking Huntington Ave, quiet. (3) Panera Bread basement on Huntington - lots of booths, open late, good for groups. (4) Afterhours in Curry - cozy cafe vibe for between-class work.' },
    { question: 'How do I get to the gym without waiting forever?', answer: 'Marino Recreation Center gets packed during peak hours (evenings, especially 5-8pm). Go early morning (6-9am) or midday (10am-noon). Alternative: SquashBusters at 795 Columbus Ave - smaller, less crowded, open 6am-midnight Mon-Thu.' },
    { question: 'Is the MFA really free?', answer: 'Yes! Museum of Fine Arts is free for Northeastern students with your Husky Card. It\'s a 5-minute walk from campus on Huntington Ave. One of the best art museums in the country. Go on a slow afternoon when you need a break from studying.' },
    { question: 'What restaurants are near campus?', answer: 'On Huntington Ave: El Jefe\'s Taqueria (late-night burritos), Sprout (healthy salads), Wollaston\'s Market (sandwiches). Hidden gem: Chicken Lou\'s on Forsyth St (cheap breakfast/lunch). For more variety: Chinatown (5 min T ride), Back Bay (Newbury/Boylston, 2 stops on Green Line). Symphony Sushi for a fun group dinner.' },
  ],
}

const wpiUniversity: UniversityKnowledge = {
  name: 'Worcester Polytechnic Institute',
  domain: 'wpi.edu',
  location: 'Worcester, Massachusetts',
  address: '100 Institute Road, Worcester, MA 01609',
  coordinates: { lat: 42.2743, lng: -71.8064 },
  campus_size: '95 acres',
  enrollment: '~6,500 students (undergrad + grad)',
  mascot: 'Goat (Gompei)',
  colors: 'Crimson and Gray',
  nickname: 'Engineers / Goats',
  motto: 'Theory and Practice',
  founded: 1865,
  website: 'www.wpi.edu',
  emergency: {
    police: '911',
    non_emergency: '(508) 831-5555',
    mental_health_after_hours: 'ProtoCall at (508) 831-5540 - 24/7 after-hours mental health support',
  },
  wifi: {
    'WPI-Wireless': 'Main student network. Use your WPI username and password.',
    'WPI-Guest': 'Guest access for visitors.',
  },
  student_id_name: 'WPI ID Card',
  currency_name: 'Goatbucks',
  buildings: {
    'founders-hall': {
      name: 'Founders Hall',
      nickname: 'Founders',
      hours: 'Extended hours',
      description: 'Main building with Goat\'s Head restaurant, Starbucks, and student services.',
      features: ['Goat\'s Head restaurant - bar-style dining, weekly events', 'Starbucks on ground floor', 'Tuesday night trivia at Goat\'s Head', 'Weekend sports viewing (Sox, Pats)', 'Student services offices'],
      pro_tip: 'The Goat\'s Head is the main social spot at WPI. Tuesday night trivia is a campus institution. Come early on game days.',
    },
    'gordon-library': {
      name: 'Gordon Library',
      hours: 'Extended hours during semester. 24/7 during finals.',
      description: 'Main university library. Multiple study areas, reflection space.',
      features: ['Multiple study floors', 'Group study rooms (bookable)', 'Mindful Thursday Meditation sessions', 'Reflection Space - quiet area for meditation/prayer', 'Computers and printing available'],
      pro_tip: 'Gordon Library has a Reflection Space that\'s great for decompressing during stressful weeks. Mindful Thursday Meditation is a free event open to all students.',
    },
    'rubin-campus-center': {
      name: 'Rubin Campus Center',
      hours: 'Extended hours',
      description: 'Student center. Food court, Dunkin\', pool tables, meeting rooms.',
      features: ['Food court with multiple options', 'Dunkin\' on first floor', 'Pool tables on bottom level', 'Red couches overlooking athletic fields', 'Student organization offices', 'Tables on lower floors, couches on top floor'],
      pro_tip: 'The red couches on the top floor overlook the athletic fields - great spot to decompress. Pool tables on bottom level for when you need a break.',
    },
    'unity-hall': {
      name: 'Unity Hall',
      hours: 'Building hours',
      description: 'Newest building on campus. Modern study and collaboration spaces.',
      features: ['WPI\'s newest academic building', 'Modern study spaces', 'Collaborative work areas', 'Good alternative to Gordon Library when crowded'],
    },
    'atwater-kent': {
      name: 'Atwater Kent Laboratory',
      nickname: 'AK',
      hours: 'Class and lab hours',
      description: 'Engineering lab building. Has a famous "Pumpkin Lounge" and upstairs study space with view of Institute Park.',
      features: ['"Pumpkin Lounge" - hidden study spot', 'Upstairs study area with view of Institute Park', 'Engineering labs', 'EE and ECE department'],
      pro_tip: 'The "Pumpkin Lounge" in Atwater Kent is a student favorite study spot. The upstairs has a great view of Institute Park - much more peaceful than the main study areas.',
      hidden_gem: true,
    },
    'institute-park': {
      name: 'Institute Park',
      hours: 'Always accessible',
      description: 'Beautiful park directly adjacent to WPI campus. Reflecting pool, swans, outdoor space.',
      features: ['Beautiful green space right on campus edge', 'Reflecting pool near Higgins Gardens', 'Swans in the pond', 'Great for studying outdoors in nice weather', 'Outdoor relaxation and decompressing'],
      pro_tip: 'One of WPI\'s best features. Read a book by the reflecting pool, watch the swans, or just sit in the grass. Instagram-worthy campus scenery.',
    },
    'recreation-center': {
      name: 'WPI Recreation Center',
      hours: 'Mon-Thu 6am-11pm, Fri 6am-10pm, Sat-Sun 10am-8pm (verify wpi.edu)',
      description: 'Main gym and fitness center. Free for students.',
      features: ['Weight room and cardio', 'Basketball courts', 'Swimming pool', 'Red couches overlooking the fields', 'Free for students with WPI ID'],
    },
    'oasis-house': {
      name: 'OASIS House (Multicultural Center)',
      hours: 'Building hours',
      description: 'Multicultural center. Lounge, conference room, full kitchen. Open to all students for meetings, studying, and gathering.',
      features: ['Comfortable lounge', 'Conference room', 'Full kitchen', 'Indoor and outdoor gathering spaces', 'Open to all students for club meetings or hangouts'],
    },
    'wedge-social-lounge': {
      name: 'Wedge Social Lounge',
      location: 'Between Morgan and Daniels halls',
      hours: 'Building hours',
      description: 'Tucked between two dorms. Good for games, conversation, and casual hangouts.',
      features: ['Games available', 'Social space', 'Good for student groups'],
      pro_tip: 'Often overlooked but a solid chill spot between Morgan and Daniels.',
      hidden_gem: true,
    },
  },
  dining: {
    main_halls: [
      { name: 'Morgan Hall Dining', location: 'Morgan Hall', hours: { breakfast: '7:00am - 10:00am', lunch: '11:00am - 2:00pm', dinner: '5:00pm - 8:00pm' }, features: ['Main residential dining hall', 'Rotating menu', 'Vegetarian/vegan options', 'Allergen-free options available'] },
      { name: 'Goat\'s Head (Founders Hall)', location: 'Founders Hall', hours: { lunch: '11:00am - 10:00pm (varies)' }, features: ['Bar-restaurant style dining', 'Accepts Goatbucks (10% discount with Goatbucks)', 'Tuesday night trivia', 'Weekend sports viewing', '"Shaq Pizza" available to order and share', 'Social atmosphere'] },
      { name: 'Rubin Campus Center Food Court', location: 'Rubin Campus Center', hours: { breakfast: '7:00am - 10:00am', lunch: '10:30am - 3:00pm' }, features: ['Multiple food options', 'Quick grab-and-go', 'Between-class convenience'] },
    ],
    meal_plan_currency: 'Goatbucks',
    pro_tips: ['Goatbucks get you a 10% discount at all dining locations - load them using the GET app.', 'Use the GET mobile app for mobile ordering from any dining location.', 'Dining food gets mixed reviews - supplement with off-campus options.', 'Starship robots deliver food around campus - look for them!', 'Voluntary meal plans roll over each year for off-campus students.'],
  },
  study_spots: [
    { name: 'Atwater Kent "Pumpkin Lounge"', location: 'Atwater Kent building', vibe: 'quiet', hours: 'Building hours', features: ['Hidden spot', 'Good atmosphere', 'Near engineering labs', 'View of Institute Park upstairs'], pro_tip: 'This is what students who\'ve figured out WPI call "the Pumpkin Lounge." Quiet and rarely crowded.', hidden_gem: true },
    { name: 'Gordon Library - Upper floors', location: 'Gordon Library', vibe: 'quiet', hours: '24/7 during finals', features: ['Multiple quiet floors', 'Group rooms bookable', 'Computers available', 'Reflection space'] },
    { name: 'Unity Hall', location: 'Main campus', vibe: 'moderate', hours: 'Building hours', features: ['Modern spaces', 'Collaboration-friendly', 'Good for group projects'] },
    { name: 'Empty Classrooms', location: 'Throughout campus', vibe: 'quiet', hours: 'When not in use', features: ['Projector available', 'Tables and chairs', 'Quiet', 'Can use projector for group study'], pro_tip: 'WPI pro tip: empty classrooms are fair game when not in use. You can even use the projector. Great for group study sessions.', hidden_gem: true },
    { name: 'Rubin Campus Center - Top floor couches', location: 'Rubin Campus Center', vibe: 'social', hours: 'Building hours', features: ['Comfortable couches', 'Views of athletic fields', 'More relaxed atmosphere', 'Good for casual studying'] },
    { name: 'Innovation Studio', location: 'On campus', vibe: 'moderate', hours: 'Building hours', features: ['Open floor plan', 'Collaborative', 'Reserve tech suites for group work', 'Maker equipment available'], pro_tip: 'Reserve a tech suite in the Innovation Studio for group project work - useful for hands-on engineering projects.' },
    { name: 'Institute Park', location: 'Adjacent to campus', vibe: 'quiet', hours: 'Daylight hours (weather permitting)', features: ['Outdoor study in nice weather', 'Beautiful surroundings', 'Reflecting pool', 'Good for mental reset'] },
  ],
  hangout_spots: [
    { name: 'Goat\'s Head', location: 'Founders Hall', description: 'The main social hub at WPI. Bar-restaurant vibe, weekly trivia, sports games. Where WPI students gather.', best_for: ['Tuesday night trivia', 'Sports viewing', 'Group meals', 'Social hangouts'], hours: 'Until ~10pm or later for events' },
    { name: 'Rubin Campus Center', location: 'Central campus', description: 'Pool tables, food court, student spaces. Good for between-class hangouts.', best_for: ['Pool tables', 'Quick food', 'Student org meetings', 'Between classes'] },
    { name: 'East Hall Social Lounge', location: 'Ground floor near Founders Hall', description: 'Cozy spot to chill on ground floor of East Hall.', best_for: ['Casual hangouts', 'Small group chilling'] },
    { name: 'Hammock & Slackline Zone', location: 'Behind Rubin Campus Center', description: 'Outdoor hammock area. Bring a hammock or use the slackline. Great on nice days.', best_for: ['Nice weather relaxation', 'Outdoor hangouts', 'Stress relief'] },
    { name: 'Boynton Hill', location: 'Near Boynton Hall', description: 'Outdoor benches with a view of Worcester. Great for thinking and decompressing.', best_for: ['Views', 'Quiet reflection', 'Nice weather'] },
    { name: 'Science Fiction Society Gaming Nights', location: 'Campus Center - Friday nights', description: 'Weekly gaming night organized by the Science Fiction Society. Every Friday in the Campus Center.', best_for: ['Gaming', 'Meeting nerds (affectionately)', 'Free Friday entertainment'] },
    { name: 'Fuller Labs & Alden Hall Pianos', location: 'Fuller Labs and Alden Hall', description: 'Free pianos available in these buildings. Just knock to see if a room is open.', best_for: ['Musicians', 'Stress relief through music'] },
  ],
  late_night_food: [
    { name: 'Wings Over Worcester', hours: 'Open late', distance: 'Near WPI', what_to_get: 'Wings - they deliver late', price_range: '$10-20', pro_tip: 'WPI students\' go-to for late night wings delivery.' },
    { name: 'Coney Island Hot Dogs', hours: 'Varies - open late on weekends', distance: 'Downtown Worcester', what_to_get: 'Hot dogs - Worcester institution', price_range: '$3-8', pro_tip: 'A Worcester institution. Best hot dogs in the city. WPI\'s own "100 Things to Do" list includes this.' },
    { name: 'Price Chopper (take SNAP bus)', hours: 'Open late', distance: 'WRTA SNAP bus from campus', what_to_get: 'Late-night grocery run - snacks, drinks, real food', price_range: '$5-20', pro_tip: 'Take the free SNAP bus to Price Chopper for late-night snack runs. A WPI tradition.' },
    { name: 'Boston Donuts', hours: 'Check hours - late hours available', distance: 'Near WPI area', what_to_get: 'M&M donut or Oreo iced coffee', price_range: '$3-7', pro_tip: 'The M&M donut and Oreo iced coffee are the student favorites here.' },
    { name: 'Shrewsbury Street', hours: 'Many restaurants open until 10-11pm', distance: '~10-15 min drive from WPI', price_range: '$10-30', pro_tip: 'Worcester\'s restaurant row with 40+ restaurants. Both WPI and Clark students go here for a proper dinner out.' },
  ],
  nearby_food: [
    { name: 'The Boynton', type: 'Pub/Restaurant', distance: 'Near campus', price: '$$', known_for: 'Slider\'s night on Mondays. Student hangout spot.', hours: 'Lunch and dinner' },
    { name: 'Blue Jeans Pizza', type: 'Pizza', distance: 'Near WPI', price: '$', known_for: 'Buffalo chicken calzone - WPI students swear by it.' },
    { name: 'New England Roast Beef', type: 'Sandwiches', distance: 'Near WPI area', price: '$', known_for: 'Grinder with fries - classic Worcester comfort food.' },
    { name: 'Worcester Public Market', type: 'Market with food vendors', distance: 'Downtown Worcester', price: '$', known_for: 'Multiple food vendors. Good for weekend afternoon. Outdoor picnic tables.' },
    { name: 'The Sole Proprietor', type: 'Seafood', distance: '~15 min from WPI', price: '$$$', known_for: 'Cheap late-night sushi on Tuesdays. WPI\'s own "100 Things" list recommends it.' },
  ],
  transit: {
    on_campus: ['Campus is walkable for most purposes', 'Free safety shuttle available at night'],
    public_transit: ['WRTA buses serve the WPI area (42 routes around Worcester)', 'SNAP bus free shuttle for students', 'Union Station (downtown Worcester) for commuter rail to Boston (~1 hour)', 'Zipcar available for day trips'],
    free_for_students: false,
    pro_tips: ['SNAP free shuttle bus goes to key locations including Price Chopper', 'WRTA with 42 routes - good for exploring Worcester without a car', 'Zipcar for longer trips (Wrentham Outlets 45 min, Berkshires, coast of NH)', 'Boston is easy from Union Station commuter rail (~1 hour, ~$10-15)', 'Polar Park (WooSox games) is walkable from downtown - fun cheap outing'],
  },
  athletics: {
    division: 'NCAA Division III',
    gym_name: 'WPI Recreation Center',
    gym_hours: 'Mon-Thu 6am-11pm, Fri 6am-10pm, Sat-Sun 10am-8pm',
    facilities: ['Weight room and cardio', 'Basketball courts', 'Swimming pool', 'Red couches with field views (unofficial hangout)'],
    free_for_students: true,
    pro_tip: 'Red couches in the rec center overlooking the fields are a great hangout spot even if you\'re not working out. Also: Central Rock Gym (rock climbing) does College Night on Thursdays.',
  },
  academic_culture: 'Project-based learning is WPI\'s hallmark. Major Qualifying Project (MQP) and Interactive Qualifying Project (IQP) are required of all students - real-world engineering and interdisciplinary projects. 7-week term system (A, B, C, D terms) is fast-paced and intense. "We Prefer Initials" is the student joke about the many acronyms. STEM-focused but has humanities departments. Professors are generally accessible and supportive. Collaborative culture - students work together on projects. Very engineering-heavy culture.',
  student_vibe: 'Engineering-nerdy, collaborative, tight-knit. Greek life exists (~25% of students) but is not dominant. Sports culture is present but NCAA Division III so not huge. Students are serious about their work but find time for fun. "We Prefer Initials" joke is accurate - everything has an acronym. Small enough that you recognize faces quickly. Winter Carnival and Spring Carnival are big annual events.',
  famous_for: ['Project-based learning - MQP and IQP required of all students', '7-week term system - intense, fast-paced', 'Global IQP projects - you might study abroad for your IQP', 'Goat mascot "Gompei" - one of the oldest college mascots', 'Goat\'s Head pub and Tuesday trivia nights', 'Starship delivery robots on campus', 'Institute Park and the reflecting pool', 'Winter Carnival and Spring Carnival ("Goat\'s Head Day")', 'Highest starting salaries among peer institutions'],
  pro_tips: ['The 7-week term system is brutal - stay ahead of work from day one. Procrastination is fatal.', 'Empty classrooms are fair game when not in class - you can even use the projector.', 'Goatbucks give you 10% off at all dining locations - load them in the GET app.', 'Starship robots deliver food on campus - use the app to order.', 'SNAP bus to Price Chopper for late-night grocery/snack runs.', 'Gordon Library Reflection Space for when you need 5 minutes of peace.', 'Fuller Labs has free pianos - just knock to see if a room is open.', 'Science Fiction Society gaming night every Friday is free and genuinely fun.', 'Central Rock Gym: College Night on Thursdays for rock climbing.', 'Work on Worcester event in fall: good way to get involved in the community.', '"WPI stands for We Prefer Initials" - learn the acronyms early or you\'ll be lost.', 'MQP tip: Start looking for a project adviser EARLY - the good ones fill up.', 'Boynton Hill has a great view of Worcester for when you need perspective.'],
  common_questions: [
    { question: 'What is the term system at WPI?', answer: 'WPI operates on four 7-week terms per year (A, B, C, D terms). Each term is intense and fast-paced. Instead of traditional semesters, you have shorter, focused terms. This means you can fail a class quickly if you fall behind - but also means finals and midterms happen more frequently and each one counts less. Most students find it works well if you stay organized.' },
    { question: 'What is the MQP and IQP?', answer: 'MQP (Major Qualifying Project): A year-long capstone project in your major where you work on a real engineering or science problem, often with a company sponsor. IQP (Interactive Qualifying Project): An interdisciplinary project that applies technical skills to a social need - many students do this abroad in WPI project centers worldwide. Both are required for graduation and are what make a WPI degree distinctive.' },
    { question: 'What is The Goat\'s Head?', answer: 'The Goat\'s Head is WPI\'s main social dining spot in Founders Hall. It\'s a pub/restaurant with a fun atmosphere. Tuesday night trivia is a campus institution. Also a great spot to watch Red Sox and Patriots games on weekends. Accepts Goatbucks (your student account currency) with a 10% discount.' },
    { question: 'Where should I eat late at night?', answer: 'Late night options: (1) Wings Over Worcester - delivers late, great wings. (2) SNAP bus to Price Chopper for grocery runs. (3) Boston Donuts - M&M donut and Oreo iced coffee are student favorites. (4) Blue Jeans Pizza for a buffalo chicken calzone. (5) Downtown Worcester has several options if you Uber there.' },
    { question: 'What is there to do at WPI for fun?', answer: 'Fun options: (1) Goat\'s Head trivia on Tuesdays. (2) Science Fiction Society gaming night every Friday at the Campus Center. (3) Pool tables in Rubin Campus Center basement. (4) Hammock zone behind Rubin. (5) Institute Park - walk by the reflecting pool, watch the swans. (6) SocComm events - check MyWPI for shows, comedy acts, trips. (7) Movies in Perreault Auditorium every Saturday and Sunday at 8pm (first-run films).' },
  ],
}

const bostonUniversity: UniversityKnowledge = {
  name: 'Boston University',
  domain: 'bu.edu',
  location: 'Boston, Massachusetts',
  address: '1 Silber Way, Boston, MA 02215',
  coordinates: { lat: 42.3505, lng: -71.1054 },
  campus_size: '135 acres (linear campus along Commonwealth Ave)',
  enrollment: '~36,000+ students (undergrad + grad)',
  mascot: 'Terrier',
  colors: 'Scarlet and White',
  nickname: 'Terriers',
  motto: 'Learning, Virtue, Piety',
  founded: 1839,
  website: 'www.bu.edu',
  emergency: { police: '911', non_emergency: '(617) 353-2121' },
  wifi: {
    'BU Guest': 'Open WiFi for campus use.',
    'BU Wireless': 'Authenticated student WiFi with BU login credentials.',
  },
  student_id_name: 'BUid (Terrier Card)',
  currency_name: 'Dining Points / Convenience Points',
  buildings: {
    'mugar-library': {
      name: 'Mugar Memorial Library',
      nickname: 'Mugar',
      hours: 'Extended hours during semester. 24/7 during finals (April 30 - May 8 specifically). Regular year: varies by floor.',
      description: 'BU\'s main library and premier study spot. 7 floors. Gets quieter the higher you go. Largest computer lounge on campus on ground floor.',
      features: ['7 floors - ground floor most social, upper floors increasingly quiet', 'Largest computer lounge on campus (ground floor)', '24/7 during study period and finals', 'Free overnight shuttle bus from midnight to 6am during finals', 'Group study rooms', 'Printing services', 'Floor 3: Large desks and open spaces for group study'],
      pro_tip: 'Ground floor for social/collaborative work. Each floor gets progressively quieter - 6th/7th floor for serious solo cramming. During finals: 24/7 access. BU Libraries runs a free overnight shuttle midnight to 6am during finals week.',
    },
    'gsu': {
      name: 'George Sherman Union',
      nickname: 'GSU',
      hours: 'Daily extended hours',
      description: 'Main student union. Huge food court, student lounges, Ziskind Lounge, Dean\'s Study Lounge.',
      features: ['Food court on 2nd floor - multiple options', 'Communal areas and study lounges upstairs', 'Ziskind Lounge for focused work', 'Dean\'s Study Lounge for collaboration', 'Good for group projects', 'Easy to refuel while studying'],
      pro_tip: 'Go upstairs from the food court for quieter study space. Ziskind Lounge and Dean\'s Study Lounge are both solid. Study rooms go quickly so arrive early.',
    },
    'yawkey-center': {
      name: 'Yawkey Center for Student Services',
      nickname: 'Yawkey',
      hours: 'Extended hours; Bay State Underground opens after dark',
      description: 'Student services hub. Also home to Bay State Underground in the basement - one of BU\'s best-kept secrets for late night.',
      features: ['Student services on upper floors', 'Bay State Underground in basement - LATE NIGHT GEM', 'O-Mori Ramen Bar also in basement', 'Comfortable seating and BU memorabilia throughout'],
      pro_tip: 'Bay State Underground is the secret late night spot at BU. Open Sunday-Wednesday 7pm-midnight, Thursday-Saturday 7pm-2am. Comfort food (burgers, pizza, fries) and ramen. Accepts dining and convenience points.',
    },
    'bay-state-underground': {
      name: 'Bay State Underground',
      location: 'Yawkey Center basement, 100 Bay State Road',
      hours: 'Sun-Wed: 7pm - midnight; Thu-Sat: 7pm - 2am',
      description: 'BU\'s best-kept secret for late night food. Comfort food AND ramen bar in the basement. Open only after dark. Accepts dining/convenience points.',
      features: ['Burgers, fries, chicken fingers, brick oven pizzas (Bay State Underground)', 'O-Mori Ramen Bar - build-your-own ramen bowls', 'Eat in or take out', 'Comfy seating - good for studying while eating late', 'Accepts dining and convenience points', 'BU memorabilia on walls'],
      pro_tip: 'This is THE BU hidden gem. Most freshmen don\'t know it exists. Goes late on weekends (2am). Great for a late night study break with real food. Use your dining/convenience points.',
      hidden_gem: true,
    },
    'fitrec': {
      name: 'Fitness and Recreation Center (FitRec)',
      nickname: 'FitRec',
      hours: '6am - 11pm daily (may vary, check bu.edu/fitrec)',
      description: 'Main gym and fitness center. One of the best facilities in the Boston university system.',
      features: ['Full fitness center with latest equipment', 'Olympic-sized indoor pool', 'Basketball courts', 'Racquetball and squash courts', 'Rock climbing wall - very popular', 'Group fitness classes (yoga, spinning, etc.)', 'Free for students with BU ID'],
      pro_tip: 'Rock climbing wall is very popular and a BU student favorite. Free for students. Can be busy evenings - go early morning or midday to avoid waits.',
    },
    'stuvi2': {
      name: 'Student Village 2 (StuVi2)',
      nickname: 'StuVi2',
      hours: 'Resident access',
      description: 'Dorm building. Top floor has sweeping views of Boston\'s skyline - one of the best views on campus.',
      features: ['Student housing', 'Top floor: stunning Boston skyline views', 'Comfortable couches and tables on top floor', 'Open to residents and their guests'],
      pro_tip: 'If you know someone in StuVi2, get them to take you to the top floor. The view of Boston\'s skyline is one of the most stunning spots in any Boston college.',
    },
    'kilachand-hall': {
      name: 'Kilachand Hall',
      hours: 'Resident access',
      description: 'Dorm/academic building. Top floor has stunning city views and ample study space.',
      features: ['Top floor: Beautiful view of Boston', 'Lots of tables and study space on top floor', 'Only accessible with resident swipe-in'],
      pro_tip: 'Beautiful top floor study spot - but you need a resident to swipe you in. If you\'re not a resident, befriend someone who is.',
    },
    'com-building': {
      name: 'College of Communication Building',
      hours: 'Extended building hours',
      description: 'COM school building. Has free newspapers, a student lounge with charging stations, and a black & white printer.',
      features: ['Free newspapers available daily', 'Student lounge with charging stations', 'Black and white printer (room 338 for color)', 'Vending machines nearby', 'Basement classrooms often available when not in use'],
      pro_tip: 'Even if you\'re not a COM student, this is a solid study spot. Free newspapers, charging stations, and usually quiet. Classroom spaces in basement are fair game when not scheduled.',
      hidden_gem: true,
    },
    'charles-river': {
      name: 'Charles River Esplanade',
      hours: 'Always accessible',
      description: 'The Charles River runs along BU\'s campus. Beautiful views, running path, picnic areas.',
      features: ['Gorgeous views especially at sunset', 'Running path along the river', 'Picnic areas', 'Kayaking/sailing available seasonally', 'Boston skyline views from Cambridge side'],
      pro_tip: 'The Charles River is BU\'s natural asset. Walk or run along it when you need a mental reset. Sunset from the BU Bridge is stunning.',
    },
    'mugar-science-library': {
      name: 'Stone Science Library',
      location: 'Inside CAS (College of Arts and Sciences) building',
      hours: 'Extended hours',
      description: 'Hidden gem science library inside CAS. Often empty - perfect for isolated studying.',
      features: ['Often empty - great for focused solo work', 'Surrounded by books, journals, atlases', 'Quiet atmosphere', 'Geddes Language Center on top floor (computers in semi-private booths)', 'Free Keurig machine in the Language Center'],
      pro_tip: 'The Stone Science Library inside CAS is almost always empty. Perfect for solo cramming in peace. Go one floor up to the Geddes Language Center for private computer booths AND a free Keurig coffee machine.',
      hidden_gem: true,
    },
    'theology-library': {
      name: 'School of Theology Library',
      hours: 'Business hours',
      description: 'Warm, cozy library with tables hidden among bookshelves. Perfect for quiet studying on bad weather days.',
      features: ['Warm and cozy - great on winter days', 'Tables tucked within bookshelves throughout', 'Very low noise level', 'Not crowded', 'Open to all BU students'],
      pro_tip: 'Underrated gem. The Theology Library feels like a private reading room - warm, cozy, bookshelves everywhere, and tables hidden among them. Almost no one here. Perfect on a snowy January day.',
      hidden_gem: true,
    },
    't-pub': {
      name: 'T\'s Pub',
      location: 'West Campus',
      hours: 'Until 2am daily (food served until 11pm)',
      description: 'BU West Campus pub/restaurant. Popular with students. Wings, burgers, sandwiches.',
      features: ['Open until 2am daily', 'Wings - try the Terrier wings (habanero sauce, "fiercely hot")', 'Burgers, sandwiches, salad bowls', 'Sports bar atmosphere', 'Popular for watching Boston sports games'],
      pro_tip: 'T\'s Pub is the West Campus social spot. Open until 2am. Try the Terrier wings if you can handle the heat. Good for watching Celtics/Bruins/Red Sox games late at night.',
    },
  },
  dining: {
    main_halls: [
      { name: 'Dining Hall (Allston) / West Campus Dining', location: 'West Campus', hours: { breakfast: '7:00am - 10:30am', lunch: '11:00am - 2:30pm', dinner: '5:00pm - 8:30pm' }, features: ['Large cafeteria', 'Multiple stations', 'Vegetarian/vegan options', 'Near West Campus dorms'] },
      { name: 'Late Nite Cafe (West Campus location)', location: 'West Campus Dining', hours: { late_night: 'Late evening until midnight or later' }, features: ['Late night dining option', 'Accepts meal plan', 'Extended hours for night owls'] },
      { name: 'GSU Food Court', location: 'George Sherman Union, 2nd floor', hours: { breakfast: '7:00am - 10:00am', lunch: '10:00am - 8:00pm' }, features: ['Multiple food options', 'Central campus location', 'Quick grab-and-go'] },
    ],
    late_night: [{ name: 'Bay State Underground', hours: 'Sun-Wed 7pm-midnight, Thu-Sat 7pm-2am', features: ['Best late night dining at BU', 'Burgers, pizza, ramen bar', 'Accepts dining and convenience points', 'Basement of Yawkey Center'] }],
    meal_plan_currency: 'Dining Points / Convenience Points',
    pro_tips: ['Bay State Underground (Yawkey basement) is THE late night spot - open until 2am Thu-Sat.', 'Domino\'s delivers until 3am and accepts BU dining/convenience points. Use code "RHETT" for 50% off orders over $14.', 'T\'s Pub on West Campus is open until 2am and serves real food.', 'BU dining meal plans: required for freshmen, optional for upperclassmen.', 'Convenience Points vs Dining Points - convenience points more flexible for on/off campus.', 'Late Nite Cafe on West Campus for late studying with food.'],
  },
  study_spots: [
    { name: 'Mugar Library - Upper floors (6th-7th)', location: 'Mugar Memorial Library', vibe: 'quiet', hours: '24/7 during finals', features: ['Quietest floors', 'Good for solo intensive work', '24/7 during exam period', 'Computer access'], pro_tip: 'Floor 3 for groups (large desks, open space), floors 6-7 for solo silent work. During finals, take the free overnight shuttle midnight-6am.' },
    { name: 'Stone Science Library (inside CAS)', location: 'CAS building', vibe: 'quiet', hours: 'Extended hours', features: ['Almost always empty', 'Journals and atlases', 'Peaceful atmosphere', 'Geddes Language Center on top floor with free Keurig'], pro_tip: 'Hidden gem. Free coffee machine in the Language Center upstairs. Bring your travel mug.', hidden_gem: true },
    { name: 'Theology Library', location: 'School of Theology', vibe: 'quiet', hours: 'Business hours', features: ['Warm and cozy', 'Tables hidden in bookshelves', 'Very few students know about it', 'Perfect for rainy/cold days'], hidden_gem: true },
    { name: 'Bay State Underground (late night studying)', location: 'Yawkey Center basement', vibe: 'social', hours: 'Sun-Wed until midnight, Thu-Sat until 2am', features: ['Study while eating', 'Comfortable seating', 'Good food available', 'Late night option'], pro_tip: 'Perfect for late-night study sessions with food. Cozy atmosphere with BU memorabilia.' },
    { name: 'GSU Ziskind Lounge / Dean\'s Study Lounge', location: 'George Sherman Union, upper floor', vibe: 'moderate', hours: 'GSU hours', features: ['Focused work environment', 'Collaborative spaces', 'Near food court for quick refueling'] },
    { name: 'COM Building Lounge', location: 'College of Communication', vibe: 'quiet', hours: 'Extended building hours', features: ['Charging stations', 'Quiet atmosphere', 'Black and white printer', 'Free newspapers'], hidden_gem: true },
    { name: 'Boston Public Library (Copley)', location: 'Copley Square (Green Line - Copley stop)', vibe: 'quiet', hours: 'Mon-Thu 9am-9pm, Fri-Sat 9am-5pm, Sun 1-5pm', features: ['Free with BU ID (get a library card)', 'Historic, beautiful building (look up at the ceiling!)', 'Multiple study floors', 'Near Newbury Street food'], pro_tip: 'Get a Boston Public Library card - it\'s free for BU students. The main reading room is one of the most beautiful spaces in Boston. Look up at the ceiling when you walk in.' },
    { name: 'Charles River Esplanade (outdoors)', location: 'Along Commonwealth Ave', vibe: 'social', hours: 'Daylight hours', features: ['Outdoor studying in nice weather', 'Beautiful views', 'Running break available', 'Mental health reset'] },
  ],
  hangout_spots: [
    { name: 'Bay State Underground', location: 'Yawkey Center basement', description: 'Late night secret gem. Open after dark, comfort food + ramen, cozy atmosphere. BU memorabilia on the walls. Great for late night hangouts.', best_for: ['Late night food and hangouts', 'Studying with food nearby', 'Weekend late nights'], hours: 'After dark - Sun-Wed until midnight, Thu-Sat until 2am' },
    { name: 'StuVi2 Top Floor', location: 'Student Village 2', description: 'Best views of Boston\'s skyline at BU. Couches and tables, open to residents and guests.', best_for: ['Views', 'Night study with skyline backdrop', 'Impressing visitors to campus'] },
    { name: 'T\'s Pub', location: 'West Campus', description: 'Late night bar/restaurant open until 2am. Sports bar vibes, great for watching games.', best_for: ['Sports watching', 'Late night food', 'West Campus social scene'], hours: 'Until 2am daily' },
    { name: 'COM Lawn (waffle truck)', location: 'Outside Communication school', description: 'There\'s a waffle truck parked outside COM every day. Great spot to eat, people-watch, and relax.', best_for: ['Quick outdoor hangout', 'Waffles', 'People watching'] },
    { name: 'Charles River', location: 'Along campus edge', description: 'Walk or sit by the Charles River for a mental reset. Best in fall and spring.', best_for: ['Walking', 'Mental reset', 'Running', 'Outdoor relaxation'] },
    { name: 'Nickerson Field (when not in use)', location: 'West Campus', description: 'BU\'s main athletic field. When not in use, a nice open space to relax.', best_for: ['Nice weather', 'Open space activities'] },
    { name: 'Duan Family Center for Computing & Data Sciences', nickname: 'Jenga Building', description: 'Famous architecturally - nicknamed "the Jenga building" by students because it looks like a Jenga tower. Worth seeing and hanging around near.', best_for: ['Instagram photo', 'Meeting spot', 'Unique campus architecture'] },
  ],
  late_night_food: [
    { name: 'Bay State Underground', hours: 'Sun-Wed 7pm-midnight, Thu-Sat 7pm-2am', distance: 'On campus, Yawkey Center basement', what_to_get: 'Burgers, fries, O-Mori Ramen bowls', price_range: '$8-15', pro_tip: 'Accepts dining AND convenience points. The best on-campus late night food. Secret spot most freshmen don\'t know.' },
    { name: 'T\'s Pub', hours: 'Until 2am daily (food until 11pm)', distance: 'West Campus', what_to_get: 'Terrier wings (habanero - very hot) or regular wings, burgers', price_range: '$10-20' },
    { name: 'Domino\'s (delivers to campus until 3am)', hours: 'Until 3am delivery', distance: 'Delivered to your dorm', what_to_get: 'Pizza - use code "RHETT" for 50% off orders over $14', price_range: '$10-25', pro_tip: 'Game-changing tip: code "RHETT" for 50% off Domino\'s orders over $14. Delivers to BU until 3am. They accept dining and convenience points.' },
    { name: 'Late Nite Cafe', hours: 'Until midnight or later (check website)', distance: 'West Campus Dining', price_range: '$5-12', pro_tip: 'Accepts meal plan. Best bet if you want real food and don\'t want to leave campus.' },
    { name: 'Allston area restaurants', hours: 'Many open until 1-3am', distance: '15-20 min walk or quick T ride', what_to_get: 'Cheap eats from the college neighborhood - many options', price_range: '$5-15', pro_tip: 'Allston is a college neighborhood with tons of cheap late-night options. Take the Green Line B branch.' },
  ],
  nearby_food: [
    { name: 'Saxbys (on campus)', type: 'Coffee and food', distance: 'On campus', price: '$', known_for: 'Great breakfast burrito and coffee. Easy on-campus spot between classes.' },
    { name: 'Pavement Coffeehouse', type: 'Coffee shop', distance: 'Near campus and multiple locations', price: '$', known_for: 'Great bagels (good for NYC bagel standards). Cozy study atmosphere.' },
    { name: 'Trident Bookstore (Newbury Street)', type: 'Cafe/bookstore', distance: 'Newbury Street (few T stops)', price: '$', known_for: 'Adorable cafe inside a bookstore. Very cozy study spot on Newbury.' },
    { name: 'Allston restaurants', type: 'Various cheap eats', distance: 'Green Line B branch, 15-20 min', price: '$', known_for: 'College area with tons of cheap food options. Great for a Saturday night out with friends.' },
    { name: 'Brookline restaurants', type: 'Trendy / cafes', distance: 'Green Line C or D branch', price: '$$ - $$$', known_for: 'Trendy restaurants and cafes. More upscale than Allston. Great for nicer dinners.' },
    { name: 'Newbury Street', type: 'Upscale shopping and dining', distance: '2-3 T stops (Hynes or Copley)', price: '$$ - $$$', known_for: 'Shopping, great restaurants, Pavement Coffee. Bring Husky Card - many stores give student discounts.' },
  ],
  transit: {
    on_campus: ['BU is a linear campus (1 mile long along Commonwealth Ave) - it\'s a 15-20 minute walk end to end', 'Free BU shuttle buses run along Commonwealth Ave throughout the day', 'Boston skyline visible and walking along Charles River is encouraged'],
    public_transit: ['Green Line (B branch) runs along Commonwealth Ave with multiple BU stops: BU East, BU Central, BU West, St. Paul St, Babcock St', 'MBTA Bus routes throughout the area', 'T access to all of Boston, Cambridge, and beyond'],
    free_for_students: true,
    transit_pass_name: 'MBTA U-Pass (free for BU students)',
    pro_tips: ['The Green Line B branch runs along Commonwealth Ave - this IS your on-campus transit. Learn the stops.', 'U-Pass is FREE for BU students. Pick it up at the BU ID office. Saves you $90/month.', 'Overnight shuttle during finals: Free bus midnight-6am from Mugar Library.', 'Allston and Brookline both walkable or very short T ride - explore them early.', 'The Charles River path is great for running and biking. Rent a Bluebikes from campus.', 'Logan Airport: Take the Green Line to Government Center, then Blue Line to Airport. No Uber needed.'],
  },
  athletics: {
    division: 'NCAA Division I',
    gym_name: 'Fitness and Recreation Center (FitRec)',
    gym_hours: '6am-11pm daily (verify at bu.edu/fitrec)',
    facilities: ['Full fitness center', 'Olympic-sized indoor pool', 'Basketball courts', 'Racquetball and squash courts', 'Rock climbing wall', 'Group fitness classes', 'Walter Brown Arena (ice hockey)', 'Nickerson Field (soccer/football)'],
    free_for_students: true,
    pro_tip: 'Rock climbing wall at FitRec is very popular - a great stress reliever and social activity. You can take beginner lessons. Free for students.',
  },
  academic_culture: 'Large research university (36,000+ students). Classes can be large, especially freshman year. Strong in communications/journalism, business (Questrom), engineering, medicine (pre-med), and arts. Traditional classroom learning with growing experiential components. Good academic support services. Career services with strong Boston employer network. Competitive for internships given Boston employer access.',
  student_vibe: 'Big university energy - diverse, competitive, urban. Hockey is HUGE (BU vs BC rivalry is one of the most intense in college sports). Large Greek life presence but doesn\'t dominate. Boston access means students explore the city constantly. Many students work part-time given proximity to employers. Social scene tied heavily to the city - not just the campus bubble.',
  famous_for: ['BU vs BC ice hockey rivalry (one of the most intense in college sports)', 'Free MBTA U-Pass for all students', 'COM (College of Communication) - one of the best in the country', 'Bay State Underground - the late-night hidden gem', 'Charles River campus views', '"Jenga Building" (Duan Center) - architecturally famous', 'Questrom School of Business', 'Free overnight library shuttle during finals', 'Domino\'s 50% off code "RHETT" for orders over $14', 'Largest private university in New England', 'Walter Brown Arena - ice hockey, one of the best D1 programs', 'BU Medical Campus - pre-med pipeline'],
  pro_tips: ['Bay State Underground in the Yawkey basement is THE best-kept BU secret. Open after dark, amazing food, accepts dining points. Most freshmen don\'t find out until sophomore year.', 'Domino\'s code "RHETT" = 50% off orders over $14. Delivers until 3am. They accept dining/convenience points.', 'Get your FREE U-Pass (MBTA) from the BU ID office immediately. Saves $90/month.', 'Stone Science Library inside CAS building: almost always empty, free Keurig in the language center upstairs.', 'Theology Library: warm, cozy, almost no one there. Best bad-weather study spot.', 'Green Line B runs along Commonwealth Ave with 5 BU stops - use it to traverse the mile-long campus.', 'FitRec rock climbing wall is free for students and a great social activity/stress reliever.', 'COM Building: free newspapers, charging stations, usually quiet. Good non-obvious study spot.', 'StuVi2 top floor = best skyline view at BU. Befriend a resident.', 'Saxbys for a great breakfast burrito between classes.', 'Trident Bookstore on Newbury - cafe + bookstore + cozy study spot. Worth the T ride.', 'Check BU social media accounts and posters around campus for free events, thrift pop-ups, comedy shows.', 'Work at FitRec or as a tour guide for easy on-campus jobs.', 'T\'s Pub on West Campus is open until 2am - great for late night food and sports watching.'],
  common_questions: [
    { question: 'What is Bay State Underground?', answer: 'Bay State Underground is BU\'s best-kept secret for late night food. It\'s in the basement of Yawkey Center at 100 Baystate Road. Open Sunday-Wednesday 7pm-midnight, Thursday-Saturday 7pm-2am. They serve comfort food (burgers, fries, brick oven pizza) AND have an O-Mori Ramen Bar. Accepts dining and convenience points. Great for late-night studying with real food. The walls are covered in old BU memorabilia.' },
    { question: 'How do I get food after midnight at BU?', answer: 'Options: (1) Bay State Underground - until midnight Sun-Wed, until 2am Thu-Sat. (2) T\'s Pub on West Campus - food until 11pm, open until 2am. (3) Domino\'s delivery until 3am - they accept dining/convenience points, use code "RHETT" for 50% off orders over $14. (4) Late Nite Cafe (West Campus Dining). For variety: Green Line to Allston (20 min) has lots of cheap late night options.' },
    { question: 'Where should I study at BU?', answer: 'Main options: (1) Mugar Library - go upper floors for quiet, ground/3rd floor for groups. 24/7 during finals. (2) Stone Science Library inside CAS - almost always empty, free Keurig upstairs. Hidden gem. (3) Theology Library - cozy, warm, tables in bookshelves, almost no one there. (4) GSU Ziskind/Dean\'s Lounge - good for groups with food nearby. (5) Bay State Underground for late night studying with food.' },
    { question: 'Is the gym free?', answer: 'Yes, FitRec (Fitness and Recreation Center) is free for all BU students with your ID. Hours: 6am-11pm daily. Facilities include full fitness center, Olympic pool, basketball, racquetball, squash courts, and a rock climbing wall. Rock climbing wall is a student favorite - beginner lessons available.' },
    { question: 'How do I get around campus and Boston?', answer: 'BU campus is linear - 1 mile along Commonwealth Ave. Free BU shuttle buses run along the avenue. Green Line B branch has 5 stops along campus (BU East, Central, West, St. Paul, Babcock). Your MBTA U-Pass is FREE - pick it up at the BU ID office. It covers all subway and bus lines in Boston, saving you $90/month. Get it immediately - it\'s one of BU\'s biggest student benefits.' },
    { question: 'What is the BU vs BC rivalry?', answer: 'The BU-BC (Boston College) hockey rivalry is one of the most intense in college sports. Known as the "Beanpot" tournament (held every February at the TD Garden), BU and BC face off along with Harvard and Northeastern. BU hockey has won 5 national championships. Game days are electric on campus. Get your student tickets early - they go fast.' },
  ],
}

export const universityKnowledgeBase: Record<string, UniversityKnowledge> = {
  'clarku.edu': clarkUniversity,
  'northeastern.edu': northeasternUniversity,
  'wpi.edu': wpiUniversity,
  'bu.edu': bostonUniversity,
}

export function getUniversityKnowledge(domain: string): UniversityKnowledge | null {
  return universityKnowledgeBase[domain] ?? null
}

export function buildKnowledgeContextString(domain: string): string {
  const uni = getUniversityKnowledge(domain)
  if (!uni) return ''

  const lines: string[] = [
    `UNIVERSITY: ${uni.name}`,
    `LOCATION: ${uni.location}`,
    `ADDRESS: ${uni.address}`,
    `ENROLLMENT: ${uni.enrollment}`,
    `MASCOT: ${uni.mascot}`,
    `EMERGENCY CONTACTS: Police 911 | Campus Non-Emergency: ${uni.emergency.non_emergency}`,
    uni.emergency.mental_health_after_hours ? `MENTAL HEALTH AFTER HOURS: ${uni.emergency.mental_health_after_hours}` : '',
    `STUDENT ID: ${uni.student_id_name}`,
    `CAMPUS CURRENCY: ${uni.currency_name}`,
    '',
    `WIFI:`,
    ...Object.entries(uni.wifi).map(([name, desc]) => `  - ${name}: ${desc}`),
    '',
    `CAMPUS VIBE: ${uni.student_vibe}`,
    '',
    `FAMOUS FOR: ${uni.famous_for.join(', ')}`,
    '',
    `KEY BUILDINGS:`,
    ...Object.values(uni.buildings).map(b =>
      `  - ${b.name}${b.nickname ? ` (aka ${b.nickname})` : ''}: ${b.description}. Hours: ${b.hours ?? 'varies'}. ${b.pro_tip ? `Pro tip: ${b.pro_tip}` : ''}`
    ),
    '',
    `STUDY SPOTS:`,
    ...uni.study_spots.map(s =>
      `  - ${s.name} (${s.location}): ${s.vibe} vibe. Hours: ${s.hours}. Features: ${s.features.join(', ')}${s.hidden_gem ? ' [HIDDEN GEM]' : ''}. ${s.pro_tip ?? ''}`
    ),
    '',
    `HANGOUT SPOTS:`,
    ...uni.hangout_spots.map(h =>
      `  - ${h.name} (${h.location ?? 'campus'}): ${h.description}. Best for: ${h.best_for.join(', ')}.`
    ),
    '',
    `DINING HALLS:`,
    ...uni.dining.main_halls.map(d =>
      `  - ${d.name}: Breakfast ${d.hours.breakfast ?? 'N/A'} | Lunch ${d.hours.lunch ?? 'N/A'} | Dinner ${d.hours.dinner ?? 'N/A'}. Features: ${d.features?.join(', ') ?? 'standard dining'}.`
    ),
    '',
    uni.dining.pro_tips ? `DINING TIPS: ${uni.dining.pro_tips.join(' | ')}` : '',
    '',
    `LATE NIGHT FOOD (after 10pm):`,
    ...uni.late_night_food.map(l =>
      `  - ${l.name}: Open ${l.hours}. Distance: ${l.distance}. Get: ${l.what_to_get ?? 'varies'}. Price: ${l.price_range ?? 'varies'}. ${l.pro_tip ?? ''}`
    ),
    '',
    `ATHLETICS (${uni.athletics.division}):`,
    `  Gym: ${uni.athletics.gym_name} | Hours: ${uni.athletics.gym_hours ?? 'varies'} | Free for students: ${uni.athletics.free_for_students ? 'YES' : 'NO'}`,
    `  Facilities: ${uni.athletics.facilities.join(', ')}`,
    uni.athletics.pro_tip ? `  Pro tip: ${uni.athletics.pro_tip}` : '',
    '',
    `TRANSIT:`,
    ...(uni.transit.on_campus ?? []).map(t => `  - ${t}`),
    ...(uni.transit.public_transit ?? []).map(t => `  - ${t}`),
    uni.transit.free_for_students ? `  FREE TRANSIT PASS: ${uni.transit.transit_pass_name ?? 'Yes, check student services'}` : '',
    '',
    `PRO TIPS FOR STUDENTS:`,
    ...uni.pro_tips.map((tip, i) => `  ${i + 1}. ${tip}`),
    '',
    `COMMON Q&A:`,
    ...uni.common_questions.map(qa => `  Q: ${qa.question}\n  A: ${qa.answer}`),
  ]

  return lines.filter(Boolean).join('\n')
}
