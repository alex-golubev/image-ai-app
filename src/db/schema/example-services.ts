import { ImageRepository } from './example-repositories';
import type { NewImageWithValidation } from './images';
import { ZodError } from 'zod';

/**
 * Service layer for handling business logic related to images
 */
export class ImageService {
  private repository: ImageRepository;

  constructor() {
    this.repository = new ImageRepository();
  }

  /**
   * Get all images with pagination
   */
  async getAllImages(page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;
    return this.repository.getAll(pageSize, offset);
  }

  /**
   * Get a single image by ID
   */
  async getImageById(id: string) {
    const image = await this.repository.getById(id);

    if (!image) {
      throw new Error(`Image with ID ${id} not found`);
    }

    return image;
  }

  /**
   * Create a new image with validation
   */
  async createImage(data: NewImageWithValidation) {
    try {
      // Validation happens through Zod schema
      return await this.repository.create(data);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(`Validation error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Update an image with validation
   */
  async updateImage(id: string, data: Partial<NewImageWithValidation>) {
    const updated = await this.repository.update(id, data);

    if (!updated) {
      throw new Error(`Image with ID ${id} not found`);
    }

    return updated;
  }

  /**
   * Delete an image
   */
  async deleteImage(id: string) {
    const deleted = await this.repository.delete(id);

    if (!deleted) {
      throw new Error(`Image with ID ${id} not found or could not be deleted`);
    }

    return { success: true };
  }

  /**
   * Search for images
   */
  async searchImages(query: string) {
    if (!query || query.length < 3) {
      throw new Error('Search query must be at least 3 characters long');
    }

    return this.repository.search(query);
  }
}
