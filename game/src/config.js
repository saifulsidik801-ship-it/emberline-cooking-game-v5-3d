// RAMEN RUSH — configuration: recipes, ingredients, tuning.
// Written from scratch for the v5 3D build. No prior-version code is used.
(function () {
  const RR = (window.RR = window.RR || {});

  RR.CONFIG = {
    dayLength: 150, // seconds per day
    orderSpawnEvery: 9, // seconds between new tickets
    maxTickets: 5,
    orderTime: 45, // seconds before a ticket expires
    rushEvery: 55, // seconds between rush hours
    rushLength: 14, // seconds a rush lasts
    cookTime: 3, // seconds on grill/pot to cook
    burnTime: 7, // seconds after cooked before BURNT
    comboWindow: 12, // seconds to keep the combo alive
    chefSpeed: 4.2, // m/s along the counter
    chefXMin: -5.4,
    chefXMax: 5.4,
    chefZ: -1.35, // workline where the chefs stand (close to the counter so they read above it)
    counterZ: 0,
    seatZ: 1.6,
  };

  // 8 ingredient bins along the counter (key 1..8).
  RR.BINS = [
    { key: '1', name: 'Noodle', color: 0xf2d492 },
    { key: '2', name: 'Cabbage', color: 0x8fd14f },
    { key: '3', name: 'Negi', color: 0x4f9e57 },
    { key: '4', name: 'Pork', color: 0xe58aa0 },
    { key: '5', name: 'Chicken', color: 0xf6c177 },
    { key: '6', name: 'Shrimp', color: 0xf08a5c },
    { key: '7', name: 'Mushroom', color: 0xc9a06a },
    { key: '8', name: 'Egg', color: 0xffe9a8 },
  ];

  // 6 recipes. Each order needs exactly these 3 ingredients.
  RR.RECIPES = [
    { name: 'Tonkotsu Ramen', price: 14, needs: ['Noodle', 'Pork', 'Egg'], color: 0xd94f3d },
    { name: 'Ebi Tempura', price: 11, needs: ['Shrimp', 'Cabbage', 'Egg'], color: 0xe88a2e },
    { name: 'Yakitori Don', price: 13, needs: ['Chicken', 'Negi', 'Mushroom'], color: 0xb5772e },
    { name: 'Sunomono Salad', price: 8, needs: ['Cabbage', 'Shrimp', 'Negi'], color: 0x4f9e57 },
    { name: 'Omakase Platter', price: 18, needs: ['Noodle', 'Shrimp', 'Mushroom'], color: 0x8a5fd0 },
    { name: 'Kinoko Don', price: 10, needs: ['Mushroom', 'Chicken', 'Egg'], color: 0x7a5a3a },
  ];

  RR.STATIONS = [
    { id: 'grill', name: 'CHARCOAL GRILL', x: -4.5, z: -2.8 },
    { id: 'tempura', name: 'TEMPURA POT', x: -2.8, z: -2.8 },
    { id: 'chop', name: 'CHOP', x: -1.0, z: -2.8 },
    { id: 'sauce', name: 'SAUCE & GARNISH', x: 0.6, z: -2.8 },
    { id: 'plating', name: 'PLATING BAR', x: 2.6, z: -2.8 },
    { id: 'sink', name: 'SINK', x: 4.3, z: -2.8 },
    { id: 'trash', name: 'TRASH', x: 5.5, z: -2.8 },
    { id: 'bell', name: 'SERVE • RING THE BELL', x: 2.6, z: 0.55 },
  ];

  RR.SEATS = [-5.2, -3.7, -2.2, -0.7, 0.8, 2.3, 3.8, 5.2]; // 8 customer seats
  RR.QUEUE_SPOTS = [
    { x: 6.6, z: 2.8 },
    { x: 7.3, z: 3.8 },
    { x: 6.9, z: 4.9 },
    // second half of the line, snaking back through the dining area
    // (kept clear of the side-table diners at (7.0, 6.6) and (8.0, 6.6))
    { x: 7.8, z: 5.9 },
    { x: 6.2, z: 6.9 },
    { x: 7.6, z: 7.6 },
  ];
})();
