# -desarrollo_web_Juan_Erazo

Repositorio para el desarrollo del ramo de Desarrollo de Aplicaciones Web.

## Tarea 1 (prototipo front-end)

El codigo original del prototipo se mantiene en la carpeta `tarea_1/` con estos archivos principales:

- `tarea_1_inline.html`
- `usuario.js`
- `actividades.js`
- `grafico.js`

## Tarea 2 (Flask + MySQL)

Se agrego una aplicacion web con Flask y MySQL que implementa:

- Portada con menu principal y listado de los ultimos 5 miembros registrados.
- Registro de miembro y actividades con validaciones en cliente (JavaScript) y servidor (Flask).
- Insercion en base de datos para tablas `miembro`, `actividad` y `foto`.
- Subida y almacenamiento de archivos de imagen por actividad.
- Listado de miembros paginado.
- Vista de detalle por miembro (actividades y fotos).
- Seccion de estadisticas pendiente para la siguiente tarea.

## Tarea 3 (estadisticas y comentarios)

Se agrego la funcionalidad solicitada en el enunciado:

- Pagina de estadisticas con 3 graficos generados en el cliente con `fetch` y canvas:
  - miembros registrados por dia;
  - actividades por tipo;
  - actividades por comuna.
- Endpoint `/api/estadisticas` que obtiene los datos desde MySQL.
- Campo `comuna` en los miembros para alimentar el grafico de actividades por comuna.
- Tabla `comentario` asociada a `actividad`.
- Listado y formulario de comentarios bajo cada actividad en la vista de detalle.
- Endpoints asincronos para comentarios:
  - `GET /api/actividades/<id>/comentarios`
  - `POST /api/actividades/<id>/comentarios`
- Validacion de comentarios en JavaScript y nuevamente en Flask.

### Estructura principal agregada

- `app.py`: rutas Flask y logica de validacion/persistencia.
- `db.py`: conexion a MySQL mediante pool.
- `schema.sql`: creacion de base de datos y tablas.
- `templates/`: vistas HTML con Jinja2.
- `static/css/styles.css`: estilos.
- `static/js/register.js`: validaciones cliente y manejo de actividades dinamicas.
- `static/js/members.js`: fila clicable en listado.
- `static/js/stats.js`: carga y dibujo de graficos con `fetch`.
- `static/js/comments.js`: listado y envio asincrono de comentarios.
- `.env.example`: variables de entorno de referencia.

## Tarea 4 (buscador de actividades y notas)

Se agrego la funcionalidad solicitada para la busqueda y evaluacion de actividades:

- Nueva pagina de buscador de actividades con input unico y busqueda automatica al escribir 3+ caracteres.
- Busqueda por coincidencia parcial en nombre, descripcion o comuna.
- Resultados con miembro, dia, tipo, comuna, nombre, descripcion y nota promedio.
- Resaltado visual del texto que calza con el patron buscado.
- Opcion de evaluar por actividad (nota entera entre 1 y 7).
- Insercion asincrona de notas y actualizacion inmediata de promedio y contador de evaluaciones.
- Nueva tabla `nota` para almacenar evaluaciones por actividad.

## Requisitos

- Python 3.10+
- MySQL 8+

## Configuracion y ejecucion

1. Instalar dependencias:

```bash
pip install -r requirements.txt
```

2. Crear y poblar la base de datos (ajustando usuario/password segun tu MySQL):

```bash
mysql -u root -p < schema.sql
```

Si ya tenia creada la base de datos de la Tarea 2, aplicar solo la migracion de Tarea 3:

```bash
mysql -u root -p club_db < migracion_tarea3.sql
```

Si ya tenia creada la base de datos de tareas previas, aplicar tambien migracion de Tarea 4:

```bash
mysql -u root -p club_db < migracion_tarea4.sql
```

3. Configurar variables de entorno:

```bash
cp .env.example .env
```

4. Ejecutar la aplicacion:

```bash
python app.py
```

### Nota para este dev container (Ubuntu 24.04)

En este entorno, para abrir la pagina sin errores fue necesario:

1. Instalar soporte de venv y MySQL:

```bash
sudo apt-get update
sudo apt-get install -y python3.12-venv mysql-server
```

2. Crear entorno virtual e instalar dependencias:

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

3. Iniciar MySQL, cargar esquema y asegurar acceso por TCP para `root@127.0.0.1`:

```bash
sudo service mysql start
sudo mysql -e "CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED BY 'root'; ALTER USER 'root'@'127.0.0.1' IDENTIFIED BY 'root'; GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION; FLUSH PRIVILEGES;"
mysql -h 127.0.0.1 -uroot -proot < schema.sql
```

4. Levantar la app con el entorno virtual:

```bash
.venv/bin/python app.py
```

5. Abrir en navegador:

- `http://127.0.0.1:5000`

## Supuestos del prototipo inicial (Tarea 1)

1. Los nombres utilizados son reales.
2. Los RUT utilizados son reales.
3. Las direcciones de correo utilizadas tienen dominios existentes.
4. Los URL utilizados dirigen a una pagina o foto real.
5. Las actividades ingresadas son reales.
6. Las horas ingresadas son reales.
7. No se repiten RUT al momento de crear usuarios.
8. Todas las actividades ingresadas pueden ser asignadas a un tipo de actividad existente.
9. Los grados academicos se ingresan como texto libre.
