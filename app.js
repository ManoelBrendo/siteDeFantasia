import { BosqueCatalogApi } from "./catalog-api.js";
import {
    DEFAULT_LABEL,
    DEFAULT_QUERY,
    RESULTS_PER_PAGE,
    advancedFilters,
    affinityQuestions,
    authorsCatalog,
    featuredBooks,
    glossaryTerms,
    readingPaths,
    topicThemes
} from "./site-data.js";
import { recommendFromAnswers } from "./recommendation-engine.js";

const api = new BosqueCatalogApi();
const defaultFilters = Object.fromEntries(advancedFilters.map((group) => [group.id, group.defaultValue]));

const getRequiredElement = (id) => {
    const element = document.getElementById(id);

    if (!element) {
        throw new Error(`Elemento obrigatorio ausente: #${id}`);
    }

    return element;
};

const escapeHtml = (value) => {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
};

const elements = {
    oraculoSection: getRequiredElement("oraculo"),
    compraSection: getRequiredElement("compra"),
    affinityQuestions: getRequiredElement("affinity-questions"),
    affinityResult: getRequiredElement("affinity-result"),
    affinityResultName: getRequiredElement("affinity-result-name"),
    affinityResultDescription: getRequiredElement("affinity-result-description"),
    affinityResultReason: getRequiredElement("affinity-result-reason"),
    affinityResultAlt: getRequiredElement("affinity-result-alt"),
    affinityResultBooks: getRequiredElement("affinity-result-books"),
    affinityMap: getRequiredElement("affinity-map"),
    affinitySubmit: getRequiredElement("affinity-submit"),
    affinityReset: getRequiredElement("affinity-reset"),
    affinityProgress: getRequiredElement("affinity-progress"),
    affinityExplore: getRequiredElement("affinity-explore"),
    authorsGrid: getRequiredElement("authors-grid"),
    authorFocusName: getRequiredElement("author-focus-name"),
    authorFocusSummary: getRequiredElement("author-focus-summary"),
    authorFocusBestFor: getRequiredElement("author-focus-best-for"),
    authorFocusClimate: getRequiredElement("author-focus-climate"),
    authorFocusStart: getRequiredElement("author-focus-start"),
    authorFocusLegacy: getRequiredElement("author-focus-legacy"),
    authorFocusWorks: getRequiredElement("author-focus-works"),
    glossarySearch: getRequiredElement("glossary-search"),
    glossaryCount: getRequiredElement("glossary-count"),
    glossaryGrid: getRequiredElement("glossary-grid"),
    curatedGrid: getRequiredElement("curated-grid"),
    topicsGrid: getRequiredElement("topics-grid"),
    searchForm: getRequiredElement("catalog-search-form"),
    searchInput: getRequiredElement("catalog-search"),
    submitButton: getRequiredElement("catalog-submit"),
    status: getRequiredElement("catalog-status"),
    resultsGrid: getRequiredElement("results-grid"),
    loadMoreButton: getRequiredElement("catalog-load-more"),
    activeTheme: getRequiredElement("active-theme"),
    recentQueries: getRequiredElement("recent-queries"),
    filtersGrid: getRequiredElement("filters-grid"),
    filterSummary: getRequiredElement("filter-summary"),
    clearFilters: getRequiredElement("clear-filters"),
    favoritesGrid: getRequiredElement("favorites-grid"),
    favoritesEmpty: getRequiredElement("favorites-empty"),
    purchaseTitle: getRequiredElement("purchase-title"),
    purchaseOriginal: getRequiredElement("purchase-original"),
    purchaseMeta: getRequiredElement("purchase-meta"),
    purchaseDescription: getRequiredElement("purchase-description"),
    purchaseCover: getRequiredElement("purchase-cover"),
    purchaseLink: getRequiredElement("purchase-link"),
    purchaseSave: getRequiredElement("purchase-save"),
    purchaseHint: getRequiredElement("purchase-hint"),
    purchaseSignalRow: getRequiredElement("purchase-signal-row"),
    purchaseDossierGrid: getRequiredElement("purchase-dossier-grid"),
    purchaseWhyRead: getRequiredElement("purchase-why-read"),
    purchaseReaderProfile: getRequiredElement("purchase-reader-profile"),
    purchaseAuthorNote: getRequiredElement("purchase-author-note")
};

const optionalElements = {
    recentShell: document.getElementById("recent-shell"),
    relicarioSection: document.getElementById("relicario")
};

const state = {
    query: DEFAULT_QUERY,
    page: 1,
    total: 0,
    controller: null,
    debounceTimer: null,
    rawResultBooks: [],
    visibleBooks: [],
    registry: new Map(),
    activeLabel: DEFAULT_LABEL,
    affinityAnswers: new Map(),
    filters: { ...defaultFilters },
    activeAuthorId: authorsCatalog[0]?.id || "",
    glossaryQuery: "",
    favorites: [],
    recentQueries: [],
    currentBookId: featuredBooks[0]?.id || "",
    lastSource: "remote",
    saveStateTimer: null
};

