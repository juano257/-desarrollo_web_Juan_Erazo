import os
import re
import uuid
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, flash, jsonify, redirect, render_template, request, url_for
from werkzeug.utils import secure_filename

from db import get_db_connection

load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY", "dev-secret")
app.config["UPLOAD_FOLDER"] = os.getenv("UPLOAD_FOLDER", "static/uploads")
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024

TIPOS_ACTIVIDAD = {"deportiva", "artistica", "tecnologica", "social", "recreativa"}
EXTENSIONES_PERMITIDAS = {"png", "jpg", "jpeg", "gif", "webp"}
EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


# Garantiza que exista la carpeta de subida incluso en primer arranque.
Path(app.config["UPLOAD_FOLDER"]).mkdir(parents=True, exist_ok=True)


def _archivo_permitido(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in EXTENSIONES_PERMITIDAS


def _normalizar_miembro_desde_form(form):
    return {
        "rut": form.get("rut", "").strip(),
        "nombre": form.get("nombre", "").strip(),
        "telefono": form.get("telefono", "").strip(),
        "email": form.get("email", "").strip(),
        "grado_academico": form.get("grado_academico", "").strip(),
        "comuna": form.get("comuna", "").strip(),
    }


def _normalizar_actividades_desde_form(form):
    nombres = form.getlist("actividad_nombre[]")
    descripciones = form.getlist("actividad_descripcion[]")
    tipos = form.getlist("actividad_tipo[]")
    fechas = form.getlist("actividad_fecha[]")
    horas = form.getlist("actividad_horas[]")

    max_len = max(len(nombres), len(descripciones), len(tipos), len(fechas), len(horas), 1)
    actividades = []

    for i in range(max_len):
        actividad = {
            "index": i,
            "nombre": nombres[i].strip() if i < len(nombres) else "",
            "descripcion": descripciones[i].strip() if i < len(descripciones) else "",
            "tipo": tipos[i].strip() if i < len(tipos) else "",
            "fecha": fechas[i].strip() if i < len(fechas) else "",
            "horas": horas[i].strip() if i < len(horas) else "",
        }
        # Descarta bloques completamente vacios para facilitar una UX flexible.
        if any([
            actividad["nombre"],
            actividad["descripcion"],
            actividad["tipo"],
            actividad["fecha"],
            actividad["horas"],
        ]):
            actividades.append(actividad)

    return actividades


def _validar_miembro(miembro):
    errores = {}

    if not miembro["rut"]:
        errores["rut"] = "Debe ingresar un RUT."
    if not miembro["nombre"]:
        errores["nombre"] = "Debe ingresar un nombre."
    if not miembro["telefono"]:
        errores["telefono"] = "Debe ingresar un numero telefonico."
    if not miembro["grado_academico"]:
        errores["grado_academico"] = "Debe ingresar un grado academico."
    if not miembro["comuna"]:
        errores["comuna"] = "Debe ingresar una comuna."
    if miembro["email"] and not EMAIL_REGEX.match(miembro["email"]):
        errores["email"] = "Debe ingresar un email valido."

    return errores


def _validar_actividades(actividades, files):
    errores = []

    if not actividades:
        return [{"index": 0, "message": "Debe registrar al menos una actividad."}]

    for actividad in actividades:
        idx = actividad["index"]

        if len(actividad["nombre"]) < 3:
            errores.append({"index": idx, "message": "El nombre de la actividad debe tener al menos 3 caracteres."})

        if len(actividad["descripcion"]) < 5:
            errores.append({"index": idx, "message": "La descripcion de la actividad debe tener al menos 5 caracteres."})

        if actividad["tipo"] not in TIPOS_ACTIVIDAD:
            errores.append({"index": idx, "message": "Debe seleccionar un tipo de actividad valido."})

        try:
            datetime.strptime(actividad["fecha"], "%Y-%m-%d")
        except ValueError:
            errores.append({"index": idx, "message": "Debe seleccionar una fecha valida."})

        try:
            horas = int(actividad["horas"])
            if horas < 1 or horas > 24:
                raise ValueError
        except ValueError:
            errores.append({"index": idx, "message": "La duracion debe estar entre 1 y 24 horas."})

        archivos = files.getlist(f"actividad_fotos_{idx}")
        archivos_validos = [f for f in archivos if f and f.filename]

        if not archivos_validos:
            errores.append({"index": idx, "message": "Debe adjuntar al menos una foto por actividad."})
        else:
            for archivo in archivos_validos:
                if not _archivo_permitido(archivo.filename):
                    errores.append({"index": idx, "message": "Formato de foto no permitido. Use png, jpg, jpeg, gif o webp."})
                    break

    return errores


@app.get("/")
def portada():
    ultimos_miembros = []

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT id, rut, nombre, telefono, email, grado_academico, comuna, created_at
            FROM miembro
            ORDER BY created_at DESC
            LIMIT 5
            """
        )
        ultimos_miembros = cursor.fetchall()
        cursor.close()
        conn.close()
    except Exception:
        flash("No se pudo conectar a MySQL. Se muestra la portada sin datos.", "error")

    return render_template("index.html", ultimos_miembros=ultimos_miembros)


@app.route("/registrar", methods=["GET", "POST"])
def registrar_miembro_actividades():
    miembro = {
        "rut": "",
        "nombre": "",
        "telefono": "",
        "email": "",
        "grado_academico": "",
        "comuna": "",
    }
    actividades = [
        {
            "index": 0,
            "nombre": "",
            "descripcion": "",
            "tipo": "",
            "fecha": "",
            "horas": "",
        }
    ]
    errores_miembro = {}
    errores_actividades = []

    if request.method == "POST":
        miembro = _normalizar_miembro_desde_form(request.form)
        actividades = _normalizar_actividades_desde_form(request.form)

        errores_miembro = _validar_miembro(miembro)
        errores_actividades = _validar_actividades(actividades, request.files)

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        if miembro["rut"]:
            cursor.execute("SELECT id FROM miembro WHERE rut = %s", (miembro["rut"],))
            if cursor.fetchone():
                errores_miembro["rut"] = "Ya existe un miembro con ese RUT."

        if not errores_miembro and not errores_actividades:
            try:
                cursor.execute(
                    """
                    INSERT INTO miembro (rut, nombre, telefono, email, grado_academico, comuna)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        miembro["rut"],
                        miembro["nombre"],
                        miembro["telefono"],
                        miembro["email"] or None,
                        miembro["grado_academico"],
                        miembro["comuna"],
                    ),
                )
                miembro_id = cursor.lastrowid

                for actividad in actividades:
                    cursor.execute(
                        """
                        INSERT INTO actividad (miembro_id, nombre, descripcion, tipo, fecha, horas)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        """,
                        (
                            miembro_id,
                            actividad["nombre"],
                            actividad["descripcion"],
                            actividad["tipo"],
                            actividad["fecha"],
                            int(actividad["horas"]),
                        ),
                    )
                    actividad_id = cursor.lastrowid

                    fotos = request.files.getlist(f"actividad_fotos_{actividad['index']}")
                    for foto in fotos:
                        if not foto or not foto.filename:
                            continue

                        nombre_original = secure_filename(foto.filename)
                        extension = nombre_original.rsplit(".", 1)[1].lower()
                        nombre_guardado = f"{uuid.uuid4().hex}.{extension}"
                        ruta_relativa = os.path.join("uploads", nombre_guardado).replace("\\", "/")
                        ruta_absoluta = os.path.join(app.static_folder, ruta_relativa)
                        foto.save(ruta_absoluta)

                        cursor.execute(
                            """
                            INSERT INTO foto (actividad_id, ruta_archivo, nombre_original)
                            VALUES (%s, %s, %s)
                            """,
                            (actividad_id, ruta_relativa, nombre_original),
                        )

                conn.commit()
                flash("Miembro y actividades registradas correctamente.", "success")
                return redirect(url_for("portada"))
            except Exception:
                conn.rollback()
                flash("Ocurrio un error al guardar los datos. Intente nuevamente.", "error")
            finally:
                cursor.close()
                conn.close()
        else:
            cursor.close()
            conn.close()

    return render_template(
        "register.html",
        miembro=miembro,
        actividades=actividades,
        errores_miembro=errores_miembro,
        errores_actividades=errores_actividades,
        tipos=sorted(TIPOS_ACTIVIDAD),
    )


