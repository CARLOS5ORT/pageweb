import whisper
import json
import sys

model = whisper.load_model("medium")  # puedes usar "small" para probar

audio_path = sys.argv[1]

result = model.transcribe(
    audio_path,
    word_timestamps=True,
    language="es"
)

words = []

for segment in result["segments"]:
    for w in segment["words"]:
        words.append({
            "time": round(w["start"], 2),
            "word": w["word"].strip().upper()
        })

print(json.dumps(words, ensure_ascii=False))
