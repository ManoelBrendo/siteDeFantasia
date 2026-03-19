import { initAudioPlayer } from "./audio-player.js";
import { OpenLibraryCatalogApi } from "./open-library-api.js";

const api = new OpenLibraryCatalogApi();
const DEFAULT_QUERY = "subject:fantasy";
const DEFAULT_LABEL = "Espadas e reinos";
const RESULTS_PER_PAGE = 9;

const featuredBooks = [
    {
        id: "elfland",
        title: "A Filha do Rei de Elfland",
        originalTitle: "The King of Elfland's Daughter",
        author: "Lord Dunsany",
        year: "1924",
        cover: "https://commons.wikimedia.org/wiki/Special:FilePath/The%20Hunting%20of%20the%20Unicorn%20by%20Samuel%20Simes%2C%20Frontispiece%20to%20The%20King%20of%20Elfland%27s%20Daughter.png?width=720",
        description: "Quando um reino humano exige um toque de magia, o príncipe Alveric parte para Elfland e traz de lá a filha do rei. O encontro entre os dois abala as fronteiras entre a vida comum e um mundo feérico que não segue o tempo dos homens.",
        aura: "Feérico, régio e melancólico"
    },
    {
        id: "phantastes",
        title: "Fantastes",
        originalTitle: "Phantastes",
        author: "George MacDonald",
        year: "1858",
        cover: "https://commons.wikimedia.org/wiki/Special:FilePath/Phantastes%20Title%20Page%201894.jpg?width=720",
        description: "Depois de herdar uma chave misteriosa, Anodos desperta em uma terra encantada e atravessa florestas, palácios e provações interiores. A trama funciona como viagem espiritual e conto de maravilhamento ao mesmo tempo.",
        aura: "Onírico, simbólico e iniciático"
    },
    {
        id: "princesa-goblin",
        title: "A Princesa e o Goblin",
        originalTitle: "The Princess and the Goblin",
        author: "George MacDonald",
        year: "1872",
        cover: "https://commons.wikimedia.org/wiki/Special:FilePath/Princess%20and%20the%20Goblin.jpg?width=720",
        description: "A pequena princesa Irene vive em um castelo ameaçado por goblins escondidos no subterrâneo. Com a ajuda de Curdie, ela precisa enfrentar perigos, descobrir passagens ocultas e confiar em uma proteção misteriosa que paira sobre o reino.",
        aura: "Acolhedor, medieval e aventureiro"
    },
    {
        id: "well-world-end",
        title: "O Poço no Fim do Mundo",
        originalTitle: "The Well at the World's End",
        author: "William Morris",
        year: "1896",
        cover: "https://commons.wikimedia.org/wiki/Special:FilePath/The%20Well%20at%20the%20World%27s%20End%2C%20design%20by%20William%20Morris%2C%20Hammersmith%2C%20Kelmscott%20Press%2C%201896%20-%20National%20Gallery%20of%20Art%2C%20Washington%20-%20DSC09794.JPG?width=720",
        description: "Ralph deixa o conforto do lar para procurar um poço lendário ligado à fortuna e ao destino. A jornada o leva por estradas, cortes, combates e encontros que transformam a busca em um romance de formação cavaleiresca.",
        aura: "Cavaleiresco, antigo e cerimonial"
    }
];

const topicThemes = [
    { label: "Elfos e feéria", query: "elves fantasy", description: "Cortes feéricas, bosques e reinos encantados." },
    { label: "Mitologia celta", query: "\"celtic mythology\" fantasy", description: "Sidhe, druidas, símbolos e velhas lendas." },
    { label: "Lendas arturianas", query: "\"arthurian romance\"", description: "Camelot, Avalon e relíquias do reino." },
    { label: "Espadas e reinos", query: "subject:fantasy", description: "Jornadas, heróis e paisagens de saga." },
    { label: "Magia e feitiçaria", query: "\"magic fantasy\"", description: "Feitiços, grimórios e aprendizes do arcano." },
    { label: "Dragões e criaturas", query: "\"dragons fantasy\"", description: "Bestiários, monstros e fôlego antigo." },
    { label: "Bosques encantados", query: "\"fairy tales\" forest", description: "Trilhas verdes e maravilhas do mato." },
    { label: "Castelos medievais", query: "\"medieval fantasy\"", description: "Pedra, brasões e ecos de corte." }
];