const humanFilterLabel = (groupId, value) => {
    const group = advancedFilters.find((entry) => entry.id === groupId);
    return group?.options.find((option) => option.value === value)?.label || value;
};

const motifLabel = (value) => humanFilterLabel("motivo", value);
const climaLabel = (value) => humanFilterLabel("clima", value);

const normalizeBook = (book) => {
    return {
        ...book,
        originalTitle: book.originalTitle || book.title,
        aura: book.aura || "Fantasia de acervo",
        difficulty: book.difficulty || "Intermediario de descoberta",
        difficultyKey: book.difficultyKey || "intermediario",
        themes: Array.isArray(book.themes) && book.themes.length > 0 ? book.themes : ["fantasia"],
        readerProfile: book.readerProfile || "Boa porta de entrada para leitores curiosos pelo fantastico.",
        whyRead: book.whyRead || "Vale ler para ampliar a trilha fantastica a partir de um recorte especifico do acervo.",
        authorNote: book.authorNote || `${book.author || "O autor"} ajuda a expandir a paisagem desta trilha dentro do acervo.`,
        filters: {
            clima: book.filters?.clima || "iniciatico",
            dificuldade: book.filters?.dificuldade || book.difficultyKey || "intermediario",
            motivo: book.filters?.motivo || "magia"
        },
        purchaseUrl: book.purchaseUrl || "#compra"
    };
};

const registerBooks = (books) => {
    books.map(normalizeBook).forEach((book) => {
        state.registry.set(book.id, book);
    });
};

const getRegisteredBook = (id) => {
    return state.registry.get(id) || null;
};

const isFavorite = (bookId) => {
    return state.favorites.includes(bookId);
};

const serializeUiState = () => {
    return {
        query: state.query,
        activeLabel: state.activeLabel,
        filters: state.filters,
        activeAuthorId: state.activeAuthorId,
        glossaryQuery: state.glossaryQuery,
        affinityAnswers: Object.fromEntries(state.affinityAnswers.entries())
    };
};

const scheduleUiStateSave = () => {
    clearTimeout(state.saveStateTimer);
    state.saveStateTimer = window.setTimeout(() => {
        api.saveUiState(serializeUiState()).catch(() => null);
    }, 180);
};

const hydrateSavedState = (savedState) => {
    if (!savedState || typeof savedState !== "object") {
        return;
    }

    if (savedState.filters && typeof savedState.filters === "object") {
        state.filters = {
            ...defaultFilters,
            ...savedState.filters
        };
    }

    if (typeof savedState.activeAuthorId === "string" && savedState.activeAuthorId) {
        state.activeAuthorId = savedState.activeAuthorId;
    }

    if (typeof savedState.glossaryQuery === "string") {
        state.glossaryQuery = savedState.glossaryQuery;
    }

    if (savedState.affinityAnswers && typeof savedState.affinityAnswers === "object") {
        state.affinityAnswers = new Map(Object.entries(savedState.affinityAnswers).filter(([, value]) => Boolean(value)));
    }
};

const getBookCoverSources = (book) => {
    const sources = Array.isArray(book.coverCandidates) && book.coverCandidates.length > 0
        ? [...book.coverCandidates, book.cover]
        : [book.cover];

    return [...new Set(sources.filter(Boolean))];
};

const applyBookCover = (image, book) => {
    if (!image || !book) {
        return;
    }

    const sources = getBookCoverSources(book);
    let sourceIndex = 0;

    image.onerror = () => {
        sourceIndex += 1;

        if (sourceIndex < sources.length) {
            image.src = sources[sourceIndex];
            return;
        }

        image.onerror = null;
    };

    image.src = sources[0] || "";
};

const hydrateBookImages = (root) => {
    root.querySelectorAll("[data-book-cover-id]").forEach((image) => {
        const book = getRegisteredBook(image.dataset.bookCoverId);

        if (book) {
            applyBookCover(image, book);
        }
    });
};

const buildBookChipRowMarkup = (book) => {
    const chips = [
        book.aura,
        book.difficulty,
        ...book.themes.slice(0, 2)
    ];

    return `
        <div class="book-chip-row">
            ${chips.map((chip) => `<span class="book-chip">${escapeHtml(chip)}</span>`).join("")}
        </div>
    `;
};

const buildBookSaveButtonMarkup = (book) => `
    <button
        class="book-save-button${isFavorite(book.id) ? " is-active" : ""}"
        type="button"
        data-book-save="${escapeHtml(book.id)}"
        aria-pressed="${isFavorite(book.id) ? "true" : "false"}"
    >
        ${isFavorite(book.id) ? "Guardado" : "Guardar"}
    </button>
`;

