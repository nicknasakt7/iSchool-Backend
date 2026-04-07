-- CreateTable
CREATE TABLE "AIClassAnalysis" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "strength" TEXT NOT NULL,
    "weakness" TEXT NOT NULL,
    "suggestion" TEXT NOT NULL,
    "trend" "Trend" NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "term" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIClassAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIParentStudentInsight" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "strength" TEXT NOT NULL,
    "weakness" TEXT NOT NULL,
    "suggestion" TEXT NOT NULL,
    "behaviorInsight" TEXT,
    "learningStyle" TEXT,
    "trend" "Trend" NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "term" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIParentStudentInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AIClassAnalysis_classroomId_term_year_key" ON "AIClassAnalysis"("classroomId", "term", "year");

-- CreateIndex
CREATE UNIQUE INDEX "AIParentStudentInsight_studentId_term_year_key" ON "AIParentStudentInsight"("studentId", "term", "year");

-- AddForeignKey
ALTER TABLE "AIClassAnalysis" ADD CONSTRAINT "AIClassAnalysis_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIClassAnalysis" ADD CONSTRAINT "AIClassAnalysis_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIParentStudentInsight" ADD CONSTRAINT "AIParentStudentInsight_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIParentStudentInsight" ADD CONSTRAINT "AIParentStudentInsight_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
