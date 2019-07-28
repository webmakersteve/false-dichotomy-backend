const { buildSchema } = require('graphql');

const schema = buildSchema(`
  input BoardInput {
    name: String
    slug: String
  }

  input PostInput {
    content: String
    board: String
    topic: String
  }

  input TopicInput {
    board: BoardInput!
    name: String!
    slug: String
  }

  input UserInput {
    battletag: String
    firstName: String
    lastName: String
    role: Int
  }

  input PostsQuery {
    q: String!
    from: Int
    to: Int
    by: UserInput
    topic: Int
    board: Int
    page: Int
  }

  type User {
    battletag: String!
    firstName: String
    lastName: String
    mainCharacter: Int
    role: Int
  }

  type RecentPost {
    author: User!
    createdAt: Int
    topic: String
    topicSlug: String
  }

  type Board {
    id: Int
    name: String
    slug: String
    mostRecentPost: RecentPost
  }

  type Post {
    content: String
    author: User!
  }

  type Topic {
    id: Int
    name: String
    slug: String
    mostRecentPost: RecentPost
  }

  type Query {
    getBoards: [Board]!
    searchPosts(q: PostsQuery!): [Post]!
    getTopics(input: BoardInput!): [Topic]!
    getCurrentUser: User!
    getUser: User
    getUsers: [User]!
  }

  type Mutation {
    createBoard(input: BoardInput!): Board
    createPost(input: PostInput!): Post
    createTopic(input: TopicInput!): Topic
    updateUser(input: UserInput!): User
    updateCurrentUser(input: UserInput!): User!
  }
`);

module.exports = schema;
