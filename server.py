#!/usr/bin/env python3
"""
Servidor Flask con:
- Backend de LinkedIn OAuth (recibe datos del callback)
- Asistente IA con Gemini (google-genai)
- Servidor de archivos estáticos (index, consulta-ia, etc.)
"""

from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
import requests
import os
from datetime import datetime

from dotenv import load_dotenv
from google import genai

# ============================================
# FLASK APP
# ============================================

app = Flask(
    __name__,
    static_folder='.',      # raíz del proyecto
    static_url_path='',     # sirve /nicepage.css, /js/..., /images/...
    template_folder='.'     # por si usas render_template
)
CORS(app)

# ============================================
# CARGAR VARIABLES DE ENTORNO
# ============================================

load_dotenv()

# ============================================
# CONFIGURACIÓN LINKEDIN (DESDE .env)
# ============================================

LINKEDIN_CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID", "TU_CLIENT_ID_AQUI")
LINKEDIN_CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET", "TU_CLIENT_SECRET_AQUI")
LINKEDIN_REDIRECT_URI = os.getenv("LINKEDIN_REDIRECT_URI", "http://localhost:8080/callback.html")

if not LINKEDIN_CLIENT_ID or not LINKEDIN_CLIENT_SECRET:
    raise ValueError("❌ ERROR: Faltan credenciales de LinkedIn en el .env")

# ============================================
# CONFIGURACIÓN GEMINI (SDK NUEVO google-genai)
# ============================================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "GEMINI_MODEL")

if not GEMINI_API_KEY:
    raise ValueError("❌ No se encontró GEMINI_API_KEY en .env")

# Cliente del nuevo SDK
client = genai.Client(api_key=GEMINI_API_KEY)

# ============================================
# RUTAS ESTÁTICAS (PÁGINAS HTML)
# ============================================

@app.route('/')
@app.route('/acceso.html')


def serve_acceso():
    return send_from_directory('.', 'acceso.html')

@app.route('/index.html')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/consulta-ia.html')
def serve_consulta_ia():
    return send_from_directory('.', 'consulta-ia.html')

@app.route('/callback.html')
def callback():
    """Página de callback de LinkedIn (el HTML hace el trabajo con JS)"""
    return send_from_directory('.', 'callback.html')


# ============================================
# ENDPOINT: TOKEN / DATOS DE LINKEDIN
# ============================================

@app.route('/api/linkedin/token', methods=['POST'])
def linkedin_token():
    """
    Endpoint que recibe datos desde callback.html.
    En tu callback.js seguramente envías:
    {
      "name": "...",
      "email": "...",
      "profile_url": "..."
    }
    Aquí simplemente se registran y se devuelven.
    """
    try:
        data = request.get_json() or {}
        name = data.get("name") or data.get("nombre") or "Usuario"
        email = data.get("email", "")
        profile_url = data.get("profile_url") or data.get("linkedin_url", "")

        print(f"✅ Datos LinkedIn recibidos: {name} - {email} - {profile_url}")

        return jsonify({
            "status": "ok",
            "name": name,
            "email": email,
            "profile_url": profile_url
        }), 200

    except Exception as e:
        print("❌ Error en /api/linkedin/token:", repr(e))
        return jsonify({"error": "Error procesando datos de LinkedIn"}), 500


