const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

// Ensure database directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getFilePath(table) {
  return path.join(DATA_DIR, `${table}.json`);
}

function readTable(table) {
  const filePath = getFilePath(table);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf8');
    return [];
  }
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content || '[]');
  } catch (error) {
    console.error(`Error reading database file ${table}.json:`, error);
    return [];
  }
}

function writeTable(table, data) {
  const filePath = getFilePath(table);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error writing database file ${table}.json:`, error);
  }
}

const db = {
  // Find all items matching a predicate function
  find(table, queryFn = () => true) {
    const data = readTable(table);
    return data.filter(queryFn);
  },

  // Find a single item matching a predicate function
  findOne(table, queryFn) {
    const data = readTable(table);
    return data.find(queryFn) || null;
  },

  // Insert a new item, auto-generating an ID
  insert(table, item) {
    const data = readTable(table);
    const newId = data.length > 0 ? Math.max(...data.map(i => i.id || 0)) + 1 : 1;
    const newItem = { id: newId, ...item, timestamp: new Date().toISOString() };
    data.push(newItem);
    writeTable(table, data);
    return newItem;
  },

  // Update an existing item by ID
  update(table, id, updates) {
    const data = readTable(table);
    const index = data.findIndex(item => item.id === Number(id));
    if (index === -1) return null;
    
    data[index] = { ...data[index], ...updates };
    writeTable(table, data);
    return data[index];
  },

  // Delete an item by ID
  delete(table, id) {
    const data = readTable(table);
    const filtered = data.filter(item => item.id !== Number(id));
    writeTable(table, filtered);
    return true;
  }
};

module.exports = db;
