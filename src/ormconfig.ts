import { DynamicModule } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Logger } from 'protocol-common/logger';

// @tothink we could also use Typeorm's environment variables feature:
// https://github.com/typeorm/typeorm/blob/master/docs/using-ormconfig.md#using-environment-variables
export function OrmConfig(): DynamicModule {
    const options: TypeOrmModuleOptions = {
        type: 'postgres',
        synchronize: false,
        migrationsRun: true,
        entities: ['src/transactions/persistence/**/*.ts', 'transactions/persistence/**/*.js'],
        migrations: ['dist/migration/**/*.js', 'migration/**/*.js'],
        host: process.env.WALLET_DB_HOST,
        username: process.env.WALLET_DB_USER,
        password: process.env.WALLET_DB_PASS,
        database: process.env.WALLET_DB,
        port: parseInt(process.env.WALLET_DB_PORT, 10),
    };
    const module = TypeOrmModule.forRoot(options);

    Logger.info(`OrmConfig() loaded using ${options.host} db ${options.database}, with synchronize ${options.synchronize}`);

    return module;
}
