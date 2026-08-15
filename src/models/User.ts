import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IUser extends Document {
  username: string;
  password: string; // Plain-text as requested
  portal: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    portal: { type: String, enum: ['business'], required: true, default: 'business' },
  },
  { timestamps: true }
);

export const User = models.User || model<IUser>("User", UserSchema, "users");
