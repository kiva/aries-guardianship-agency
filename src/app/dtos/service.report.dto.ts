import { IsArray, IsString } from 'class-validator';


export class ServiceReportDto {
    @IsString() serviceName: string;
    @IsString() startedAt: string;
    @IsString() currentTime: string;
    @IsArray() versions: string[];
}
