// RAMEN RUSH v6 — configuration: recipes, ingredients, tuning, regulars.
// 2D illustrated night-market yatai. Written fresh for the v6 rebuild;
// the recipe/ingredient system is kept from v5 so the loop stays proven.
(function () {
  const RR = (window.RR = window.RR || {});

  // Canvas is fixed 1280x720 — the judge reads it at that size.
  RR.W = 1280;
  RR.H = 720;

  RR.CONFIG = {
    dayLength: 150, // seconds per night
    orderSpawnEvery: 9, // seconds between new tickets
    maxTickets: 6, // top entries all show 5-6 tickets
    orderTime: 45, // seconds before a ticket expires
    rushEvery: 55, // seconds between rush hours
    rushLength: 14, // seconds a rush lasts
    cookTime: 3, // seconds on the grill to cook
    burnTime: 7, // seconds after cooked before BURNT
    comboWindow: 12, // seconds to keep the combo alive
    chefSpeed: 520, // px/s along the workline
    chefXMin: 250,
    chefXMax: 1030,
    chefY: 372, // workline where the chefs stand
    dayGoal: 400, // yen to clear the night
  };

  // 8 ingredient bins along the counter (key 1..8).
  RR.BINS = [
    { key: '1', name: 'Noodle', color: '#f2d492', dark: '#c9a45e' },
    { key: '2', name: 'Cabbage', color: '#8fd14f', dark: '#5d9430' },
    { key: '3', name: 'Negi', color: '#4f9e57', dark: '#2f6b38' },
    { key: '4', name: 'Pork', color: '#e58aa0', dark: '#b35a72' },
    { key: '5', name: 'Chicken', color: '#f6c177', dark: '#c98f3f' },
    { key: '6', name: 'Shrimp', color: '#f08a5c', dark: '#c25a2e' },
    { key: '7', name: 'Mushroom', color: '#c9a06a', dark: '#8f6b3a' },
    { key: '8', name: 'Egg', color: '#ffe9a8', dark: '#d9b45e' },
  ];

  // 6 recipes. Each order needs exactly these 3 ingredients.
  RR.RECIPES = [
    { name: 'Tonkotsu Ramen', short: 'TONKOTSU', price: 14, needs: ['Noodle', 'Pork', 'Egg'], color: '#d94f3d', bowl: '#c0392b' },
    { name: 'Ebi Tempura', short: 'EBI TEMPURA', price: 11, needs: ['Shrimp', 'Cabbage', 'Egg'], color: '#e88a2e', bowl: '#d35400' },
    { name: 'Yakitori Don', short: 'YAKITORI DON', price: 13, needs: ['Chicken', 'Negi', 'Mushroom'], color: '#b5772e', bowl: '#8e5a1d' },
    { name: 'Sunomono Salad', short: 'SUNOMONO', price: 8, needs: ['Cabbage', 'Shrimp', 'Negi'], color: '#4f9e57', bowl: '#2e7d32' },
    { name: 'Omakase Platter', short: 'OMAKASE', price: 18, needs: ['Noodle', 'Shrimp', 'Mushroom'], color: '#8a5fd0', bowl: '#5e35b1' },
    { name: 'Kinoko Don', short: 'KINOKO DON', price: 10, needs: ['Mushroom', 'Chicken', 'Egg'], color: '#7a5a3a', bowl: '#5d4037' },
  ];

  // 6 stations along the back of the stall (x = centre, scene coords).
  RR.STATIONS = [
    { id: 'broth', name: 'BROTH POT', verb: 'SIMMER', x: 300, w: 118 },
    { id: 'noodle', name: 'NOODLE BOIL', verb: 'BOIL', x: 428, w: 118 },
    { id: 'chop', name: 'CHOP BOARD', verb: 'CHOP!', x: 556, w: 118 },
    { id: 'grill', name: 'CHARCOAL GRILL', verb: 'GRILL', x: 684, w: 118 },
    { id: 'plating', name: 'PLATING', verb: 'PLATE', x: 812, w: 118 },
    { id: 'pass', name: 'THE PASS', verb: 'SERVE', x: 950, w: 128 },
  ];

  // Named regulars — every ticket belongs to a person with a mood and a line.
  RR.REGULARS = [
    { name: 'Grandma Yuki', color: '#c96a9a', hair: '#e8e8e8', style: 'bun', lines: ['The broth tastes like 1962.', 'My husband built a stall like this one.', 'Extra negi, dear. I am not getting younger.'] },
    { name: 'Ken · Taxi', color: '#4a90d9', hair: '#1a1a1a', style: 'cap', cap: '#2e6b34', lines: ['Quick! My meter is running.', 'One bowl, then back to the night shift.', 'You are the fastest ladle in the lane.'] },
    { name: 'Aoi · Student', color: '#e8a83e', hair: '#6b4423', style: 'hair', lines: ['Exam week. I need something light.', 'Can I sit here and study? The steam helps.', 'My friends all eat here. All of them.'] },
    { name: 'Ren · Salaryman', color: '#8a5fd0', hair: '#111111', style: 'band', band: '#d94f8a', lines: ['Long day. Extra crispy, please.', 'The office can wait. This cannot.', 'I dream about this tempura.'] },
    { name: 'Mika · Nurse', color: '#4f9e57', hair: '#111111', style: 'hair', lines: ['Night shift in an hour. Feed me.', 'I have saved lives. Now save my dinner.', 'The rain sounds better from this stool.'] },
    { name: 'Old Sato', color: '#2e6b8a', hair: '#888888', style: 'hair', lines: ['I have eaten here forty years.', 'Your noodles are too good. It worries me.', 'Rain or shine, the yatai opens.'] },
  ];
  RR.CRITIC = { name: 'Hana · Critic', color: '#d9a441', hair: '#3a2a1a', style: 'bun', lines: ['I write for the city paper. Impress me.', 'Five stars, or I walk. No pressure.', 'This better be worth the rain.'] };

  RR.GOALS = [
    { id: 'serve8', label: 'Serve 8 dishes' },
    { id: 'combo5', label: 'Reach COMBO x5' },
    { id: 'critic', label: 'Serve the hidden critic' },
    { id: 'nowalk', label: 'No walkouts tonight' },
  ];

  // Seats in front of the counter (scene coords, y = stool row).
  RR.SEAT_X = [268, 408, 548, 688, 828];
  RR.SEAT_Y = 556;
  // Queue spots, right end of the scene (standing, umbrellas). Spread in x
  // so neighbours never cover each other's name tags (the old 952/962
  // pair hid "Ken" behind the front person's torso), and low enough that
  // every name stays inside the scene clip (y <= 604).
  RR.QUEUE_SPOTS = [
    { x: 915, y: 505 },
    { x: 985, y: 530 },
    { x: 1040, y: 545 },
  ];
})();
