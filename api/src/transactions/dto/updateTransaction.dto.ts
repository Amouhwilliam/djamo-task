import {IsString} from "class-validator";

export class UpdateTransactionDto {
    @IsString()
    id: string;

    @IsString()
    status: string;

    @IsString()
    webhookUrl: string;
}