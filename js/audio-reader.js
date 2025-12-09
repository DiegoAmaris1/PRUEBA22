// audio-reader.js - Sistema de lectura por voz para artículos del blog
// Incluir este archivo en cualquier página de artículo

// Variables globales para el sistema de lectura
let synth = window.speechSynthesis;
let utterance = null;
let isReading = false;
let currentParagraph = 0;
let paragraphs = [];
let availableVoices = [];

// Inicializar cuando la página carga
window.addEventListener('load', function() {
    initializeAudioReader();
});

function initializeAudioReader() {
    // Insertar el HTML del reproductor si no existe
    if (!document.getElementById('audioPlayer')) {
        insertAudioPlayerHTML();
    }
    
    initializeVoices();
    prepareParagraphs();
}

// Insertar HTML del reproductor
function insertAudioPlayerHTML() {
    const articleContent = document.getElementById('articleContent') || 
                          document.querySelector('.article-content');
    
    if (!articleContent) return;
    
    const playerHTML = `
        <div class="audio-player" id="audioPlayer">
            <div class="audio-controls">
                <button class="audio-btn" id="playBtn" onclick="toggleReading()">
                    <span id="playIcon">🔊</span>
                    <span id="playText">Escuchar artículo</span>
                </button>
                <button class="audio-btn" id="stopBtn" onclick="stopReading()" style="display: none;">
                    ⏹️ Detener
                </button>
                <div class="audio-status" id="status">
                    Presiona el botón para escuchar el artículo completo
                </div>
                <div class="speed-control">
                    <label for="speedSelect">Velocidad:</label>
                    <select id="speedSelect" onchange="changeSpeed()">
                        <option value="0.75">0.75x</option>
                        <option value="1" selected>1x Normal</option>
                        <option value="1.25">1.25x</option>
                        <option value="1.5">1.5x</option>
                    </select>
                </div>
                <div class="voice-control">
                    <label for="voiceSelect">Voz:</label>
                    <select id="voiceSelect">
                        <option value="">Cargando voces...</option>
                    </select>
                </div>
            </div>
        </div>
    `;
    
    articleContent.insertAdjacentHTML('beforebegin', playerHTML);
}

// Cargar voces disponibles
function initializeVoices() {
    function loadVoices() {
        availableVoices = synth.getVoices();
        const voiceSelect = document.getElementById('voiceSelect');
        if (!voiceSelect) return;
        
        voiceSelect.innerHTML = '';
        
        // Filtrar voces en español
        const spanishVoices = availableVoices.filter(voice => 
            voice.lang.includes('es')
        );
        
        if (spanishVoices.length > 0) {
            spanishVoices.forEach((voice, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${voice.name} (${voice.lang})`;
                voiceSelect.appendChild(option);
            });
        } else {
            // Si no hay voces en español, mostrar todas
            availableVoices.forEach((voice, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${voice.name} (${voice.lang})`;
                voiceSelect.appendChild(option);
            });
        }
    }
    
    loadVoices();
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadVoices;
    }
}

// Preparar párrafos para lectura
function prepareParagraphs() {
    const content = document.getElementById('articleContent') || 
                   document.querySelector('.article-content');
    
    if (!content) return;
    
    const elements = content.querySelectorAll('p, h2, h3, li');
    paragraphs = Array.from(elements).map(el => ({
        element: el,
        text: el.textContent.trim()
    })).filter(p => p.text.length > 0);
}

// Alternar lectura (reproducir/pausar)
function toggleReading() {
    if (!isReading) {
        startReading();
    } else {
        pauseReading();
    }
}

// Iniciar lectura
function startReading() {
    if (paragraphs.length === 0) {
        alert('No hay contenido para leer');
        return;
    }

    isReading = true;
    document.getElementById('playText').textContent = 'Pausar';
    document.getElementById('playIcon').textContent = '⏸️';
    document.getElementById('stopBtn').style.display = 'inline-flex';
    
    readNextParagraph();
}

// Leer siguiente párrafo
function readNextParagraph() {
    if (currentParagraph >= paragraphs.length) {
        stopReading();
        return;
    }

    const paragraph = paragraphs[currentParagraph];
    
    // Resaltar párrafo actual
    removeAllHighlights();
    paragraph.element.classList.add('reading-highlight');
    
    // Scroll suave al párrafo
    paragraph.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Actualizar estado
    document.getElementById('status').textContent = 
        `Leyendo... (${currentParagraph + 1}/${paragraphs.length})`;

    // Crear utterance
    utterance = new SpeechSynthesisUtterance(paragraph.text);
    
    // Configurar voz seleccionada
    const voiceSelect = document.getElementById('voiceSelect');
    const selectedVoiceIndex = voiceSelect.value;
    if (selectedVoiceIndex && availableVoices.length > 0) {
        const spanishVoices = availableVoices.filter(v => v.lang.includes('es'));
        utterance.voice = spanishVoices[selectedVoiceIndex] || availableVoices[0];
    }
    
    // Configurar velocidad
    utterance.rate = parseFloat(document.getElementById('speedSelect').value);
    utterance.pitch = 1;
    utterance.volume = 1;

    // Eventos
    utterance.onend = function() {
        if (isReading) {
            currentParagraph++;
            readNextParagraph();
        }
    };

    utterance.onerror = function(event) {
        console.error('Error en la síntesis de voz:', event);
        stopReading();
    };

    // Reproducir
    synth.speak(utterance);
}

// Pausar lectura
function pauseReading() {
    isReading = false;
    synth.pause();
    document.getElementById('playText').textContent = 'Continuar';
    document.getElementById('playIcon').textContent = '▶️';
    document.getElementById('status').textContent = 'Pausado';
}

// Detener lectura
function stopReading() {
    isReading = false;
    synth.cancel();
    currentParagraph = 0;
    removeAllHighlights();
    document.getElementById('playText').textContent = 'Escuchar artículo';
    document.getElementById('playIcon').textContent = '🔊';
    document.getElementById('stopBtn').style.display = 'none';
    document.getElementById('status').textContent = 'Presiona el botón para escuchar el artículo completo';
}

// Cambiar velocidad
function changeSpeed() {
    if (isReading && utterance) {
        synth.cancel();
        readNextParagraph();
    }
}

// Remover resaltados
function removeAllHighlights() {
    document.querySelectorAll('.reading-highlight').forEach(el => {
        el.classList.remove('reading-highlight');
    });
}

// Limpiar al salir de la página
window.addEventListener('beforeunload', function() {
    if (isReading) {
        synth.cancel();
    }
});