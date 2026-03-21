# Guía de Instalación del Sistema Hotelero

Esta guía describe cómo levantar el Sistema de Gestión Hotelera completo desde cero.

## 1. Requisitos Previos
*   **Node.js**: Versión 18+ instalada.
*   **Microsoft SQL Server**: Conexión a la base de datos `PruebaIA` en el servidor `76.74.150.83,1434`.
*   **Git / Terminal**: Terminal lista para ejecutar comandos.

## 2. Configuración de Base de Datos
El proyecto utiliza autenticación SQL Server (`Integrated Security = False`). El código actualmente asume de forma predeterminada el usuario `sa` y la base de datos `PruebaIA`.

1. Abre SQL Server Management Studio (SSMS) u otro cliente de SQL.
2. Conéctate a la instancia `76.74.150.83,1434` usando autenticación SQL con tu usuario.
3. Abre el archivo localizado en `database/schema.sql`.
4. Ejecuta el script completo. Esto creará la estructura en la base de datos `PruebaIA` (asegúrate de cambiar la primera línea del script para apuntar a `PruebaIA` en lugar de `HotelDB`), sus tablas y un usuario administrador inicial.

**Credenciales Iniciales de Admin:**
*   **Email:** admin@hotel.com
*   **Password:** admin123

## 3. Configuración y Ejecución del Backend

1. Abre una terminal y navega hacia la carpeta del backend:
   ```bash
   cd hotel-system/backend
   ```
2. Instala las dependencias necesarias:
   ```bash
   npm install
   ```
3. Crea un archivo `.env` en la raíz del backend (puedes copiar el contenido de `.env.example`). Asegúrate de que los datos de conexión coincidan con tu SQL Server.
4. Inicia el servidor de backend:
   ```bash
   npm start
   ```
   *El backend debe indicar que se conectó a MSSQL y está corriendo en el puerto 5000.*

## 4. Configuración y Ejecución del Frontend

1. Abre otra ventana de terminal y navega hacia el frontend:
   ```bash
   cd hotel-system/frontend
   ```
2. Instala las dependencias (se recomienda `npm install --legacy-peer-deps` si hay conflictos de React):
   ```bash
   npm install --legacy-peer-deps
   ```
3. Levanta el servidor de desarrollo de Vite:
   ```bash
   npm run dev
   ```
4. Abre tu navegador en la URL indicada (generalmente `http://localhost:3000` o `http://localhost:5173`).

¡Listo! Ingresa con las credenciales de administrador y comenzarás a utilizar el sistema.
