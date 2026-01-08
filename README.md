# Products Microservice (NestJS + Prisma)

<p align="center">
  <a href="http://nestjs.com/" target="_blank" rel="noopener noreferrer">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="NestJS Logo" />
  </a>
</p>

Microservicio basado en NestJS 11 para gestionar productos utilizando Prisma ORM y SQLite como base de datos. Comunica mediante transporte TCP con patrones de mensaje en lugar de endpoints HTTP tradicionales.

## 📋 Tecnologías y Características Principales

- **Framework**: NestJS 11 con arquitectura de microservicios
- **Transporte**: TCP con patrones de mensaje
- **Base de datos**: SQLite con Prisma ORM
- **Validación**: Global `ValidationPipe` con whitelist y forbidNonWhitelisted
- **Persistencia**: `@prisma/adapter-better-sqlite3` para mejor rendimiento
- **Generación de código**: Cliente Prisma auto-generado en carpeta `generated/`
- **Índices**: Campo `available` indexado para optimizar soft deletes

## 🗄️ Modelo de Datos

### Tabla Product
```prisma
model Product {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  price     Float
  available Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([available])
}
```

**Características**:
- `id`: Identificador único auto-incrementado
- `name`: Nombre único del producto
- `price`: Precio del producto
- `available`: Flag para soft delete (listados solo incluyen `available: true`)
- `createdAt`: Timestamp de creación
- `updatedAt`: Timestamp de última actualización
- Índice en `available` para optimizar filtros

## 🚀 Requisitos Previos

- Node.js y npm instalados
- Entorno configurado con variables de ambiente

## ⚙️ Configuración

### Instalación y Base de Datos

```bash
# Instalar dependencias
npm install

# Aplicar migraciones existentes
npx prisma migrate deploy

# Re-generar cliente Prisma (si cambias schema.prisma)
npx prisma generate
```

### Variables de Ambiente

Copiar `.env.template` a `.env` y configurar:

```env
PORT=3001
DATABASE_URL=file:./dev.db
NODE_ENV=development
```

## 🎯 Scripts Disponibles

### Desarrollo
```bash
npm run start:dev      # Modo watch con hot reload
npm run start          # Inicio sin watch
npm run start:debug    # Modo debug con hot reload
```

### Producción
```bash
npm run build          # Compilar TypeScript a JavaScript
npm run start:prod     # Ejecutar desde dist/
```

### Pruebas y Calidad
```bash
npm run lint           # Ejecutar ESLint y corregir
npm run format         # Formatear código con Prettier
npm run test           # Ejecutar tests unitarios
npm run test:watch     # Tests en modo watch
npm run test:cov       # Tests con coverage
npm run test:debug     # Tests en modo debug
npm run test:e2e       # Tests end-to-end
```

## 📡 Comunicación TCP - Patrones de Mensaje

El microservicio escucha en el puerto configurado en `PORT` y responde a los siguientes patrones:

| Comando | Payload Esperado | Respuesta |
|---------|------------------|-----------|
| `create_product` | `{ name: string, price: number }` | Producto creado con `id`, `createdAt`, `updatedAt` |
| `find_all_products` | `{ page?: number, limit?: number }` | `{ data: Product[], meta: { totalItems, page, lastPage } }` |
| `find_one_product` | `{ id: number }` | Producto encontrado o error 404 |
| `update_product` | `{ id: number, name?: string, price?: number }` | Producto actualizado |
| `remove_product` | `{ id: number }` | Marca `available` en `false` (soft delete) |

### Ejemplo de Cliente NestJS

```typescript
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

const client = ClientProxyFactory.create({
  transport: Transport.TCP,
  options: { port: 3001 },
});

// Crear producto
client.send({ cmd: 'create_product' }, { name: 'Lámpara LED', price: 29.99 })
  .subscribe(
    (product) => console.log('Producto creado:', product),
    (error) => console.error('Error:', error)
  );

// Obtener todos los productos (paginados)
client.send({ cmd: 'find_all_products' }, { page: 1, limit: 10 })
  .subscribe(
    (result) => console.log('Productos:', result.data, 'Total:', result.meta.totalItems),
  );

// Obtener un producto
client.send({ cmd: 'find_one_product' }, { id: 1 })
  .subscribe((product) => console.log('Producto:', product));

// Actualizar producto
client.send({ cmd: 'update_product' }, { id: 1, price: 39.99 })
  .subscribe((product) => console.log('Actualizado:', product));

// Desactivar producto (soft delete)
client.send({ cmd: 'remove_product' }, { id: 1 })
  .subscribe((product) => console.log('Desactivado:', product));
```

## 📁 Estructura del Proyecto

```
src/
├── app.module.ts              # Módulo raíz
├── main.ts                    # Punto de entrada (TCP microservice)
├── prisma.service.ts          # Servicio Prisma
├── common/
│   ├── index.ts
│   └── dto/
│       └── pagination.dto.ts   # DTO para paginación
├── config/
│   ├── envs.ts                # Configuración de ambiente
│   └── index.ts
└── products/
    ├── products.controller.ts  # Controlador TCP
    ├── products.module.ts      # Módulo de productos
    ├── products.service.ts     # Lógica de negocio
    ├── dto/
    │   ├── create-product.dto.ts
    │   └── update-product.dto.ts
    └── entities/
        └── product.entity.ts

prisma/
├── schema.prisma              # Definición de modelo de datos
└── migrations/                # Historial de migraciones
    ├── 20251214202549_init/
    ├── 20251214222828_available/
    └── 20251214224515_available_index/

generated/
└── prisma/                    # Cliente Prisma auto-generado
    ├── browser.ts
    ├── client.ts
    ├── commonInputTypes.ts
    ├── enums.ts
    ├── models.ts
    └── internal/
```

## 🔄 Migraciones de Base de Datos

El proyecto incluye 3 migraciones:

1. **20251214202549_init**: Creación inicial de tabla `Product`
2. **20251214222828_available**: Adición del campo `available` (soft delete)
3. **20251214224515_available_index**: Creación de índice en campo `available`

Para crear una nueva migración después de cambiar `schema.prisma`:

```bash
npx prisma migrate dev --name nombre_descriptivo
```

## 🛡️ Validación y Seguridad

- **ValidationPipe Global**: Todas las solicitudes pasan por validación de DTO
- **Whitelist**: Solo campos permitidos en DTOs
- **forbidNonWhitelisted**: Rechaza campos no definidos en DTOs
- **Class Validator**: Validaciones decoradas en clases DTO
- **Soft Delete**: Los productos no se eliminan, solo se marcan como `available: false`

## 📝 Logs y Debugging

Para debug detallado:

```bash
npm run start:debug
```

Esto inicia el servicio en modo debug permitiendo usar breakpoints en el IDE.

## 📦 Dependencias Principales

- `@nestjs/core@^11.0.1`: Framework NestJS
- `@nestjs/microservices@^11.1.9`: Soporte para microservicios TCP
- `@prisma/client@^7.1.0`: ORM Prisma
- `@prisma/adapter-better-sqlite3@^7.1.0`: Adaptador SQLite optimizado
- `class-validator@^0.14.3`: Validación de DTOs
- `class-transformer@^0.5.1`: Transformación de datos
- `nats@^2.29.3`: Cliente NATS (disponible para futuros patrones)

## 🤝 Contribución

1. Crear rama desde `main`
2. Hacer cambios
3. Ejecutar `npm run lint` y `npm run format`
4. Ejecutar tests: `npm run test` y `npm run test:e2e`
5. Crear Pull Request

## 📄 Licencia

UNLICENSED