@app.get("/miembros")
def listado_miembros():
    page = request.args.get("page", default=1, type=int)
    per_page = 5
    page = max(page, 1)
    offset = (page - 1) * per_page

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT COUNT(*) AS total FROM miembro")
        total = cursor.fetchone()["total"]

        cursor.execute(
            """
            SELECT id, rut, nombre, telefono, email, grado_academico, comuna, created_at
            FROM miembro
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
            """,
            (per_page, offset),
        )
        miembros = cursor.fetchall()

        cursor.close()
        conn.close()
    except Exception:
        flash("No se pudo conectar a MySQL. Se muestra el listado sin datos.", "error")
        total = 0
        miembros = []

    total_pages = (total + per_page - 1) // per_page if total > 0 else 1

    return render_template(
        "members.html",
        miembros=miembros,
        page=page,
        total_pages=total_pages,
    )


@app.get("/miembros/<int:miembro_id>")
def detalle_miembro(miembro_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT id, rut, nombre, telefono, email, grado_academico, comuna, created_at
        FROM miembro
        WHERE id = %s
        """,
        (miembro_id,),
    )
    miembro = cursor.fetchone()

    if not miembro:
        cursor.close()
        conn.close()
        flash("No existe el miembro solicitado.", "error")
        return redirect(url_for("listado_miembros"))

    cursor.execute(
        """
        SELECT id, nombre, descripcion, tipo, fecha, horas
        FROM actividad
        WHERE miembro_id = %s
        ORDER BY fecha DESC, id DESC
        """,
        (miembro_id,),
    )
    actividades = cursor.fetchall()

    for actividad in actividades:
        cursor.execute(
            """
            SELECT id, ruta_archivo, nombre_original
            FROM foto
            WHERE actividad_id = %s
            ORDER BY id ASC
            """,
            (actividad["id"],),
        )
        actividad["fotos"] = cursor.fetchall()

    cursor.close()
    conn.close()

    return render_template("member_detail.html", miembro=miembro, actividades=actividades)


@app.get("/estadisticas")
def estadisticas():
    return render_template("stats.html")


@app.get("/buscador")
def buscador_actividades():
    return render_template("search.html")


@app.get("/api/actividades/buscar")
def api_buscar_actividades():
    query = request.args.get("q", "").strip()

    if len(query) < 3:
        return jsonify({"actividades": []})

    patron = f"%{query.lower()}%"
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT
            a.id,
            m.nombre AS miembro_nombre,
            a.fecha,
            a.tipo,
            m.comuna,
            a.nombre,
            a.descripcion,
            AVG(n.valor) AS nota_promedio,
            COUNT(n.id) AS total_notas
        FROM actividad a
        JOIN miembro m ON m.id = a.miembro_id
        LEFT JOIN nota n ON n.actividad_id = a.id
        WHERE LOWER(a.nombre) LIKE %s
           OR LOWER(a.descripcion) LIKE %s
           OR LOWER(m.comuna) LIKE %s
        GROUP BY a.id, m.nombre, a.fecha, a.tipo, m.comuna, a.nombre, a.descripcion
        ORDER BY a.fecha DESC, a.id DESC
        LIMIT 50
        """,
        (patron, patron, patron),
    )
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    actividades = []
    for row in rows:
        actividades.append(
            {
                "id": row["id"],
                "miembro_nombre": row["miembro_nombre"],
                "fecha": row["fecha"].strftime("%Y-%m-%d"),
                "tipo": row["tipo"],
                "comuna": row["comuna"],
                "nombre": row["nombre"],
                "descripcion": row["descripcion"],
                "nota": "-" if row["total_notas"] == 0 else round(float(row["nota_promedio"]), 2),
                "total_notas": row["total_notas"],
            }
        )

    return jsonify({"actividades": actividades})


