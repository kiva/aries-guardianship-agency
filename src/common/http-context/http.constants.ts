
/**
 * author: esmaeila
 * Enum defines different http header names, etc.
 */

export enum HttpConstants {
    REQUEST_ID_HEADER = 'x-request-id',
    REQUEST_ID = 'reqid',
    JWT_AUTH_HEADER = 'x-jwt-auth',
    AUTH0_AUTH_HEADER = 'Authorization',
    AUTH0_CLIENT_ID_HEADER = 'x-client-id',
    AUTH0_CLIENT_SECRET_HEADER = 'x-client-secret',
    AUTH0_GRANT_TYPE = 'client_credentials',
    FSP_ID_HEADER = 'x-fsp-id',
    PING_RESPONSE = 'pong',
    HEALTHZ_RESPONSE = 'OK',
    JSON_LIMIT = '50mb',
}
