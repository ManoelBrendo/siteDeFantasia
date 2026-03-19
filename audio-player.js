const AUDIO_PLAYER_STYLE_ID = "bosque-audio-player-style";

const tracks = {
    serenata: {
        label: "Serenata do Bosque",
        description: "Violino, flauta e harpa em uma camada macia e antiga.",
        sources: [
            { src: "https://upload.wikimedia.org/wikipedia/commons/transcoded/2/29/Gramophone-11491-248010.ogg/Gramophone-11491-248010.ogg.mp3", type: "audio/mpeg" },
            { src: "https://upload.wikimedia.org/wikipedia/commons/2/29/Gramophone-11491-248010.ogg", type: "audio/ogg" }
        ]
    },
    violino: {
        label: "Violino ao Longe",
        description: "Um violino distante, humano e discreto, como se viesse do outro lado da névoa.",
        sources: [
            { src: "https://upload.wikimedia.org/wikipedia/commons/transcoded/9/94/Street_musician_violin.ogg/Street_musician_violin.ogg.mp3", type: "audio/mpeg" },
            { src: "https://upload.wikimedia.org/wikipedia/commons/9/94/Street_musician_violin.ogg", type: "audio/ogg" }
        ]
    },
    nevoa: {
        label: "Névoa de Câmara",
        description: "Instrumental antigo com sopros suaves e clima de salão encantado.",
        sources: [
            { src: "https://upload.wikimedia.org/wikipedia/commons/transcoded/2/2d/Victor-16029a-b6222.ogg/Victor-16029a-b6222.ogg.mp3", type: "audio/mpeg" },
            { src: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Victor-16029a-b6222.ogg", type: "audio/ogg" }
        ]
    }
};

const playerStyles = `
.audio-dock {
    position: fixed;
    right: 1rem;
    bottom: 1rem;
    z-index: 30;
    width: min(16.75rem, calc(100% - 2rem));
    padding: 0.8rem 0.82rem;
    border: 1px solid rgba(220, 191, 131, 0.24);
    border-radius: 20px;
    background:
        linear-gradient(180deg, rgba(24, 43, 35, 0.95), rgba(8, 14, 12, 0.94));
    box-shadow: 0 18px 38px rgba(3, 8, 7, 0.5);
    backdrop-filter: blur(18px);
    transition: width 180ms ease, padding 180ms ease, transform 180ms ease, background 180ms ease;
}
.audio-dock::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(135deg, rgba(220, 191, 131, 0.12), transparent 44%);
    pointer-events: none;
}
.audio-dock.is-collapsed {
    width: auto;
    min-width: 0;
    padding: 0.42rem;
    border-radius: 999px;
}
.audio-head {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.65rem;
}
.audio-head-text {
    min-width: 0;
}
.audio-head h3 {
    margin: 0;
    font-size: 0.92rem;
    color: var(--gold-soft, #f0dfb0);
    font-family: "Palatino Linotype", "Book Antiqua", Georgia, serif;
}
.audio-panel-toggle {
    min-height: 2.05rem;
    padding: 0.4rem 0.72rem;
    white-space: nowrap;
    font-size: 0.82rem;
}
.audio-head p,
.audio-meta,
.audio-status {
    margin: 0;
    color: var(--muted, #c4bda8);
}
.audio-meta {
    margin-top: 0.22rem;
    font-size: 0.75rem;
}
.audio-controls {
    position: relative;
    display: grid;
    gap: 0.52rem;
    margin-top: 0.72rem;
}
.audio-dock.is-collapsed .audio-head {
    justify-content: center;
}
.audio-dock.is-collapsed .audio-head-text,
.audio-dock.is-collapsed .audio-controls {
    display: none;
}
.audio-buttons {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.6rem;
}
.audio-action {
    width: 100%;
    min-height: 2.55rem;
    justify-content: center;
}
.audio-action:disabled {
    opacity: 0.52;
    cursor: default;
    transform: none;
}
.audio-select,
.audio-slider {
    display: grid;
    gap: 0.28rem;
}
.audio-slider label,
.audio-select label {
    color: var(--gold-soft, #f0dfb0);
    font-size: 0.76rem;
    font-weight: 700;
    letter-spacing: 0.03em;
}
.audio-select select {
    width: 100%;
    padding: 0.62rem 0.76rem;
    border-radius: 14px;
    border: 1px solid rgba(220, 191, 131, 0.16);
    background: rgba(255, 252, 246, 0.08);
    color: var(--text, #f7efdc);
    font: inherit;
}
.audio-slider input[type="range"] {
    width: 100%;
    accent-color: var(--deep, #dcbf83);
}
.audio-status {
    font-size: 0.74rem;
    min-height: 1.25rem;
}
@media (max-width: 720px) {
    .audio-dock {
        left: 1rem;
        right: 1rem;
        width: auto;
        bottom: 0.8rem;
        backdrop-filter: none;
    }
    .audio-dock.is-collapsed {
        left: auto;
        right: 1rem;
        width: auto;
    }
    .audio-panel-toggle {
        width: auto;
    }
    .audio-buttons {
        grid-template-columns: 1fr;
    }
}
`;

const createPlayerMarkup = () => `
    <div class="audio-dock is-collapsed" id="audio-dock" aria-label="Controle da trilha sonora ambiente">
        <div class="audio-head">
            <div class="audio-head-text">
                <h3>Trilha do bosque</h3>
                <p id="audio-meta" class="audio-meta">Escolha uma trilha e deixe o ambiente correr em segundo plano.</p>
            </div>
            <button id="audio-panel-toggle" class="button secondary audio-panel-toggle" type="button" aria-expanded="false" aria-controls="audio-controls">Som</button>
        </div>
        <div class="audio-controls" id="audio-controls">
            <div class="audio-select">
                <label for="audio-track">Trilha sonora</label>
                <select id="audio-track">
                    <option value="serenata">Serenata do Bosque</option>
                    <option value="violino">Violino ao Longe</option>
                    <option value="nevoa">Névoa de Câmara</option>
                </select>
            </div>
            <div class="audio-buttons">
                <button id="audio-play" class="button secondary audio-action" type="button">Tocar</button>
                <button id="audio-pause" class="button secondary audio-action" type="button">Pausar</button>
            </div>
            <div class="audio-slider">
                <label for="audio-volume">Volume ambiente</label>
                <input id="audio-volume" type="range" min="0" max="100" step="1" value="12">
            </div>
            <p id="audio-status" class="audio-status">A trilha começa quando você tocar no botão de tocar.</p>
        </div>
        <audio id="ambient-audio" loop preload="metadata" crossorigin="anonymous"></audio>
    </div>
`;

const ensureStyles = () => {
    if (document.getElementById(AUDIO_PLAYER_STYLE_ID)) {
        return;
    }

    const style = document.createElement("style");
    style.id = AUDIO_PLAYER_STYLE_ID;
    style.textContent = playerStyles;
    document.head.appendChild(style);
};

export const initAudioPlayer = () => {
    if (document.getElementById("audio-dock")) {
        return;
    }

    ensureStyles();
    document.body.insertAdjacentHTML("beforeend", createPlayerMarkup());

    const ambientAudio = document.getElementById("ambient-audio");
    const audioDock = document.getElementById("audio-dock");
    const audioPanelToggle = document.getElementById("audio-panel-toggle");
    const audioPlay = document.getElementById("audio-play");
    const audioPause = document.getElementById("audio-pause");
    const audioTrack = document.getElementById("audio-track");
    const audioMeta = document.getElementById("audio-meta");
    const audioVolume = document.getElementById("audio-volume");
    const audioStatus = document.getElementById("audio-status");
    const AUDIO_ENABLED_KEY = "bosque-da-fantasia-audio-enabled";
    const AUDIO_VOLUME_KEY = "bosque-da-fantasia-audio-volume";
    const AUDIO_TRACK_KEY = "bosque-da-fantasia-audio-track";
    const AUDIO_PANEL_KEY = "bosque-da-fantasia-audio-panel-open";
    const defaultVolume = 0.12;

    const applyTrackSources = (track) => {
        ambientAudio.innerHTML = "";

        track.sources.forEach((sourceInfo) => {
            const source = document.createElement("source");
            source.src = sourceInfo.src;
            source.type = sourceInfo.type;
            ambientAudio.appendChild(source);
        });

        ambientAudio.load();
    };

    const syncPanelToggleLabel = () => {
        const isOpen = !audioDock.classList.contains("is-collapsed");
        audioPanelToggle.textContent = isOpen ? "Fechar" : (!ambientAudio.paused ? "Som ativo" : "Som");
        audioPanelToggle.setAttribute("aria-expanded", String(isOpen));
    };

    const updateAudioUi = (isPlaying, message) => {
        audioPlay.disabled = isPlaying;
        audioPause.disabled = !isPlaying;
        audioStatus.textContent = message;
        syncPanelToggleLabel();
    };

    const setPanelOpen = (isOpen) => {
        audioDock.classList.toggle("is-collapsed", !isOpen);
        syncPanelToggleLabel();
        localStorage.setItem(AUDIO_PANEL_KEY, String(isOpen));
    };

    const setTrack = (trackKey) => {
        const resolvedTrackKey = tracks[trackKey] ? trackKey : "serenata";
        const track = tracks[resolvedTrackKey];
        applyTrackSources(track);
        audioTrack.value = resolvedTrackKey;
        audioMeta.textContent = track.description;
        localStorage.setItem(AUDIO_TRACK_KEY, resolvedTrackKey);
    };

    const setAudioVolume = (value) => {
        ambientAudio.volume = value;
        audioVolume.value = Math.round(value * 100);
        localStorage.setItem(AUDIO_VOLUME_KEY, String(value));
    };

    const storedVolume = Number(localStorage.getItem(AUDIO_VOLUME_KEY));
    const initialVolume = Number.isFinite(storedVolume) && storedVolume >= 0 && storedVolume <= 1
        ? storedVolume
        : defaultVolume;

    setAudioVolume(initialVolume);
    setPanelOpen(localStorage.getItem(AUDIO_PANEL_KEY) === "true");
    setTrack(localStorage.getItem(AUDIO_TRACK_KEY));

    audioPanelToggle.addEventListener("click", () => {
        setPanelOpen(audioDock.classList.contains("is-collapsed"));
    });

    audioVolume.addEventListener("input", (event) => {
        setAudioVolume(Number(event.target.value) / 100);

        if (!ambientAudio.paused) {
            updateAudioUi(true, "Trilha ativa em volume baixo e contínuo.");
        } else {
            updateAudioUi(false, "Volume ajustado. Toque em tocar quando quiser ouvir.");
        }
    });

    audioTrack.addEventListener("change", async (event) => {
        const wasPlaying = !ambientAudio.paused;
        setTrack(event.target.value);

        if (!wasPlaying) {
            updateAudioUi(false, "Nova trilha escolhida. Toque em tocar para ouvir.");
            return;
        }

        try {
            await ambientAudio.play();
            updateAudioUi(true, "Trilha trocada sem interromper o ambiente.");
        } catch {
            localStorage.setItem(AUDIO_ENABLED_KEY, "false");
            updateAudioUi(false, "A nova trilha foi escolhida. Toque em tocar para recomeçar.");
        }
    });

    ambientAudio.addEventListener("error", () => {
        localStorage.setItem(AUDIO_ENABLED_KEY, "false");
        updateAudioUi(false, "Essa trilha não carregou direito. Troque de faixa ou tente tocar novamente.");
    });

    audioPlay.addEventListener("click", async () => {
        try {
            await ambientAudio.play();
            localStorage.setItem(AUDIO_ENABLED_KEY, "true");
            updateAudioUi(true, "Trilha ativa em loop suave.");
        } catch {
            updateAudioUi(false, "O navegador não liberou o som agora. Tente tocar em tocar outra vez.");
        }
    });

    audioPause.addEventListener("click", () => {
        ambientAudio.pause();
        localStorage.setItem(AUDIO_ENABLED_KEY, "false");
        updateAudioUi(false, "Trilha pausada.");
    });

    if (localStorage.getItem(AUDIO_ENABLED_KEY) === "true") {
        ambientAudio.play()
            .then(() => {
                updateAudioUi(true, "Trilha retomada com sua preferência salva.");
            })
            .catch(() => {
                localStorage.setItem(AUDIO_ENABLED_KEY, "false");
                updateAudioUi(false, "Sua preferência foi lembrada, mas o navegador pediu um novo toque para liberar o som.");
            });
        return;
    }

    updateAudioUi(false, "A trilha começa quando você tocar no botão de tocar.");
};
