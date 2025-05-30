import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Импортируем все схемы из центральной точки
import * as schema from './schema';

// Используем переменную окружения для подключения к базе данных
const sql = neon(process.env.DATABASE_URL!);

// Создаем подключение к БД со всеми схемами
export const db = drizzle(sql, { schema });

// Экспортируем схемы для удобства доступа
export * from './schema';
