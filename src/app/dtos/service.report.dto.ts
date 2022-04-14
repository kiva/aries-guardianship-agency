import { IsArray, IsString } from 'class-validator';

/**
 * Please note: this structure is expected to be used across all services
 * which report statistics
 */
export class ServiceReportDto {
    @IsString() serviceName: string;
    @IsString() startedAt: string;
    @IsString() currentTime: string;
    @IsArray() versions: string[];
}
