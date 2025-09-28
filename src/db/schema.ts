import { text, pgTable } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
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
