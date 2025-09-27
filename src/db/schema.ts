import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  wallet: text('wallet').primaryKey(),
  username: text('username'),
  profilePictureUrl: text('profile_picture_url'),
});

export type InsertUser = {
  wallet: string;
  username?: string | null;
  profilePictureUrl?: string | null;
};

export type SelectUser = {
  wallet: string;
  username: string | null;
  profilePictureUrl: string | null;
};
