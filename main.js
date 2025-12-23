// --- CONFIGURACIÓN ---
const HF_API_URL = "https://huggingface.co/spaces/carlos5ort/detector-tonalidad"; // Ejemplo de modelo
const HF_TOKEN = "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"; // <--- ¡PEGA TU TOKEN DE HUGGING FACE AQUÍ!

// --- ELEMENTOS DOM ---
const btnCargar = document.getElementById('btnCargar');
const inputAudio = document.getElementById('inputAudio');
const statusMsg = document.getElementById('status-msg');
const setupPanel = document.getElementById('setup-panel');
const visContainer = document.getElementById('visualizer-container');
const displayTonality = document.getElementById('display-tonality');
const audioPlayer = document.getElementById('audio-player');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Variables globales para visualización
let audioContext, analyser, dataArray;
let tonalidadGlobal = "Desconocida";

// --- LÓGICA PRINCIPAL ---

btnCargar.addEventListener('click', async () => {
    const file = inputAudio.files[0];
    if (!file) {
        alert("Por favor selecciona un archivo de audio.");
        return;
    }

    // 1. UI: Indicar carga
    btnCargar.disabled = true;
    btnCargar.innerText = "Analizando Audio...";
    statusMsg.innerText = "Enviando datos a Hugging Face (esto puede tardar unos segundos)...";

    try {
        // 2. LLAMADA API: Esperamos aquí (await)
        // NOTA: Si el archivo es muy grande, podrías recortarlo antes, 
        // pero para este ejemplo enviamos el archivo directo.
        const resultado = await analizarConHuggingFace(file);
        
        // Procesar respuesta
        console.log("Respuesta IA:", resultado);
        
        // Dependiendo del modelo, la respuesta varía. 
        // Asumimos formato estándar de clasificación [{label: "C", score: 0.9}, ...]
        if (Array.isArray(resultado) && resultado.length > 0) {
            tonalidadGlobal = resultado[0].label; 
        } else {
            tonalidadGlobal = "No detectada";
        }

        statusMsg.innerText = "¡Análisis completado!";

        // 3. TRANSICIÓN A VISUALIZADOR
        iniciarVisualizador(file);

    } catch (error) {
        console.error(error);
        statusMsg.innerText = "Error en el análisis. Iniciando sin IA...";
        tonalidadGlobal = "Error API";
        setTimeout(() => iniciarVisualizador(file), 1000);
    }
});

async function analizarConHuggingFace(file) {
    // Leemos el archivo como binario
    const response = await fetch(HF_API_URL, {
        headers: { Authorization: HF_TOKEN },
        method: "POST",
        body: file,
    });
    
    if (!response.ok) throw new Error("Error conectando con HF");
    return await response.json();
}

function iniciarVisualizador(file) {
    // Ocultar panel de carga
    setupPanel.style.opacity = 0;
    setTimeout(() => {
        setupPanel.classList.add('hidden');
        visContainer.classList.remove('hidden');
    }, 1000);

    // Actualizar texto en pantalla
    displayTonality.innerText = `Tonalidad: ${tonalidadGlobal}`;

    // Configurar Audio
    const fileURL = URL.createObjectURL(file);
    audioPlayer.src = fileURL;
    audioPlayer.play();

    // Configurar Web Audio API para las líneas que bailan
    configurarAudioAnalyzer();
    
    // Iniciar bucle de dibujo
    animar();
}

// --- VISUALIZACIÓN (MAGENTA LINES) ---

function configurarAudioAnalyzer() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaElementSource(audioPlayer);
    analyser = audioContext.createAnalyser();
    
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    analyser.fftSize = 256; // Resolución del análisis
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
}

function animar() {
    // Ajustar canvas al tamaño de ventana
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    requestAnimationFrame(animar);

    // Obtener datos de frecuencia del audio
    if(analyser) analyser.getByteFrequencyData(dataArray);

    // Fondo semi-transparente para efecto de "estela" (trails)
    ctx.fillStyle = 'rgba(5, 5, 5, 0.2)'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if(!dataArray) return;

    // DIBUJAR LÍNEAS MAGENTA
    const barWidth = (canvas.width / dataArray.length) * 2.5;
    let barHeight;
    let x = 0;

    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);

    // Dibujamos una onda suave conectando puntos
    for (let i = 0; i < dataArray.length; i++) {
        barHeight = dataArray[i]; 
        
        // Color Magenta Dinámico
        // Más brillante cuanto más alto el volumen de esa frecuencia
        const r = 255;
        const g = 0;
        const b = 255; 
        const alpha = barHeight / 255;

        // Estilo de línea
        ctx.strokeStyle = `rgba(${r},${g},${b}, ${alpha + 0.2})`;
        ctx.lineWidth = 3;

        // Dibujo tipo osciloscopio
        const y = (canvas.height / 2) - (barHeight * 1.5);
        
        // Curvas suaves
        ctx.lineTo(x, y);

        // Efecto espejo (abajo)
        // ctx.lineTo(x, (canvas.height / 2) + (barHeight * 1.5)); 

        x += barWidth + 1;
    }
    
    ctx.stroke();
    
    // Añadir brillo extra al centro
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ff00ff";
}
