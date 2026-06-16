const fs = require('fs');

let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace(/bg-\[#050505\]/g, 'bg-gray-50');
code = code.replace(/bg-\[#0a0a0a\]/g, 'bg-gray-100');
code = code.replace(/bg-\[#111\]/g, 'bg-white');
code = code.replace(/bg-\[#1a1a1a\]/g, 'bg-white');
code = code.replace(/bg-\[#b5952f\]/g, 'bg-blue-700');
code = code.replace(/bg-\[#D4AF37\]/g, 'bg-blue-600');

code = code.replace(/text-\[#D4AF37\]/g, 'text-blue-600');
code = code.replace(/border-\[#D4AF37\]/g, 'border-blue-600');
code = code.replace(/fill-\[#D4AF37\]/g, 'fill-blue-600');
code = code.replace(/from-\[#D4AF37\]\/5/g, 'from-blue-600/5');

code = code.replace(/border-white\/10/g, 'border-gray-200');
code = code.replace(/border-white\/20/g, 'border-gray-300');
code = code.replace(/bg-white\/5/g, 'bg-gray-50');
code = code.replace(/bg-white\/10/g, 'bg-gray-100');
code = code.replace(/hover:bg-white\/5/g, 'hover:bg-gray-50');
code = code.replace(/hover:bg-white\/10/g, 'hover:bg-gray-100');
code = code.replace(/hover:text-white/g, 'hover:text-blue-600');

// Replace standard white text with dark text where it makes sense.
// This is tricky, maybe better to just replace `text-white` with `text-gray-800` globally and then fix buttons.
code = code.replace(/text-white/g, 'text-gray-800');
code = code.replace(/text-gray-800\/20/g, 'text-white/20'); // fix alpha
code = code.replace(/bg-black/g, 'bg-white text-gray-800'); // Some inputs are bg-black

// For buttons, if they have bg-blue-600, let's make sure they have text-white
code = code.replace(/(bg-blue-600[^"']*?)text-gray-800/g, '$1text-white');
code = code.replace(/bg-black text-gray-800/g, 'bg-gray-800 text-white'); // Maybe primary buttons

code = code.replace(/text-gray-400/g, 'text-gray-500');

// Add Storefront tab
code = code.replace(/id: 'settings', label: 'Settings', icon: Settings/g, "id: 'settings', label: 'Settings', icon: Settings },\n    { id: 'storefront', label: 'Storefront', icon: Layout");

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Replacements done');
