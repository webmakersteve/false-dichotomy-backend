const slugify = require('slugify');

function createSlug(n) {
  return slugify(n, {
    lower: true,
  });
}

class Board {
  constructor({
    id,
    name,
    slug,
    createdBy,
  }) {
    if (!name) {
      throw new TypeError('Board cannot be created with no name provided');
    }

    this.name = name;
    this.id = id || null;
    this.slug = slug ? createSlug(slug) : createSlug(name);
    this.createdBy = createdBy;
  }
}

module.exports = Board;
