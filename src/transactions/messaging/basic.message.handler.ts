/**
 * the transaction system uses basic messages to complete the transaction protocol (until such time
 * we can make the protocol an accepted RFC in aries).  Each IBasicMessageHandler implementation
 * is expected to handle one type of message.
 *
 * the `TransactionMessageResponseFactory` determines which implementation to use.
 */
export interface IBasicMessageHandler {
    respond(message: any):  Promise<boolean>;
}