const elements = {
    curatedGrid: document.getElementById("curated-grid"),
    topicsGrid: document.getElementById("topics-grid"),
    searchForm: document.getElementById("catalog-search-form"),
    searchInput: document.getElementById("catalog-search"),
    submitButton: document.getElementById("catalog-submit"),
    status: document.getElementById("catalog-status"),
    resultsGrid: document.getElementById("results-grid"),
    loadMoreButton: document.getElementById("catalog-load-more"),
    activeTheme: document.getElementById("active-theme"),
    purchaseTitle: document.getElementById("purchase-title"),
    purchaseOriginal: document.getElementById("purchase-original"),
    purchaseMeta: document.getElementById("purchase-meta"),
    purchaseDescription: document.getElementById("purchase-description"),
    purchaseCover: document.getElementById("purchase-cover"),
    purchaseLink: document.getElementById("purchase-link"),
    purchaseHint: document.getElementById("purchase-hint")
};

const state = {
    query: DEFAULT_QUERY,
    page: 1,
    total: 0,
    controller: null,
    debounceTimer: null,
    resultBooks: [],
    registry: new Map(),
    activeLabel: DEFAULT_LABEL
};

const registerBooks = (books) => {
    books.forEach((book) => {
        state.registry.set(book.id, book);
    });
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
        const book = state.registry.get(image.dataset.bookCoverId);

        if (!book) {
            return;
        }

        applyBookCover(image, book);
    });
};

const buildCuratedMarkup = (book) => `
    <article class="featured-card">
        <a class="book-card-link js-book-link" href="#compra" data-book-id="${book.id}" aria-label="Abrir o portal de compra para ${book.title}">
            <div class="book-cover-shell">
                <img data-book-cover-id="${book.id}" src="${book.cover}" alt="Capa de ${book.title}" loading="lazy" decoding="async">
            </div>
            <div class="book-copy">
                <span class="book-ribbon">${book.aura}</span>
                <h3>${book.title}</h3>
                <p class="book-original">${book.originalTitle}</p>
                <p class="book-description">${book.description}</p>
                <div class="book-meta">
                    <span>${book.author}</span>
                    <span>${book.year}</span>
                </div>
            </div>
        </a>
    </article>
`;

const buildTopicMarkup = (topic) => `
    <button class="theme-card" type="button" data-query="${topic.query}" data-label="${topic.label}">
        <strong>${topic.label}</strong>
        <span>${topic.description}</span>
    </button>
`;

const buildResultMarkup = (book) => `
    <article class="result-card">
        <a class="book-card-link js-book-link" href="#compra" data-book-id="${book.id}" aria-label="Abrir o portal de compra para ${book.title}">
            <div class="book-cover-shell">
                <img data-book-cover-id="${book.id}" src="${book.cover}" alt="Capa de ${book.title}" loading="lazy" decoding="async">
            </div>
            <div class="book-copy">
                <h3>${book.title}</h3>
                <p class="book-author">${book.author}</p>
                <p class="book-description">${book.description}</p>
                <div class="book-meta">
                    <span>${book.year}</span>
                    <span>${book.editionCount ? `${book.editionCount} edições` : "Acervo geral"}</span>
                </div>
            </div>
        </a>
    </article>
`;

const renderCuratedShelf = () => {
    registerBooks(featuredBooks);
    elements.curatedGrid.innerHTML = featuredBooks.map(buildCuratedMarkup).join("");
    hydrateBookImages(elements.curatedGrid);
};

const renderTopics = () => {
    elements.topicsGrid.innerHTML = topicThemes.map(buildTopicMarkup).join("");
};

const updatePurchasePanel = (book) => {
    elements.purchaseTitle.textContent = book.title;
    elements.purchaseOriginal.textContent = book.originalTitle
        ? `Título original: ${book.originalTitle}`
        : "Título exibido como veio do acervo.";
    elements.purchaseMeta.textContent = `${book.author} · ${book.year}`;
    elements.purchaseDescription.textContent = book.description;
    elements.purchaseCover.alt = `Capa de ${book.title}`;
    applyBookCover(elements.purchaseCover, book);
    elements.purchaseLink.href = book.purchaseUrl || "#compra";
    elements.purchaseLink.setAttribute("aria-disabled", String(!book.purchaseUrl || book.purchaseUrl === "#compra"));
    elements.purchaseHint.textContent = `O link final de compra de ${book.title} pode ser conectado depois sem alterar o restante da vitrine.`;
};

