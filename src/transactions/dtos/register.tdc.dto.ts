import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class RegisterTdcDto {
    @ApiProperty({
        example: `tdc`,
        description: `arbitrary id for the tdc.  the fsp can use this as an id`
    })
    @IsString() readonly tdcPrefix: string;

    @ApiProperty({
        example: `http://localhost:3015`,
        description: `url for the TDC restful apis`
    })
    @IsString() readonly tdcEndpoint: string;
}
