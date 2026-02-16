FROM python:3.11-slim

# Instalamos solo lo esencial de sistema que sí está en los repositorios estándar
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    build-essential \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalamos Essentia y las demás librerías vía PIP (más estable en tu red)
COPY requirements.txt .
RUN pip install --no-cache-dir --trusted-host pypi.org --trusted-host files.pythonhosted.org \
    numpy \
    flask \
    essentia

COPY . .

EXPOSE 5000
CMD ["python", "app/server.py"]