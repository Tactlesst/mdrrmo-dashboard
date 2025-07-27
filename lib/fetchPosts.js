// lib/fetchPosts.js
import { neon } from '@netlify/neon';

const sql = neon(); // uses NETLIFY_DATABASE_URL

export async function getAllPosts() {
  const posts = await sql`SELECT * FROM posts ORDER BY created_at DESC`;
  return posts;
}
