db = db.getSiblingDB('doc-generator');

db.createCollection('batches');
db.batches.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 });
db.batches.createIndex({ status: 1 });

db.createCollection('documents');
db.documents.createIndex({ batchId: 1 });
db.documents.createIndex({ userId: 1 });
db.documents.createIndex({ status: 1 });
db.documents.createIndex({ createdAt: 1 });

print('MongoDB initialized successfully');