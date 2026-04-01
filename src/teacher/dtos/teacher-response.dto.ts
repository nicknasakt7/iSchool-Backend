export class TeacherResponseDto {
  id: string;
  email: string;
  gender: string;

  firstName: string;
  lastName: string;
  homeroomClassId?: string | null;

  profileImageUrl?: string | null;

  createdAt: Date;
  updatedAt: Date;
}
