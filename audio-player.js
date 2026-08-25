const AMBIENT_AUDIO_KEY = "bosque-da-fantasia-ambient-audio";
const AMBIENT_VOLUME = 0.055;
const BASE_FREQUENCY = 220;
const NOTE_STEPS = [0, 7, 12, 14, 7, 5, 12, 19];
const NOTE_INTERVAL_MS = 920;
const LOOP_PADDING_MS = 900;

const getAudioContextClass = () => window.AudioContext || window.webkitAudioContext;

const getFrequency = (step) => BASE_FREQUENCY * (2 ** (step / 12));

const setUi = ({ toggleElement, statusElement, isPlaying, message }) => {
    toggleElement.textContent = isPlaying
        ? "Silenciar trilha elfica"
        : "Ativar trilha elfica";
    toggleElement.setAttribute("aria-pressed", String(isPlaying));
    statusElement.textContent = message;
};

export const initAudioPlayer = () => {
    const audioElement = document.getElementById("ambient-audio");
    const toggleElement = document.getElementById("ambient-toggle");
    const statusElement = document.getElementById("ambient-status");
    const AudioContextClass = getAudioContextClass();

    if (!toggleElement || !statusElement) {
        return;
    }

    if (toggleElement.dataset.ready === "true") {
        return;
    }

    toggleElement.dataset.ready = "true";

    if (audioElement) {
        audioElement.removeAttribute("src");
        audioElement.innerHTML = "";
    }

    if (!AudioContextClass) {
        toggleElement.disabled = true;
        setUi({
            toggleElement,
            statusElement,
            isPlaying: false,
            message: "Este navegador nao liberou audio ambiente local."
        });
        return;
    }

    let audioContext;
    let masterGain;
    let droneNodes = [];
    let activeNotes = new Set();
    let loopTimer;
    let isPlaying = false;

    const ensureGraph = () => {
        if (!audioContext) {
            audioContext = new AudioContextClass();
            masterGain = audioContext.createGain();
            masterGain.gain.value = 0;
            masterGain.connect(audioContext.destination);
        }
    };

    const stopDrone = () => {
        const stopAt = audioContext ? audioContext.currentTime + 0.08 : 0;

        droneNodes.forEach(({ oscillator, gain }) => {
            try {
                gain.gain.cancelScheduledValues(audioContext.currentTime);
                gain.gain.linearRampToValueAtTime(0, stopAt);
                oscillator.stop(stopAt + 0.05);
            } catch {
                // The node may already have been stopped by the browser.
            }
        });

        droneNodes = [];
    };

    const stopActiveNotes = () => {
        if (!audioContext) {
            return;
        }

        activeNotes.forEach(({ oscillator, gain }) => {
            try {
                gain.gain.cancelScheduledValues(audioContext.currentTime);
                gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.05);
                oscillator.stop(audioContext.currentTime + 0.08);
            } catch {
                // The note may already have finished naturally.
            }
        });

        activeNotes.clear();
    };

    const startDrone = () => {
        const droneFrequencies = [BASE_FREQUENCY / 2, getFrequency(7) / 2];

        droneNodes = droneFrequencies.map((frequency, index) => {
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();

            oscillator.type = index === 0 ? "sine" : "triangle";
            oscillator.frequency.value = frequency;
            gain.gain.value = 0;
            oscillator.connect(gain);
            gain.connect(masterGain);
            oscillator.start();
            gain.gain.linearRampToValueAtTime(index === 0 ? 0.18 : 0.08, audioContext.currentTime + 1.4);

            return { oscillator, gain };
        });
    };

    const playNote = (frequency, delaySeconds) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const startsAt = audioContext.currentTime + delaySeconds;
        const fadesAt = startsAt + 0.1;
        const endsAt = startsAt + 2.7;
        const note = { oscillator, gain };

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, startsAt);
        gain.gain.setValueAtTime(0, startsAt);
        gain.gain.linearRampToValueAtTime(0.34, fadesAt);
        gain.gain.exponentialRampToValueAtTime(0.001, endsAt);

        oscillator.connect(gain);
        gain.connect(masterGain);
        oscillator.start(startsAt);
        oscillator.stop(endsAt + 0.04);
        activeNotes.add(note);
        oscillator.addEventListener("ended", () => activeNotes.delete(note));
    };

    const scheduleLoop = () => {
        NOTE_STEPS.forEach((step, index) => {
            playNote(getFrequency(step), (index * NOTE_INTERVAL_MS) / 1000);
        });

        loopTimer = window.setTimeout(scheduleLoop, (NOTE_STEPS.length * NOTE_INTERVAL_MS) + LOOP_PADDING_MS);
    };

    const pauseAudio = ({ persist = true } = {}) => {
        if (loopTimer) {
            window.clearTimeout(loopTimer);
            loopTimer = undefined;
        }

        if (audioContext && masterGain) {
            masterGain.gain.cancelScheduledValues(audioContext.currentTime);
            masterGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.28);
            stopDrone();
            stopActiveNotes();
        }

        isPlaying = false;

        if (persist) {
            localStorage.setItem(AMBIENT_AUDIO_KEY, "off");
        }

        setUi({
            toggleElement,
            statusElement,
            isPlaying: false,
            message: "Trilha desligada. Ative quando quiser um fundo elfico bem leve."
        });
    };

    const playAudio = async ({ persist = true } = {}) => {
        try {
            ensureGraph();
            await audioContext.resume();

            if (loopTimer) {
                window.clearTimeout(loopTimer);
            }

            stopDrone();
            stopActiveNotes();
            masterGain.gain.cancelScheduledValues(audioContext.currentTime);
            masterGain.gain.linearRampToValueAtTime(AMBIENT_VOLUME, audioContext.currentTime + 0.45);
            startDrone();
            scheduleLoop();
            isPlaying = true;

            if (persist) {
                localStorage.setItem(AMBIENT_AUDIO_KEY, "on");
            }

            setUi({
                toggleElement,
                statusElement,
                isPlaying: true,
                message: "Trilha elfica ativa em volume baixo, gerada localmente pelo navegador."
            });
        } catch {
            pauseAudio({ persist: false });
            statusElement.textContent = "O navegador pediu outro toque para liberar a trilha.";
        }
    };

    toggleElement.addEventListener("click", () => {
        if (isPlaying) {
            pauseAudio({ persist: true });
            return;
        }

        playAudio({ persist: true });
    });

    if (localStorage.getItem(AMBIENT_AUDIO_KEY) === "on") {
        setUi({
            toggleElement,
            statusElement,
            isPlaying: false,
            message: "Toque para reativar a trilha elfica nesta visita."
        });
        return;
    }

    pauseAudio({ persist: false });
};
