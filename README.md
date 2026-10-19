# Seguimiento de Tóners

Aplicación web para llevar el control de las recargas y los cambios de tóner de los distintos servicios. Permite consultar el estado de cada movimiento, filtrar el historial, administrar servicios y responsables, y preparar un resumen mensual imprimible.

Los registros se guardan en Firebase Firestore. Cuando la aplicación está conectada, los cambios se sincronizan en tiempo real entre las personas que la tienen abierta.

## URL y acceso

- **Aplicación publicada:** [https://seguimiento-de-toners.web.app](https://seguimiento-de-toners.web.app)
- **Dirección alternativa de Firebase:** [https://seguimiento-de-toners.firebaseapp.com](https://seguimiento-de-toners.firebaseapp.com)
- **Proyecto Firebase:** `seguimiento-de-toners`
- **Base de datos:** Cloud Firestore, colección `registros`.

Las dos direcciones públicas llevan a la misma aplicación. Para presentarla, abre la primera en un navegador con conexión a Internet. No es necesario abrir VS Code para mostrar la versión publicada. La carpeta del proyecto en este computador está en `C:\Users\Sistemas\Documents\toner-tracker`.

> **Antes de compartir la URL:** el sitio está publicado y actualmente muestra registros. La aplicación no tiene inicio de sesión; comparte la dirección solo con personas autorizadas y no introduzcas información privada o sensible hasta que se configure el acceso seguro en Firebase. Durante una demostración, evita guardar, editar o eliminar registros reales.

## Explicación general

Esta página sirve para centralizar el seguimiento de los tóneres utilizados en los diferentes servicios. En lugar de llevar los movimientos en apuntes separados, cada recarga o cambio se registra con su estado, servicio, identificadores, fechas y responsable. Así se puede revisar qué ocurrió, encontrar registros anteriores y preparar un resumen mensual.

El recorrido habitual es: registrar un movimiento, consultar su tarjeta en el tablero, actualizarla si el estado cambia y usar los filtros o el reporte para revisar la información. La aplicación es un registro de seguimiento; no controla físicamente las impresoras ni detecta automáticamente el nivel de tóner.

Una forma breve de presentarla sería: “Seguimiento de Tóners es una página para registrar y consultar las recargas y los cambios de tóner por servicio. Permite identificar el tóner atendido y su reemplazo, indicar el estado y el responsable, buscar movimientos anteriores y generar un reporte mensual de cantidades y valores. La información se comparte en tiempo real mediante Firebase”.

## Partes de la página

- **Encabezado:** identifica la aplicación. El texto debajo del título muestra cuántos registros hay y si están sincronizados, o indica si hubo un problema de conexión. **Editar listas** administra los servicios y responsables disponibles; **+ Nuevo registro** abre el formulario.
- **Indicadores:** resumen de cuántos registros hay y cuántos están recargados o cambiados, pendientes o sin stock. No cambian al aplicar filtros.
- **Estados rápidos:** botones para mostrar todos los registros o filtrar por recargado, cambiado, pendiente o sin stock.
- **Búsqueda y filtros:** permiten reducir las tarjetas visibles por texto, servicio y responsable.
- **Resumen mensual:** calcula cantidades y valores para un mes y permite imprimir el reporte.
- **Tarjetas:** muestran un resumen de cada movimiento. Al pulsarlas se despliega la información; el botón **Editar** abre el formulario.
- **Ventanas de formulario:** una sirve para crear, modificar o eliminar registros; la otra administra las listas de servicios y responsables.

## Dónde está cada cosa

Los archivos principales están en la carpeta raíz `toner-tracker`, abierta en VS Code:

| Archivo o carpeta | Para qué sirve |
| --- | --- |
| `index.html` | Estructura de la página: encabezado, contadores, filtros, reporte y formularios. |
| `style.css` | Colores, tipografía, distribución y adaptación a teléfonos e impresión. |
| `script.js` | Comportamiento: conexión con Firebase, lectura y escritura de registros, filtros, listas y reporte. |
| `firebase-config.js` | Identificadores públicos de configuración que conectan la página con el proyecto Firebase. No contiene una contraseña. |
| `firebase.json` | Configuración de Firebase Hosting; define la carpeta publicada y reglas de caché. |
| `.firebaserc` | Indica que el proyecto Firebase seleccionado para esta carpeta es `seguimiento-de-toners`. |
| `umit.png` | Imagen institucional que aparece junto al título. |
| `404.html` | Página que Hosting muestra cuando se solicita una dirección que no existe. |
| `.vscode/tasks.json` | Configura la tarea de VS Code que inicia la publicación automática al abrir la carpeta. |
| `.vscode/deploy-watch.js` | Observa cambios en archivos y ejecuta la publicación de Hosting cuando detecta uno. |
| `README.md` | Esta documentación y las instrucciones de uso y mantenimiento. |
| `documentacion_toner_tracker.docx` | Documento de Word existente en la carpeta del proyecto. |
| `assets/` | Carpeta disponible para recursos adicionales; actualmente está vacía. |

Las carpetas ocultas `.firebase/` y `.venv/` son archivos de soporte/caché del entorno; no son necesarias para explicar el funcionamiento de la página. No edites archivos dentro de ellas para cambiar la aplicación.

## Guía de uso

### Consultar el tablero

En la parte superior se muestran cuatro contadores: registros totales, recargados o cambiados, pendientes y sin stock. Los contadores corresponden a todos los registros, aunque haya filtros activos.

Cada tarjeta muestra inicialmente el estado, el servicio y el ID del tóner. Pulsa una tarjeta para ver el resto de la información y luego **Editar** para modificar el registro.

### Crear un registro

1. Pulsa **+ Nuevo registro**.
2. Selecciona el estado final: **Recargado**, **Cambiado**, **Pendiente** o **Sin stock**.
3. Escribe el ID del tóner que se atiende y selecciona el servicio. Estos dos datos son obligatorios para guardar.
4. Completa los demás datos que correspondan y pulsa **Guardar**.

El formulario también permite registrar el ID del tóner de reemplazo, el servicio al que se traslada el tóner retirado, las fechas de cambio y recarga, la cantidad de cilindros cambiados, el número de impresiones, la persona responsable y una novedad. Estos campos son opcionales. Cancelar cierra el formulario sin guardar.

### Qué significa cada campo

| Campo | Significado |
| --- | --- |
| **Estado final** | Describe el resultado registrado: recargado, cambiado, pendiente o sin stock. |
| **ID tóner para cambiar** | Identificador del tóner vacío o atendido. Es obligatorio. |
| **ID tóner de reemplazo** | Identificador del tóner nuevo que se instala, cuando aplica. |
| **Servicio** | Servicio relacionado con el movimiento. Es obligatorio y también se usa para agrupar el reporte mensual. |
| **Fecha de cambio** | Fecha en que se realizó el cambio de tóner. |
| **Fecha de recarga** | Fecha en que se realizó la recarga. En el reporte mensual tiene prioridad sobre la fecha de cambio para decidir a qué mes pertenece el registro. |
| **N.° cilindros cambiados** | Cantidad de cilindros asociados al movimiento. Se utiliza en el cálculo del reporte mensual. |
| **N.° impresiones** | Cantidad de impresiones anotada para el movimiento. Se conserva en el registro, pero no aparece en las tarjetas ni se suma en el reporte actual. |
| **Cambiado por** | Persona responsable seleccionada de la lista. |
| **Novedad** | Nota libre para dejar información adicional. |

Los únicos campos que la aplicación exige para guardar son el ID del tóner atendido y el servicio. Las fechas, cantidades, responsable y demás datos no tienen validación obligatoria; completa los que sean necesarios para que el historial sea útil.

### Cómo interpretar los estados

- **Recargado:** la recarga quedó registrada como realizada.
- **Cambiado:** el tóner fue reemplazado.
- **Pendiente:** el trabajo aún no se ha completado.
- **Sin stock:** no hay disponibilidad para completar el movimiento.

### Editar o eliminar

Selecciona la tarjeta del registro. Puedes cambiar sus datos y pulsar **Guardar**, o pulsar **Eliminar** para borrarlo. La eliminación se ejecuta inmediatamente y no tiene confirmación; verifica que seleccionaste el registro correcto.

### Buscar y filtrar

- Usa los botones de estado para mostrar todos los registros o limitar la vista a recargados, cambiados, pendientes o sin stock.
- Escribe un ID en el campo de búsqueda para encontrar coincidencias tanto en el tóner atendido como en el de reemplazo; también busca en servicios y novedades.
- Selecciona una fecha para mostrar registros cuya fecha de cambio o recarga coincida con ese día.
- Usa los menús de servicio y responsable para limitar los resultados.
- Los filtros se pueden combinar. Para volver a ver todo, limpia la búsqueda y selecciona **Todos** en los filtros.

Los filtros se pueden combinar; por ejemplo, puedes seleccionar una fecha y escribir un ID para limitar los resultados a ese tóner en ese día.

### Administrar servicios y responsables

1. Pulsa **Editar listas**.
2. Selecciona **Servicios** o **Responsables**.
3. Para agregar una opción, escribe su nombre y pulsa **Agregar**. También puedes pulsar Enter.
4. Pulsa **Quitar** para retirarla de la lista.
5. Pulsa **Guardar cambios** para aplicar y sincronizar la lista, o **Cancelar** para descartar los cambios.

Las opciones se guardan en Firestore y se normalizan a mayúsculas. Retirar una opción de la lista no borra los registros históricos que ya la usan.

### Consultar e imprimir el resumen mensual

1. Abre **Resumen mensual**.
2. Selecciona el mes que quieres consultar.
3. Ajusta, si es necesario, el valor unitario del tóner y del cilindro.
4. Pulsa **Imprimir** y elige impresora o destino PDF en el diálogo del navegador.

El reporte agrupa los movimientos por servicio y presenta la cantidad de recargas, cambios y cilindros, sus subtotales y el total. Los valores iniciales son $ 35.000 por tóner y $ 20.000 por cilindro; se pueden cambiar antes de imprimir. El total se calcula así:

`(recargas + cambios) × valor del tóner + cilindros × valor del cilindro`

Para asignar un movimiento a un mes, la aplicación usa la fecha de recarga cuando existe; si no, usa la fecha de cambio. El conteo de recargas y cambios incluye los estados **Recargado** y **Cambiado**, respectivamente. El número de cilindros se suma en los movimientos del mes aunque su estado sea otro. Los valores se muestran con formato colombiano.

## Conexión y almacenamiento

- La aplicación necesita conexión a Internet para cargar y sincronizar datos.
- Los registros y las listas se almacenan en la colección `registros` de Firestore. La configuración de listas se guarda en un documento especial de esa colección.
- El tablero se actualiza automáticamente cuando Firestore recibe cambios.
- Si no se puede conectar, la página muestra un aviso de conexión y no se pueden guardar los cambios.
- La aplicación no cuenta actualmente con inicio de sesión, usuarios ni permisos por persona. La configuración de Firebase que carga el navegador no es una contraseña.

> **Seguridad:** no uses reglas de Firestore que permitan leer y escribir a cualquiera para guardar datos sensibles. Que la URL no se publique no impide que otras personas accedan a los datos si las reglas lo permiten. Antes de usar información real o compartir el sitio ampliamente, configura Firebase Authentication y reglas de Firestore que requieran usuarios autorizados, e integra el inicio de sesión en la aplicación. Mientras eso no esté implementado, usa únicamente datos de prueba y reglas acordes con ese uso.

## Configuración para desarrollo

### Compartir el código en GitHub

1. Crea en GitHub un repositorio **privado** y copia su dirección HTTPS. No marques la opción de crear un README si vas a subir esta carpeta, porque ya tiene uno.
2. En VS Code, abre la carpeta `toner-tracker` y usa **Control de código fuente > Publicar en GitHub** para publicar el proyecto, o conecta la dirección del repositorio desde la terminal.
3. Comprueba que el repositorio incluya `index.html`, `style.css`, `script.js`, `firebase-config.js`, `firebase.json`, `.firebaserc`, `README.md`, `umit.png` y `.vscode/`.
4. No subas `.venv/`, `.firebase/`, `node_modules/` ni archivos `.env`; `.gitignore` ya excluye esas carpetas y archivos locales.

Si el repositorio remoto ya está creado y esta carpeta todavía no tiene un remoto, estos son los comandos para conectarlo y subir la rama principal. Sustituye la dirección de ejemplo por la URL HTTPS copiada desde GitHub:

```powershell
git init
git add .
git commit -m "Preparar proyecto para compartir"
git branch -M main
git remote add origin https://github.com/USUARIO/REPOSITORIO.git
git push -u origin main
```

Si Git indica que no hay cambios para confirmar, continúa con `git push`. Si `origin` ya existe, no repitas `git remote add origin`; verifica el remoto con `git remote -v` y luego usa `git push -u origin main`.

En el otro computador, instala Git y VS Code, clona el repositorio y abre la carpeta:

```powershell
git clone https://github.com/USUARIO/REPOSITORIO.git
cd REPOSITORIO
```

Para traer cambios antes de trabajar y compartir los propios al terminar:

```powershell
git pull
git add .
git commit -m "Describe el cambio realizado"
git push
```

El proyecto es una página HTML/CSS/JavaScript y carga Firebase desde Internet; no necesita `npm install` para ejecutarse. Para probarlo, abre la carpeta clonada en VS Code y usa **Live Server** sobre `index.html`. `firebase-config.js` y `.firebaserc` conectan con el proyecto Firebase existente, así que déjalos incluidos si el equipo debe usar esa misma base de datos.

La carpeta `.vscode/` incluye una tarea que inicia un observador al abrir el proyecto. Cuando detecta cambios en archivos, intenta publicar la página en Firebase Hosting. Para que la publicación funcione en otro computador, instala Firebase CLI e inicia sesión con una cuenta que tenga permiso para ese proyecto. La tarea no sustituye a Git ni sincroniza el código entre equipos.

**Importante:** tener acceso al repositorio no concede permisos de Firebase, y un repositorio privado no vuelve privada la página publicada. Los movimientos permanecen en Firestore, no en GitHub. Como la aplicación no tiene inicio de sesión, revisa las reglas de Firestore antes de permitir que otras personas usen la URL o modifiquen datos.

### Preparar Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
2. Crea una base de datos **Cloud Firestore**.
3. Registra una aplicación web en la configuración del proyecto.
4. Copia la configuración web que proporciona Firebase en `firebase-config.js`, reemplazando los valores de ejemplo.
5. Configura las reglas de Firestore según el nivel de acceso requerido. La aplicación no incluye autenticación, así que no habilites reglas que dependan de un usuario autenticado hasta que se integre ese flujo.

### Ejecutar en el computador

1. Abre esta carpeta en VS Code.
2. Instala la extensión **Live Server**.
3. Haz clic derecho en `index.html` y selecciona **Open with Live Server**.
4. Live Server abrirá una dirección local en el navegador. Usa la dirección que aparece en ese momento; normalmente empieza por `http://127.0.0.1:5500/`.
5. Prueba únicamente con datos no sensibles.

No abras el archivo HTML directamente desde el explorador de archivos: la aplicación carga módulos JavaScript y Firebase desde Internet, por lo que debe servirse mediante HTTP/HTTPS.

## Publicar con Firebase Hosting

La versión pública ya está disponible en `https://seguimiento-de-toners.web.app`. Esta carpeta también tiene una tarea de VS Code que intenta publicar cambios automáticamente al abrir el espacio de trabajo y cuando se modifican archivos. Para que funcione, Firebase CLI debe estar instalado y la sesión debe tener acceso al proyecto. La tarea se puede dejar activa mientras se trabaja; detenerla no elimina el sitio publicado.

Con Node.js instalado y Firebase configurado, abre una terminal en la carpeta del proyecto:

```sh
npm install -g firebase-tools
firebase login
firebase init hosting
```

Durante la configuración, selecciona el proyecto de Firebase correspondiente, indica `.` como carpeta pública y responde **No** a la pregunta de configurar una aplicación de una sola página. No reemplaces `index.html` si Firebase lo pregunta.

Después publica el sitio:

```sh
firebase deploy
```

Firebase mostrará la URL del sitio publicado. Antes de compartirla o cargar datos reales, revisa las reglas de Firestore y ten en cuenta la advertencia de seguridad anterior.

## Guion para presentar la aplicación

1. **Abrir:** entra a `https://seguimiento-de-toners.web.app` y confirma que bajo el título aparezca el estado de sincronización.
2. **Explicar el propósito:** “Esta aplicación centraliza el historial de recargas y cambios de tóner por servicio, con estado, fechas, identificadores y responsable”.
3. **Mostrar el tablero:** señala los cuatro contadores y explica que resumen todos los registros, independientemente de los filtros activos.
4. **Mostrar una consulta:** usa un filtro de estado o servicio y abre una tarjeta para ver sus detalles. No pulses **Editar**, **Eliminar** ni **Guardar** sobre registros reales durante la demostración.
5. **Mostrar el reporte:** abre **Resumen mensual**, indica el mes y explica que agrupa recargas, cambios y cilindros por servicio; puedes mostrar **Imprimir** sin confirmar una impresión.
6. **Cerrar:** explica que los datos se guardan en Firestore y se sincronizan en tiempo real. Aclara que la app no detecta el nivel físico de tóner ni tiene inicio de sesión.

Si te preguntan cómo se organiza el proyecto, vuelve a VS Code y muestra la carpeta `toner-tracker`: `index.html` es la página, `style.css` su presentación, `script.js` la lógica y `firebase-config.js` la conexión con Firebase. No muestres valores de registros privados en una exposición pública.