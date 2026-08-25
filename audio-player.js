const AMBIENT_AUDIO_KEY = "bosque-da-fantasia-ambient-audio";
const AMBIENT_VOLUME_KEY = "bosque-da-fantasia-ambient-volume";
const DEFAULT_VOLUME = 0.35;

const getControls = () => [
    document.getElementById("ambient-toggle"),
    document.getElementById("ambient-dock")
].filter(Boolean);

const getStoredVolume = () => {
    const storedValue = Number.parseFloat(localStorage.getItem(AMBIENT_VOLUME_KEY));
    return Number.isFinite(storedValue) ? Math.min(Math.max(storedValue, 0), 1) : DEFAULT_VOLUME;
};

const setUi = ({ audioElement, playerElement, controls, statusElement, isPlaying, message }) => {
    controls.forEach((control) => {
        const isDock = control.id === "ambient-dock";
        control.textContent = isDock
            ? (isPlaying ? "Som ligado" : "Trilha sonora")
            : (isPlaying ? "Pausar" : "Tocar");
        control.setAttribute("aria-pressed", String(isPlaying));
        control.setAttribute("aria-label", isPlaying ? "Pausar trilha sonora" : "Tocar trilha sonora");
        control.dataset.audioState = isPlaying ? "on" : "off";
    });

    if (playerElement) {
        playerElement.dataset.state = isPlaying ? "playing" : "idle";
    }

    if (audioElement) {
        audioElement.dataset.state = isPlaying ? "playing" : "idle";
    }

    if (statusElement) {
        statusElement.textContent = message;
    }
};

export const initAudioPlayer = () => {
    const audioElement = document.getElementById("ambient-audio");
    const playerElement = document.getElementById("ambient-player");
    const volumeElement = document.getElementById("ambient-volume");
    const statusElement = document.getElementById("ambient-status");
    const controls = getControls();

    if (!audioElement || !controls.length) {
        return;
    }

    if (audioElement.dataset.ready === "true") {
        return;
    }

    audioElement.dataset.ready = "true";
    audioElement.volume = getStoredVolume();

    if (volumeElement) {
        volumeElement.value = String(audioElement.volume);
    }

    const updateUi = (message) => {
        setUi({
            audioElement,
            playerElement,
            controls,
            statusElement,
            isPlaying: !audioElement.paused,
            message
        });
    };

    const pauseAudio = ({ persist = true } = {}) => {
        audioElement.pause();

        if (persist) {
            localStorage.setItem(AMBIENT_AUDIO_KEY, "off");
        }

        updateUi("Trilha pausada. Use Tocar para voltar ao canto ambiente.");
    };

    const playAudio = async ({ persist = true } = {}) => {
        try {
            await audioElement.play();

            if (persist) {
                localStorage.setItem(AMBIENT_AUDIO_KEY, "on");
            }

            updateUi("Trilha sonora ativa em volume baixo.");
        } catch {
            localStorage.setItem(AMBIENT_AUDIO_KEY, "off");
            updateUi("O navegador bloqueou o audio. Toque novamente em Tocar.");
        }
    };

    controls.forEach((control) => {
        control.addEventListener("click", () => {
            if (audioElement.paused) {
                playAudio({ persist: true });
                return;
            }

            pauseAudio({ persist: true });
        });
    });

    if (volumeElement) {
        volumeElement.addEventListener("input", () => {
            const nextVolume = Number.parseFloat(volumeElement.value);
            audioElement.volume = Number.isFinite(nextVolume) ? Math.min(Math.max(nextVolume, 0), 1) : DEFAULT_VOLUME;
            localStorage.setItem(AMBIENT_VOLUME_KEY, String(audioElement.volume));
        });
    }

    audioElement.addEventListener("play", () => {
        updateUi("Trilha sonora ativa em volume baixo.");
    });

    audioElement.addEventListener("pause", () => {
        updateUi("Trilha pausada. Use Tocar para voltar ao canto ambiente.");
    });

    audioElement.addEventListener("canplay", () => {
        if (audioElement.paused) {
            updateUi("Trilha carregada. Toque em Tocar para iniciar.");
        }
    });

    audioElement.addEventListener("error", () => {
        localStorage.setItem(AMBIENT_AUDIO_KEY, "off");
        updateUi("Nao consegui carregar a trilha agora. Verifique a conexao e tente novamente.");
    });

    if (localStorage.getItem(AMBIENT_AUDIO_KEY) === "on") {
        updateUi("Toque em Tocar para reativar a trilha nesta visita.");
        return;
    }

    updateUi("Trilha pronta. Toque em Tocar para iniciar.");
};
