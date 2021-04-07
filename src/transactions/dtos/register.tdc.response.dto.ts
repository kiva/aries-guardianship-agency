import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Max, Min } from 'class-validator';

export class RegisterTdcResponseDto {
    @ApiProperty({
        example: `see acapy api documentation`,
        description: `json data from connection made through acapy. see acapy for structure`
    })
    @IsNotEmpty() readonly connectionData: any;
}
