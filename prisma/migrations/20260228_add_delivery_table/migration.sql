-- CreateTable
CREATE TABLE "Delivery" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trackingId" TEXT NOT NULL,
    "storeId" INTEGER NOT NULL,
    "staffId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Delivery_trackingId_fkey" FOREIGN KEY ("trackingId") REFERENCES "UniformRequest" ("trackingId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Delivery_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Delivery_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_trackingId_key" ON "Delivery"("trackingId");

-- CreateIndex
CREATE INDEX "Delivery_storeId_idx" ON "Delivery"("storeId");

-- CreateIndex
CREATE INDEX "Delivery_staffId_idx" ON "Delivery"("staffId");
