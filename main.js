/* =========================================
   1. CONFIGURACIÓN IA
   ========================================= */
// IMPORTANTE: Asegúrate de que el token sea correcto.
const HF_TOKEN = "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"; 
const HF_API_URL = "https://api-inference.huggingface.co/models/renumics/key_detection";

/* =========================================
   2. VARIABLES DE ESTADO
   ========================================= */
let cancion;
let analizador;
let audioCargado = false;

/* =========================================
   3. FUNCIONES DE CONTROL (FOOTER)
   ========================================= */

// Definimos iniciarTodo primero para que esté disponible globalmente
window.iniciarTodo = function() {
    [cite_start]console.log("Iniciando aplicación..."); [cite: 4]
    
    [cite_start]// Gestión de paneles según tu HTML [cite: 1, 2, 4]
    [cite_start]const setup = document.getElementById('setup-panel'); [cite: 1]
    [cite_start]const footer = document.getElementById('footer-controls'); [cite: 2]
    [cite_start]const hud = document.getElementById('hud'); [cite: 3]
    [cite_start]const lyrics = document.getElementById('lyrics-panel'); [cite: 3]

    [cite_start]if (setup) setup.classList.add('hidden'); [cite: 1]
    [cite_start]if (footer) footer.classList.remove('hidden'); [cite: 2]
    [cite_start]if (hud) hud.classList.remove('hidden'); [cite: 3]
    [cite_start]if (lyrics) lyrics.classList.remove('hidden'); [cite: 3]

    [cite_start]// Cargar letra [cite: 1, 3]
    [cite_start]const input = document.getElementById('lyricsInput'); [cite: 1]
    [cite_start]const box = document.getElementById('lyrics-box'); [cite: 3]
    [cite_start]if (input && box) box.innerText = input.value; [cite: 1, 3]

    [cite_start]// Cargar Audio en p5.js [cite: 1]
    [cite_start]const audioFile = document.getElementById('audioFile'); [cite: 1]
    if (audioFile && audioFile.files[0]) {
        const url = URL.createObjectURL(audioFile.files[0]);
        cancion = loadSound(url, () => {
            audioCargado = true;
            cancion.play();
            loop(); 
        });
    }
};

/* =========================================
   4. LÓGICA DEL BOTÓN PRINCIPAL
   ========================================= */
[cite_start]// Buscamos el botón por ID [cite: 2]
[cite_start]const btnAnalizar = document.getElementById('btnAnalizar'); [cite: 2]

if (btnAnalizar) {
    btnAnalizar.onclick = async function() {
        [cite_start]const fileInput = document.getElementById('audioFile'); [cite: 1]
        const file = fileInput && fileInput.files[0];

        if (!file) {
            alert("Por favor, selecciona un archivo de audio primero.");
            return;
        }

        // Feedback visual inmediato
        btnAnalizar.innerText = "PROCESANDO...";
        btnAnalizar.disabled = true;

        // Intentar análisis de IA en segundo plano
        try {
            const response = await fetch(HF_API_URL, {
                headers: { 
                    "Authorization": HF_TOKEN,
                    "x-wait-for-model": "true" 
                },
                method: "POST",
                body: file
            });
            
            const data = await response.json();
            const keyDisplay = document.getElementById('hf-key');

            if (data && data[0] && keyDisplay) {
                keyDisplay.innerText = "CLAVE: " + data[0].label;
            }
        } catch (e) {
            console.error("Error en IA:", e);
            const keyDisplay = document.getElementById('hf-key');
            if (keyDisplay) keyDisplay.innerText = "CLAVE: No disponible";
        } finally {
            // Restaurar botón y arrancar visualizador pase lo que pase
            [cite_start]btnAnalizar.innerText = "CARGAR Y ANALIZAR"; [cite: 2]
            btnAnalizar.disabled = false;
            window.iniciarTodo(); 
        }
    };
}

/* =========================================
   5. LÓGICA DE DIBUJO (p5.js)
   ========================================= */

function setup() {
    let cnv = createCanvas(windowWidth, windowHeight);
    cnv.position(0, 0);
    cnv.style('z-index', '-1');
    noLoop(); 
    analizador = new p5.FFT();
}

function draw() {
    background(5);
    
    if (audioCargado && cancion && cancion.isPlaying()) {
        // Líneas Magenta
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

        [cite_start]// Barra de progreso y tiempo [cite: 2, 3]
        let p = (cancion.currentTime() / cancion.duration()) * 100;
        [cite_start]const progressBar = document.getElementById('progress-bar'); [cite: 2]
        if (progressBar) progressBar.style.width = p + "%";
        
        [cite_start]const timeDisplay = document.getElementById('time'); [cite: 3]
        if (timeDisplay) {
            timeDisplay.innerText = nf(cancion.currentTime(), 0, 1) + " / " + nf(cancion.duration(), 0, 1);
        }
    }
}

/* --- Funciones Globales para Botones --- */
[cite_start]window.cambiarCancion = () => location.reload(); [cite: 2]

window.togglePlay = function() {
    if (!cancion) return;
    [cite_start]const btn = document.getElementById('playBtn'); [cite: 2]
    if (cancion.isPlaying()) {
        cancion.pause();
        [cite_start]if (btn) btn.innerText = "PLAY"; [cite: 2]
    } else {
        cancion.play();
        [cite_start]if (btn) btn.innerText = "PAUSA"; [cite: 2]
    }
};

window.detener = function() {
    if (cancion) {
        cancion.stop();
        [cite_start]const btn = document.getElementById('playBtn'); [cite: 2]
        [cite_start]if (btn) btn.innerText = "PLAY"; [cite: 2]
    }
};

window.saltar = function(s) {
    [cite_start]if (cancion) cancion.jump(constrain(cancion.currentTime() + s, 0, cancion.duration())); [cite: 3]
};

window.clickBarra = function(e) {
    if (!cancion) return;
    [cite_start]const bar = document.getElementById('progress-container'); [cite: 2]
    const rect = bar.getBoundingClientRect();
    const porcentaje = (e.clientX - rect.left) / rect.width;
    cancion.jump(cancion.duration() * porcentaje);
};

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
