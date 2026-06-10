import mongoose, { Schema, Document, model, models } from "mongoose";

export interface INote extends Document {
  title: string;
  content: string;
  tags: string[];
  patientId?: string;
  pin?: string;
  isPinned?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    title: { type: String, default: "" },
    content: { type: String, default: "" },
    tags: { type: [String], default: [] },
    patientId: { type: String, default: "" },
    pin: { type: String, default: "" },
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// If the cached model exists but doesn't have the pin or isPinned field (due to Next.js hot-reloading), delete it so it gets re-compiled
if (models.Note && (!models.Note.schema.paths.pin || !models.Note.schema.paths.isPinned)) {
  delete (models as any).Note;
}

export const Note = models.Note || model<INote>("Note", NoteSchema);