const buildCuratedMarkup = (book) => `
    <article class="featured-card">
        ${buildBookSaveButtonMarkup(book)}
        <a class="book-card-link js-book-link" href="#compra" data-book-id="${escapeHtml(book.id)}" aria-label="Abrir a ficha editorial de ${escapeHtml(book.title)}">
            <div class="book-cover-shell">
                <img data-book-cover-id="${escapeHtml(book.id)}" src="${escapeHtml(book.cover)}" alt="Capa de ${escapeHtml(book.title)}" loading="lazy" decoding="async">
            </div>
            <div class="book-copy">
                <span class="book-ribbon">${escapeHtml(book.aura)}</span>
                <h3>${escapeHtml(book.title)}</h3>
                <p class="book-original">${escapeHtml(book.originalTitle)}</p>
                <p class="book-description">${escapeHtml(book.description)}</p>
                ${buildBookChipRowMarkup(book)}
                <div class="book-meta">
                    <span>${escapeHtml(book.author)}</span>
                    <span>${escapeHtml(book.year)}</span>
                </div>
            </div>
        </a>
    </article>
`;

const buildTopicMarkup = (topic) => `
    <button class="theme-card" type="button" data-query="${escapeHtml(topic.query)}" data-label="${escapeHtml(topic.label)}">
        <strong>${escapeHtml(topic.label)}</strong>
        <span>${escapeHtml(topic.description)}</span>
    </button>
`;

const buildResultMarkup = (book) => `
    <article class="result-card">
        ${buildBookSaveButtonMarkup(book)}
        <a class="book-card-link js-book-link" href="#compra" data-book-id="${escapeHtml(book.id)}" aria-label="Abrir a ficha editorial de ${escapeHtml(book.title)}">
            <div class="book-cover-shell">
                <img data-book-cover-id="${escapeHtml(book.id)}" src="${escapeHtml(book.cover)}" alt="Capa de ${escapeHtml(book.title)}" loading="lazy" decoding="async">
            </div>
            <div class="book-copy">
                <h3>${escapeHtml(book.title)}</h3>
                <p class="book-author">${escapeHtml(book.author)}</p>
                <p class="book-description">${escapeHtml(book.description)}</p>
                ${buildBookChipRowMarkup(book)}
                <div class="book-meta">
                    <span>${escapeHtml(book.year)}</span>
                    <span>${book.editionCount ? `${escapeHtml(book.editionCount)} edicoes` : "Acervo geral"}</span>
                </div>
            </div>
        </a>
    </article>
`;

const buildGlossaryMarkup = (entry) => `
    <article class="glossary-card">
        <span class="book-ribbon">${escapeHtml(entry.category)}</span>
        <h3>${escapeHtml(entry.term)}</h3>
        <p>${escapeHtml(entry.short)}</p>
        <p>${escapeHtml(entry.long)}</p>
    </article>
`;

const buildAffinityQuestionMarkup = (question) => `
    <article class="affinity-question-card">
        <div class="affinity-question-head">
            <span class="book-ribbon">Pergunta</span>
            <h3>${escapeHtml(question.title)}</h3>
        </div>
        <div class="affinity-choice-grid">
            ${question.options.map((option) => `
                <button
                    class="affinity-choice"
                    type="button"
                    data-question-id="${escapeHtml(question.id)}"
                    data-option-value="${escapeHtml(option.value)}"
                >
                    <strong>${escapeHtml(option.label)}</strong>
                    <span>${escapeHtml(option.description)}</span>
                </button>
            `).join("")}
        </div>
    </article>
`;

const buildAffinityBookMarkup = (book) => `
    <a class="affinity-book-link js-book-link" href="#compra" data-book-id="${escapeHtml(book.id)}">
        <strong>${escapeHtml(book.title)}</strong>
        <span>${escapeHtml(book.author)}</span>
    </a>
`;

const buildAuthorCardMarkup = (author) => `
    <button class="author-card" type="button" data-author-id="${escapeHtml(author.id)}">
        <span>${escapeHtml(author.status)}</span>
        <h3>${escapeHtml(author.name)}</h3>
        <p>${escapeHtml(author.summary)}</p>
        <ul>
            <li>Bom para: ${escapeHtml(author.bestFor)}</li>
            <li>Clima: ${escapeHtml(author.climate)}</li>
        </ul>
    </button>
`;

const buildFilterGroupMarkup = (group) => `
    <article class="filter-group">
        <strong>${escapeHtml(group.label)}</strong>
        <div class="filter-option-row">
            ${group.options.map((option) => `
                <button
                    class="filter-chip"
                    type="button"
                    data-filter-group="${escapeHtml(group.id)}"
                    data-filter-value="${escapeHtml(option.value)}"
                >
                    ${escapeHtml(option.label)}
                </button>
            `).join("")}
        </div>
    </article>
`;

