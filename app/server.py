from flask import Flask, render_template, request, jsonify
import essentia.standard as es
import os

app = Flask(__name__)
UPLOAD_FOLDER = 'data'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analizar', methods=['POST'])
def analizar():
    if 'audio' not in request.files:
        return jsonify({"error": "No hay audio"}), 400
    
    file = request.files['audio']
    path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(path)

    try:
        # Cargamos el audio
        audio = es.MonoLoader(filename=path)()

        # 1. Extracción de Tonalidad
        key_extractor = es.KeyExtractor()
        key, scale, strength = key_extractor(audio)

        # 2. Extracción de Melodía (f0)
        # Esto reemplaza tu lógica de JS por algo profesional
        melody_extractor = es.PredominantPitchMelodia(frameSize=2048, hopSize=128)
        pitch, confidence = melody_extractor(audio)

        # Limpiamos el archivo después de procesar
        os.remove(path)

        return jsonify({
            "key": f"{key} {scale}",
            "confidence": float(strength),
            "pitch_map": [{"t": i*128/44100, "f": float(p)} for i, p in enumerate(pitch) if p > 0]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
