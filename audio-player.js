const AMBIENT_AUDIO_KEY = "bosque-da-fantasia-ambient-audio";
const AMBIENT_TRACK_KEY = "bosque-da-fantasia-ambient-track";
const AMBIENT_VOLUME_KEY = "bosque-da-fantasia-ambient-volume";
const DEFAULT_VOLUME = 0.35;
const DEFAULT_TRACK_ID = "frondens";

const AUDIO_TRACKS = [
    {
        id: "frondens",
        title: "O frondens",
        subtitle: "Canto medieval ambiente",
        sources: [
            {
                src: "https://upload.wikimedia.org/wikipedia/commons/transcoded/a/ad/O_frondens_2.ogg/O_frondens_2.ogg.mp3",
                type: "audio/mpeg"
            },
            {
                src: "https://upload.wikimedia.org/wikipedia/commons/a/ad/O_frondens_2.ogg",
                type: "audio/ogg"
            }
        ]
    },
    {
        id: "ut-queant",
        title: "Ut Queant Laxis",
        subtitle: "Hino medieval leve",
        sources: [
            {
                src: "https://upload.wikimedia.org/wikipedia/commons/transcoded/9/93/Ut_Queant_Laxis.ogg/Ut_Queant_Laxis.ogg.mp3",
                type: "audio/mpeg"
            },
            {
                src: "https://upload.wikimedia.org/wikipedia/commons/9/93/Ut_Queant_Laxis.ogg",
                type: "audio/ogg"
            }
        ]
    },
    {
        id: "santa-maria",
        title: "Santa Maria",
        subtitle: "Cantiga medieval aberta",
        sources: [
            {
                src: "https://upload.wikimedia.org/wikipedia/commons/1/13/Santa_Maria.ogg",
                type: "audio/ogg"
            }
        ]
    },
    {
        id: "a-chantar",
        title: "A Chantar",
        subtitle: "Trova medieval vocal",
        sources: [
            {
                src: "https://upload.wikimedia.org/wikipedia/commons/d/d4/A_Chantar2.ogg",
                type: "audio/ogg"
            }
        ]
    }
];

const getControls = () => [
    document.getElementById("ambient-toggle"),
    document.getElementById("ambient-dock")
].filter(Boolean);

const getStoredVolume = () => {
    const storedValue = Number.parseFloat(localStorage.getItem(AMBIENT_VOLUME_KEY));
    return Number.isFinite(storedValue) ? Math.min(Math.max(storedValue, 0), 1) : DEFAULT_VOLUME;
};

const getTrackById = (trackId) => {
    return AUDIO_TRACKS.find((track) => track.id === trackId) || AUDIO_TRACKS[0];
};

const setAudioSources = (audioElement, track) => {
    audioElement.innerHTML = "";

    track.sources.forEach((source) => {
        const sourceElement = document.createElement("source");
        sourceElement.src = source.src;
        sourceElement.type = source.type;
        audioElement.appendChild(sourceElement);
    });

    audioElement.load();
};

const setTrackMeta = ({ titleElement, subtitleElement, track }) => {
    if (titleElement) {
        titleElement.textContent = track.title;
    }

    if (subtitleElement) {
        subtitleElement.textContent = track.subtitle;
    }
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
    const trackElement = document.getElementById("ambient-track");
    const titleElement = document.getElementById("ambient-track-title");
    const subtitleElement = document.getElementById("ambient-track-subtitle");
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
    let activeTrack = getTrackById(localStorage.getItem(AMBIENT_TRACK_KEY) || DEFAULT_TRACK_ID);
    setAudioSources(audioElement, activeTrack);
    setTrackMeta({ titleElement, subtitleElement, track: activeTrack });

    if (trackElement) {
        trackElement.value = activeTrack.id;
    }

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

    const changeTrack = async (trackId) => {
        const nextTrack = getTrackById(trackId);
        const shouldResume = !audioElement.paused;

        activeTrack = nextTrack;
        localStorage.setItem(AMBIENT_TRACK_KEY, activeTrack.id);
        setTrackMeta({ titleElement, subtitleElement, track: activeTrack });
        setAudioSources(audioElement, activeTrack);
        updateUi(`Trilha alterada para ${activeTrack.title}.`);

        if (shouldResume) {
            await playAudio({ persist: true });
        }
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

    if (trackElement) {
        trackElement.addEventListener("change", () => {
            changeTrack(trackElement.value).catch(() => {
                updateUi("Nao consegui trocar a trilha agora. Tente outra opcao.");
            });
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
