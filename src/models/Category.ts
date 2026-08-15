import mongoose, { Schema, Document, model, models } from "mongoose";

export interface ICategory extends Document {
  name: string;
  portal: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    portal: { type: String, enum: ['personal', 'business'], required: true },
  },
  { timestamps: true }
);

// Invalidate cached model if it doesn't have the portal field
if (models.Category && !models.Category.schema.paths.portal) {
  delete (models as any).Category;
}

export const Category = models.Category || model<ICategory>("Category", CategorySchema, "categories");
