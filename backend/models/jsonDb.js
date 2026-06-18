const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '../data');

// Ensure database directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to generate a MongoDB-like 24-character hex ID
function generateObjectId() {
  return crypto.randomBytes(12).toString('hex');
}

class JsonQuery {
  constructor(data, collectionName) {
    this.data = JSON.parse(JSON.stringify(data)); // Deep clone
    this.collectionName = collectionName;
  }

  populate(pathStr) {
    if (!pathStr || !this.data) return this;
    
    // Support space-separated or array path lists
    const fields = typeof pathStr === 'string' ? pathStr.split(' ') : pathStr;
    
    const resolveRef = (refId, refCollection) => {
      const dbFile = path.join(DATA_DIR, `${refCollection.toLowerCase()}s.json`);
      if (!fs.existsSync(dbFile)) return refId;
      try {
        const items = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
        return items.find(item => item._id === refId || item.id === refId) || refId;
      } catch (err) {
        return refId;
      }
    };

    const populateItem = (item) => {
      fields.forEach(field => {
        if (!item[field]) return;
        
        // Infer collection name based on field
        let refCollection = '';
        if (field === 'creator' || field === 'assignedTo' || field === 'user' || field === 'userId') {
          refCollection = 'user';
        } else if (field === 'task' || field === 'taskId') {
          refCollection = 'task';
        } else if (field === 'workspace' || field === 'workspaceId') {
          refCollection = 'workspace';
        } else if (field === 'members') {
          // If array of objects containing user ref
          if (Array.isArray(item.members)) {
            item.members = item.members.map(m => {
              if (m.user && typeof m.user === 'string') {
                return { ...m, user: resolveRef(m.user, 'user') };
              }
              return m;
            });
          }
          return;
        }

        if (!refCollection) return;

        if (Array.isArray(item[field])) {
          item[field] = item[field].map(id => typeof id === 'string' ? resolveRef(id, refCollection) : id);
        } else if (typeof item[field] === 'string') {
          item[field] = resolveRef(item[field], refCollection);
        }
      });
    };

    if (Array.isArray(this.data)) {
      this.data.forEach(populateItem);
    } else {
      populateItem(this.data);
    }

    return this;
  }

  sort(sortOptions) {
    if (!sortOptions || !Array.isArray(this.data)) return this;
    
    let sortField = '';
    let isDescending = false;

    if (typeof sortOptions === 'string') {
      if (sortOptions.startsWith('-')) {
        sortField = sortOptions.substring(1);
        isDescending = true;
      } else {
        sortField = sortOptions;
      }
    } else if (typeof sortOptions === 'object') {
      const keys = Object.keys(sortOptions);
      if (keys.length > 0) {
        sortField = keys[0];
        isDescending = sortOptions[sortField] === -1 || sortOptions[sortField] === 'desc';
      }
    }

    if (sortField) {
      this.data.sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        
        // Handle dates
        if (sortField.toLowerCase().includes('date') || sortField.toLowerCase().includes('at')) {
          valA = new Date(valA || 0).getTime();
          valB = new Date(valB || 0).getTime();
        }

        if (valA < valB) return isDescending ? 1 : -1;
        if (valA > valB) return isDescending ? -1 : 1;
        return 0;
      });
    }

    return this;
  }

  select(fieldsStr) {
    if (!fieldsStr || !this.data) return this;
    
    const fields = fieldsStr.split(' ').filter(Boolean);
    const include = !fields[0].startsWith('-');
    const parsedFields = fields.map(f => f.startsWith('-') ? f.substring(1) : f);

    const project = (item) => {
      const newItem = {};
      if (include) {
        // Only include specified fields + _id
        newItem._id = item._id;
        parsedFields.forEach(f => {
          if (f in item) newItem[f] = item[f];
        });
      } else {
        // Include everything EXCEPT specified fields
        Object.keys(item).forEach(key => {
          if (!parsedFields.includes(key)) {
            newItem[key] = item[key];
          }
        });
      }
      return newItem;
    };

    if (Array.isArray(this.data)) {
      this.data = this.data.map(project);
    } else {
      this.data = project(this.data);
    }

    return this;
  }

  exec() {
    return Promise.resolve(this.data);
  }

  then(onFulfilled, onRejected) {
    return Promise.resolve(this.data).then(onFulfilled, onRejected);
  }
}

