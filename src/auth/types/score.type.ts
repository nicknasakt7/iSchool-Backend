export type ScoreItemInput = {
  configId: string;
  value: number;
};

export type UpsertScorePayload = {
  studentId: string;
  subjectId: string;
  term: number;
  year: number;
  items: ScoreItemInput[];
  comment?: string;
  teacherId: string;
};
