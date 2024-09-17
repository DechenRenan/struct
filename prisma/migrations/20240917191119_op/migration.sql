-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Upload" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "audioLevel" TEXT NOT NULL,
    "audioFilePath" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING'
);
INSERT INTO "new_Upload" ("audioFilePath", "audioLevel", "email", "id") SELECT "audioFilePath", "audioLevel", "email", "id" FROM "Upload";
DROP TABLE "Upload";
ALTER TABLE "new_Upload" RENAME TO "Upload";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