class JsonModel {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.filePath = path.join(DATA_DIR, `${collectionName.toLowerCase()}s.json`);
    
    // Initialize file if not exists
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
    }
  }

  _read() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error(`Error reading ${this.filePath}:`, err);
      return [];
    }
  }

  _write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(`Error writing ${this.filePath}:`, err);
    }
  }

  _match(item, query) {
    for (const key in query) {
      if (query[key] && typeof query[key] === 'object' && !Array.isArray(query[key])) {
        // Support simple operators like $or, $in, $ne
        const subQuery = query[key];
        const val = item[key];
        
        if ('$ne' in subQuery) {
          if (val === subQuery['$ne']) return false;
        }
        if ('$in' in subQuery) {
          if (!Array.isArray(subQuery['$in']) || !subQuery['$in'].includes(val)) return false;
        }
        if ('$nin' in subQuery) {
          if (Array.isArray(subQuery['$nin']) && subQuery['$nin'].includes(val)) return false;
        }
        if ('$gte' in subQuery) {
          if (val < subQuery['$gte']) return false;
        }
        if ('$lte' in subQuery) {
          if (val > subQuery['$lte']) return false;
        }
      } else if (key === '$or') {
        const clauses = query[key];
        if (Array.isArray(clauses)) {
          const matchAny = clauses.some(clause => this._match(item, clause));
          if (!matchAny) return false;
        }
      } else {
        // Standard check
        // Handle Mongoose ObjectID vs string checks
        const val = item[key];
        const qVal = query[key];
        if (val !== qVal && String(val) !== String(qVal)) {
          return false;
        }
      }
    }
    return true;
  }

  find(query = {}) {
    const items = this._read();
    const filtered = items.filter(item => this._match(item, query));
    return new JsonQuery(filtered, this.collectionName);
  }

  findOne(query = {}) {
    const items = this._read();
    const found = items.find(item => this._match(item, query));
    return new JsonQuery(found || null, this.collectionName);
  }

  findById(id) {
    const items = this._read();
    const found = items.find(item => item._id === String(id));
    return new JsonQuery(found || null, this.collectionName);
  }

  async create(data) {
    const items = this._read();
    const newDoc = {
      _id: generateObjectId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    
    // Add instance save helper
    newDoc.save = async function() {
      const fileItems = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      const index = fileItems.findIndex(i => i._id === this._id);
      this.updatedAt = new Date().toISOString();
      
      const plainDoc = { ...this };
      delete plainDoc.save;
      delete plainDoc.filePath;
      
      if (index !== -1) {
        fileItems[index] = plainDoc;
      } else {
        fileItems.push(plainDoc);
      }
      fs.writeFileSync(this.filePath, JSON.stringify(fileItems, null, 2));
      return this;
    }.bind({ ...newDoc, filePath: this.filePath });

    const plainDoc = { ...newDoc };
    delete plainDoc.save;
    delete plainDoc.filePath;
    
    items.push(plainDoc);
    this._write(items);
    return newDoc;
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const items = this._read();
    const index = items.findIndex(item => item._id === String(id));
    if (index === -1) return null;

    let updatedDoc = { ...items[index] };
    const updates = update.$set || update; // support $set or straight updates
    
    // Handle specific updates, like pushing comments, etc
    if (update.$push) {
      for (const field in update.$push) {
        if (!updatedDoc[field]) updatedDoc[field] = [];
        updatedDoc[field].push(update.$push[field]);
      }
    } else if (update.$pull) {
      for (const field in update.$pull) {
        if (Array.isArray(updatedDoc[field])) {
          const pullVal = update.$pull[field];
          updatedDoc[field] = updatedDoc[field].filter(v => String(v) !== String(pullVal));
        }
      }
    } else {
      updatedDoc = {
        ...updatedDoc,
        ...updates,
        updatedAt: new Date().toISOString()
      };
    }

    items[index] = updatedDoc;
    this._write(items);
    
    return updatedDoc;
  }

  async findByIdAndDelete(id) {
    const items = this._read();
    const index = items.findIndex(item => item._id === String(id));
    if (index === -1) return null;
    const deleted = items.splice(index, 1)[0];
    this._write(items);
    return deleted;
  }

  async countDocuments(query = {}) {
    const items = this._read();
    return items.filter(item => this._match(item, query)).length;
  }
}

module.exports = JsonModel;
