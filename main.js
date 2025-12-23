// --- 2. CONFIGURACIÓN ---
const HF_API_URL = "https://huggingface.co/spaces/carlos5ort/detector-tonalidad"; // Ejemplo de modelo
const HF_TOKEN = "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"; // <--- ¡PEGA TU TOKEN DE HUGGING FACE AQUÍ!

/* --- LOGICA DE INTEGRACIÓN --- */
document.getElementById('btnAnalizar').onclick = async function() {
    const fileInput = document.getElementById('audioFile');
    const file = fileInput.files[0];

    if (!file) {
        alert("Selecciona un archivo primero");
        return;
    }

    // 1. Mostrar que estamos analizando
    this.innerText = "ANALIZANDO CLAVE...";
    this.disabled = true;

    try {
        // 2. Llamada a Hugging Face
        const response = await fetch(HF_API_URL, {
            headers: { Authorization: HF_TOKEN, "x-wait-for-model": "true" },
            method: "POST",
            body: file
        });
        
        const data = await response.json();

        // 3. Mostrar el resultado en el HUD de la derecha
        if (data && data[0]) {
            document.getElementById('key-result').innerText = data[0].label;
        } else {
            document.getElementById('key-result').innerText = "No detectada";
        }
    } catch (error) {
        console.error("Error IA:", error);
        document.getElementById('key-result').innerText = "Error API";
    }

    // 4. Mostrar el contenedor de la clave
    document.getElementById('tonality-display').classList.remove('hidden');

    // 5. LLAMAR A TU FUNCIÓN ORIGINAL
    // Aquí ejecuto iniciarTodo() que ya tenías en tu código original
    iniciarTodo();
};

/* --- AQUÍ ABAJO PEGA EL RESTO DE TU CÓDIGO ORIGINAL --- */
/* (Tus funciones iniciarTodo, draw, saltar, togglePlay, etc.) */
