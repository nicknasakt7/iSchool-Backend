export class BillResponseDto {
  id: string;
  billNumber: string;
  title: string;
  description?: string | null;
  amount: number;
  term: number;
  year: number;
  dueDate?: Date | null;
  isPaid: boolean;
  paidAt?: Date | null;
  method?: string | null;
  studentId: string;
  studentName: string;
  parentId: string;
  parentName: string;
  createdAt: Date;
  updatedAt: Date;
}
