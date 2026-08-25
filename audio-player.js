const AMBIENT_AUDIO_KEY = "bosque-da-fantasia-ambient-audio";
const AMBIENT_VOLUME = 0.12;
const BASE_FREQUENCY = 261.63;
const NOTE_STEPS = [0, 4, 7, 12, 7, 9, 5, 12];
const NOTE_INTERVAL_MS = 780;
const LOOP_INTERVAL_MS = 6600;

const getAudioContextClass = () => window.AudioContext || window.webkitAudioContext;

const getFrequency = (step) => BASE_FREQUENCY * (2 ** (step / 12));

const getControls = () => [
    document.getElementById("ambient-toggle"),
    document.getElementById("ambient-dock")
].filter(Boolean);

const setUi = ({ controls, statusElement, isPlaying, message }) => {
    controls.forEach((control) => {
        control.textContent = isPlaying ? "Silenciar trilha" : "Trilha elfica";
        control.setAttribute("aria-pressed", String(isPlaying));
        control.dataset.audioState = isPlaying ? "on" : "off";
    });

    if (statusElement) {
        statusElement.textContent = message;
    }
};

export const initAudioPlayer = () => {
    const audioElement = document.getElementById("ambient-audio");
    const statusElement = document.getElementById("ambient-status");
    const controls = getControls();
    const AudioContextClass = getAudioContextClass();

    if (!controls.length) {
        return;
    }

    if (controls.some((control) => control.dataset.ready === "true")) {
        return;
    }

    controls.forEach((control) => {
        control.dataset.ready = "true";
    });

    if (audioElement) {
        audioElement.removeAttribute("src");
        audioElement.innerHTML = "";
    }

    if (!AudioContextClass) {
        controls.forEach((control) => {
            control.disabled = true;
        });
        setUi({
            controls,
            statusElement,
            isPlaying: false,
            message: "Este navegador nao liberou audio ambiente local."
        });
        return;
    }

    let audioContext;
    let masterGain;
    let lowPass;
    let loopTimer;
    let activeNodes = [];
    let isPlaying = false;

    const ensureGraph = () => {
        if (audioContext) {
            return;
        }

        audioContext = new AudioContextClass();
        masterGain = audioContext.createGain();
        lowPass = audioContext.createBiquadFilter();

        masterGain.gain.value = 0;
        lowPass.type = "lowpass";
        lowPass.frequency.value = 1800;
        lowPass.Q.value = 0.8;

        masterGain.connect(lowPass);
        lowPass.connect(audioContext.destination);
    };

    const trackNode = (oscillator, gain) => {
        const node = { oscillator, gain };
        activeNodes.push(node);
        oscillator.addEventListener("ended", () => {
            activeNodes = activeNodes.filter((candidate) => candidate !== node);
        });
    };

    const stopActiveNodes = () => {
        if (!audioContext) {
            activeNodes = [];
            return;
        }

        activeNodes.forEach(({ oscillator, gain }) => {
            try {
                gain.gain.cancelScheduledValues(audioContext.currentTime);
                gain.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.03);
                oscillator.stop(audioContext.currentTime + 0.12);
            } catch {
                // Some browsers throw when a scheduled oscillator already stopped.
            }
        });

        activeNodes = [];
    };

    const playTone = ({ frequency, startsAt, duration, peak, type = "sine" }) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const endsAt = startsAt + duration;

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, startsAt);
        gain.gain.setValueAtTime(0.0001, startsAt);
        gain.gain.linearRampToValueAtTime(peak, startsAt + 0.08);
        gain.gain.setTargetAtTime(0.0001, startsAt + 0.16, Math.max(0.18, duration / 3));

        oscillator.connect(gain);
        gain.connect(masterGain);
        oscillator.start(startsAt);
        oscillator.stop(endsAt);
        trackNode(oscillator, gain);
    };

    const schedulePhrase = () => {
        const now = audioContext.currentTime + 0.04;

        playTone({
            frequency: BASE_FREQUENCY / 2,
            startsAt: now,
            duration: 5.8,
            peak: 0.16,
            type: "triangle"
        });

        playTone({
            frequency: getFrequency(7) / 2,
            startsAt: now + 0.25,
            duration: 5.2,
            peak: 0.08,
            type: "sine"
        });

        NOTE_STEPS.forEach((step, index) => {
            playTone({
                frequency: getFrequency(step),
                startsAt: now + ((index * NOTE_INTERVAL_MS) / 1000),
                duration: 1.8,
                peak: index === 0 ? 0.26 : 0.19,
                type: index % 2 === 0 ? "sine" : "triangle"
            });
        });
    };

    const startLoop = () => {
        schedulePhrase();
        loopTimer = window.setInterval(schedulePhrase, LOOP_INTERVAL_MS);
    };

    const pauseAudio = ({ persist = true } = {}) => {
        if (loopTimer) {
            window.clearInterval(loopTimer);
            loopTimer = undefined;
        }

        if (audioContext && masterGain) {
            masterGain.gain.cancelScheduledValues(audioContext.currentTime);
            masterGain.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.08);
            stopActiveNodes();
        }

        isPlaying = false;

        if (persist) {
            localStorage.setItem(AMBIENT_AUDIO_KEY, "off");
        }

        setUi({
            controls,
            statusElement,
            isPlaying: false,
            message: "Trilha desligada. Toque no controle flutuante para ouvir o fundo elfico."
        });
    };

    const playAudio = async ({ persist = true } = {}) => {
        try {
            ensureGraph();
            await audioContext.resume();

            if (loopTimer) {
                window.clearInterval(loopTimer);
            }

            stopActiveNodes();
            masterGain.gain.cancelScheduledValues(audioContext.currentTime);
            masterGain.gain.setTargetAtTime(AMBIENT_VOLUME, audioContext.currentTime, 0.12);
            startLoop();
            isPlaying = true;

            if (persist) {
                localStorage.setItem(AMBIENT_AUDIO_KEY, "on");
            }

            setUi({
                controls,
                statusElement,
                isPlaying: true,
                message: "Trilha elfica ativa. O som e gerado localmente, sem carregar arquivo externo."
            });
        } catch {
            pauseAudio({ persist: false });
            setUi({
                controls,
                statusElement,
                isPlaying: false,
                message: "O navegador bloqueou o som. Toque novamente no botao da trilha."
            });
        }
    };

    controls.forEach((control) => {
        control.addEventListener("click", () => {
            if (isPlaying) {
                pauseAudio({ persist: true });
                return;
            }

            playAudio({ persist: true });
        });
    });

    document.addEventListener("visibilitychange", () => {
        if (document.hidden && isPlaying && audioContext) {
            masterGain.gain.setTargetAtTime(AMBIENT_VOLUME * 0.35, audioContext.currentTime, 0.18);
            return;
        }

        if (!document.hidden && isPlaying && audioContext) {
            masterGain.gain.setTargetAtTime(AMBIENT_VOLUME, audioContext.currentTime, 0.18);
        }
    });

    if (localStorage.getItem(AMBIENT_AUDIO_KEY) === "on") {
        setUi({
            controls,
            statusElement,
            isPlaying: false,
            message: "Toque em Trilha elfica para reativar o som nesta visita."
        });
        return;
    }

    pauseAudio({ persist: false });
};
