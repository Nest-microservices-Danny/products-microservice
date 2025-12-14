# Products microservice (NestJS + Prisma)

<p align="center">
  <a href="http://nestjs.com/" target="_blank" rel="noopener noreferrer">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="NestJS Logo" />
  </a>
</p>

Microservicio TCP para gestionar productos usando NestJS 11 y Prisma con SQLite. Expone comandos para crear, listar, actualizar y desactivar productos mediante patrones de mensaje en lugar de endpoints HTTP.

## Stack y puntos clave
- NestJS microservices con transporte TCP y `ValidationPipe` global (whitelist y forbid non whitelisted).
- Prisma ORM con `@prisma/adapter-better-sqlite3`; base local `dev.db` incluida.
- Esquema `Product`: `id`, `name` (unico), `price`, `available` (soft delete), `createdAt`, `updatedAt`.
- Listados y consultas solo devuelven productos `available: true`.

## Requisitos previos
- Node y npm instalados.
- Copiar `.env.template` a `.env` y ajustar variables:
  - `PORT` (ej. 3001).
  - `DATABASE_URL` (ej. `file:./dev.db` para usar el archivo incluido).

## Instalacion y base de datos
```bash
npm install
# Si necesitas recrear la base desde cero:
npx prisma migrate deploy   # aplica migraciones existentes
npx prisma generate         # re-generar cliente si cambias el esquema
```

## Arranque
```bash
npm run start:dev   # modo watch
npm run start       # desarrollo sin watch
npm run build && npm run start:prod   # produccion (usa dist/)
```

## Uso via mensajes TCP
El microservicio escucha en el puerto `PORT` y responde a estos patrones (`cmd`):

| Comando `cmd`          | Payload esperado                                             | Respuesta |
|------------------------|-------------------------------------------------------------|-----------|
| `create_product`       | `{ name: string, price: number }`                           | Producto creado |
| `find_all_products`    | `{ page?: number, limit?: number }`                         | `{ data: Product[], meta: { totalItems, page, lastPage } }` |
| `find_one_product`     | `{ id: number }`                                            | Producto encontrado o error 404 |
| `update_product`       | `{ id: number, name?: string, price?: number }`             | Producto actualizado |
| `remove_product`       | `{ id: number }`                                            | Marca `available` en `false` (soft delete) |

Ejemplo rapido de cliente NestJS:
```ts
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

const client = ClientProxyFactory.create({
  transport: Transport.TCP,
  options: { port: 3001 },
});

client.send({ cmd: 'create_product' }, { name: 'Lamp', price: 29.9 })
  .subscribe(console.log);
```

## Scripts utiles
- `npm run lint`
- `npm run test`, `npm run test:e2e`, `npm run test:cov`
- `npm run format`
