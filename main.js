// --- 2. CONFIGURACIÓN ---

const HF_TOKEN = "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"; // <--- ¡PEGA TU TOKEN DE HUGGING FACE AQUÍ!
/* =========================================
   1. CONFIGURACIÓN IA
   ========================================= */
// IMPORTANTE: Pon tu token real aquí. Mantén el espacio después de Bearer.

const HF_API_URL = "https://api-inference.huggingface.co/models/renumics/key_detection";

/* =========================================
   2. VARIABLES DE p5.js Y ESTADO
   ========================================= */
let cancion;
let analizador;
let audioCargado = false;

/* =========================================
   3. LÓGICA DEL BOTÓN PRINCIPAL
   ========================================= */
const btnAnalizar = document.getElementById('btnAnalizar');

if (btnAnalizar) {
    btnAnalizar.onclick = async function() {
        const fileInput = document.getElementById('audioFile');
        const file = fileInput.files[0];

        if (!file) {
            alert("Por favor, selecciona un archivo de audio primero.");
            return;
        }

        // Feedback visual
        btnAnalizar.innerText = "ANALIZANDO...";
        btnAnalizar.disabled = true;

        try {
            console.log("Iniciando petición a Hugging Face...");
            
            const response = await fetch(HF_API_URL, {
                headers: { 
                    "Authorization": HF_TOKEN,
                    "x-wait-for-model": "true" 
                },
                method: "POST",
                body: file
            });
            
            const data = await response.json();
            console.log("Datos recibidos de la IA:", data);

            const keyDisplay = document.getElementById('hf-key');
            if (data && data[0] && keyDisplay) {
                keyDisplay.innerText = "CLAVE: " + data[0].label;
            } else if (data.error) {
                console.warn("IA Error:", data.error);
                if (keyDisplay) keyDisplay.innerText = "CLAVE: Cargando modelo...";
            }

        } catch (error) {
            console.error("Error crítico en la llamada IA:", error);
            const keyDisplay = document.getElementById('hf-key');
            if (keyDisplay) keyDisplay.innerText = "CLAVE: No disponible";
        } finally {
            // PASE LO QUE PASE, arrancamos la aplicación
            btnAnalizar.innerText = "CARGAR Y ANALIZAR";
            btnAnalizar.disabled = false;
            
            console.log("Llamando a iniciarTodo...");
            iniciarTodo();
        }
    };
}

/* =========================================
   4. FUNCIONES DE CONTROL Y p5.js
   ========================================= */

function iniciarTodo() {
    // 1. Gestionar visibilidad de paneles (Basado en tu HTML) [cite: 1, 3, 4]
    document.getElementById('setup-panel').classList.add('hidden');
    document.getElementById('footer-controls').classList.remove('hidden');
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('lyrics-panel').classList.remove('hidden');

    // 2. Cargar letra
    const lyricsInput = document.getElementById('lyricsInput');
    const lyricsBox = document.getElementById('lyrics-box');
    if (lyricsInput && lyricsBox) {
        lyricsBox.innerText = lyricsInput.value;
    }

    // 3. Cargar Audio en p5.js [cite: 1]
    const fileInput = document.getElementById('audioFile');
    if (fileInput.files[0]) {
        const url = URL.createObjectURL(fileInput.files[0]);
        cancion = loadSound(url, () => {
            console.log("Audio cargado exitosamente en p5.js");
            audioCargado = true;
            cancion.play();
            loop(); // Inicia el dibujo de p5.js [cite: 1]
        });
    }
}

// FUNCIONES GLOBALES PARA EL HTML [cite: 2, 3]
window.cambiarCancion = function() {
    location.reload();
};

window.saltar = function(segundos) {
    if (cancion && audioCargado) {
        let t = cancion.currentTime();
        cancion.jump(constrain(t + segundos, 0, cancion.duration()));
    }
};

window.togglePlay = function() {
    if (!cancion) return;
    const btn = document.getElementById('playBtn');
    if (cancion.isPlaying()) {
        cancion.pause();
        btn.innerText = "PLAY";
    } else {
        cancion.play();
        btn.innerText = "PAUSA";
    }
};

window.detener = function() {
    if (cancion) {
        cancion.stop();
        document.getElementById('playBtn').innerText = "PLAY";
    }
};

window.clickBarra = function(event) {
    if (!cancion || !audioCargado) return;
    const bar = document.getElementById('progress-container');
    const rect = bar.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const porcentaje = x / rect.width;
    cancion.jump(cancion.duration() * porcentaje);
};

/* =========================================
   5. LÓGICA DE DIBUJO (p5.js)
   ========================================= */

function setup() {
    // Canvas en el fondo [cite: 1]
    let cnv = createCanvas(windowWidth, windowHeight);
    cnv.position(0, 0);
    cnv.style('z-index', '-1');
    noLoop(); // Esperar al audio
    analizador = new p5.FFT();
}

function draw() {
    background(5);
    
    if (audioCargado && cancion && cancion.isPlaying()) {
        // Actualizar UI de progreso y tiempo [cite: 2, 3]
        let p = (cancion.currentTime() / cancion.duration()) * 100;
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) progressBar.style.width = p + "%";
        
        const timeDisplay = document.getElementById('time');
        if (timeDisplay) {
            timeDisplay.innerText = nf(cancion.currentTime(), 0, 1) + " / " + nf(cancion.duration(), 0, 1);
        }

        // Espectro Magenta [cite: 1]
        let spectrum = analizador.analyze();
        noFill();
        stroke(255, 0, 255); 
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
