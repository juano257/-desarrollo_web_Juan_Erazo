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

### Estructura principal agregada

- `app.py`: rutas Flask y logica de validacion/persistencia.
- `db.py`: conexion a MySQL mediante pool.
- `schema.sql`: creacion de base de datos y tablas.
- `templates/`: vistas HTML con Jinja2.
- `static/css/styles.css`: estilos.
- `static/js/register.js`: validaciones cliente y manejo de actividades dinamicas.
- `static/js/members.js`: fila clicable en listado.
- `.env.example`: variables de entorno de referencia.

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

3. Configurar variables de entorno:

```bash
cp .env.example .env
```

4. Ejecutar la aplicacion:

```bash
python app.py
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
