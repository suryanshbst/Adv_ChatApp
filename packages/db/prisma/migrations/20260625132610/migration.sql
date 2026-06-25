/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `Messages` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Messages_id_key" ON "Messages"("id");

-- CreateIndex
CREATE INDEX "Messages_roomId_idx" ON "Messages"("roomId");

-- CreateIndex
CREATE INDEX "Messages_senderId_idx" ON "Messages"("senderId");
