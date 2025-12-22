let song, mic, pitchUser, fftSong;
let bars = [];
let voiceTrail = [];
let freqUser = 0;
let ready = false;

const TIME_SCALE = 300;
const notes = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

// ===============================
// CLAVE FINAL (FIJA)
// ===============================
let finalKey = "Analizando...";
let keyDetected = false;

// Perfiles Krumhansl (estándar)
const MAJOR_PROFILE = [6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88];
const MINOR_PROFILE = [6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17];

function setup() {
    createCanvas(windowWidth, windowHeight);
    textFont("Segoe UI");
}

async function iniciarTodo() {
    const file = document.getElementById("audioFile").files[0];
    if (!file) return;

    document.getElementById("setup-panel").classList.add("hidden");
    document.getElementById("footer-controls").classList.remove("hidden");
    document.getElementById("hud").classList.remove("hidden");

    cargarLetra();
    await getAudioContext().resume();

    song = loadSound(URL.createObjectURL(file), async () => {
        fftSong = new p5.FFT(0.9, 2048);
        fftSong.setInput(song);

        // 🔥 ANALISIS OFFLINE COMPLETO
        await analyzeFullSongKey();

        mic = new p5.AudioIn();
        mic.start(() => {
            const modelURL =
            "https://raw.githubusercontent.com/ml5js/ml5-data-and-models/main/models/pitch-detection/crepe/";
            pitchUser = ml5.pitchDetection(modelURL, getAudioContext(), mic.stream, () => {
                ready = true;
                song.play();
            });
        });
    });
}

// ===============================
// ANALISIS DE CLAVE COMPLETA
// ===============================
async function analyzeFullSongKey() {
    let votes = new Array(24).fill(0);
    let windowSize = 0.5;
    let step = 0.25;

    song.play();
    song.pause();

    for (let t = 0; t < song.duration(); t += step) {
        song.jump(t);
        await sleep(30);

        let spectrum = fftSong.analyze();
        let chroma = new Array(12).fill(0);
        let nyquist = getAudioContext().sampleRate / 2;

        for (let i = 0; i < spectrum.length; i++) {
            let amp = spectrum[i];
            if (amp < 10) continue;

            let freq = (i / spectrum.length) * nyquist;
            if (freq < 80 || freq > 2000) continue;

            let midi = Math.round(12 * Math.log2(freq / 440) + 69);
            let note = ((midi % 12) + 12) % 12;
            chroma[note] += amp;
        }

        normalize(chroma);

        let best = detectKeyFromChroma(chroma);
        if (best >= 0) votes[best]++;
    }

    let winner = votes.indexOf(Math.max(...votes));
    finalKey = formatKeyName(winner);
    keyDetected = true;
}

function detectKeyFromChroma(chroma) {
    let bestScore = -Infinity;
    let bestKey = -1;

    for (let i = 0; i < 12; i++) {
        let maj = 0, min = 0;
        for (let j = 0; j < 12; j++) {
            maj += chroma[(j+i)%12] * MAJOR_PROFILE[j];
            min += chroma[(j+i)%12] * MINOR_PROFILE[j];
        }
        if (maj > bestScore) { bestScore = maj; bestKey = i; }
        if (min > bestScore) { bestScore = min; bestKey = i + 12; }
    }
    return bestKey;
}

function formatKeyName(k) {
    if (k < 12) return notes[k] + " mayor";
    return notes[k-12] + " menor";
}

function normalize(arr) {
    let sum = arr.reduce((a,b)=>a+b,0);
    if (sum === 0) return;
    for (let i=0;i<arr.length;i++) arr[i] /= sum;
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

// ===============================
// DIBUJO
// ===============================
function draw() {
    background(5,5,15);
    if (!ready) return;

    drawGrid();

    let now = song.currentTime();
    let fSong = detectPitchSong();

    if (fSong && fSong > 80 && fSong < 1100) {
        if (!bars.length || now - bars[bars.length-1].time > 0.15) {
            bars.push({ y: freqToY(fSong), time: now });
        }
    }

    pitchUser.getPitch((e,f)=> freqUser = f || 0);

    if (freqUser > 0) {
        voiceTrail.push({ y: freqToY(freqUser), time: now });
    }

    stroke(0,242,255,180);
    strokeWeight(8);
    for (let i=1;i<voiceTrail.length;i++) {
        let x1 = width/2 + (voiceTrail[i-1].time - now) * TIME_SCALE;
        let x2 = width/2 + (voiceTrail[i].time - now) * TIME_SCALE;
        if (x1<80||x2>width) continue;
        line(x1, voiceTrail[i-1].y, x2, voiceTrail[i].y);
    }

    stroke("#ff00ff");
    strokeWeight(12);
    for (let b of bars) {
        let x = width/2 + (b.time - now) * TIME_SCALE;
        if (x<80||x>width) continue;
        line(x, b.y, x+45, b.y);
    }

    if (freqUser>0) {
        let y=freqToY(freqUser);
        fill(0,242,255,150); noStroke();
        ellipse(width/2,y,40);
        fill(255); ellipse(width/2,y,15);
    }

    // ---- CLAVE FINAL (FIJA) ----
    noStroke();
    fill(255);
    textSize(20);
    textAlign(LEFT, TOP);
    text("Clave: " + finalKey, 20, 20);

    stroke(0,242,255,160);
    strokeWeight(2);
    line(width/2, 0, width/2, height);

    updateUI();
}

// ===============================
// UTILIDADES
// ===============================
function drawGrid() {
    for (let i=36;i<84;i++) {
        let f=440*Math.pow(2,(i-69)/12);
        let y=freqToY(f);
        stroke(255,10); line(80,y,width,y);
        noStroke(); fill(0,242,255,120);
        text(notes[i%12]+(Math.floor(i/12)-1),25,y);
    }
}

function freqToY(f) {
    return map(Math.log(f),Math.log(80),Math.log(1100),height-160,50);
}

function detectPitchSong() {
    let w=fftSong.waveform();
    let best=-1,bestCorr=0;
    for (let o=20;o<1000;o++) {
        let c=0;
        for (let i=0;i<w.length-o;i++) c+=w[i]*w[i+o];
        if (c>bestCorr){bestCorr=c;best=o;}
    }
    return best>0?getAudioContext().sampleRate/best:null;
}

function updateUI() {
    let c=song.currentTime(),d=song.duration();
    document.getElementById("progress-bar").style.width=(c/d*100)+"%";
    document.getElementById("time").innerText=Math.floor(c)+" / "+Math.floor(d);
}

function togglePlay() {
    if (song.isPlaying()){song.pause();playBtn.innerText="PLAY";}
    else{song.play();playBtn.innerText="PAUSA";}
}

function saltar(s){song.jump(constrain(song.currentTime()+s,0,song.duration()));}
function detener(){song.stop();bars=[];voiceTrail=[];}
function cambiarCancion(){detener();location.reload();}
function clickBarra(e){
    let r=e.target.getBoundingClientRect();
    song.jump((e.clientX-r.left)/r.width*song.duration());
}

function cargarLetra(){
    let t=document.getElementById("lyricsInput").value.trim();
    if(!t)return;
    let b=document.getElementById("lyrics-box");
    b.innerHTML="";
    t.split("\n").forEach(l=>{
        let s=document.createElement("span");
        s.textContent=l;
        b.appendChild(s);
    });
    document.getElementById("lyrics-panel").classList.remove("hidden");
}

function windowResized(){resizeCanvas(windowWidth,windowHeight);}
