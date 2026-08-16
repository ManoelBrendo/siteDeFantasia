const AMBIENT_AUDIO_KEY = "bosque-da-fantasia-ambient-audio";
const AMBIENT_VOLUME = 0.08;
const AMBIENT_TRACK = {
    label: "Violino ao longe",
    sources: [
        {
            src: "https://upload.wikimedia.org/wikipedia/commons/transcoded/9/94/Street_musician_violin.ogg/Street_musician_violin.ogg.mp3",
            type: "audio/mpeg"
        },
        {
            src: "https://upload.wikimedia.org/wikipedia/commons/9/94/Street_musician_violin.ogg",
            type: "audio/ogg"
        }
    ]
};

const setSources = (audioElement) => {
    audioElement.innerHTML = "";

    AMBIENT_TRACK.sources.forEach((sourceInfo) => {
        const sourceElement = document.createElement("source");
        sourceElement.src = sourceInfo.src;
        sourceElement.type = sourceInfo.type;
        audioElement.appendChild(sourceElement);
    });

    audioElement.load();
};

const setUi = ({ toggleElement, statusElement, isPlaying, message }) => {
    toggleElement.textContent = isPlaying
        ? "Silenciar violino ambiente"
        : "Ativar violino ambiente";
    toggleElement.setAttribute("aria-pressed", String(isPlaying));
    statusElement.textContent = message;
};

export const initAudioPlayer = () => {
    const audioElement = document.getElementById("ambient-audio");
    const toggleElement = document.getElementById("ambient-toggle");
    const statusElement = document.getElementById("ambient-status");

    if (!audioElement || !toggleElement || !statusElement) {
        return;
    }

    if (audioElement.dataset.ready === "true") {
        return;
    }

    audioElement.dataset.ready = "true";
    audioElement.volume = AMBIENT_VOLUME;
    setSources(audioElement);

    const pauseAudio = ({ persist = true } = {}) => {
        audioElement.pause();

        if (persist) {
            localStorage.setItem(AMBIENT_AUDIO_KEY, "off");
        }

        setUi({
            toggleElement,
            statusElement,
            isPlaying: false,
            message: "Som suave desligado. Ative quando quiser um violino leve ao fundo."
        });
    };

    const playAudio = async ({ persist = true, fromInteraction = false } = {}) => {
        try {
            await audioElement.play();

            if (persist) {
                localStorage.setItem(AMBIENT_AUDIO_KEY, "on");
            }

            setUi({
                toggleElement,
                statusElement,
                isPlaying: true,
                message: "Violino ambiente ativo em volume baixo."
            });
        } catch {
            if (persist) {
                localStorage.setItem(AMBIENT_AUDIO_KEY, "off");
            }

            setUi({
                toggleElement,
                statusElement,
                isPlaying: false,
                message: fromInteraction
                    ? "O navegador pediu mais um toque para liberar o som."
                    : "Ative o violino quando quiser ouvir a trilha."
            });
        }
    };

    toggleElement.addEventListener("click", () => {
        if (audioElement.paused) {
            playAudio({ persist: true, fromInteraction: true });
            return;
        }

        pauseAudio({ persist: true });
    });

    audioElement.addEventListener("error", () => {
        pauseAudio({ persist: false });
        statusElement.textContent = "A trilha nao carregou direito agora. Tente novamente em instantes.";
    });

    if (localStorage.getItem(AMBIENT_AUDIO_KEY) === "on") {
        playAudio({ persist: false, fromInteraction: false });
        return;
    }

    pauseAudio({ persist: false });
};
