/*
  Warnings:

  - A unique constraint covering the columns `[gradeId,name,year,term]` on the table `Classroom` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Classroom_name_gradeId_key";

-- DropIndex
DROP INDEX "Classroom_name_key";

-- AlterTable
ALTER TABLE "Classroom" ADD COLUMN     "term" INTEGER,
ADD COLUMN     "year" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Classroom_gradeId_name_year_term_key" ON "Classroom"("gradeId", "name", "year", "term");
