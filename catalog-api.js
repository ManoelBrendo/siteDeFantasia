import { BosqueLibraryDb } from "./library-db.js";
import { OpenLibraryCatalogApi } from "./open-library-api.js";

const UI_STATE_KEY = "ui-state";
const FAVORITES_KEY = "favorites";
const RECENT_QUERIES_KEY = "recent-queries";

const buildQueryId = ({ query, page, limit }) => {
    return `${query}::${page}::${limit}`;
};

export class BosqueCatalogApi {
    constructor() {
        this.remoteApi = new OpenLibraryCatalogApi();
        this.database = new BosqueLibraryDb();
    }

    async primeStaticCollections({ books = [], authors = [], glossary = [] } = {}) {
        await Promise.all([
            this.database.storeBooks(books),
            this.database.storeMeta("authors", authors),
            this.database.storeMeta("glossary", glossary)
        ]).catch(() => null);
    }

    async searchBooks({ query, page = 1, limit = 9, signal } = {}) {
        const queryId = buildQueryId({ query, page, limit });
        const storedQuery = await this.database.getQuery(queryId).catch(() => null);

        if (!navigator.onLine && storedQuery) {
            return storedQuery;
        }

        try {
            const result = await this.remoteApi.searchBooks({
                query,
                page,
                limit,
                signal
            });

            await Promise.all([
                this.database.putQuery(queryId, result),
                this.database.storeBooks(result.books)
            ]).catch(() => null);

            return result;
        } catch (error) {
            if (storedQuery) {
                return storedQuery;
            }

            const localBooks = await this.database.searchBooks(query, limit).catch(() => []);

            if (localBooks.length > 0) {
                return {
                    total: localBooks.length,
                    page: 1,
                    books: localBooks,
                    source: "offline-db"
                };
            }

            throw error;
        }
    }

    async saveUiState(payload) {
        await this.database.setState(UI_STATE_KEY, payload).catch(() => null);
    }

    async loadUiState() {
        return this.database.getState(UI_STATE_KEY).catch(() => null);
    }

    async getFavorites() {
        const favorites = await this.database.getState(FAVORITES_KEY).catch(() => null);
        return Array.isArray(favorites) ? favorites : [];
    }

    async saveFavorites(bookIds) {
        const uniqueBookIds = [...new Set((bookIds || []).filter(Boolean))];
        await this.database.setState(FAVORITES_KEY, uniqueBookIds).catch(() => null);
        return uniqueBookIds;
    }

    async toggleFavorite(bookId) {
        const favorites = await this.getFavorites();
        const nextFavorites = favorites.includes(bookId)
            ? favorites.filter((id) => id !== bookId)
            : [bookId, ...favorites];

        return this.saveFavorites(nextFavorites);
    }

    async getRecentQueries() {
        const entries = await this.database.getState(RECENT_QUERIES_KEY).catch(() => null);
        return Array.isArray(entries) ? entries : [];
    }

    async pushRecentQuery(entry) {
        const currentEntries = await this.getRecentQueries();
        const cleanedEntry = {
            query: String(entry?.query || "").trim(),
            label: String(entry?.label || entry?.query || "").trim(),
            savedAt: Date.now()
        };

        if (!cleanedEntry.query) {
            return currentEntries;
        }

        const nextEntries = [
            cleanedEntry,
            ...currentEntries.filter((item) => item.query !== cleanedEntry.query)
        ].slice(0, 8);

        await this.database.setState(RECENT_QUERIES_KEY, nextEntries).catch(() => null);
        return nextEntries;
    }
}
