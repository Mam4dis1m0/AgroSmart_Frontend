# Proyecto Web

Este repositorio contiene una aplicación web completa con un frontend en React/Vite, un backend en NestJS y utilidades para base de datos.

## Estructura general del repositorio

- `frontend/` - Aplicación cliente con Vite, React, TypeScript y React Router.
- `backend/back/` - API REST construida con NestJS y TypeScript.
- `scripts/` - Utilidades de soporte, por ejemplo `execute_sql.js`.

> Nota: No hay `package.json` en la raíz. Cada parte del proyecto administra sus propias dependencias.

## Detalle de carpetas

### `frontend/`

Proyecto frontend principal.

- `package.json` - scripts y dependencias de Node.
- `vite.config.ts` - configuración de Vite.
- `src/` - código fuente de la aplicación React.
- `public/` - archivos estáticos.
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` - configuración de TypeScript.
- `eslint.config.js` - reglas de ESLint para el frontend.

También contiene `frontend/vite/`, un subdirectorio con configuración adicional de TypeScript y su propio `src/`.

### `backend/back/`

API backend con NestJS.

- `package.json` - scripts de NestJS, pruebas y lint.
- `src/` - código fuente de la API.
- `test/` - pruebas de integración y e2e.
- `tsconfig.json`, `tsconfig.build.json` - configuración de TypeScript.
- `nest-cli.json` - configuración del CLI de Nest.
- `eslint.config.mjs` - reglas de ESLint para el backend.

### `scripts/`

Utilidades de soporte.

- `execute_sql.js` - script Node.js que ejecuta un archivo SQL en MySQL.

> Importante: `execute_sql.js` usa una ruta absoluta a `html/agrosmart_db_CORREGIDO.sql`. Asegúrate de tener ese archivo disponible o ajusta la ruta.

## Tecnologías principales

- Frontend: React, Vite, TypeScript, React Router, Chart.js.
- Backend: NestJS, TypeScript, Jest, Supertest.
- Base de datos: MySQL (a través de `mysql2` en `execute_sql.js`).

## Cómo ejecutar el frontend

1. Abrir terminal en `frontend`.
2. Ejecutar:

```powershell
cd "frontend"
npm install
npm run dev
```

3. Abre el navegador en la dirección que indique Vite.

## Cómo ejecutar el backend

1. Abrir terminal en `backend\back`.
2. Ejecutar:

```powershell
cd "backend\back"
npm install
npm run start:dev
```

3. La API se iniciará en el puerto configurado por NestJS.

## Comandos útiles

### Frontend

- `npm run dev` - iniciar servidor de desarrollo.
- `npm run build` - compilar la aplicación.
- `npm run lint` - ejecutar ESLint.
- `npm run preview` - vista previa del build.

### Backend

- `npm run start:dev` - iniciar backend en modo desarrollo con watch.
- `npm run build` - compilar el backend.
- `npm run lint` - ejecutar ESLint.
- `npm run test` - ejecutar pruebas unitarias.
- `npm run test:e2e` - ejecutar pruebas e2e.

### Scripts

- `node scripts/execute_sql.js` - ejecutar script SQL para crear la base de datos local.

## Recomendaciones para presentación

1. Explica la arquitectura: frontend separado del backend, cada uno con su propio entorno.
2. Muestra que el frontend usa Vite y React para una SPA moderna.
3. Indica que el backend usa NestJS para estructura modular y servicios.
4. Explica que el script `execute_sql.js` automatiza la instalación de la base de datos MySQL.

## Observaciones

- El repositorio no contiene un directorio `database/html/` dentro de la raíz.
- El README anterior tenía rutas obsoletas a `frontend/all vite/`.
- La estructura real es `frontend/` + `backend/back/` + `scripts/`.
