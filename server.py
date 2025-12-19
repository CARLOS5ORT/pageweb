from fastapi import FastAPI, UploadFile
import whisper
import tempfile
import json

app = FastAPI()
model = whisper.load_model("medium")

@app.post("/sync-lyrics")
async def sync_lyrics(audio: UploadFile):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name

    result = model.transcribe(
        tmp_path,
        word_timestamps=True,
        language="es"
    )

    words = []
    for seg in result["segments"]:
        for w in seg["words"]:
            words.append({
                "time": round(w["start"], 2),
                "word": w["word"].strip().upper()
            })

    return words
