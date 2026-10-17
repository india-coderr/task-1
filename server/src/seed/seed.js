const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const Settings = require('../models/Settings');
const Counter = require('../models/Counter');

const sampleMenuItems = [
  // --- Burgers ---
  {
    name: 'Cheesy Smashed Beef Burger',
    category: 'Burgers',
    price: 8.99,
    description:
      'Double smashed beef patty, melted cheddar, crisp lettuce, pickles and house burger sauce on a lightly toasted brioche bun.',
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    imageAttribution: {
      text: 'Photo by David Foodphototasty on Unsplash',
      html: 'Photo by <a href="https://unsplash.com/@phototastyfood">David Foodphototasty</a> on <a href="https://unsplash.com">Unsplash</a>',
      photographerName: 'David Foodphototasty',
      photographerUrl: 'https://unsplash.com/@phototastyfood'
    },
    isAvailable: true,
    isActive: true
  },
  {
    name: 'Flying High Double Cheeseburger',
    category: 'Burgers',
    price: 9.99,
    description:
      'Two seared quarter-pound beef patties, caramelized slow-cooked onions, double sharp cheddar, tangy relish.',
    image: 'https://images.unsplash.com/photo-1632203171982-cc0df6e9ceb4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    imageAttribution: {
      text: 'Photo by Ric Matkowski on Unsplash',
      html: 'Photo by <a href="https://unsplash.com/@matkowrs">Ric Matkowski</a> on <a href="https://unsplash.com">Unsplash</a>',
      photographerName: 'Ric Matkowski',
      photographerUrl: 'https://unsplash.com/@matkowrs'
    },
    isAvailable: true,
    isActive: true
  },
  {
    name: 'Crispy Bacon & Cheddar Burger',
    category: 'Burgers',
    price: 10.49,
    description:
      'Applewood smoked crispy bacon strips, aged Wisconsin cheddar, organic greens, and roasted garlic aioli.',
    image: 'https://images.unsplash.com/photo-1566217688581-b2191944c2f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    imageAttribution: {
      text: 'Photo by Anthony Espinosa on Unsplash',
      html: 'Photo by <a href="https://unsplash.com/@thony_espi">Anthony Espinosa</a> on <a href="https://unsplash.com">Unsplash</a>',
      photographerName: 'Anthony Espinosa',
      photographerUrl: 'https://unsplash.com/@thony_espi'
    },
    isAvailable: true,
    isActive: true
  },
  {
    name: 'Veggie Truffle Crunch Burger',
    category: 'Burgers',
    price: 8.49,
    description:
      'Plant-based artisanal patty, pan-sautéed forest mushrooms, vegan truffle cream, fresh arugula.',
    image: 'https://images.unsplash.com/photo-1585238341267-1cfec2046a55?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    imageAttribution: {
      text: 'Photo by LikeMeat on Unsplash',
      html: 'Photo by <a href="https://unsplash.com/@likemeat">LikeMeat</a> on <a href="https://unsplash.com">Unsplash</a>',
      photographerName: 'LikeMeat',
      photographerUrl: 'https://unsplash.com/@likemeat'
    },
    isAvailable: true,
    isActive: true
  },

  // --- Pizzas ---
  {
    name: 'Rustic Pepperoni & Herb Pizza',
    category: 'Pizzas',
    price: 14.99,
    description:
      'Thin sourdough crust, crushed San Marzano plum tomatoes, artisanal spicy pepperoni, fresh fior di latte mozzarella.',
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    imageAttribution: {
      text: 'Photo by Fernando Andrade on Unsplash',
      html: 'Photo by <a href="https://unsplash.com/@thisisnando">Fernando Andrade</a> on <a href="https://unsplash.com">Unsplash</a>',
      photographerName: 'Fernando Andrade',
      photographerUrl: 'https://unsplash.com/@thisisnando'
    },
    isAvailable: true,
    isActive: true
  },
  {
    name: 'Wood-Fired Pepperoni Supreme',
    category: 'Pizzas',
    price: 13.99,
    description:
      'Slow-fermented artisan crust, hand-pinched sweet Italian sausage, charred pepperoni, fresh oregano oil.',
    image: 'https://images.unsplash.com/photo-1692737580547-b45bb4a02356?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    imageAttribution: {
      text: 'Photo by David Foodphototasty on Unsplash',
      html: 'Photo by <a href="https://unsplash.com/@phototastyfood">David Foodphototasty</a> on <a href="https://unsplash.com">Unsplash</a>',
      photographerName: 'David Foodphototasty',
      photographerUrl: 'https://unsplash.com/@phototastyfood'
    },
    isAvailable: true,
    isActive: true
  },
  {
    name: 'Artisan Sausage & Basil Pizza',
    category: 'Pizzas',
    price: 15.49,
    description:
      'Oven-fired pie layered with smoked provolone, crushed fennel sausage, roasted red peppers, and fresh Genovese basil.',
    image: 'https://images.unsplash.com/photo-1700760934249-93efbb574d23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    imageAttribution: {
      text: 'Photo by Farhad Ibrahimzade on Unsplash',
      html: 'Photo by <a href="https://unsplash.com/@ferhadd">Farhad Ibrahimzade</a> on <a href="https://unsplash.com">Unsplash</a>',
      photographerName: 'Farhad Ibrahimzade',
      photographerUrl: 'https://unsplash.com/@ferhadd'
    },
    isAvailable: true,
    isActive: true
  },

  // --- Pastas ---
  {
    name: 'Classic Penne Bolognese Ragu',
    category: 'Pastas',
    price: 12.99,
    description:
      'Traditional slow-simmered beef and pork ragu folded into al dente bronze-cut penne, crowned with 24-month Parmigiano.',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    imageAttribution: {
      text: 'Photo by Ben Lei on Unsplash',
      html: 'Photo by <a href="https://unsplash.com/@bleiplays33">Ben Lei</a> on <a href="https://unsplash.com">Unsplash</a>',
      photographerName: 'Ben Lei',
      photographerUrl: 'https://unsplash.com/@bleiplays33'
    },
    isAvailable: true,
    isActive: true
  },
  {
    name: 'Pink Sauce Rosatella Rigatoni',
    category: 'Pastas',
    price: 11.99,
    description:
      'Creamy tomato-vodka emulsion, fresh garlic, sweet shallots, and cracked black pepper over ribbed rigatoni.',
    image: 'https://images.unsplash.com/photo-1709201417401-5c72ed84f191?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    imageAttribution: {
      text: 'Photo by Zoshua Colah on Unsplash',
      html: 'Photo by <a href="https://unsplash.com/@zoshuacolah">Zoshua Colah</a> on <a href="https://unsplash.com">Unsplash</a>',
      photographerName: 'Zoshua Colah',
      photographerUrl: 'https://unsplash.com/@zoshuacolah'
    },
    isAvailable: true,
    isActive: true
  },
  {
    name: 'Tuscan Garlic Herb Pasta',
    category: 'Pastas',
    price: 10.99,
    description:
      'Extra virgin olive oil, toasted garlic chips, sweet sun-dried tomatoes, wilted baby spinach, and chili flakes.',
    image: 'https://images.unsplash.com/photo-1626028937210-754d2118d5f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    imageAttribution: {
      text: 'Photo by Jasbir S Bhatia on Unsplash',
      html: 'Photo by <a href="https://unsplash.com/@jasbir1612">Jasbir S Bhatia</a> on <a href="https://unsplash.com">Unsplash</a>',
      photographerName: 'Jasbir S Bhatia',
      photographerUrl: 'https://unsplash.com/@jasbir1612'
    },
    isAvailable: true,
    isActive: true
  },

  // --- Beverages ---
  {
    name: 'Sparkling Iced Lemon Refresher',
    category: 'Beverages',
    price: 3.99,
    description:
      'Freshly squeezed Amalfi lemon juice, crushed mint, organic raw cane syrup, and effervescent sparkling water.',
    image: 'https://images.unsplash.com/photo-1470752354724-60a1d2b1907f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    imageAttribution: {
      text: "Photo by Julia D'Alkmin on Unsplash",
      html: "Photo by <a href=\"https://unsplash.com/@jdalkmin\">Julia D'Alkmin</a> on <a href=\"https://unsplash.com\">Unsplash</a>",
      photographerName: "Julia D'Alkmin",
      photographerUrl: 'https://unsplash.com/@jdalkmin'
    },
    isAvailable: true,
    isActive: true
  },
  {
    name: 'Cold Brew Artisan Iced Coffee',
    category: 'Beverages',
    price: 4.50,
    description:
      'Single-origin Ethiopian beans steeped cold for 20 hours, poured over crystal-clear artisan ice spheres.',
    image: 'https://images.unsplash.com/photo-1773632996574-45b0d56ff809?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    imageAttribution: {
      text: 'Photo by Cheng Qi Huang on Unsplash',
      html: 'Photo by <a href="https://unsplash.com/@candy_keeper">Cheng Qi Huang</a> on <a href="https://unsplash.com">Unsplash</a>',
      photographerName: 'Cheng Qi Huang',
      photographerUrl: 'https://unsplash.com/@candy_keeper'
    },
    isAvailable: true,
    isActive: true
  },
  {
    name: 'Iced Matcha Green Tea Latte',
    category: 'Beverages',
    price: 4.99,
    description:
      'Uji ceremonial-grade stone-ground green matcha whisked cold with creamy oat milk and a touch of organic agave.',
    image: 'https://images.unsplash.com/photo-1781663904776-c2edce194950?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    imageAttribution: {
      text: 'Photo by Lachlan Wang on Unsplash',
      html: 'Photo by <a href="https://unsplash.com/@lachlanwang">Lachlan Wang</a> on <a href="https://unsplash.com">Unsplash</a>',
      photographerName: 'Lachlan Wang',
      photographerUrl: 'https://unsplash.com/@lachlanwang'
    },
    isAvailable: true,
    isActive: true
  },

  // --- Desserts ---
  {
    name: 'Wild Strawberry Cheesecake',
    category: 'Desserts',
    price: 6.99,
    description:
      'Silky Philadelphia cream cheese on a buttery graham crust, topped with hand-picked ripe strawberry coulis.',
    image: 'https://images.unsplash.com/photo-1622621746668-59fb299bc4d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    imageAttribution: {
      text: 'Photo by Alexandra Khudyntseva on Unsplash',
      html: 'Photo by <a href="https://unsplash.com/@sannka">Alexandra Khudyntseva</a> on <a href="https://unsplash.com">Unsplash</a>',
      photographerName: 'Alexandra Khudyntseva',
      photographerUrl: 'https://unsplash.com/@sannka'
    },
    isAvailable: true,
    isActive: true
  },
  {
    name: 'Berry Swirl Sunday Tart',
    category: 'Desserts',
    price: 6.49,
    description:
      'Crisp French butter pastry shell filled with rich Madagascar bourbon vanilla pastry cream and fresh berries.',
    image: 'https://images.unsplash.com/photo-1589119908995-c6837fa14848?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    imageAttribution: {
      text: 'Photo by Davide Carpani on Unsplash',
      html: 'Photo by <a href="https://unsplash.com/@dc_photo">Davide Carpani</a> on <a href="https://unsplash.com">Unsplash</a>',
      photographerName: 'Davide Carpani',
      photographerUrl: 'https://unsplash.com/@dc_photo'
    },
    isAvailable: true,
    isActive: true
  },
  {
    name: 'Blueberry Velvet Cheesecake',
    category: 'Desserts',
    price: 7.25,
    description:
      'Baked vanilla bean cheesecake swirled with slow-reduced wild Maine blueberries and lemon zest.',
    image: 'https://images.unsplash.com/photo-1734987408480-c2916b5386bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    imageAttribution: {
      text: 'Photo by Snappr on Unsplash',
      html: 'Photo by <a href="https://unsplash.com/@snappr">Snappr</a> on <a href="https://unsplash.com">Unsplash</a>',
      photographerName: 'Snappr',
      photographerUrl: 'https://unsplash.com/@snappr'
    },
    isAvailable: true,
    isActive: true
  }
];

