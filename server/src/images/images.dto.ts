import { IsBase64, IsString } from 'class-validator';

export class UploadImageDto {
    @IsString()
    name!: string;

    @IsString()
    mimeType!: string;

    @IsBase64()
    data!: string;
}
