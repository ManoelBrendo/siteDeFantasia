import { featuredBooks } from "../../site-data.js";

const SELECTED_BOOK_KEY = "bosque-selected-book";

const getElement = (id) => {
    const element = document.getElementById(id);

    if (!element) {
        throw new Error(`Elemento obrigatorio ausente: #${id}`);
    }

    return element;
};

const elements = {
    cover: getElement("purchase-cover"),
    title: getElement("purchase-title"),
    meta: getElement("purchase-meta"),
    note: getElement("purchase-note"),
    back: getElement("purchase-back")
};

const getStoredBook = () => {
    try {
        const storedBook = JSON.parse(sessionStorage.getItem(SELECTED_BOOK_KEY) || "null");

        if (storedBook && typeof storedBook === "object") {
            return storedBook;
        }
    } catch {
        return null;
    }

    return null;
};

const getFallbackBook = () => {
    const bookId = new URLSearchParams(window.location.search).get("book");
    return featuredBooks.find((book) => book.id === bookId) || featuredBooks[0];
};

const getBookCoverSources = (book) => {
    const sources = Array.isArray(book.coverCandidates) && book.coverCandidates.length > 0
        ? [...book.coverCandidates, book.cover]
        : [book.cover];

    return [...new Set(sources.filter(Boolean))];
};

const applyBookCover = (book) => {
    const sources = getBookCoverSources(book);
    let sourceIndex = 0;

    elements.cover.onerror = () => {
        sourceIndex += 1;

        if (sourceIndex < sources.length) {
            elements.cover.src = sources[sourceIndex];
            return;
        }

        elements.cover.onerror = null;
    };

    elements.cover.src = sources[0] || "";
};

const renderBook = (book) => {
    elements.title.textContent = book.title || "Livro do bosque";
    elements.meta.textContent = `${book.author || "Autor nao informado"} - ${book.year || "Ano nao informado"}`;
    elements.note.textContent = book.description || "O link final de compra sera conectado aqui depois.";
    elements.cover.alt = `Capa de ${book.title || "livro selecionado"}`;
    elements.back.href = `livros.html?q=${encodeURIComponent(book.title || "")}&tema=${encodeURIComponent("Retomar busca")}`;
    applyBookCover(book);
};

renderBook(getStoredBook() || getFallbackBook());
