const slugify = require('slugify');

function createSlug(n) {
  return slugify(n, {
    lower: true,
  });
}

class Topic {
  constructor({
    id,
    name,
    slug,
    createdBy,
    mostRecentPost,
    board,
  }) {
    if (!name) {
      throw new TypeError('Topic cannot be created with no name provided');
    }
    this.name = name;
    this.id = id || null;
    this.slug = slug ? createSlug(slug) : createSlug(name);
    this.createdBy = createdBy;
    this.mostRecentPost = mostRecentPost;
    this.board = board;
  }
}

Topic.fromDatabase = function transformBoard(row) {
  let mostRecentPost = null;

  if (row.most_recent_post_author) {
    mostRecentPost = {
      author: {
        battletag: row.most_recent_post_author,
      },
      createdAt: new Date(row.most_recent_post_date).getTime(),
      topic: row.most_recent_topic_name,
      topicSlug: row.most_recent_topics_slug,
    };
  }

  return new Topic({
    id: row.id,
    name: row.name,
    slug: row.slug,
    mostRecentPost,
    createdBy: row.created_by,
  });
};

module.exports = Topic;
