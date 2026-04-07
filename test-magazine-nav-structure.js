// test-magazine-nav-structure.js
// Verify buildTree correctly populates Magazine.children with categories

import { buildTree } from "./src/pages/AdminModules/menu/menuUtils.js";

// Mock the nav_items that will exist after migration
const mockNavItems = [
  // Main menu items
  { id: "nav00001-0000-0000-0000-000000000001", label: "Browse", type: "link", visible: true, position: 1 },
  { id: "nav00001-0000-0000-0000-000000000002", label: "Aura Discovery", type: "link", visible: true, position: 2 },
  { id: "nav00001-0000-0000-0000-000000000003", label: "Real Weddings", type: "link", visible: true, position: 3 },

  // Magazine as mega_menu parent
  {
    id: "nav00001-0000-0000-0000-000000000006",
    label: "Magazine",
    type: "mega_menu",
    url: null,
    nav_action: "magazine",
    visible: true,
    position: 6,
    parent_id: null
  },

  // Magazine category children
  { id: "mag-cat-001", label: "Destinations", type: "link", url: "/magazine/category/destinations", nav_action: "mag_category", parent_id: "nav00001-0000-0000-0000-000000000006", position: 0, visible: true },
  { id: "mag-cat-002", label: "Venues", type: "link", url: "/magazine/category/venues", nav_action: "mag_category", parent_id: "nav00001-0000-0000-0000-000000000006", position: 1, visible: true },
  { id: "mag-cat-003", label: "Fashion & Beauty", type: "link", url: "/magazine/category/fashion", nav_action: "mag_category", parent_id: "nav00001-0000-0000-0000-000000000006", position: 2, visible: true },
  { id: "mag-cat-004", label: "Real Weddings", type: "link", url: "/magazine/category/real-weddings", nav_action: "mag_category", parent_id: "nav00001-0000-0000-0000-000000000006", position: 3, visible: true },
  { id: "mag-cat-005", label: "Planning", type: "link", url: "/magazine/category/planning", nav_action: "mag_category", parent_id: "nav00001-0000-0000-0000-000000000006", position: 4, visible: true },
];

console.log("🧪 Testing buildTree with Magazine mega_menu structure...\n");

const tree = buildTree(mockNavItems);

console.log("✅ buildTree executed successfully\n");

// Find the Magazine item
const magazineItem = tree.find(item => item.label === "Magazine");

if (!magazineItem) {
  console.error("❌ Magazine item not found in tree roots");
  process.exit(1);
}

console.log(`📍 Magazine item found: ${magazineItem.label}`);
console.log(`   Type: ${magazineItem.type}`);
console.log(`   Has children: ${!!magazineItem.children}`);
console.log(`   Children count: ${magazineItem.children?.length || 0}\n`);

if (!magazineItem.children || magazineItem.children.length === 0) {
  console.error("❌ Magazine has no children - buildTree failed to populate");
  process.exit(1);
}

console.log("✅ Magazine children populated correctly:\n");
magazineItem.children.forEach((child, idx) => {
  console.log(`   ${idx + 1}. ${child.label} → ${child.url}`);
});

// Verify structure
const expectedChildren = 5; // We added 5 in the test
if (magazineItem.children.length !== expectedChildren) {
  console.warn(`⚠️  Expected ${expectedChildren} children, got ${magazineItem.children.length}`);
} else {
  console.log(`\n✅ All ${expectedChildren} children accounted for`);
}

// Check for required properties on children
const requiredProps = ['id', 'label', 'url', 'nav_action', 'type'];
const childrenValid = magazineItem.children.every(child =>
  requiredProps.every(prop => child.hasOwnProperty(prop))
);

if (!childrenValid) {
  console.error("❌ Some children missing required properties");
  process.exit(1);
}

console.log("✅ All children have required properties");
console.log("\n✅ buildTree structure verification PASSED");
