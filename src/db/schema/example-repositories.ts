import { db } from '..';
import { images } from './images';
import { users } from './example-users';
import { eq, desc, sql } from 'drizzle-orm';
import type { NewImage, Image } from './images';

/**
 * Repository pattern for images
 * Encapsulates database access logic for image operations
 */
export class ImageRepository {
  /**
   * Get all images with optional pagination
   */
  async getAll(limit: number = 20, offset: number = 0): Promise<Image[]> {
    return db.select().from(images).limit(limit).offset(offset).orderBy(desc(images.createdAt));
  }

  /**
   * Get image by ID
   */
  async getById(id: string): Promise<Image | undefined> {
    const results = await db.select().from(images).where(eq(images.id, id));

    return results[0];
  }

  /**
   * Get images by user ID
   */
  async getByUserId(userId: string): Promise<Image[]> {
    return db
      .select({
        id: images.id,
        title: images.title,
        description: images.description,
        url: images.url,
        prompt: images.prompt,
        createdAt: images.createdAt,
        updatedAt: images.updatedAt,
      })
      .from(images)
      .innerJoin(users, eq(images.id, userId))
      .orderBy(desc(images.createdAt));
  }

  /**
   * Create a new image
   */
  async create(image: NewImage): Promise<Image> {
    const result = await db.insert(images).values(image).returning();

    return result[0];
  }

  /**
   * Update an existing image
   */
  async update(id: string, data: Partial<NewImage>): Promise<Image | undefined> {
    const result = await db
      .update(images)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(images.id, id))
      .returning();

    return result[0];
  }

  /**
   * Delete an image
   */
  async delete(id: string): Promise<boolean> {
    const result = await db.delete(images).where(eq(images.id, id)).returning();

    return result.length > 0;
  }

  /**
   * Search images by title or description
   */
  async search(query: string): Promise<Image[]> {
    return db
      .select()
      .from(images)
      .where(
        sql`to_tsvector('english', ${images.title} || ' ' || ${images.description}) @@ to_tsquery('english', ${query})`,
      )
      .limit(20);
  }
}
