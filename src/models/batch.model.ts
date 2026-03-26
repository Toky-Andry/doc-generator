import mongoose, { Schema } from 'mongoose';

export type BatchStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface IBatch {
  _id: string;
  userIds: string[];
  status: BatchStatus;
  totalDocuments: number;
  processedDocuments: number;
  failedDocuments: number;
  documentIds: string[];
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema = new Schema<IBatch>(
  {
    _id: { type: String, required: true },
    userIds: [{ type: String, required: true }],
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    totalDocuments: { type: Number, required: true },
    processedDocuments: { type: Number, default: 0 },
    failedDocuments: { type: Number, default: 0 },
    documentIds: [{ type: String }],
    error: { type: String },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
    _id: false,
  }
);

BatchSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export const Batch = mongoose.model<IBatch>('Batch', BatchSchema);