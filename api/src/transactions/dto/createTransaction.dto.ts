import {IsString} from "class-validator";


export class CreateTransactionDto {
    @IsString()
    id: string;
}