const renderCuratedShelf = () => {
    registerBooks(featuredBooks);
    elements.curatedGrid.innerHTML = featuredBooks.map(buildCuratedMarkup).join("");
    hydrateBookImages(elements.curatedGrid);
    syncFavoriteButtons();
};

const renderTopics = () => {
    elements.topicsGrid.innerHTML = topicThemes.map(buildTopicMarkup).join("");
};

const renderAffinityQuestions = () => {
    elements.affinityQuestions.innerHTML = affinityQuestions.map(buildAffinityQuestionMarkup).join("");
};

const renderAuthors = () => {
    elements.authorsGrid.innerHTML = authorsCatalog.map(buildAuthorCardMarkup).join("");
    syncAuthorSelection();
    renderAuthorFocus();
};

const renderAuthorFocus = () => {
    const author = authorsCatalog.find((entry) => entry.id === state.activeAuthorId) || authorsCatalog[0];

    if (!author) {
        return;
    }

    elements.authorFocusName.textContent = author.name;
    elements.authorFocusSummary.textContent = author.summary;
    elements.authorFocusBestFor.textContent = author.bestFor;
    elements.authorFocusClimate.textContent = author.climate;
    elements.authorFocusStart.textContent = author.startWith;
    elements.authorFocusLegacy.textContent = author.legacy;
    elements.authorFocusWorks.innerHTML = author.works
        .map((work) => `<span class="author-work-chip">${escapeHtml(work)}</span>`)
        .join("");
};

const renderGlossary = () => {
    const query = state.glossaryQuery.trim().toLowerCase();
    const visibleEntries = glossaryTerms.filter((entry) => {
        if (!query) {
            return true;
        }

        return `${entry.term} ${entry.category} ${entry.short} ${entry.long}`.toLowerCase().includes(query);
    });

    elements.glossaryGrid.innerHTML = visibleEntries.map(buildGlossaryMarkup).join("");
    elements.glossaryCount.textContent = `${visibleEntries.length} verbetes revelados`;
};

const renderFilters = () => {
    elements.filtersGrid.innerHTML = advancedFilters.map(buildFilterGroupMarkup).join("");
    syncFilterChips();
    renderFilterSummary();
};

const renderRecentQueries = () => {
    if (state.recentQueries.length === 0) {
        elements.recentQueries.innerHTML = "";

        if (optionalElements.recentShell) {
            optionalElements.recentShell.hidden = true;
        }

        return;
    }

    if (optionalElements.recentShell) {
        optionalElements.recentShell.hidden = false;
    }

    elements.recentQueries.innerHTML = state.recentQueries.map((entry) => `
        <button
            class="filter-chip recent-query-chip"
            type="button"
            data-recent-query="${escapeHtml(entry.query)}"
            data-recent-label="${escapeHtml(entry.label)}"
        >
            ${escapeHtml(entry.label)}
        </button>
    `).join("");
};

const syncFavoriteButtons = () => {
    document.querySelectorAll("[data-book-save]").forEach((button) => {
        const active = isFavorite(button.dataset.bookSave);
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
        button.textContent = active ? "Guardado" : "Guardar";
    });

    const purchaseBook = getRegisteredBook(state.currentBookId);
    const isPurchaseFavorite = Boolean(purchaseBook && isFavorite(purchaseBook.id));
    elements.purchaseSave.textContent = isPurchaseFavorite ? "Remover do relic\u00E1rio" : "Guardar no relic\u00E1rio";
    elements.purchaseSave.setAttribute("aria-pressed", String(isPurchaseFavorite));
};

const renderFavorites = () => {
    const favoriteBooks = state.favorites
        .map((bookId) => getRegisteredBook(bookId))
        .filter(Boolean);

    if (optionalElements.relicarioSection) {
        optionalElements.relicarioSection.hidden = favoriteBooks.length === 0;
    }

    elements.favoritesEmpty.hidden = favoriteBooks.length > 0;
    elements.favoritesGrid.innerHTML = favoriteBooks.map(buildCuratedMarkup).join("");

    if (favoriteBooks.length === 0) {
        elements.favoritesEmpty.textContent = "Guarde livros no relic\u00E1rio para montar sua trilha pessoal neste dispositivo.";
        return;
    }

    hydrateBookImages(elements.favoritesGrid);
    syncFavoriteButtons();
};

const syncFilterChips = () => {
    elements.filtersGrid.querySelectorAll("[data-filter-group][data-filter-value]").forEach((button) => {
        const isActive = state.filters[button.dataset.filterGroup] === button.dataset.filterValue;
        button.classList.toggle("is-active", isActive);
    });
};

