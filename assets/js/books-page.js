import { BosqueCatalogApi } from "../../catalog-api.js";
import { DEFAULT_LABEL, DEFAULT_QUERY, RESULTS_PER_PAGE, featuredBooks, topicThemes } from "../../site-data.js";

const api = new BosqueCatalogApi();
const SELECTED_BOOK_KEY = "bosque-selected-book";

const getElement = (id) => {
    const element = document.getElementById(id);

    if (!element) {
        throw new Error(`Elemento obrigatorio ausente: #${id}`);
    }

    return element;
};

const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const elements = {
    title: getElement("catalog-title"),
    summary: getElement("catalog-summary"),
    topicsGrid: getElement("topics-grid"),
    searchForm: getElement("catalog-search-form"),
    searchInput: getElement("catalog-search"),
    status: getElement("catalog-status"),
    resultsGrid: getElement("results-grid"),
    loadMoreButton: getElement("catalog-load-more")
};

const params = new URLSearchParams(window.location.search);
const state = {
    query: params.get("q") || DEFAULT_QUERY,
    label: params.get("tema") || DEFAULT_LABEL,
    publicOnly: params.get("dominio") === "1",
    page: 1,
    total: 0,
    books: [],
    controller: null
};

const getBookCoverSources = (book) => {
    const sources = Array.isArray(book.coverCandidates) && book.coverCandidates.length > 0
        ? [...book.coverCandidates, book.cover]
        : [book.cover];

    return [...new Set(sources.filter(Boolean))];
};

const applyBookCover = (image, book) => {
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

const sortBooksByTitle = (books) => {
    return [...books].sort((firstBook, secondBook) => {
        return firstBook.title.localeCompare(secondBook.title, "pt-BR", { sensitivity: "base" });
    });
};

const buildTopicMarkup = (topic) => `
    <button class="topic-card" type="button" data-query="${escapeHtml(topic.query)}" data-label="${escapeHtml(topic.label)}" data-public-domain="${topic.publicDomain ? "true" : "false"}">
        <strong>${escapeHtml(topic.label)}</strong>
        <span>${escapeHtml(topic.description)}</span>
    </button>
`;

const buildBookMarkup = (book) => `
    <article class="book-card">
        <a class="book-link js-book-link" href="compra.html?book=${encodeURIComponent(book.id)}" data-book-id="${escapeHtml(book.id)}" aria-label="Abrir detalhes de ${escapeHtml(book.title)}">
            <div class="book-cover-shell">
                <img data-book-cover-id="${escapeHtml(book.id)}" src="${escapeHtml(book.cover)}" alt="Capa de ${escapeHtml(book.title)}" loading="lazy" decoding="async">
            </div>
            <div class="book-copy">
                <h3>${escapeHtml(book.title)}</h3>
                <p class="book-author">${escapeHtml(book.author)}</p>
                <p class="book-description">${escapeHtml(book.description)}</p>
                <div class="book-meta">
                    <span>${escapeHtml(book.year)}</span>
                    <span>${book.publicDomain ? "Leitura pública" : "Acervo geral"}</span>
                    <span>${book.editionCount ? `${escapeHtml(book.editionCount)} edições` : "Catálogo aberto"}</span>
                </div>
            </div>
        </a>
    </article>
`;

const hydrateImages = () => {
    elements.resultsGrid.querySelectorAll("[data-book-cover-id]").forEach((image) => {
        const book = state.books.find((entry) => entry.id === image.dataset.bookCoverId);

        if (book) {
            applyBookCover(image, book);
        }
    });
};

const persistSelectedBook = (book) => {
    try {
        sessionStorage.setItem(SELECTED_BOOK_KEY, JSON.stringify(book));
    } catch {
        // O link com query string ainda permite abrir a pagina de compra.
    }
};

const renderResults = () => {
    elements.resultsGrid.innerHTML = state.books.map(buildBookMarkup).join("");
    hydrateImages();

    elements.resultsGrid.querySelectorAll(".js-book-link").forEach((link) => {
        link.addEventListener("click", () => {
            const book = state.books.find((entry) => entry.id === link.dataset.bookId);

            if (book) {
                persistSelectedBook(book);
            }
        });
    });
};

const syncHeader = () => {
    elements.title.textContent = state.label;
    elements.summary.textContent = state.publicOnly
        ? `Pesquisa ativa: ${state.query}. Mostrando obras com leitura pública quando a Open Library informa essa disponibilidade.`
        : `Pesquisa ativa: ${state.query}. Escolha um livro para abrir a ficha de compra placeholder.`;
    elements.searchInput.value = state.query;
};

const searchBooks = async ({ append = false } = {}) => {
    state.controller?.abort();
    state.controller = new AbortController();

    elements.loadMoreButton.hidden = true;
    elements.status.textContent = append ? "Carregando mais livros..." : "Buscando livros no acervo...";

    try {
        const searchMethod = state.publicOnly ? "searchPublicDomainBooks" : "searchBooks";
        const result = await api[searchMethod]({
            query: state.query,
            page: state.page,
            limit: RESULTS_PER_PAGE,
            signal: state.controller.signal
        });

        state.total = result.total || 0;
        state.books = sortBooksByTitle(append ? [...state.books, ...result.books] : result.books);

        renderResults();
        syncHeader();

        const shown = state.books.length;
        elements.status.textContent = shown > 0
            ? `${shown} de ${state.total || shown} livros encontrados para "${state.label}".`
            : "Nenhum livro encontrado agora. Tente outro termo ou tema.";
        elements.loadMoreButton.hidden = shown === 0 || shown >= state.total;
    } catch (error) {
        if (error.name === "AbortError") {
            return;
        }

        state.books = sortBooksByTitle(append ? state.books : featuredBooks);
        renderResults();
        elements.status.textContent = "Nao foi possivel buscar online agora. Mostrando a curadoria local.";
        elements.loadMoreButton.hidden = true;
    }
};

const setTopic = (query, label) => {
    state.query = query || DEFAULT_QUERY;
    state.label = label || query || DEFAULT_LABEL;
    state.publicOnly = false;
    state.page = 1;
    state.books = [];
    window.history.replaceState(null, "", `livros.html?q=${encodeURIComponent(state.query)}&tema=${encodeURIComponent(state.label)}`);
    searchBooks();
};

const setPublicDomain = () => {
    state.query = DEFAULT_QUERY;
    state.label = "Domínio público";
    state.publicOnly = true;
    state.page = 1;
    state.books = [];
    window.history.replaceState(null, "", `livros.html?q=${encodeURIComponent(state.query)}&tema=${encodeURIComponent(state.label)}&dominio=1`);
    searchBooks();
};

const init = () => {
    elements.topicsGrid.innerHTML = topicThemes.map(buildTopicMarkup).join("");
    elements.topicsGrid.addEventListener("click", (event) => {
        const button = event.target.closest(".topic-card");

        if (button) {
            if (button.dataset.publicDomain === "true") {
                setPublicDomain();
                return;
            }

            setTopic(button.dataset.query, button.dataset.label);
        }
    });

    elements.searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const query = elements.searchInput.value.trim();

        if (query) {
            setTopic(query, query);
        }
    });

    elements.loadMoreButton.addEventListener("click", () => {
        state.page += 1;
        searchBooks({ append: true });
    });

    syncHeader();
    searchBooks();
};

init();
