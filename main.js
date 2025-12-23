// --- 2. CONFIGURACIÓN ---

const HF_TOKEN = "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"; // <--- ¡PEGA TU TOKEN DE HUGGING FACE AQUÍ!
/* =========================================
   1. CONFIGURACIÓN IA (HUGGING FACE)
   ========================================= */

const HF_API_URL = "https://api-inference.huggingface.co/models/renumics/key_detection";

/* =========================================
   2. VARIABLES GLOBALES Y AUDIO
   ========================================= */
let cancion;
let analizador;
let detectorPitch;
let audioCargado = false;
let letraLines = [];

/* =========================================
   3. INICIO Y ANÁLISIS (BOTÓN PRINCIPAL)
   ========================================= */
[cite_start]// Usamos el ID del botón de tu HTML [cite: 1, 2]
const btnAnalizar = document.getElementById('btnAnalizar');

if (btnAnalizar) {
    btnAnalizar.onclick = async function() {
        const fileInput = document.getElementById('audioFile'); [cite_start]// [cite: 1]
        const file = fileInput.files[0];

        if (!file) {
            alert("Selecciona un archivo primero");
            return;
        }

        // Bloquear botón mientras la IA trabaja
        btnAnalizar.innerText = "ANALIZANDO CLAVE...";
        btnAnalizar.disabled = true;

        try {
            // Llamada a Hugging Face (Detección de Tonalidad)
            const response = await fetch(HF_API_URL, {
                headers: { 
                    "Authorization": HF_TOKEN,
                    "x-wait-for-model": "true" 
                },
                method: "POST",
                body: file
            });
            
            const data = await response.json();

            [cite_start]// Mostrar el resultado en el HUD [cite: 3]
            const keyDisplay = document.getElementById('hf-key');
            if (data && data[0] && keyDisplay) {
                keyDisplay.innerText = "CLAVE: " + data[0].label;
            }

        } catch (error) {
            console.error("Error IA:", error);
            document.getElementById('hf-key').innerText = "CLAVE: Error API";
        } finally {
            btnAnalizar.innerText = "CARGAR Y ANALIZAR";
            btnAnalizar.disabled = false;
            
            [cite_start]// Una vez terminada la IA, arrancamos tu lógica original [cite: 2]
            iniciarTodo();
        }
    };
}

/* =========================================
   4. FUNCIONES DE CONTROL (BOTONES FOOTER)
   ========================================= */

function iniciarTodo() {
    [cite_start]// Gestión de paneles [cite: 1, 2, 3, 4]
    document.getElementById('setup-panel').classList.add('hidden');
    document.getElementById('footer-controls').classList.remove('hidden');
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('lyrics-panel').classList.remove('hidden');

    [cite_start]// Cargar la letra del textarea [cite: 1, 3, 4]
    const rawLyrics = document.getElementById('lyricsInput').value;
    const lyricsBox = document.getElementById('lyrics-box');
    lyricsBox.innerText = rawLyrics;

    // Lógica para cargar el archivo en p5.js
    const file = document.getElementById('audioFile').files[0];
    const url = URL.createObjectURL(file);
    
    cancion = loadSound(url, () => {
        audioCargado = true;
        cancion.play();
        loop(); // Inicia el dibujo de p5.js
    });
}

function togglePlay() {
    if (!cancion) return;
    const btn = document.getElementById('playBtn'); [cite_start]// [cite: 2]
    if (cancion.isPlaying()) {
        cancion.pause();
        btn.innerText = "PLAY";
    } else {
        cancion.play();
        btn.innerText = "PAUSA";
    }
}

function detener() {
    if (cancion) {
        cancion.stop();
        document.getElementById('playBtn').innerText = "PLAY"; [cite_start]// [cite: 3]
    }
}

function saltar(segundos) {
    if (!cancion) return;
    let t = cancion.currentTime();
    cancion.jump(constrain(t + segundos, 0, cancion.duration()));
}

function cambiarCancion() {
    location.reload(); [cite_start]// [cite: 2]
}

function clickBarra(event) {
    if (!cancion) return;
    const bar = document.getElementById('progress-container'); [cite_start]// [cite: 2]
    const rect = bar.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const porcentaje = x / rect.width;
    cancion.jump(cancion.duration() * porcentaje);
}

/* =========================================
   5. LÓGICA DE DIBUJO (P5.JS)
   ========================================= */

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.position(0, 0);
    canvas.style('z-index', '-1');
    noLoop(); // No dibuja hasta que cargue la canción
    
    analizador = new p5.FFT();
}

function draw() {
    background(5);
    
    if (audioCargado && cancion.isPlaying()) {
        [cite_start]// Actualizar barra de progreso [cite: 2]
        let p = (cancion.currentTime() / cancion.duration()) * 100;
        document.getElementById('progress-bar').style.width = p + "%";
        
        [cite_start]// Actualizar tiempo [cite: 2]
        document.getElementById('time').innerText = 
            nf(cancion.currentTime(), 0, 1) + " / " + nf(cancion.duration(), 0, 1);

        // DIBUJAR LÍNEAS MAGENTA
        let spectrum = analizador.analyze();
        noFill();
        stroke(255, 0, 255); // Magenta
        strokeWeight(3);
        
        beginShape();
        for (let i = 0; i < spectrum.length; i++) {
            let x = map(i, 0, spectrum.length, 0, width);
            let h = map(spectrum[i], 0, 255, height, height / 2);
            vertex(x, h);
        }
        endShape();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