const renderResults = () => {
    elements.resultsGrid.innerHTML = state.resultBooks.map(buildResultMarkup).join("");
    hydrateBookImages(elements.resultsGrid);
};

const updateStatus = ({ loading = false, error = "", empty = false } = {}) => {
    elements.submitButton.disabled = loading;
    elements.loadMoreButton.disabled = loading;

    if (loading) {
        elements.status.textContent = "O oráculo está consultando o acervo dos reinos...";
        elements.loadMoreButton.hidden = true;
        return;
    }

    if (error) {
        elements.status.textContent = error;
        elements.loadMoreButton.hidden = true;
        return;
    }

    if (empty) {
        elements.status.textContent = "Nenhuma obra atravessou o véu dessa busca. Tente outro termo ou um tema sugerido.";
        elements.loadMoreButton.hidden = true;
        return;
    }

    elements.status.textContent = `O oráculo revelou ${state.resultBooks.length} de ${state.total.toLocaleString("pt-BR")} registros.`;
    elements.loadMoreButton.hidden = state.resultBooks.length >= state.total;
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

        state.query = query;
        state.page = page;
        state.total = result.total;
        state.resultBooks = append ? [...state.resultBooks, ...result.books] : result.books;
        registerBooks(result.books);

        setActiveTheme(label || prettyQuery(query), query, { syncInput: !append });
        renderResults();
        updateStatus({ empty: state.resultBooks.length === 0 });
        syncQueryUrl();
    } catch (error) {
        if (error.name === "AbortError") {
            return;
        }

        updateStatus({ error: "O acervo não respondeu agora. Tente novamente em alguns instantes." });
    }
};

const selectBookById = (id) => {
    const selectedBook = state.registry.get(id);

    if (!selectedBook) {
        return;
    }

    updatePurchasePanel(selectedBook);
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
            elements.activeTheme.textContent = "Digite mais um pouco para consultar o acervo";
            return;
        }

        state.debounceTimer = window.setTimeout(() => {
            const nextQuery = typedValue || DEFAULT_QUERY;
            const nextLabel = typedValue ? prettyQuery(typedValue) : DEFAULT_LABEL;
            runSearch({ query: nextQuery, page: 1, append: false, label: nextLabel });
        }, 550);
    });

    elements.topicsGrid.addEventListener("click", (event) => {
        const button = event.target.closest("[data-query]");

        if (!button) {
            return;
        }

        const { query, label } = button.dataset;
        setActiveTheme(label, query, { syncInput: true });
        runSearch({ query, page: 1, append: false, label });
        document.getElementById("oraculo").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    document.body.addEventListener("click", (event) => {
        const link = event.target.closest(".js-book-link");

        if (!link) {
            return;
        }

        const { bookId } = link.dataset;
        selectBookById(bookId);
        document.getElementById("compra").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    elements.loadMoreButton.addEventListener("click", () => {
        runSearch({ query: state.query, page: state.page + 1, append: true, label: state.activeLabel });
    });
};

const init = async () => {
    renderCuratedShelf();
    renderTopics();
    initAudioPlayer();
    initSearchInteractions();
    updatePurchasePanel(featuredBooks[0]);

    const queryFromUrl = new URLSearchParams(window.location.search).get("busca") || DEFAULT_QUERY;
    const matchedTheme = resolveThemeByQuery(queryFromUrl);
    const initialLabel = matchedTheme?.label || prettyQuery(queryFromUrl) || DEFAULT_LABEL;

    setActiveTheme(initialLabel, queryFromUrl, { syncInput: true });
    await runSearch({ query: queryFromUrl, page: 1, append: false, label: initialLabel });
};

const bootstrap = async () => {
    try {
        await init();
    } catch (error) {
        initAudioPlayer();
        console.error("Falha ao inicializar a página:", error);

        if (elements.status) {
            elements.status.textContent = "A página carregou parcialmente. A trilha sonora continua disponível, mas o acervo precisa ser recarregado.";
        }
    }
};

bootstrap();
