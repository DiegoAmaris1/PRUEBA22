from flask import Flask, render_template_string
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Template HTML para Privacy Policy
PRIVACY_POLICY_HTML = """
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Política de Privacidad - Sistema Acceso</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        h1 {
            color: #0077B5;
            border-bottom: 2px solid #0077B5;
            padding-bottom: 10px;
        }
        h2 {
            color: #0077B5;
            margin-top: 30px;
        }
        .last-updated {
            color: #666;
            font-style: italic;
        }
    </style>
</head>
<body>
    <h1>Política de Privacidad</h1>
    <p class="last-updated">Última actualización: Diciembre 2024</p>
    
    <h2>1. Información que Recopilamos</h2>
    <p>
        Nuestra aplicación "Sistema Acceso" recopila únicamente la información básica 
        de perfil de LinkedIn necesaria para la autenticación, incluyendo:
    </p>
    <ul>
        <li>Nombre completo</li>
        <li>Dirección de correo electrónico</li>
        <li>URL del perfil de LinkedIn</li>
        <li>Foto de perfil (opcional)</li>
    </ul>
    
    <h2>2. Cómo Usamos tu Información</h2>
    <p>La información recopilada se utiliza exclusivamente para:</p>
    <ul>
        <li>Autenticar tu identidad en nuestro sistema</li>
        <li>Proporcionar acceso a las funcionalidades de la aplicación</li>
        <li>Mejorar la experiencia del usuario</li>
    </ul>
    
    <h2>3. Protección de Datos</h2>
    <p>
        Nos comprometemos a proteger tu información personal. No compartimos, 
        vendemos ni alquilamos tus datos a terceros.
    </p>
    
    <h2>4. Almacenamiento de Datos</h2>
    <p>
        Los datos se almacenan de forma segura y solo se mantienen mientras 
        tu cuenta esté activa o según sea necesario para proporcionarte servicios.
    </p>
    
    <h2>5. Tus Derechos</h2>
    <p>Tienes derecho a:</p>
    <ul>
        <li>Acceder a tus datos personales</li>
        <li>Solicitar la corrección de datos inexactos</li>
        <li>Solicitar la eliminación de tus datos</li>
        <li>Revocar el acceso de la aplicación a tu cuenta de LinkedIn</li>
    </ul>
    
    <h2>6. Cookies</h2>
    <p>
        Utilizamos cookies esenciales para mantener tu sesión activa. 
        No utilizamos cookies de terceros para rastreo o publicidad.
    </p>
    
    <h2>7. Cambios a esta Política</h2>
    <p>
        Podemos actualizar esta política ocasionalmente. Te notificaremos 
        sobre cambios significativos publicando la nueva política en esta página.
    </p>
    
    <h2>8. Contacto</h2>
    <p>
        Si tienes preguntas sobre esta política de privacidad, contáctanos en:
        <br><strong>Email:</strong> contacto@sistemaacceso.com
    </p>
</body>
</html>
"""

@app.route('/')
def index():
    return '''
    <h1>Flask API - Sistema Acceso</h1>
    <p>API funcionando correctamente ✅</p>
    <p><a href="/privacy-policy">Ver Política de Privacidad</a></p>
    '''

@app.route('/privacy-policy')
@app.route('/privacy-policy.html')
def privacy_policy():
    return render_template_string(PRIVACY_POLICY_HTML)

@app.route('/health')
def health():
    return {'status': 'ok', 'message': 'API funcionando'}

if __name__ == '__main__':
    # Para desarrollo local
    app.run(host='0.0.0.0', port=5000, debug=True)
    
    # Para producción, usa gunicorn:
    # gunicorn -w 4 -b 0.0.0.0:5000 app:app
