import { NextResponse } from 'next/server';
import { db } from '../../../db';
import { images } from '../../../db/schema';
import { eq } from 'drizzle-orm';

// Type definitions
interface ImageData {
  title: string;
  description?: string;
  url: string;
  prompt?: string;
}

interface UpdateImageData extends Partial<ImageData> {
  id: string;
}

// Response type definitions
interface ImageRecord {
  id: string;
  title: string;
  description: string | null;
  url: string;
  prompt: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ErrorResponse {
  error: string;
}

interface SuccessResponse {
  success: boolean;
}

/**
 * Get all images
 *
 * @route GET /api/images
 * @returns List of image records or error message
 */
export async function GET(): Promise<NextResponse<ImageRecord[] | ErrorResponse>> {
  try {
    const allImages = await db.select().from(images);
    return NextResponse.json(allImages);
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}

/**
 * Create a new image
 *
 * @route POST /api/images
 * @returns Created image record or error message
 */
export async function POST(request: Request): Promise<NextResponse<ImageRecord | ErrorResponse>> {
  try {
    const data: ImageData = await request.json();
    const { title, description, url, prompt } = data;

    const result = await db
      .insert(images)
      .values({
        title,
        description,
        url,
        prompt,
      })
      .returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error creating image:', error);
    return NextResponse.json({ error: 'Failed to create image' }, { status: 500 });
  }
}

/**
 * Update an existing image
 *
 * @route PUT /api/images
 * @returns Updated image record or error message
 */
export async function PUT(request: Request): Promise<NextResponse<ImageRecord | ErrorResponse>> {
  try {
    const data: UpdateImageData = await request.json();
    const { id, title, description, url, prompt } = data;

    const result = await db
      .update(images)
      .set({
        title,
        description,
        url,
        prompt,
        updatedAt: new Date(),
      })
      .where(eq(images.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating image:', error);
    return NextResponse.json({ error: 'Failed to update image' }, { status: 500 });
  }
}

/**
 * Delete an image
 *
 * @route DELETE /api/images?id={id}
 * @returns Success message or error message
 */
export async function DELETE(
  request: Request,
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const result = await db.delete(images).where(eq(images.id, id)).returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}
