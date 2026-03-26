import mongoose, { Schema } from 'mongoose';

export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface IDocument {
  _id: string;
  batchId: string;
  userId: string;
  status: DocumentStatus;
  gridfsFileId?: string;
  fileName?: string;
  fileSize?: number;
  attempts: number;
  error?: string;
  generatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    _id: { type: String, required: true },
    batchId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    gridfsFileId: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    attempts: { type: Number, default: 0 },
    error: { type: String },
    generatedAt: { type: Date },
  },
  {
    timestamps: true,
    _id: false,
  }
);

DocumentSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export const DocumentModel = mongoose.model<IDocument>('Document', DocumentSchema);