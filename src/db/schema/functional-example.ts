import { db } from '..';
import { images } from './images';
import { users } from './example-users';
import { eq, desc, sql } from 'drizzle-orm';
import type { NewImage, Image } from './images';

// Репозиторий как набор функций
export const imageRepository = {
  // Получение всех изображений с пагинацией
  getAll: async (limit = 20, offset = 0): Promise<Image[]> => {
    return db.select().from(images).limit(limit).offset(offset).orderBy(desc(images.createdAt));
  },

  // Получение изображения по ID
  getById: async (id: string): Promise<Image | undefined> => {
    const results = await db.select().from(images).where(eq(images.id, id));
    return results[0];
  },

  // Получение изображений по ID пользователя
  getByUserId: async (userId: string): Promise<Image[]> => {
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
  },

  // Создание нового изображения
  create: async (image: NewImage): Promise<Image> => {
    const result = await db.insert(images).values(image).returning();
    return result[0];
  },

  // Обновление изображения
  update: async (id: string, data: Partial<NewImage>): Promise<Image | undefined> => {
    const result = await db
      .update(images)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(images.id, id))
      .returning();
    return result[0];
  },

  // Удаление изображения
  delete: async (id: string): Promise<boolean> => {
    const result = await db.delete(images).where(eq(images.id, id)).returning();
    return result.length > 0;
  },

  // Поиск изображений
  search: async (query: string): Promise<Image[]> => {
    return db
      .select()
      .from(images)
      .where(
        sql`to_tsvector('english', ${images.title} || ' ' || ${images.description}) @@ to_tsquery('english', ${query})`,
      )
      .limit(20);
  },
};

// Сервисный слой также как набор функций
export const imageService = {
  // Получение всех изображений с пагинацией
  getAllImages: async (page = 1, pageSize = 20) => {
    const offset = (page - 1) * pageSize;
    return imageRepository.getAll(pageSize, offset);
  },

  // Получение изображения по ID
  getImageById: async (id: string) => {
    const image = await imageRepository.getById(id);
    if (!image) {
      throw new Error(`Image with ID ${id} not found`);
    }
    return image;
  },

  // Создание изображения
  createImage: async (data: NewImage) => {
    return imageRepository.create(data);
  },

  // Обновление изображения
  updateImage: async (id: string, data: Partial<NewImage>) => {
    const updated = await imageRepository.update(id, data);
    if (!updated) {
      throw new Error(`Image with ID ${id} not found`);
    }
    return updated;
  },

  // Удаление изображения
  deleteImage: async (id: string) => {
    const deleted = await imageRepository.delete(id);
    if (!deleted) {
      throw new Error(`Image with ID ${id} not found or could not be deleted`);
    }
    return { success: true };
  },

  // Поиск изображений
  searchImages: async (query: string) => {
    if (!query || query.length < 3) {
      throw new Error('Search query must be at least 3 characters long');
    }
    return imageRepository.search(query);
  },
};
