// TODO: replace with the official DART bus stop list. This is temporary mock data
// so the field can render as a searchable dropdown while the real list is sourced.
export const DART_BUS_STOPS: string[] = [
  'Cedar Blvd at 7th St',
  'Ross at Skillman',
  'Ross at Fitzhugh',
  'Live Oak at Peak',
  'Illinois at Cockrell Hill',
  'Zang at Jefferson',
  'Hampton at Kiest',
  'Ledbetter at Lancaster',
  'Kiest at Corinth',
  'Beckley at Overton',
  'Camp Wisdom at Cedar Ridge',
  'Buckner at Samuell',
  'Garland Rd at Peavy',
  'Lake June at Prairie Creek',
  'Preston at Belt Line',
  'Northwest Hwy at Marsh',
  'Forest at Coit',
  'Walnut Hill at Central',
  'Mockingbird at Skillman',
  'Harry Hines at Inwood',
  'Denton Dr at Mockingbird',
  'Elm at Ervay',
  'Commerce at Griffin',
  'Main at Akard',
  'Pacific at Olive',
];

export const BUS_STOP_OPTIONS = DART_BUS_STOPS.map(name => ({ value: name, label: name }));