const renderFilterSummary = () => {
    const activeLabels = advancedFilters
        .filter((group) => state.filters[group.id] !== group.defaultValue)
        .map((group) => `${group.label}: ${humanFilterLabel(group.id, state.filters[group.id])}`);

    elements.filterSummary.textContent = activeLabels.length > 0
        ? activeLabels.join(" | ")
        : "Nenhum filtro extra ativo.";
};

const syncAuthorSelection = () => {
    elements.authorsGrid.querySelectorAll("[data-author-id]").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.authorId === state.activeAuthorId);
    });
};

const syncAffinityChoices = () => {
    elements.affinityQuestions.querySelectorAll(".affinity-choice").forEach((button) => {
        const isSelected = state.affinityAnswers.get(button.dataset.questionId) === button.dataset.optionValue;
        button.classList.toggle("is-selected", isSelected);
    });

    elements.affinityProgress.textContent = `${state.affinityAnswers.size}/${affinityQuestions.length} respostas escolhidas`;
};

const renderAffinityMap = (scoreMap = new Map()) => {
    const scores = readingPaths.map((path) => ({
        ...path,
        score: scoreMap.get(path.id) || 0
    }));
    const maxScore = Math.max(...scores.map((entry) => entry.score), 1);

    elements.affinityMap.innerHTML = scores.map((entry) => {
        const fill = entry.score > 0 ? `${Math.max(14, (entry.score / maxScore) * 100)}%` : "6%";

        return `
            <article class="affinity-lane">
                <div class="affinity-lane-head">
                    <strong>${escapeHtml(entry.name)}</strong>
                    <span>${escapeHtml(entry.score)} pontos</span>
                </div>
                <div class="affinity-track">
                    <div class="affinity-fill" style="--fill: ${fill}; --accent: ${escapeHtml(entry.accent)};"></div>
                </div>
            </article>
        `;
    }).join("");
};

const updatePurchasePanel = (bookInput) => {
    const book = normalizeBook(bookInput);
    state.currentBookId = book.id;

    elements.purchaseTitle.textContent = book.title;
    elements.purchaseOriginal.textContent = book.originalTitle
        ? `T\u00EDtulo original: ${book.originalTitle}`
        : "T\u00EDtulo exibido como veio do acervo.";
    elements.purchaseMeta.textContent = `${book.author} | ${book.year}`;
    elements.purchaseDescription.textContent = book.description;
    elements.purchaseCover.alt = `Capa de ${book.title}`;
    applyBookCover(elements.purchaseCover, book);
    elements.purchaseLink.href = book.purchaseUrl || "#compra";
    elements.purchaseLink.setAttribute("aria-disabled", String(!book.purchaseUrl || book.purchaseUrl === "#compra"));
    elements.purchaseWhyRead.textContent = book.whyRead;
    elements.purchaseReaderProfile.textContent = book.readerProfile;
    elements.purchaseAuthorNote.textContent = book.authorNote;
    elements.purchaseHint.textContent = `Quando o link real de ${book.title} estiver pronto, basta trocar o destino deste bot\u00E3o.`;
    elements.purchaseSignalRow.innerHTML = [
        book.aura,
        book.difficulty,
        climaLabel(book.filters.clima),
        motifLabel(book.filters.motivo)
    ].map((chip) => `<span class="book-chip">${escapeHtml(chip)}</span>`).join("");
    elements.purchaseDossierGrid.innerHTML = `
        <div class="mini-panel">
            <strong>Clima</strong>
            <p>${escapeHtml(book.aura)}</p>
        </div>
        <div class="mini-panel">
            <strong>N\u00EDvel de leitura</strong>
            <p>${escapeHtml(book.difficulty)}</p>
        </div>
        <div class="mini-panel">
            <strong>Temas</strong>
            <p>${escapeHtml(book.themes.join(", "))}</p>
        </div>
        <div class="mini-panel">
            <strong>Motivo central</strong>
            <p>${escapeHtml(motifLabel(book.filters.motivo))}</p>
        </div>
    `;
    syncFavoriteButtons();
};

const renderResults = () => {
    if (state.visibleBooks.length === 0) {
        elements.resultsGrid.innerHTML = `
            <article class="result-card">
                <div class="book-card-link">
                    <div class="book-copy">
                        <h3>Nenhum livro apareceu com essa combinacao</h3>
                        <p class="book-description">Tente limpar os filtros ou mudar a busca para revelar outras trilhas do acervo.</p>
                    </div>
                </div>
            </article>
        `;
        syncFavoriteButtons();
        return;
    }

    elements.resultsGrid.innerHTML = state.visibleBooks.map(buildResultMarkup).join("");
    hydrateBookImages(elements.resultsGrid);
    syncFavoriteButtons();
};

