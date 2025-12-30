/* eslint-disable @typescript-eslint/no-empty-object-type */
export interface Diary {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ErrorResponse {
  statusCode: number;
}

export type ErrorResponseType = ErrorResponse | Diary;

export interface CreateDiaryDto {
  title: string;
  content: string;
}

export interface UpdateDiaryDto extends Partial<CreateDiaryDto> {}
