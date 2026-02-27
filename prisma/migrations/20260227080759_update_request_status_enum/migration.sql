-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UniformRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requestNo" TEXT NOT NULL,
    "trackingId" TEXT NOT NULL,
    "requestedBy" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UniformRequest_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_UniformRequest" ("createdAt", "id", "notes", "requestNo", "requestedBy", "status", "trackingId") SELECT "createdAt", "id", "notes", "requestNo", "requestedBy", "status", "trackingId" FROM "UniformRequest";
DROP TABLE "UniformRequest";
ALTER TABLE "new_UniformRequest" RENAME TO "UniformRequest";
CREATE UNIQUE INDEX "UniformRequest_requestNo_key" ON "UniformRequest"("requestNo");
CREATE UNIQUE INDEX "UniformRequest_trackingId_key" ON "UniformRequest"("trackingId");
CREATE INDEX "UniformRequest_requestedBy_status_idx" ON "UniformRequest"("requestedBy", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
