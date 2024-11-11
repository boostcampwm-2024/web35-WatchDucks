import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs('typeOrmConfig', () => {
  const isDevEnv = ['deployment', 'test', 'debug'].includes(
    process.env.NODE_ENV as string,
  );
  return (
    isDevEnv
      ? {
          type: 'mysql',
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          autoLoadEntities: true,
          synchronize: true,
        }
      : {
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          autoLoadEntities: true,
          synchronize: true,
        }
  ) as TypeOrmModuleOptions;
});