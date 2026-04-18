insert into campus_buildings (name, code, category, latitude, longitude, address, phone, email, hours, facilities, description)
values
  (
    'Jonas Clark Hall',
    'JCH',
    'academic',
    42.25071200,
    -71.82388300,
    '950 Main St, Worcester, MA 01610',
    '(508) 793-7000',
    'info@clarku.edu',
    '{"monday":{"open":"8:00 AM","close":"8:00 PM"},"tuesday":{"open":"8:00 AM","close":"8:00 PM"},"wednesday":{"open":"8:00 AM","close":"8:00 PM"},"thursday":{"open":"8:00 AM","close":"8:00 PM"},"friday":{"open":"8:00 AM","close":"5:00 PM"}}',
    '{"wifi","accessible","study_spaces"}',
    'Historic campus landmark with classrooms and student services.'
  ),
  (
    'Higgins University Center',
    'HIG',
    'services',
    42.25140600,
    -71.82323500,
    '950 Main St, Worcester, MA 01610',
    '(508) 793-7443',
    null,
    '{"monday":{"open":"7:00 AM","close":"11:00 PM"},"tuesday":{"open":"7:00 AM","close":"11:00 PM"},"wednesday":{"open":"7:00 AM","close":"11:00 PM"},"thursday":{"open":"7:00 AM","close":"11:00 PM"},"friday":{"open":"7:00 AM","close":"9:00 PM"}}',
    '{"dining","student_services","wifi","charging"}',
    'Student hub with dining, services, and meeting spaces.'
  ),
  (
    'Goddard Library',
    'LIB',
    'library',
    42.25176200,
    -71.82459400,
    '950 Main St, Worcester, MA 01610',
    '(508) 793-7478',
    null,
    '{"monday":{"open":"8:00 AM","close":"12:00 AM"},"tuesday":{"open":"8:00 AM","close":"12:00 AM"},"wednesday":{"open":"8:00 AM","close":"12:00 AM"},"thursday":{"open":"8:00 AM","close":"12:00 AM"},"friday":{"open":"8:00 AM","close":"8:00 PM"},"saturday":{"open":"10:00 AM","close":"6:00 PM"},"sunday":{"open":"12:00 PM","close":"12:00 AM"}}',
    '{"quiet_study","group_rooms","wifi","charging","accessible"}',
    'Library with quiet zones, group rooms, and research support.'
  ),
  (
    'Kneller Athletic Center',
    'KAC',
    'recreation',
    42.25230000,
    -71.82619800,
    '57 Downing St, Worcester, MA 01610',
    '(508) 793-7686',
    null,
    '{"monday":{"open":"6:00 AM","close":"10:00 PM"},"tuesday":{"open":"6:00 AM","close":"10:00 PM"},"wednesday":{"open":"6:00 AM","close":"10:00 PM"},"thursday":{"open":"6:00 AM","close":"10:00 PM"},"friday":{"open":"6:00 AM","close":"8:00 PM"}}',
    '{"gym","pool","locker_rooms","accessible"}',
    'Fitness center, courts, and athletics facilities.'
  );

insert into ai_knowledge_base (title, content, keywords, source, category)
values
  (
    'Library Hours',
    'Goddard Library is open until midnight Monday through Thursday, closes at 8 PM on Friday, 10 AM to 6 PM on Saturday, and noon to midnight on Sunday.',
    '{"library","hours","goddard","study room"}',
    'Clark Library Services',
    'hours'
  ),
  (
    'Kneller Athletic Center',
    'The Kneller Athletic Center is open from 6 AM to 10 PM on weekdays and offers the gym, pool, and locker rooms.',
    '{"gym","open","kneller","pool","work out"}',
    'Clark Recreation',
    'facility'
  ),
  (
    'Health Services Contact',
    'Clark Health Services can be reached at (508) 793-7467 during business hours.',
    '{"health","phone","wellness","clinic","number"}',
    'Clark Student Affairs',
    'contact'
  );
