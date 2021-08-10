/**
 * places string constants for basic message `messageTypeId` field into enum
 * See also: https://docs.google.com/spreadsheets/d/11-09O0ZOKfDQok15I-AjJR8ZiTohor_Tlz_6DkBo62Y/edit#gid=779011158
 *
 * TODO: this is shared with FSP and TRO services, move to common package
 *       https://github.com/kiva/aries-controller/tree/main/src/agent/messaging
 */
export enum TransactionMessageTypesEnum {
    // TODO rename to TRANSACTION_REQUEST
    CREDIT_TRANSACTION = `credit_transaction`,
    GRANT = `grant`,
    // TODO: rename to REPORT_REQUEST
    TRANSACTION_REQUEST = `transaction_request`
}