@app.route('/api/gemini/chat', methods=['POST'])
def gemini_chat():
    """
    Endpoint para chat con Gemini IA.
    Acepta JSON tipo:
      { "mensaje": "..."}  o  { "message": "..." }
    y responde:
      { "respuesta": "...", "reply": "...", "timestamp": "..." }
    """
    try:
        data = request.get_json() or {}

        # Aceptar tanto "mensaje" como "message"
        mensaje_usuario = (
            data.get('mensaje')
            or data.get('message')
            or ""
        ).strip()

        if not mensaje_usuario:
            print("⚠️ Petición sin mensaje:", data)
            return jsonify({'error': 'No message provided'}), 400

        # Contexto del asistente
        context = """
Eres el Asistente IA de "Diego Amaris Consultoría Contable y Financiera".

Perfil profesional:
- Diego Amaris es contador público en Colombia.
- Trabaja con pymes y personas naturales en temas contables, tributarios, financieros y administrativos.
- Ofrece servicios de automatización contable, nómina, auditoría y consultoría estratégica.

Enfoque geográfico y normativo:
- Siempre asume que el contexto es COLOMBIA.
- Apóyate en conceptos generales de: DIAN, UGPP, Estatuto Tributario, NIIF para PYMES, seguridad social, SG-SST, facturación electrónica, nómina electrónica.
- Cuando haya dudas normativas muy específicas, aclara que la respuesta es orientativa y sugiere validar con la norma vigente o con el contador responsable.

Líneas de servicio principales:
1. Automatización contable y financiera
2. Impuestos y optimización tributaria
3. Nómina y recursos humanos
4. Auditoría y control interno

Estilo de respuesta:
- Siempre responde en ESPAÑOL neutro, claro y profesional.
- Explica conceptos con ejemplos prácticos.
- Organiza la información con títulos (##), listas y pasos.
- No inventes artículos legales ni datos exactos sin certeza.
- Mantén un tono profesional, confiable y cercano al cliente.

Límites:
- No des asesoría legal o tributaria definitiva para casos complejos.
- Redirige siempre al usuario cuando la pregunta se aleje de tus temas.
"""

        prompt = (
    f"{context}\n\n"
    f"Pregunta del cliente: {mensaje_usuario}\n\n"
    "Responde SOLO en español, de forma clara y profesional. "
    "Organiza la respuesta con subtítulos (##), viñetas y pasos numerados cuando aplique. "
    "Adapta la respuesta al contexto colombiano y ofrece orientación práctica."
)

        # Llamada al modelo Gemini (SDK nuevo)
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt
        )

        respuesta_ia = response.text

        # Logs para que veas en consola que sí está respondiendo
        print("🧑 Usuario:", mensaje_usuario)
        print("🤖 IA:", respuesta_ia)

        # Devolvemos ambas claves para que el JS que tengas funcione sí o sí
        return jsonify({
            'respuesta': respuesta_ia,
            'reply': respuesta_ia,
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        print("❌ Error en Gemini chat:", repr(e))
        return jsonify({
            'error': 'Error al procesar la solicitud',
            'details': str(e)
        }), 500

# ============================================
# PRIVACY POLICY
# ============================================

@app.route('/privacy-policy')
@app.route('/privacy-policy.html')
def privacy_policy():
    html_content = """
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>Política de Privacidad - Diego Amaris Consultoría</title>
    </head>
    <body>
        <h1>Política de Privacidad</h1>
        <p>
            Esta aplicación recopila y utiliza datos personales con el fin de prestar servicios de
            consultoría contable y financiera, así como para gestionar el acceso mediante LinkedIn
            y mejorar la experiencia de usuario.
        </p>
        <h2>Datos que podemos recopilar</h2>
        <ul>
            <li>Nombre completo</li>
            <li>Correo electrónico</li>
            <li>URL de perfil de LinkedIn</li>
            <li>Datos de navegación en el sitio</li>
        </ul>
        <h2>Uso de la información</h2>
        <p>
            La información se utiliza exclusivamente para:
        </p>
        <ul>
            <li>Gestionar el acceso a la plataforma</li>
            <li>Envío de información relacionada con nuestros servicios</li>
            <li>Mejoras en la atención y automatización de procesos contables</li>
        </ul>
        <p>
            No vendemos ni cedemos tus datos personales a terceros sin tu consentimiento explícito.
        </p>
        <p>
            Si deseas más información o solicitar la eliminación de tus datos, puedes contactarnos
            al correo: <strong>diegoamarisreal123@gmail.com</strong>
        </p>
        <a href="/">← Volver al inicio</a>
    </body>
    </html>
    """
    return html_content, 200, {"Content-Type": "text/html; charset=utf-8"}


# ============================================
# MANEJO DE ERRORES 404
# ============================================

@app.errorhandler(404)
def page_not_found(e):
    return """
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>Página no encontrada</title>
    </head>
    <body>
        <h1>Error 404</h1>
        <p>Página no encontrada</p>
        <a href="/">← Volver al inicio</a>
    </body>
    </html>
    """, 404


# ============================================
# MAIN
# ============================================

if __name__ == '__main__':
    print("=" * 70)
    print("🚀 SERVIDOR FLASK CON LINKEDIN OAUTH + GEMINI IA")
    print("=" * 70)
    print(f"📍 URL Principal:        http://localhost:8080")
    print(f"📍 API LinkedIn:         http://localhost:8080/api/linkedin/token")
    print(f"📍 Privacy Policy:       http://localhost:8080/privacy-policy")
    print("=" * 70)
    print("⚠️  CONFIGURACIÓN REQUERIDA:")
    print(f"   LINKEDIN_CLIENT_ID: {LINKEDIN_CLIENT_ID[:15]}...")
    print(f"   LINKEDIN_CLIENT_SECRET: {'✅ Configurado' if LINKEDIN_CLIENT_SECRET != 'TU_CLIENT_SECRET_AQUI' else '❌ NO configurado'}")
    print(f"   GEMINI_API_KEY: {'✅ Configurada' if GEMINI_API_KEY else '❌ NO configurada'}")
    print("=" * 70)
    print("⏹️  Presiona Ctrl+C para detener")
    print("=" * 70)
    print()

    app.run(host='0.0.0.0', port=8080, debug=True)
