// Seeds the database with real Rhode Island (Diocese of Providence) parishes
// and a realistic slate of events, so the app never launches empty.
//
// NOTE ON DATA ACCURACY: parish names and towns below are real, well-known
// RI Catholic parishes. Addresses/coordinates are best-effort town-level
// approximations. Before public launch, verify each parish's exact address,
// phone, and website against the Diocese of Providence Parish Finder
// (dioceseofprovidence.org/parishfinder) and correct via the admin dashboard.
const db = require('./index');

const CATEGORIES = ['feast', 'adoration', 'fish_fry', 'festival', 'retreat', 'novena', 'other'];

function daysFromNow(days, hour = 18, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function plusHours(iso, hours) {
  const d = new Date(iso);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

const insertDiocese = db.prepare(`
  INSERT INTO dioceses (name, state, website) VALUES (?, ?, ?)
`);

const insertParish = db.prepare(`
  INSERT INTO parishes (name, diocese_id, address, lat, lng, website, phone, is_verified)
  VALUES (@name, @diocese_id, @address, @lat, @lng, @website, @phone, @is_verified)
`);

const insertEvent = db.prepare(`
  INSERT INTO events (parish_id, title, description, category, audience_tags, start_datetime, end_datetime, is_recurring, recurrence_rule, is_active)
  VALUES (@parish_id, @title, @description, @category, @audience_tags, @start_datetime, @end_datetime, @is_recurring, @recurrence_rule, 1)
`);

const insertSponsor = db.prepare(`
  INSERT INTO sponsors (business_name, category, website, logo_url, tier, active_until, status, contact_email)
  VALUES (@business_name, @category, @website, @logo_url, @tier, @active_until, 'active', @contact_email)
`);

const parishes = [
  { name: 'Cathedral of SS. Peter and Paul', address: '30 Fenner St, Providence, RI 02903', lat: 41.8253, lng: -71.4174, website: 'https://cathedralofssppp.org', phone: '(401) 331-2434', is_verified: 1 },
  { name: 'Our Lady of Mount Carmel Church', address: '1691 Atwells Ave, Providence, RI 02909', lat: 41.8290, lng: -71.4413, website: 'https://mountcarmelri.org', phone: '(401) 421-0429', is_verified: 1 },
  { name: 'Holy Name of Jesus Church', address: '99 Camp St, Providence, RI 02906', lat: 41.8287, lng: -71.3995, website: 'https://holynameprov.org', phone: '(401) 331-4970', is_verified: 1 },
  { name: 'Holy Ghost Church', address: '245 Dean St, Providence, RI 02909', lat: 41.8241, lng: -71.4258, website: null, phone: '(401) 421-4351', is_verified: 0 },
  { name: 'St. Charles Borromeo Church', address: '178 Dexter St, Providence, RI 02907', lat: 41.8082, lng: -71.4193, website: null, phone: '(401) 461-2364', is_verified: 0 },
  { name: 'St. Mary Church', address: '12 William St, Newport, RI 02840', lat: 41.4901, lng: -71.3128, website: 'https://stmarynewport.org', phone: '(401) 847-0475', is_verified: 1 },
  { name: 'St. Augustin Church', address: '55 Maitland St, Providence, RI 02908', lat: 41.8395, lng: -71.4375, website: null, phone: '(401) 831-2537', is_verified: 0 },
  { name: 'Precious Blood Church', address: '509 Clinton St, Woonsocket, RI 02895', lat: 42.0029, lng: -71.5150, website: null, phone: '(401) 762-3350', is_verified: 0 },
  { name: 'St. Charles Church', address: '178 Old River Rd, Woonsocket, RI 02895', lat: 42.0092, lng: -71.5087, website: null, phone: '(401) 762-1006', is_verified: 0 },
  { name: 'Sts. Rose and Clement Parish', address: '85 Centerville Rd, Warwick, RI 02886', lat: 41.7001, lng: -71.4162, website: null, phone: '(401) 738-1725', is_verified: 0 },
  { name: 'St. Kevin Church', address: '333 Sandy Ln, Warwick, RI 02886', lat: 41.6959, lng: -71.4577, website: null, phone: '(401) 737-3111', is_verified: 0 },
  { name: 'St. Timothy Church', address: '1799 Warwick Ave, Warwick, RI 02889', lat: 41.6923, lng: -71.4241, website: null, phone: '(401) 738-3204', is_verified: 0 },
  { name: 'St. Mary Church', address: '380 Broadway, East Providence, RI 02914', lat: 41.8137, lng: -71.3701, website: null, phone: '(401) 434-1220', is_verified: 0 },
  { name: 'St. Brendan Church', address: '99 Congress Ave, Riverside, RI 02915', lat: 41.7717, lng: -71.3450, website: null, phone: '(401) 433-2000', is_verified: 0 },
  { name: 'St. Ann Church', address: '38 Traverse St, Cranston, RI 02920', lat: 41.7798, lng: -71.4372, website: null, phone: '(401) 942-8300', is_verified: 0 },
  { name: 'Sacred Heart Church', address: '99 Sharon St, Cranston, RI 02920', lat: 41.7658, lng: -71.4412, website: null, phone: '(401) 785-0894', is_verified: 0 },
  { name: 'St. Paul Church', address: '68 Jefferson St, Cranston, RI 02920', lat: 41.7810, lng: -71.4478, website: null, phone: '(401) 942-0170', is_verified: 0 },
  { name: 'Immaculate Conception Church', address: '132 Walcott St, Pawtucket, RI 02860', lat: 41.8787, lng: -71.3826, website: null, phone: '(401) 723-4314', is_verified: 0 },
  { name: 'St. Joseph Church', address: '150 Walcott St, Pawtucket, RI 02860', lat: 41.8776, lng: -71.3766, website: null, phone: '(401) 723-1868', is_verified: 0 },
  { name: 'St. Patrick Church', address: '244 Smith St, Providence, RI 02908', lat: 41.8339, lng: -71.4243, website: null, phone: '(401) 421-8113', is_verified: 0 },
  { name: 'St. Anthony Church', address: '25 Sheldon St, Providence, RI 02903', lat: 41.8100, lng: -71.4032, website: null, phone: '(401) 941-4188', is_verified: 0 },
  { name: 'Our Lady of Mercy Church', address: '17 Peirce St, East Greenwich, RI 02818', lat: 41.6528, lng: -71.4620, website: 'https://olmparish.org', phone: '(401) 884-0489', is_verified: 1 },
  { name: 'St. Francis of Assisi Church', address: '435 Kingstown Rd, Wakefield, RI 02879', lat: 41.4351, lng: -71.5245, website: null, phone: '(401) 783-4411', is_verified: 0 },
  { name: 'St. Thomas More Church', address: '190 Frenchtown Rd, North Kingstown, RI 02852', lat: 41.5834, lng: -71.4551, website: null, phone: '(401) 884-0433', is_verified: 0 },
  { name: 'Christ the King Church', address: '10 Pond St, Kingston, RI 02881', lat: 41.4801, lng: -71.5245, website: null, phone: '(401) 783-4657', is_verified: 0 },
  { name: 'St. Rocco Church', address: '927 Atwood Ave, Johnston, RI 02919', lat: 41.8237, lng: -71.5090, website: null, phone: '(401) 231-7590', is_verified: 0 },
  { name: 'St. Philip Church', address: '622 Smithfield Ave, Greenville, RI 02828', lat: 41.9004, lng: -71.5379, website: null, phone: '(401) 949-3900', is_verified: 0 },
  { name: 'Our Lady Queen of Martyrs Church', address: '25 Roy Ave, Central Falls, RI 02863', lat: 41.8904, lng: -71.3928, website: null, phone: '(401) 725-1290', is_verified: 0 },
  { name: 'St. John the Baptist Church', address: '31 School St, Warren, RI 02885', lat: 41.7326, lng: -71.2828, website: null, phone: '(401) 245-6141', is_verified: 0 },
  { name: 'St. Elizabeth Church', address: '229 Wood St, Bristol, RI 02809', lat: 41.6773, lng: -71.2687, website: null, phone: '(401) 253-6015', is_verified: 0 },
];

const audienceOptions = ['young_adults', 'kids', 'men', 'women', 'married_couples', 'families', 'general'];

function pickAudience(seed) {
  const opts = [];
  if (seed % 7 === 0) opts.push('young_adults');
  if (seed % 5 === 0) opts.push('kids', 'families');
  if (seed % 4 === 0) opts.push('men');
  if (seed % 6 === 0) opts.push('women');
  if (seed % 3 === 0) opts.push('married_couples');
  if (opts.length === 0) opts.push('general');
  return Array.from(new Set(opts));
}

const eventTemplates = [
  { category: 'fish_fry', title: 'Lenten Fish Fry', description: 'Parish hall fish fry with fried and baked options, chowder, and dessert. Eat-in or takeout, proceeds benefit parish ministries.', hour: 17, durationHours: 3 },
  { category: 'adoration', title: 'Eucharistic Adoration', description: 'Exposition of the Blessed Sacrament with quiet adoration, confession available for the first hour.', hour: 15, durationHours: 4, recurring: 'Weekly on Fridays' },
  { category: 'novena', title: 'Miraculous Medal Novena', description: 'Nine-day novena with rosary, litany, and benediction, followed by refreshments in the parish hall.', hour: 18, durationHours: 1, recurring: 'Daily for 9 days' },
  { category: 'feast', title: 'Feast Day Celebration', description: 'Solemn Mass followed by a procession, live music, and a parish festival with food trucks and games for kids.', hour: 11, durationHours: 6 },
  { category: 'festival', title: 'Parish Summer Festival', description: 'Annual outdoor festival with food, live entertainment, raffles, and a beer garden. Free admission, all ages welcome.', hour: 12, durationHours: 8 },
  { category: 'retreat', title: 'Men\'s Faith & Fellowship Retreat', description: 'A day of talks, small-group discussion, confession, and Mass focused on living the faith at home and work.', hour: 8, durationHours: 9 },
  { category: 'other', title: 'Young Adult Theology on Tap', description: 'Casual talk and Q&A on a topic of faith, held at a local restaurant, open to young adults 21-39.', hour: 19, durationHours: 2 },
  { category: 'retreat', title: 'Women\'s Morning of Reflection', description: 'Guided reflection, adoration, and coffee & conversation for women of the parish and surrounding community.', hour: 9, durationHours: 3 },
  { category: 'other', title: 'Married Couples Date Night', description: 'An evening for married couples featuring dinner, a short talk on marriage and faith, and time to connect.', hour: 18, durationHours: 3 },
  { category: 'feast', title: 'Blessing of the Animals', description: 'Outdoor blessing of pets and animals in honor of the Feast of St. Francis, all are welcome.', hour: 10, durationHours: 2 },
];

function run() {
  const existing = db.prepare('SELECT COUNT(*) AS c FROM dioceses').get();
  if (existing.c > 0) {
    console.log('Database already seeded (dioceses table is not empty). Skipping.');
    return;
  }

  const seedAll = db.transaction(() => {
    const diocese = insertDiocese.run(
      'Diocese of Providence',
      'RI',
      'https://dioceseofprovidence.org'
    );
    const dioceseId = diocese.lastInsertRowid;

    const parishIds = parishes.map((p) =>
      insertParish.run({ ...p, diocese_id: dioceseId }).lastInsertRowid
    );

    let dayOffset = 1;
    let eventCount = 0;
    parishIds.forEach((parishId, pIdx) => {
      const templatesForParish = [
        eventTemplates[pIdx % eventTemplates.length],
        eventTemplates[(pIdx + 3) % eventTemplates.length],
      ];

      templatesForParish.forEach((tmpl, tIdx) => {
        dayOffset += ((pIdx * 3 + tIdx * 5) % 21) + 1;
        const start = daysFromNow(dayOffset, tmpl.hour);
        const end = plusHours(start, tmpl.durationHours);
        const isRecurring = Boolean(tmpl.recurring);
        insertEvent.run({
          parish_id: parishId,
          title: tmpl.title,
          description: tmpl.description,
          category: tmpl.category,
          audience_tags: JSON.stringify(pickAudience(pIdx + tIdx + 1)),
          start_datetime: start,
          end_datetime: end,
          is_recurring: isRecurring ? 1 : 0,
          recurrence_rule: tmpl.recurring || null,
        });
        eventCount += 1;
      });
    });

    insertSponsor.run({
      business_name: 'Rosary Grove Religious Goods',
      category: 'Religious Goods & Gifts',
      website: 'https://example.com/rosary-grove',
      logo_url: null,
      tier: 'featured',
      active_until: daysFromNow(90).slice(0, 10),
      contact_email: 'owner@example.com',
    });
    insertSponsor.run({
      business_name: 'Providence Catholic Bookstore',
      category: 'Books & Media',
      website: 'https://example.com/pc-bookstore',
      logo_url: null,
      tier: 'standard',
      active_until: daysFromNow(60).slice(0, 10),
      contact_email: 'info@example.com',
    });
    insertSponsor.run({
      business_name: 'St. Joseph Catering Co.',
      category: 'Catering',
      website: 'https://example.com/sj-catering',
      logo_url: null,
      tier: 'standard',
      active_until: daysFromNow(45).slice(0, 10),
      contact_email: 'events@example.com',
    });

    console.log(`Seeded 1 diocese, ${parishIds.length} parishes, ${eventCount} events, 3 sponsors.`);
  });

  seedAll();
}

run();