def _validar_nota(valor):
    if isinstance(valor, bool):
        return None

    try:
        nota = int(valor)
    except (TypeError, ValueError):
        return None

    if 1 <= nota <= 7:
        return nota

    return None


@app.post("/api/actividades/<int:actividad_id>/notas")
def api_agregar_nota(actividad_id):
    data = request.get_json(silent=True) or {}
    nota = _validar_nota(data.get("nota"))

    if nota is None:
        return jsonify({"error": "La nota debe ser un numero entero entre 1 y 7."}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT id FROM actividad WHERE id = %s", (actividad_id,))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        return jsonify({"error": "Actividad no encontrada."}), 404

    cursor.execute(
        """
        INSERT INTO nota (actividad_id, valor)
        VALUES (%s, %s)
        """,
        (actividad_id, nota),
    )
    conn.commit()

    cursor.execute(
        """
        SELECT AVG(valor) AS nota_promedio, COUNT(*) AS total_notas
        FROM nota
        WHERE actividad_id = %s
        """,
        (actividad_id,),
    )
    resumen = cursor.fetchone()

    cursor.close()
    conn.close()

    return jsonify(
        {
            "nota": round(float(resumen["nota_promedio"]), 2),
            "total_notas": resumen["total_notas"],
        }
    ), 201


@app.get("/api/estadisticas")
def api_estadisticas():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT DATE(created_at) AS dia, COUNT(*) AS total
            FROM miembro
            GROUP BY DATE(created_at)
            ORDER BY dia ASC
            """
        )
        miembros_por_dia = [
            {"dia": row["dia"].strftime("%Y-%m-%d"), "total": row["total"]}
            for row in cursor.fetchall()
        ]

        cursor.execute(
            """
            SELECT tipo, COUNT(*) AS total
            FROM actividad
            GROUP BY tipo
            ORDER BY tipo ASC
            """
        )
        actividades_por_tipo = cursor.fetchall()

        cursor.execute(
            """
            SELECT m.comuna, COUNT(a.id) AS total
            FROM miembro m
            JOIN actividad a ON a.miembro_id = m.id
            GROUP BY m.comuna
            ORDER BY m.comuna ASC
            """
        )
        actividades_por_comuna = cursor.fetchall()

        cursor.close()
        conn.close()
    except Exception:
        miembros_por_dia = []
        actividades_por_tipo = []
        actividades_por_comuna = []

    return jsonify(
        {
            "miembros_por_dia": miembros_por_dia,
            "actividades_por_tipo": actividades_por_tipo,
            "actividades_por_comuna": actividades_por_comuna,
        }
    )


def _validar_comentario(data):
    nombre = data.get("nombre", "").strip()
    texto = data.get("texto", "").strip()
    errores = {}

    if len(nombre) < 3 or len(nombre) > 80:
        errores["nombre"] = "El nombre debe tener entre 3 y 80 caracteres."
    if len(texto) < 5:
        errores["texto"] = "El comentario debe tener al menos 5 caracteres."
    if len(texto) > 300:
        errores["texto"] = "El comentario no puede superar los 300 caracteres."

    return nombre, texto, errores


@app.get("/api/actividades/<int:actividad_id>/comentarios")
def api_listar_comentarios(actividad_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT id FROM actividad WHERE id = %s", (actividad_id,))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        return jsonify({"error": "Actividad no encontrada."}), 404

    cursor.execute(
        """
        SELECT id, nombre, texto, fecha
        FROM comentario
        WHERE actividad_id = %s
        ORDER BY fecha DESC, id DESC
        """,
        (actividad_id,),
    )
    comentarios = [
        {
            "id": row["id"],
            "nombre": row["nombre"],
            "texto": row["texto"],
            "fecha": row["fecha"].strftime("%d-%m-%Y %H:%M"),
        }
        for row in cursor.fetchall()
    ]

    cursor.close()
    conn.close()
    return jsonify({"comentarios": comentarios})


@app.post("/api/actividades/<int:actividad_id>/comentarios")
def api_agregar_comentario(actividad_id):
    data = request.get_json(silent=True) or {}
    nombre, texto, errores = _validar_comentario(data)

    if errores:
        return jsonify({"errores": errores}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT id FROM actividad WHERE id = %s", (actividad_id,))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        return jsonify({"error": "Actividad no encontrada."}), 404

    cursor.execute(
        """
        INSERT INTO comentario (nombre, texto, fecha, actividad_id)
        VALUES (%s, %s, NOW(), %s)
        """,
        (nombre, texto, actividad_id),
    )
    conn.commit()

    comentario_id = cursor.lastrowid
    cursor.execute(
        """
        SELECT id, nombre, texto, fecha
        FROM comentario
        WHERE id = %s
        """,
        (comentario_id,),
    )
    row = cursor.fetchone()

    cursor.close()
    conn.close()

    return jsonify(
        {
            "comentario": {
                "id": row["id"],
                "nombre": row["nombre"],
                "texto": row["texto"],
                "fecha": row["fecha"].strftime("%d-%m-%Y %H:%M"),
            }
        }
    ), 201


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
