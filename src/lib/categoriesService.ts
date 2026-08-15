import { connectDB } from "@/lib/db";
import { Category } from "@/models/Category";
import { z } from "zod";

export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(30),
});

export async function fetchCategories(portal: string) {
  try {
    await connectDB();
    const categories = await Category.find({ portal }).sort({ createdAt: 1 });
    return {
      success: true as const,
      categories: categories.map((c) => ({
        id: c._id.toString(),
        name: c.name,
      })),
    };
  } catch (error) {
    console.error("fetchCategories failed:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to load categories",
      categories: [],
    };
  }
}

export async function createCategory(name: string, portal: string) {
  try {
    await connectDB();
    const validated = CreateCategorySchema.safeParse({ name });
    if (!validated.success) {
      return { success: false as const, error: "Invalid category name" };
    }

    const existing = await Category.findOne({ name: validated.data.name, portal });
    if (existing) {
      return { success: false as const, error: "Category already exists" };
    }

    const newCategory = await Category.create({ name: validated.data.name, portal });
    return {
      success: true as const,
      category: { id: newCategory._id.toString(), name: newCategory.name },
    };
  } catch (error) {
    console.error("createCategory failed:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to create category",
    };
  }
}
