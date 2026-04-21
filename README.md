# MINIGOCIO 🚀

**MINIGOCIO** es una solución integral y ligera de ERP/CRM y Punto de Venta (POS) diseñada específicamente para optimizar la gestión de negocios locales en Perú. Enfocada en la simplicidad y eficiencia, permite administrar inventarios, ventas, clientes y proveedores con una interfaz moderna y adaptable.

## ✨ Características Principales

- **📦 Gestión de Inventario Flexible:** Controla tus productos por cantidad, peso o volumen. Incluye seguimiento de marcas y proveedores.
- **🛒 Punto de Venta (POS) Optimizado:** Interfaz rápida para ventas directas, con soporte para métodos de pago digitales como **Yape** y **Plin**, además de efectivo.
- **📊 Auditoría y Reportes:** Registro permanente de todas las actividades del sistema con desglose detallado de cada operación.
- **🤝 CRM de Clientes y Proveedores:** Mantén una base de datos organizada de tus contactos comerciales y historial de compras/ventas asociados.
- **📑 Exportación Inteligente:** Descarga tus datos en formato **CSV** (compatible con Excel) para análisis externos o respaldos rápidos.
- **⚙️ Configuración Personalizada:** Controla aspectos fiscales como el **IGV (18%)** y elige entre múltiples temas visuales (**Nord, Soft Dark, Soft Light**).

## 🎨 Personalización Visual

La aplicación utiliza un sistema de esquinas cuadradas para una estética profesional y limpia. Puedes elegir entre:
- **Nord:** El tema clásico basado en la paleta Polar Night y Snow Storm.
- **Soft Dark:** Una variante oscura suave para reducir la fatiga visual.
- **Soft Light:** Una opción clara y brillante para entornos iluminados.

## 🛠️ Stack Tecnológico

- **Frontend:** React + TypeScript + Vite.
- **Estilos:** Tailwind CSS + Shadcn UI.
- **Backend:** Rust (Tauri v2).
- **Base de Datos:** SQLite (vía SQLx).
- **Iconografía:** Lucide React.

## 📋 Requisitos e Instalación

Para ejecutar este proyecto en modo desarrollo:

1.  Asegúrate de tener instalado **Rust** y **Node.js**.
2.  Clona este repositorio.
3.  Instala las dependencias:
    ```bash
    npm install
    ```
4.  Ejecuta la aplicación en modo desarrollo:
    ```bash
    npm run tauri dev
    ```

## 🔐 Seguridad y Respaldos

Tus datos se almacenan localmente en una base de datos SQLite cifrada por el sistema de archivos de tu sistema operativo. Puedes realizar respaldos manuales en formato `.db` o exportar tus tablas a `.csv` desde el panel de configuración.

---
Desarrollado con ❤️ para el crecimiento de los negocios locales.
