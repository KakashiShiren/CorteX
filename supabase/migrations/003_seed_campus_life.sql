delete from ai_knowledge_base
where title in ('Late Night Food Options Near Clark', 'Convenience Stores Near Clark')
   or title like 'Restaurants Near Clark University - %';

with payload (title, content, keywords, source, category) as (
  values
    (
      'The Grind at Higgins University Center',
      'The Grind is a popular student hangout space located in the basement of Higgins University Center (HUC). It has a pool table, a Pac-Man arcade machine, and is a go-to spot for students to relax and socialize. Many campus events are also hosted at The Grind. Check the Corq app for upcoming events happening there.',
      array['grind', 'the grind', 'huc', 'higgins', 'basement', 'pool table', 'billiards', 'pacman', 'arcade', 'hangout', 'chill', 'events', 'fun', 'bored', 'things to do', 'recreation', 'social']::text[],
      'https://www.clarku.edu/offices/student-engagement/higgins-university-center/',
      'activities'
    ),
    (
      'Gaming Consoles and Board Games at MACD',
      'Gaming consoles (Xbox and PlayStation) are available on the second floor of the Center for Media Arts, Computing, and Design (MACD) building. Board games are also available on the same floor, stored in cupboards next to the consoles. Students can use these freely during building hours. MACD building access closes at 11PM but students already inside can stay all night.',
      array['xbox', 'playstation', 'console', 'gaming', 'video games', 'board games', 'games', 'macd', 'media arts', 'second floor', 'floor 2', 'fun', 'bored', 'things to do', 'hang out', 'recreation']::text[],
      'https://www.clarku.edu',
      'activities'
    ),
    (
      'Game Nights and Campus Events',
      'Game nights and social events are regularly hosted across campus at different locations including MACD, The Grind in HUC basement, and the Asher Suite on the 3rd floor of Higgins University Center. To find out what events are happening, check the Corq app which lists all upcoming Clark University student events.',
      array['game night', 'events', 'social', 'asher suite', 'huc', 'macd', 'grind', 'corq', 'corq app', 'upcoming events', 'things to do', 'tonight', 'this weekend', 'fun', 'activities']::text[],
      'https://www.clarku.edu/offices/student-engagement/',
      'activities'
    ),
    (
      'Late Night Study Spots on Campus',
      'Best spots for late night studying at Clark: Goddard Library common area is open 24 hours. MACD building closes access at 11PM but students already inside can stay all night to study or work. Dana Commons lounge area is a good option too. Residence hall dorms and lounges are always accessible for residents. The corner room in MACD has a great view and you can hang out there with friends if it is free - no booking needed, just walk in.',
      array['study', 'late night', 'night', 'grind', 'all night', '24 hours', 'library', 'macd', 'dana commons', 'dorm', 'lounge', 'where to study', 'study spot', 'focus', 'homework', 'overnight', 'open late']::text[],
      'https://www.clarku.edu',
      'activities'
    ),
    (
      'Hidden Spots and Best Views on Campus',
      'Two underrated spots at Clark with great views: Room 402 in Goddard Library has a beautiful view and is a quiet place to study or relax. The corner room in the MACD building also has a beautiful view and is a great spot to chill with friends - available 24 hours if you are already inside, no booking required, just sit in any free study room. Campus Park next to the pond is also a great outdoor chill spot on nice days.',
      array['hidden spots', 'views', 'room 402', 'library view', 'macd corner room', 'corner room', 'campus park', 'pond', 'chill', 'relax', 'hang out', 'quiet', 'beautiful', 'secret spots', 'best spots']::text[],
      'https://www.clarku.edu',
      'activities'
    ),
    (
      'Campus Park and Outdoor Chill Spots',
      'Clark University has a campus park where students can relax outdoors on the green grass and next to a pond. It is a great place to chill, read, or hang out with friends on a nice day. The greens and outdoor areas are accessible at all times.',
      array['campus park', 'park', 'pond', 'greens', 'outdoor', 'outside', 'chill', 'relax', 'nature', 'grass', 'fresh air', 'hang out', 'sit outside', 'sunny day']::text[],
      'https://www.clarku.edu',
      'activities'
    ),
    (
      'Hadwen Arboretum',
      'The Hadwen Arboretum is a green nature space associated with Clark University. It is a peaceful outdoor spot great for walks, studying outside, or relaxing in nature. Free to visit and open during daylight hours.',
      array['arboretum', 'hadwen', 'hadwen arboretum', 'nature', 'park', 'walk', 'outside', 'outdoor', 'green', 'relax', 'peaceful', 'fresh air', 'study outside']::text[],
      'https://www.clarku.edu/hadwen-arboretum/',
      'activities'
    ),
    (
      'Restaurants Near Clark University',
      'There are many restaurants near Clark University on Main Street and Park Ave in Worcester. Here is a Google Maps link showing all restaurants near Clark. Most close around 9 or 10PM. If you are looking for food after 11PM, ask me about late night food options.',
      array['restaurants', 'food', 'eat', 'hungry', 'where to eat', 'near clark', 'worcester', 'main street', 'park ave', 'lunch', 'dinner', 'dining out', 'places to eat', 'what to eat']::text[],
      'https://www.google.com/maps/search/restaurants+near+Clark+University+Worcester+MA/@42.260834,-71.8324706,5100m/data=!3m2!1e3!4b1!4m2!2m1!6e5',
      'activities'
    ),
    (
      'Late Night Food Near Clark - Sunday',
      'Looking for food late at night near Clark on a Sunday after 11PM? Here is a Google Maps link filtered for Sunday night showing what is still open. Your best bets are Ziggy Bomb (open till 1-2AM, near City Hall, great burgers), 7-Eleven near campus, Family Farms on Park Ave, or order delivery via DoorDash or Uber Eats.',
      array['late night', 'food after 11', 'after 11pm', 'midnight', 'sunday', 'open late sunday', 'late night sunday', 'hungry late', 'night food', 'ziggy bomb', '7-eleven', 'family farms']::text[],
      'https://www.google.com/maps/search/restaurants+near+Clark+University+Worcester+MA/@42.2608399,-71.8215543,2550m/data=!3m2!1e3!4b1!4m7!2m6!5m4!20m3!2e7!4m1!1i23!6e5',
      'activities'
    ),
    (
      'Late Night Food Near Clark - Monday',
      'Looking for food late at night near Clark on a Monday after 11PM? Here is a Google Maps link filtered for Monday night showing what is still open. Your best bets are Ziggy Bomb (open till 1-2AM, near City Hall, great burgers), 7-Eleven near campus, Family Farms on Park Ave, or order delivery via DoorDash or Uber Eats.',
      array['late night', 'food after 11', 'after 11pm', 'midnight', 'monday', 'open late monday', 'late night monday', 'hungry late', 'night food', 'ziggy bomb', '7-eleven', 'family farms']::text[],
      'https://www.google.com/maps/search/restaurants+near+Clark+University+Worcester+MA/@42.260839,-71.8215543,2550m/data=!3m2!1e3!4b1!4m7!2m6!5m4!20m3!2e1!4m1!1i23!6e5',
      'activities'
    ),
    (
      'Late Night Food Near Clark - Tuesday',
      'Looking for food late at night near Clark on a Tuesday after 11PM? Here is a Google Maps link filtered for Tuesday night showing what is still open. Your best bets are Ziggy Bomb (open till 1-2AM, near City Hall, great burgers), 7-Eleven near campus, Family Farms on Park Ave, or order delivery via DoorDash or Uber Eats.',
      array['late night', 'food after 11', 'after 11pm', 'midnight', 'tuesday', 'open late tuesday', 'late night tuesday', 'hungry late', 'night food', 'ziggy bomb', '7-eleven', 'family farms']::text[],
      'https://www.google.com/maps/search/restaurants+near+Clark+University+Worcester+MA/@42.260838,-71.8215543,2550m/data=!3m2!1e3!4b1!4m7!2m6!5m4!20m3!2e2!4m1!1i23!6e5',
      'activities'
    ),
    (
      'Late Night Food Near Clark - Wednesday',
      'Looking for food late at night near Clark on a Wednesday after 11PM? Here is a Google Maps link filtered for Wednesday night showing what is still open. Your best bets are Ziggy Bomb (open till 1-2AM, near City Hall, great burgers), 7-Eleven near campus, Family Farms on Park Ave, or order delivery via DoorDash or Uber Eats.',
      array['late night', 'food after 11', 'after 11pm', 'midnight', 'wednesday', 'open late wednesday', 'late night wednesday', 'hungry late', 'night food', 'ziggy bomb', '7-eleven', 'family farms']::text[],
      'https://www.google.com/maps/search/restaurants+near+Clark+University+Worcester+MA/@42.260838,-71.8215543,2550m/data=!3m1!1e3!4m7!2m6!5m4!20m3!2e3!4m1!1i23!6e5',
      'activities'
    ),
    (
      'Late Night Food Near Clark - Thursday',
      'Looking for food late at night near Clark on a Thursday after 11PM? Here is a Google Maps link filtered for Thursday night showing what is still open. Your best bets are Ziggy Bomb (open till 1-2AM, near City Hall, great burgers), 7-Eleven near campus, Family Farms on Park Ave, or order delivery via DoorDash or Uber Eats.',
      array['late night', 'food after 11', 'after 11pm', 'midnight', 'thursday', 'open late thursday', 'late night thursday', 'hungry late', 'night food', 'ziggy bomb', '7-eleven', 'family farms']::text[],
      'https://www.google.com/maps/search/restaurants+near+Clark+University+Worcester+MA/@42.2608362,-71.8215543,2550m/data=!3m2!1e3!4b1!4m7!2m6!5m4!20m3!2e4!4m1!1i23!6e5',
      'activities'
    ),
    (
      'Late Night Food Near Clark - Friday',
      'Looking for food late at night near Clark on a Friday after 11PM? Here is a Google Maps link filtered for Friday night showing what is still open. Your best bets are Ziggy Bomb (open till 1-2AM, near City Hall, great burgers), 7-Eleven near campus, Family Farms on Park Ave, or order delivery via DoorDash or Uber Eats.',
      array['late night', 'food after 11', 'after 11pm', 'midnight', 'friday', 'open late friday', 'late night friday', 'hungry late', 'night food', 'ziggy bomb', '7-eleven', 'family farms']::text[],
      'https://www.google.com/maps/search/restaurants+near+Clark+University+Worcester+MA/@42.2608353,-71.8215543,2550m/data=!3m2!1e3!4b1!4m7!2m6!5m4!20m3!2e5!4m1!1i23!6e5',
      'activities'
    ),
    (
      'Late Night Food Near Clark - Saturday',
      'Looking for food late at night near Clark on a Saturday after 11PM? Here is a Google Maps link filtered for Saturday night showing what is still open. Your best bets are Ziggy Bomb (open till 1-2AM, near City Hall, great burgers), 7-Eleven near campus, Family Farms on Park Ave, or order delivery via DoorDash or Uber Eats.',
      array['late night', 'food after 11', 'after 11pm', 'midnight', 'saturday', 'open late saturday', 'late night saturday', 'hungry late', 'night food', 'ziggy bomb', '7-eleven', 'family farms']::text[],
      'https://www.google.com/maps/search/restaurants+near+Clark+University+Worcester+MA/@42.2608344,-71.8215543,2550m/data=!3m2!1e3!4b1!4m7!2m6!5m4!20m3!2e6!4m1!1i23!6e5',
      'activities'
    ),
    (
      'Convenience Stores Near Clark University',
      'There are convenience stores near Clark University. The closest are 7-Eleven near campus and Family Farms on Park Ave, both open late. Here is a Google Maps link showing convenience stores near campus.',
      array['convenience store', 'convenience', 'store', 'snack', 'drinks', 'groceries', '7 eleven', '7-eleven', 'family farms', 'park ave', 'near campus', 'open late', 'corner store', 'late night store']::text[],
      'https://www.google.com/maps/search/convenience+store+near+Clark+University+Worcester+MA/@42.2529639,-71.8254135,1257m/data=!3m1!1e3!4m8!2m7!3m5!2sClark+University!3s0x89e38aa31dacf93f:0x55302c069e5d1e52!4m2!1d-71.8245381!2d42.2520353!6e2',
      'activities'
    ),
    (
      'Vending Machines on Campus',
      'Vending machines are available in multiple areas across Clark University campus including residence halls and various campus buildings. They are accessible at all hours for snacks and drinks.',
      array['vending machine', 'vending', 'snack', 'drinks', 'food', 'late night', 'quick food', 'hungry', 'residence hall', 'dorm']::text[],
      'https://www.clarku.edu/',
      'activities'
    ),
    (
      'Swimming Pool at Kneller Athletic Center',
      'The Kneller Athletic Center has a swimming pool available for student use. Open swim hours are generally from 10AM to 3PM but check the athletics website for the current schedule as hours may vary. The gym also has basketball courts, fitness equipment, cardio machines, and squash courts.',
      array['pool', 'swimming', 'swim', 'kneller', 'gym', 'open swim', 'athletic center', 'recreation', 'fitness', 'sport', 'water', 'lap swim']::text[],
      'https://clarkathletics.com/sports/2023/4/5/facilities-Facility-Hours.aspx',
      'activities'
    ),
    (
      'Basketball Courts on Campus',
      'Basketball courts are available for free student use at both Dolan Field House and Kneller Athletic Center. Students can walk in and use the courts during facility hours.',
      array['basketball', 'basketball court', 'courts', 'dolan', 'kneller', 'sport', 'play', 'recreation', 'free', 'pickup basketball', 'hoop']::text[],
      'https://clarkathletics.com/sports/2023/4/5/facilities-Facility-Hours.aspx',
      'activities'
    ),
    (
      'Badminton on Campus',
      'Students can play badminton inside Dolan Field House or in the squash courts at Kneller Athletic Center. Badminton nets are provided. Ask the helpdesk assistant at Dolan Field House if you need help finding the courts.',
      array['badminton', 'squash', 'squash court', 'racket', 'sport', 'dolan', 'kneller', 'indoor sport', 'recreation', 'play', 'net']::text[],
      'https://clarkathletics.com/sports/2023/4/5/facilities-Facility-Hours.aspx',
      'activities'
    ),
    (
      'Outdoor Sports Fields and Courts',
      'Clark University has several outdoor athletic facilities accessible via Dolan Field House: tennis courts, lacrosse fields, baseball fields, Kilby-Gardner-Hammond Field and Track, and O Brien Softball Field. If you have trouble finding any outdoor court or field, ask the helpdesk assistant at Dolan Field House for directions.',
      array['tennis', 'tennis court', 'lacrosse', 'baseball', 'softball', 'track', 'field', 'outdoor', 'sports field', 'kilby', 'hammond', 'obrien', 'dolan', 'athletic fields', 'run', 'running track']::text[],
      'https://clarkathletics.com/sports/2023/4/5/facilities-Facility-Hours.aspx',
      'activities'
    ),
    (
      'Things to Do When Bored on Campus',
      'When bored at Clark, here are the best options students actually use - in order: First, head to The Grind in the HUC basement for pool table and Pac-Man. Or go to MACD floor 2 for Xbox, PlayStation, or board games in the cupboards next to the consoles. Second, check the Corq app for game nights or events at the Asher Suite on HUC 3rd floor or at MACD. Third, chill at campus park by the pond, hang out in room 402 of the library for a great view, or the corner room in MACD. Use Cortex Find People to see who is free right now and join them. If you are also hungry, just ask me about food separately.',
      array['bored', 'things to do', 'fun', 'activities', 'what to do', 'campus life', 'hang out', 'free time', 'suggestions', 'nothing to do', 'entertainment', 'recreation', 'social', 'explore', 'bored on campus']::text[],
      'https://www.clarku.edu/offices/student-engagement/',
      'activities'
    ),
    (
      'Corq App for Campus Events',
      'The Corq app is the official platform Clark University students use to find out about upcoming campus events including game nights, club meetings, social events, cultural events, and more. Download the Corq app and follow Clark University to stay updated on what is happening on campus.',
      array['corq', 'corq app', 'events', 'upcoming events', 'campus events', 'what is happening', 'tonight', 'this week', 'club', 'social events', 'activities', 'calendar']::text[],
      'https://www.clarku.edu/offices/student-engagement/',
      'activities'
    ),
    (
      'Best Study Spots on Campus',
      'Top study spots at Clark: Goddard Library (quiet floors, bookable study rooms, 24 hour common area), MACD building (stay all night if you get in before 11PM, free study rooms no booking needed), Dana Commons lounge area, residence hall lounges, and Room 402 in the library which has a beautiful view. For outdoor studying on nice days, try the campus park by the pond or the Hadwen Arboretum.',
      array['study', 'study spot', 'where to study', 'quiet', 'focus', 'library', 'macd', 'dana commons', 'study room', 'homework', 'work', 'concentrate', 'peaceful', 'late night study', 'grind']::text[],
      'https://clarku.libcal.com',
      'activities'
    )
),
updated as (
  update ai_knowledge_base as kb
  set
    content = payload.content,
    keywords = payload.keywords,
    source = payload.source,
    category = payload.category,
    updated_at = now()
  from payload
  where kb.title = payload.title
  returning kb.title
)
insert into ai_knowledge_base (title, content, keywords, source, category)
select payload.title, payload.content, payload.keywords, payload.source, payload.category
from payload
left join updated on updated.title = payload.title
where updated.title is null;