const renderAffinityRecommendation = () => {
    if (state.affinityAnswers.size < affinityQuestions.length) {
        elements.affinityResult.dataset.state = "idle";
        elements.affinityResultName.textContent = "Responda as quatro perguntas";
        elements.affinityResultDescription.textContent = "O Or\u00E1culo de Afinidade vai sugerir uma trilha de leitura coerente com seu gosto.";
        elements.affinityResultReason.textContent = "Escolha um portal, um ritmo, uma forma de magia e uma paisagem.";
        elements.affinityResultAlt.textContent = "Se houver uma segunda trilha compativel, ela aparece aqui como caminho complementar.";
        elements.affinityResultBooks.innerHTML = "";
        elements.affinityExplore.disabled = true;
        renderAffinityMap();
        return;
    }

    const recommendation = recommendFromAnswers({
        answers: state.affinityAnswers,
        questions: affinityQuestions,
        paths: readingPaths
    });

    const recommendedBooks = recommendation.bestPath.bookIds
        .map((bookId) => getRegisteredBook(bookId))
        .filter(Boolean);

    elements.affinityResult.dataset.state = "ready";
    elements.affinityResultName.textContent = recommendation.bestPath.name;
    elements.affinityResultDescription.textContent = recommendation.bestPath.description;
    elements.affinityResultReason.textContent = `O Or\u00E1culo aproximou voc\u00EA de ${recommendation.chosenOptions.map((option) => option.label).join(", ")}.`;
    elements.affinityResultAlt.textContent = recommendation.runnerUp
        ? `Se quiser um segundo caminho sem perder o clima principal, experimente tamb\u00E9m ${recommendation.runnerUp.name.toLowerCase()}.`
        : "Esta leitura ficou bem definida; o Or\u00E1culo n\u00E3o encontrou uma segunda trilha t\u00E3o forte quanto a principal.";
    elements.affinityResultBooks.innerHTML = recommendedBooks.map(buildAffinityBookMarkup).join("");
    elements.affinityExplore.disabled = false;
    elements.affinityExplore.dataset.query = recommendation.bestPath.focusQuery;
    elements.affinityExplore.dataset.label = recommendation.bestPath.focusLabel;
    elements.affinityExplore.textContent = `Explorar ${recommendation.bestPath.focusLabel}`;
    renderAffinityMap(recommendation.scoreMap);
};

const applyActiveFilters = (books) => {
    return books.filter((book) => {
        return advancedFilters.every((group) => {
            const selectedValue = state.filters[group.id];

            if (selectedValue === group.defaultValue) {
                return true;
            }

            return book.filters?.[group.id] === selectedValue;
        });
    });
};

const updateStatus = ({ loading = false, error = "" } = {}) => {
    elements.submitButton.disabled = loading;
    elements.loadMoreButton.disabled = loading;

    if (loading) {
        elements.status.textContent = "O Or\u00E1culo est\u00E1 consultando o acervo dos reinos...";
        elements.loadMoreButton.hidden = true;
        return;
    }

    if (error) {
        elements.status.textContent = error;
        elements.loadMoreButton.hidden = true;
        return;
    }

    if (state.rawResultBooks.length === 0) {
        elements.status.textContent = "Nenhuma obra atravessou o veu dessa busca. Tente outro termo ou um tema sugerido.";
        elements.loadMoreButton.hidden = true;
        return;
    }

    if (state.visibleBooks.length === 0) {
        elements.status.textContent = `Ha ${state.rawResultBooks.length} obras carregadas para esta busca, mas nenhuma passou pelos filtros atuais.`;
        elements.loadMoreButton.hidden = state.rawResultBooks.length >= state.total;
        return;
    }

    if (state.lastSource === "offline-db") {
        elements.status.textContent = `Sem rede, mas o bosque revelou ${state.visibleBooks.length} livros guardados neste dispositivo a partir do banco local.`;
        elements.loadMoreButton.hidden = true;
        return;
    }

    elements.status.textContent = `O Or\u00E1culo revelou ${state.visibleBooks.length} livros visiveis a partir de ${state.rawResultBooks.length} carregados nesta rodada.`;
    elements.loadMoreButton.hidden = state.rawResultBooks.length >= state.total;
};

const syncQueryUrl = () => {
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("busca", state.query);
    history.replaceState({}, "", nextUrl);
};

const prettyQuery = (query) => {
    return (query || DEFAULT_QUERY)
        .replace(/^"+|"+$/g, "")
        .replace(/subject:/g, "")
        .replace(/subject_key:/g, "")
        .replace(/-/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const resolveThemeByQuery = (query) => {
    return topicThemes.find((topic) => topic.query === query) || null;
};

const setActiveTheme = (label, query, { syncInput = false } = {}) => {
    state.activeLabel = label || prettyQuery(query);
    elements.activeTheme.textContent = state.activeLabel;

    if (syncInput) {
        elements.searchInput.value = state.activeLabel;
        elements.searchInput.dataset.displayLabel = state.activeLabel;
        elements.searchInput.dataset.searchQuery = query;
    }

    document.querySelectorAll(".theme-card").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.query === query);
    });
};

