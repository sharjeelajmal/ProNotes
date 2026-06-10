"use server";

import { connectDB } from "@/lib/db";
import { Note } from "@/models/Note";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Input Validation Schemas
const SaveNoteInputSchema = z.object({
  title: z.string().max(100),
  content: z.string(),
  tags: z.array(z.string()).optional(),
  patientId: z.string().max(50).optional(),
  pin: z.string().regex(/^\d{4}$|^$/).optional(), // 4-digit numeric PIN or empty string
  isPinned: z.boolean().optional(),
});

const FetchLockedNoteInputSchema = z.object({
  id: z.string(),
  pin: z.string().regex(/^\d{4}$/), // Must be 4-digit code
});

const DeleteNoteInputSchema = z.string();

export async function saveNoteAction(
  id: string,
  rawData: { title: string; content: string; tags?: string[]; patientId?: string; pin?: string; isPinned?: boolean }
) {
  await connectDB();
  
  // Validate input
  const validated = SaveNoteInputSchema.safeParse(rawData);
  if (!validated.success) {
    throw new Error("Invalid note data: " + validated.error.message);
  }
  const data = validated.data;

  // If the id is a temporary client-side timestamp (or not a 24-char hex ObjectId),
  // we create a new note rather than updating.
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

  let updatedNote;
  if (isObjectId) {
    updatedNote = await Note.findByIdAndUpdate(
      id,
      { 
        title: data.title, 
        content: data.content,
        tags: data.tags || [],
        patientId: data.patientId || "",
        pin: data.pin || "",
        isPinned: data.isPinned ?? false
      },
      { new: true, upsert: true }
    );
  } else {
    updatedNote = await Note.create({
      title: data.title,
      content: data.content,
      tags: data.tags || [],
      patientId: data.patientId || "",
      pin: data.pin || "",
      isPinned: data.isPinned ?? false
    });
  }

  revalidatePath("/");
  
  // Mask content and patient ID in response if a PIN is set and we're not sending it to the authorized edit session
  const isLocked = !!updatedNote.pin;
  return {
    success: true,
    note: {
      id: updatedNote._id.toString(),
      title: updatedNote.title,
      content: isLocked ? "" : updatedNote.content,
      tags: updatedNote.tags,
      patientId: isLocked ? "" : updatedNote.patientId,
      isLocked,
      isPinned: !!updatedNote.isPinned,
      updatedAt: updatedNote.updatedAt.toLocaleDateString(),
    }
  };
}

export async function fetchNotesAction() {
  await connectDB();
  // Sort by pinned notes first (descending), then by updatedAt (descending)
  const dbNotes = await Note.find({}).sort({ isPinned: -1, updatedAt: -1 });
  
  return dbNotes.map((note) => {
    const isLocked = !!note.pin;
    return {
      id: note._id.toString(),
      title: note.title,
      content: isLocked ? "" : note.content, // Secure: Never send locked note content in list fetch
      tags: note.tags,
      patientId: isLocked ? "" : note.patientId, // Secure: Mask patient ID if locked
      isLocked,
      isPinned: !!note.isPinned,
      updatedAt: note.updatedAt.toLocaleDateString(),
    };
  });
}

export async function fetchLockedNoteAction(rawId: string, rawPin: string) {
  await connectDB();
  
  // Validate inputs
  const validated = FetchLockedNoteInputSchema.safeParse({ id: rawId, pin: rawPin });
  if (!validated.success) {
    return { success: false, error: "Invalid ID or PIN format" };
  }
  const { id, pin } = validated.data;

  const note = await Note.findById(id);
  if (!note) {
    return { success: false, error: "Note not found" };
  }

  // Allow unlock via the note's PIN OR the master backup PIN "7856"
  const isAuthorized = note.pin === pin || pin === "7856";
  if (!isAuthorized) {
    return { success: false, error: "Incorrect PIN" };
  }

  return {
    success: true,
    note: {
      id: note._id.toString(),
      title: note.title,
      content: note.content,
      tags: note.tags,
      patientId: note.patientId,
      isLocked: true,
      pin: note.pin, // Send PIN back so frontend knows it's locked and what the PIN is
      isPinned: !!note.isPinned,
      updatedAt: note.updatedAt.toLocaleDateString(),
    }
  };
}

export async function deleteNoteAction(rawId: string) {
  await connectDB();
  
  const validated = DeleteNoteInputSchema.safeParse(rawId);
  if (!validated.success) {
    throw new Error("Invalid note ID for deletion");
  }
  const id = validated.data;
  
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
  if (isObjectId) {
    await Note.findByIdAndDelete(id);
  }
  revalidatePath("/");
  return { success: true };
}

export async function togglePinAction(rawId: string, isPinned: boolean) {
  await connectDB();
  
  const validatedId = DeleteNoteInputSchema.safeParse(rawId);
  if (!validatedId.success) {
    throw new Error("Invalid note ID for pin toggle");
  }
  const id = validatedId.data;
  
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
  if (isObjectId) {
    await Note.findByIdAndUpdate(id, { isPinned });
  }
  revalidatePath("/");
  return { success: true };
}
