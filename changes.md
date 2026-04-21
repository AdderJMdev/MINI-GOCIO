# CAMBIOS PARA LA APP DE ESCRITORIO "MINIGOCIO"

## CAMBIOS GENERALES FASE 1
- Cambiar el nombre de la app exactamente a "MINIGOCIO", a excepción de la interfaz configurable donde permite ingresar un nombre personalizado.
- La funcion de escanear codigo de barras debe ser opcional, por defecto usar una funcion manual.
- Esta app esta enfocada a negocios locales en Perú que usan yape, plin u otras billeteras digitales de preferencia en vez de tarjetas, eliminar la funcion de factura por tarjeta.
- la interfaz debe ser completamente con esquinas cuadradas, evitar bordes redondos.
- el tema por defecto debe ser NORD(Polar Night), (Snow Storm), para elemntos visuales graficos (Aurora).

## CAMBIOS GENERALES FASE 2
- La sección reportes debe mostrar contenido lineal de todas las acciones resaltado por la categoria del dato, actualmente es una copia del dashboard.
- Debe haber una sección para administrar proveedores y las compras realizadas.
- Los productos del inventario deben tener mas caracteristicas como "marca", "proveedor", un interruptor para clasificar el tipo de stock ya sea por cantidad, peso, volumen, el programa debe ser muy flexible.
- En configuraciones debe haber una sección para el tipo de moneda ya sea soles o dolares.
- En configuraciones debe haber una sección para el tipo de unidad por defecto, ya sea kg, gramo, litro, etc.
- Exigencia con el tipo de dato, debe ser f para los precios y char para caracteres.
- EL titulo en la interfaz de la app debe estar separado "MINI", "GOCIO" por dos diferentes colores según el tema de colores.

## CAMBIOS GENERALES FASE 3
- Los cuadros con alternativas desplegables tienen un fondo blanco que opaca bastante el texto que contiene, modifica los colores para que sean legibles.
- La moneda por defecto debe ser soles y debe mostrarse en toda la app.
- La app debe tener la capacidad de exportar los datos en formato csv como alternativa a db.
- Al hacer click en alguna fila de la sección Reportes debe desplegar un cuadro con mayor detalles, ya que los registros de ventas no muestra muchos detalles.

## CAMBIOS GENERALES FASE 4
- En configuraciones agrega la opcion de si incluir o no IGV(18%).
- Elimina el modo escáner.
- Los Reportes debe ser una base de datos permanente con una opcion de borrar pero que esta borre todo por completo, no por filas.
- Elimina la opcion de tipo de moneda, debe ser solo soles sin otra alternativa.
- En opciones elimina la funcion de indentidad de marca y en su lugar agrega una opcion para cambiar de thema: nord (actual), soft dark, soft light.
- Mejora la documentación README.md

## CAMBIOS GENERALES 5
- Conexión para respaldo de la base de datos en la nube con google drive y one drive (planificación)
- Sistema de clave unica para cada copia del software (planificación y propuestas)
- Sistema de usuarios en la app