const resolveInputQuery = () => {
    const typedValue = elements.searchInput.value.trim();
    const storedLabel = elements.searchInput.dataset.displayLabel || "";
    const storedQuery = elements.searchInput.dataset.searchQuery || "";

    if (typedValue && storedQuery && typedValue === storedLabel) {
        return { query: storedQuery, label: storedLabel };
    }

    if (!typedValue) {
        return { query: DEFAULT_QUERY, label: DEFAULT_LABEL };
    }

    return { query: typedValue, label: prettyQuery(typedValue) };
};

const applyFiltersAndRender = () => {
    state.visibleBooks = applyActiveFilters(state.rawResultBooks);
    renderResults();
    updateStatus();
    renderFilterSummary();
    syncFilterChips();
};

const runSearch = async ({ query, append = false, page = 1, label } = {}) => {
    if (state.controller) {
        state.controller.abort();
    }

    state.controller = new AbortController();
    updateStatus({ loading: true });

    try {
        const result = await api.searchBooks({
            query,
            page,
            limit: RESULTS_PER_PAGE,
            signal: state.controller.signal
        });

        const nextBooks = result.books.map(normalizeBook);
        registerBooks(nextBooks);
        state.query = query;
        state.page = page;
        state.total = result.total;
        state.lastSource = result.source || "remote";
        state.rawResultBooks = append ? [...state.rawResultBooks, ...nextBooks] : nextBooks;

        setActiveTheme(label || prettyQuery(query), query, { syncInput: !append });
        applyFiltersAndRender();
        renderFavorites();
        syncQueryUrl();

        if (!append) {
            state.recentQueries = await api.pushRecentQuery({
                query,
                label: label || prettyQuery(query)
            }).catch(() => state.recentQueries);
            renderRecentQueries();
        }

        scheduleUiStateSave();
    } catch (error) {
        if (error.name === "AbortError") {
            return;
        }

        updateStatus({ error: "O acervo nao respondeu agora. Tente novamente em alguns instantes." });
    }
};

const selectBookById = (id) => {
    const selectedBook = getRegisteredBook(id);

    if (selectedBook) {
        updatePurchasePanel(selectedBook);
    }
};

const scrollToSection = (section) => {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
};

const scheduleCatalogWarmup = (callback) => {
    if ("requestIdleCallback" in window) {
        window.requestIdleCallback(callback, { timeout: 900 });
        return;
    }

    window.setTimeout(callback, 180);
};

const initSearchInteractions = () => {
    elements.searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const { query, label } = resolveInputQuery();
        runSearch({ query, page: 1, append: false, label });
    });

    elements.searchInput.addEventListener("input", (event) => {
        clearTimeout(state.debounceTimer);

        const typedValue = event.target.value.trim();
        elements.searchInput.dataset.displayLabel = typedValue;
        elements.searchInput.dataset.searchQuery = typedValue;

        if (typedValue.length > 0 && typedValue.length < 3) {
            elements.activeTheme.textContent = "Digite pelo menos tres letras para pesquisar";
            return;
        }

        state.debounceTimer = window.setTimeout(() => {
            const nextQuery = typedValue || DEFAULT_QUERY;
            const nextLabel = typedValue ? prettyQuery(typedValue) : DEFAULT_LABEL;
            runSearch({ query: nextQuery, page: 1, append: false, label: nextLabel });
        }, 500);
    });

    elements.topicsGrid.addEventListener("click", (event) => {
        const button = event.target.closest("[data-query]");

        if (!button) {
            return;
        }

        const { query, label } = button.dataset;
        setActiveTheme(label, query, { syncInput: true });
        runSearch({ query, page: 1, append: false, label });
        scrollToSection(elements.oraculoSection);
    });

    elements.loadMoreButton.addEventListener("click", () => {
        runSearch({ query: state.query, page: state.page + 1, append: true, label: state.activeLabel });
    });
};

const initFilterInteractions = () => {
    elements.filtersGrid.addEventListener("click", (event) => {
        const button = event.target.closest("[data-filter-group][data-filter-value]");

        if (!button) {
            return;
        }

        state.filters[button.dataset.filterGroup] = button.dataset.filterValue;
        applyFiltersAndRender();
        scheduleUiStateSave();
    });

    elements.clearFilters.addEventListener("click", () => {
        state.filters = { ...defaultFilters };
        applyFiltersAndRender();
        scheduleUiStateSave();
    });
};

const initGlossaryInteractions = () => {
    elements.glossarySearch.addEventListener("input", (event) => {
        state.glossaryQuery = event.target.value || "";
        renderGlossary();
        scheduleUiStateSave();
    });
};

