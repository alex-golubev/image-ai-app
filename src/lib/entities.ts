/**
 * Enum for all entities in the system
 * Prevents typos and simplifies refactoring
 */
export enum Entity {
  User = 'user',
  Post = 'post',
  Comment = 'comment',
  Category = 'category',
  Tag = 'tag',
  File = 'file',
  Notification = 'notification',
  Permission = 'permission',
  Role = 'role',
  Session = 'session',
}

/**
 * Plural forms for read operations
 */
export enum EntityPlural {
  Users = 'users',
  Posts = 'posts',
  Comments = 'comments',
  Categories = 'categories',
  Tags = 'tags',
  Files = 'files',
  Notifications = 'notifications',
  Permissions = 'permissions',
  Roles = 'roles',
  Sessions = 'sessions',
}
