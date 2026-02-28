-- CreateTable
CREATE TABLE "Store" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "displayName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "storeId" INTEGER NOT NULL,
    "uniformLimit" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Staff_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockItem" (
    "ean" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("ean", "name")
);

-- CreateTable
CREATE TABLE "UniformRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ean" TEXT NOT NULL,
    "stockItemName" TEXT NOT NULL,
    "trackingId" TEXT NOT NULL,
    "requestedBy" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UniformRequest_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UniformRequest_ean_stockItemName_fkey" FOREIGN KEY ("ean", "stockItemName") REFERENCES "StockItem" ("ean", "name") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Store_name_key" ON "Store"("name");

-- CreateIndex
CREATE INDEX "Staff_storeId_idx" ON "Staff"("storeId");

-- CreateIndex
CREATE INDEX "Staff_role_idx" ON "Staff"("role");

-- CreateIndex
CREATE INDEX "StockItem_name_idx" ON "StockItem"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UniformRequest_trackingId_key" ON "UniformRequest"("trackingId");

-- CreateIndex
CREATE INDEX "UniformRequest_requestedBy_status_idx" ON "UniformRequest"("requestedBy", "status");

-- CreateIndex
CREATE INDEX "UniformRequest_ean_idx" ON "UniformRequest"("ean");
