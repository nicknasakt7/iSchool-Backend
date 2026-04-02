/*
  Warnings:

  - Added the required column `parentsEmail` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `parentsFirstName` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `parentsLastName` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "parentsEmail" TEXT NOT NULL,
ADD COLUMN     "parentsFirstName" TEXT NOT NULL,
ADD COLUMN     "parentsLastName" TEXT NOT NULL,
ADD COLUMN     "profile_image_public_id" TEXT,
ADD COLUMN     "profile_image_url" TEXT;