async function seedDatabase() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_pos';

  console.log(`[Seed] Connecting to MongoDB: ${uri}`);
  await mongoose.connect(uri);

  console.log('[Seed] Connected successfully.');

  // 1. Seed or update Users
  console.log('[Seed] Seeding Users...');
  const adminPasswordHash = await User.hashPassword('Admin@123');
  const staffPasswordHash = await User.hashPassword('Staff@123');

  await User.findOneAndUpdate(
    { email: 'admin@pos.com' },
    {
      name: 'Chef Gordon (Admin)',
      email: 'admin@pos.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
      isActive: true
    },
    { upsert: true, new: true }
  );
  console.log('  -> Admin created/verified: admin@pos.com / Admin@123');

  await User.findOneAndUpdate(
    { email: 'staff@pos.com' },
    {
      name: 'Sarah Connor (Staff)',
      email: 'staff@pos.com',
      passwordHash: staffPasswordHash,
      role: 'staff',
      isActive: true
    },
    { upsert: true, new: true }
  );
  console.log('  -> Staff created/verified: staff@pos.com / Staff@123');

  // 2. Seed Settings
  console.log('[Seed] Seeding Default Settings...');
  await Settings.findOneAndUpdate(
    {},
    {
      restaurantName: 'Foodly Kitchen',
      taxRate: 5,
      currency: '$',
      staffDiscountLimit: 15
    },
    { upsert: true, new: true }
  );
  console.log('  -> Default settings initialized: Tax Rate = 5%, Currency = $, Staff Discount Limit = 15%');

  // 3. Seed Menu Items
  console.log('[Seed] Seeding Menu Items...');
  let seededCount = 0;
  for (const item of sampleMenuItems) {
    await MenuItem.findOneAndUpdate(
      { name: item.name },
      { $set: item },
      { upsert: true, new: true }
    );
    seededCount++;
  }
  console.log(`  -> Successfully seeded ${seededCount} menu items with real Unsplash images and attributions!`);

  console.log('=============================================');
  console.log(' Foodly Kitchen Database Seeding Complete!  ');
  console.log(' Admin: admin@pos.com / Admin@123            ');
  console.log(' Staff: staff@pos.com / Staff@123            ');
  console.log('=============================================');

  await mongoose.disconnect();
  process.exit(0);
}

seedDatabase().catch((err) => {
  console.error('[Seed Error] Failed to seed database:', err);
  process.exit(1);
});
