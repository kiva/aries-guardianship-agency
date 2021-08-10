
export class TxReportResponseDto {
    public order: number;
    public transactionId: string;
    public typeId: string;
    public subjectId: string;
    public txDate: Date;
    public amount: string;
    public credentialId: string;
    public hash: string;
    public details: string;
}