const initAuthorInteractions = () => {
    elements.authorsGrid.addEventListener("click", (event) => {
        const button = event.target.closest("[data-author-id]");

        if (!button) {
            return;
        }

        state.activeAuthorId = button.dataset.authorId;
        syncAuthorSelection();
        renderAuthorFocus();
        scheduleUiStateSave();
    });
};

const initAffinityInteractions = () => {
    elements.affinityQuestions.addEventListener("click", (event) => {
        const button = event.target.closest("[data-question-id][data-option-value]");

        if (!button) {
            return;
        }

        state.affinityAnswers.set(button.dataset.questionId, button.dataset.optionValue);
        syncAffinityChoices();
        scheduleUiStateSave();
    });

    elements.affinitySubmit.addEventListener("click", () => {
        renderAffinityRecommendation();
        scheduleUiStateSave();
    });

    elements.affinityReset.addEventListener("click", () => {
        state.affinityAnswers.clear();
        syncAffinityChoices();
        renderAffinityRecommendation();
        scheduleUiStateSave();
    });

    elements.affinityExplore.addEventListener("click", () => {
        const { query, label } = elements.affinityExplore.dataset;

        if (!query || !label) {
            return;
        }

        setActiveTheme(label, query, { syncInput: true });
        runSearch({ query, page: 1, append: false, label });
        scrollToSection(elements.oraculoSection);
    });
};

const initRecentInteractions = () => {
    elements.recentQueries.addEventListener("click", (event) => {
        const button = event.target.closest("[data-recent-query][data-recent-label]");

        if (!button) {
            return;
        }

        const { recentQuery, recentLabel } = button.dataset;
        setActiveTheme(recentLabel, recentQuery, { syncInput: true });
        runSearch({ query: recentQuery, page: 1, append: false, label: recentLabel });
        scrollToSection(elements.oraculoSection);
    });
};

const initGlobalBookClicks = () => {
    document.body.addEventListener("click", (event) => {
        const saveButton = event.target.closest("[data-book-save]");

        if (saveButton) {
            const { bookSave } = saveButton.dataset;
            api.toggleFavorite(bookSave)
                .then((favorites) => {
                    state.favorites = favorites;
                    syncFavoriteButtons();
                    renderFavorites();
                })
                .catch(() => null);
            return;
        }

        const link = event.target.closest(".js-book-link");

        if (!link) {
            return;
        }

        const { bookId } = link.dataset;
        selectBookById(bookId);
        scrollToSection(elements.compraSection);
    });

    elements.purchaseSave.addEventListener("click", () => {
        if (!state.currentBookId) {
            return;
        }

        api.toggleFavorite(state.currentBookId)
            .then((favorites) => {
                state.favorites = favorites;
                syncFavoriteButtons();
                renderFavorites();
            })
            .catch(() => null);
    });
};

const init = async () => {
    await api.primeStaticCollections({
        books: featuredBooks,
        authors: authorsCatalog,
        glossary: glossaryTerms
    }).catch(() => null);

    const [savedUiState, savedFavorites, savedRecentQueries] = await Promise.all([
        api.loadUiState().catch(() => null),
        api.getFavorites().catch(() => []),
        api.getRecentQueries().catch(() => [])
    ]);

    hydrateSavedState(savedUiState);
    state.favorites = savedFavorites;
    state.recentQueries = savedRecentQueries;

    renderCuratedShelf();
    renderTopics();
    renderAuthors();
    elements.glossarySearch.value = state.glossaryQuery;
    renderGlossary();
    renderFilters();
    renderRecentQueries();
    renderFavorites();
    renderAffinityQuestions();
    syncAffinityChoices();
    renderAffinityRecommendation();
    initAuthorInteractions();
    initGlossaryInteractions();
    initAffinityInteractions();
    initSearchInteractions();
    initFilterInteractions();
    initRecentInteractions();
    initGlobalBookClicks();
    updatePurchasePanel(featuredBooks[0]);

    const queryFromUrl = new URLSearchParams(window.location.search).get("busca")
        || savedUiState?.query
        || DEFAULT_QUERY;
    const matchedTheme = resolveThemeByQuery(queryFromUrl);
    const initialLabel = matchedTheme?.label || savedUiState?.activeLabel || prettyQuery(queryFromUrl) || DEFAULT_LABEL;

    setActiveTheme(initialLabel, queryFromUrl, { syncInput: true });
    scheduleCatalogWarmup(() => {
        runSearch({ query: queryFromUrl, page: 1, append: false, label: initialLabel });
    });
};

const bootstrap = async () => {
    try {
        await init();
    } catch (error) {
        console.error("Falha ao inicializar a pagina:", error);
        elements.status.textContent = "A pagina carregou parcialmente. Recarregue em alguns instantes para tentar novamente.";
    }
};

bootstrap();
