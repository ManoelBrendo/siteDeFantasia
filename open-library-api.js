const OPEN_LIBRARY_SEARCH_URL = "https://openlibrary.org/search.json";
const OPEN_LIBRARY_COVER_SIZE = "M";
const OPEN_LIBRARY_FIELDS = [
    "key",
    "title",
    "author_name",
    "first_publish_year",
    "cover_i",
    "cover_edition_key",
    "edition_key",
    "isbn",
    "edition_count",
    "subject"
].join(",");

const SUBJECT_TRANSLATIONS = new Map([
    ["fantasy", "fantasia"],
    ["magic", "magia"],
    ["wizards", "magos"],
    ["witches", "bruxas"],
    ["dragons", "dragões"],
    ["elves", "elfos"],
    ["fairies", "fadas"],
    ["fairy tales", "contos de fadas"],
    ["mythology", "mitologia"],
    ["celtic mythology", "mitologia celta"],
    ["arthurian romance", "lendas arturianas"],
    ["knights", "cavaleiros"],
    ["castles", "castelos"],
    ["adventure", "aventura"],
    ["quests", "jornadas"],
    ["heroes", "heróis"],
    ["legends", "lendas"],
    ["folklore", "folclore"],
    ["monsters", "monstros"],
    ["epic", "épico"],
    ["good and evil", "conflito entre luz e sombra"],
    ["friendship", "amizade"],
    ["coming of age", "amadurecimento"],
    ["princesses", "princesas"],
    ["kings and rulers", "reis e governantes"],
    ["forests", "florestas"],
    ["medieval", "ambiente medieval"],
    ["love", "amor"],
    ["mystery", "mistério"],
    ["juvenile fiction", "aventura juvenil"],
    ["young adult fiction", "fantasia jovem"],
    ["sword and sorcery", "espada e feitiçaria"]
]);

const OPEN_LICENSE_FALLBACKS = [
    {
        titles: ["lud in the mist"],
        authors: ["hope mirrlees"],
        cover: "https://commons.wikimedia.org/wiki/Special:FilePath/Lud-in-the-Mist%201926%20cover.jpg?width=720"
    },
    {
        titles: ["lilith"],
        authors: ["george macdonald"],
        cover: "https://commons.wikimedia.org/wiki/Special:FilePath/Lilith%20a%20romance%20by%20George%20MacDonald.jpg?width=720"
    },
    {
        titles: ["the wood beyond the world", "wood beyond the world"],
        authors: ["william morris"],
        cover: "https://commons.wikimedia.org/wiki/Special:FilePath/The%20wood%20beyond%20the%20world%20by%20William%20Morris%20%28cropped%29.jpg?width=720"
    },
    {
        titles: ["the house of the wolfings", "house of the wolfings"],
        authors: ["william morris"],
        cover: "https://commons.wikimedia.org/wiki/Special:FilePath/House%20of%20the%20Wolfings%20Title%20Page%20First%20Edition%201889.jpg?width=720"
    },
    {
        titles: ["phantastes"],
        authors: ["george macdonald"],
        cover: "https://commons.wikimedia.org/wiki/Special:FilePath/Phantastes%20Title%20Page%201894.jpg?width=720"
    },
    {
        titles: ["the princess and the goblin", "princess and the goblin"],
        authors: ["george macdonald"],
        cover: "https://commons.wikimedia.org/wiki/Special:FilePath/Princess%20and%20the%20Goblin.jpg?width=720"
    },
    {
        titles: ["the king of elfland's daughter", "the king of elflands daughter"],
        authors: ["lord dunsany", "edward john moreton drax plunkett dunsany"],
        cover: "https://commons.wikimedia.org/wiki/Special:FilePath/The%20Hunting%20of%20the%20Unicorn%20by%20Samuel%20Simes%2C%20Frontispiece%20to%20The%20King%20of%20Elfland%27s%20Daughter.png?width=720"
    },
    {
        titles: ["the well at the world's end", "the well at the worlds end"],
        authors: ["william morris"],
        cover: "https://commons.wikimedia.org/wiki/Special:FilePath/The%20Well%20at%20the%20World%27s%20End%2C%20design%20by%20William%20Morris%2C%20Hammersmith%2C%20Kelmscott%20Press%2C%201896%20-%20National%20Gallery%20of%20Art%2C%20Washington%20-%20DSC09794.JPG?width=720"
    }
];

const buildFallbackCover = () => {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 460">
            <rect width="320" height="460" rx="26" fill="#15261f"/>
            <rect x="16" y="16" width="288" height="428" rx="22" fill="#20382f" stroke="#dcbf83" stroke-width="3"/>
            <path d="M58 88h204M58 134h164M58 180h186" stroke="#f0dfb0" stroke-width="8" stroke-linecap="round" opacity=".45"/>
            <circle cx="160" cy="286" r="48" fill="none" stroke="#dcbf83" stroke-width="3" opacity=".45"/>
            <text x="160" y="295" text-anchor="middle" font-size="26" fill="#f7efdc" font-family="Georgia, serif">Sem capa</text>
        </svg>
    `.trim();

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const normalizeSpaces = (value) => {
    return String(value || "").replace(/\s+/g, " ").trim();
};

const normalizeLookup = (value) => {
    return normalizeSpaces(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
};

const unique = (values) => {
    return [...new Set(values.filter(Boolean))];
};

const translateSubject = (subject) => {
    const normalized = normalizeSpaces(subject).toLowerCase();

    if (SUBJECT_TRANSLATIONS.has(normalized)) {
        return SUBJECT_TRANSLATIONS.get(normalized);
    }

    if (/^[a-z0-9 ,'"-]+$/u.test(normalized)) {
        return "";
    }

    return normalizeSpaces(subject).toLowerCase();
};

const pickSubjects = (subjects = []) => {
    return subjects
        .map(translateSubject)
        .filter(Boolean)
        .slice(0, 4);
};

const formatSubjectList = (subjects) => {
    if (subjects.length === 0) {
        return "";
    }

    if (subjects.length === 1) {
        return subjects[0];
    }

    if (subjects.length === 2) {
        return `${subjects[0]} e ${subjects[1]}`;
    }

    return `${subjects[0]}, ${subjects[1]} e ${subjects[2]}`;
};

const inferAtmosphere = (subjects) => {
    if (subjects.some((subject) => subject.includes("elfos") || subject.includes("fadas"))) {
        return "uma atmosfera feérica e de floresta encantada";
    }

    if (subjects.some((subject) => subject.includes("mitologia celta") || subject.includes("lendas arturianas"))) {
        return "um tom mítico e ritual, ligado a lendas antigas";
    }

    if (subjects.some((subject) => subject.includes("dragões") || subject.includes("monstros"))) {
        return "um clima de perigo antigo, criaturas raras e aventura";
    }

    if (subjects.some((subject) => subject.includes("cavaleiros") || subject.includes("castelos") || subject.includes("ambiente medieval"))) {
        return "uma paisagem medieval de jornada, corte e destino";
    }

    if (subjects.some((subject) => subject.includes("magia") || subject.includes("magos") || subject.includes("bruxas"))) {
        return "um universo de magia, aprendizado e mistério";
    }

    return "uma jornada fantástica guiada por encanto, descoberta e imaginação";
};

const truncateText = (value, limit = 220) => {
    const normalized = normalizeSpaces(value);

    if (!normalized || normalized.length <= limit) {
        return normalized;
    }

    return `${normalized.slice(0, limit).replace(/[ ,;:.!?-]+$/u, "")}...`;
};

const buildPortugueseDescription = ({ author, year, editionCount, subjects }) => {
    const translatedSubjects = pickSubjects(subjects);
    const subjectSummary = formatSubjectList(translatedSubjects);
    const atmosphere = inferAtmosphere(translatedSubjects);
    const yearText = year && year !== "Ano não informado"
        ? `Primeira edição conhecida em ${year}.`
        : "Ano de publicação não informado.";

    if (subjectSummary) {
        return truncateText(`Obra de ${author} ligada a ${subjectSummary}, com ${atmosphere}. ${yearText}`);
    }

    if (editionCount) {
        return truncateText(`Livro de ${author} com ${editionCount} edições registradas no acervo, associado a ${atmosphere}. ${yearText}`);
    }

    return truncateText(`Livro de ${author} associado a ${atmosphere}. ${yearText}`);
};

const buildOpenLibraryCoverUrl = (key, value) => {
    return `https://covers.openlibrary.org/b/${key}/${value}-${OPEN_LIBRARY_COVER_SIZE}.jpg?default=false`;
};

const findOpenLicenseFallback = ({ title, author }) => {
    const normalizedTitle = normalizeLookup(title);
    const normalizedAuthor = normalizeLookup(author);

    const match = OPEN_LICENSE_FALLBACKS.find((entry) => {
        const titleMatches = entry.titles.some((entryTitle) => {
            return normalizedTitle === entryTitle
                || normalizedTitle.includes(entryTitle)
                || entryTitle.includes(normalizedTitle);
        });

        if (!titleMatches) {
            return false;
        }

        return entry.authors.some((entryAuthor) => {
            return normalizedAuthor === entryAuthor
                || normalizedAuthor.includes(entryAuthor)
                || entryAuthor.includes(normalizedAuthor);
        });
    });

    return match?.cover || "";
};

const buildCoverCandidates = (doc) => {
    const candidates = [];

    if (doc.cover_i) {
        candidates.push(buildOpenLibraryCoverUrl("id", doc.cover_i));
    }

    if (doc.cover_edition_key) {
        candidates.push(buildOpenLibraryCoverUrl("olid", doc.cover_edition_key));
    }

    (doc.edition_key || []).slice(0, 2).forEach((editionKey) => {
        candidates.push(buildOpenLibraryCoverUrl("olid", editionKey));
    });

    const rightsClearedFallback = findOpenLicenseFallback({
        title: doc.title,
        author: doc.author_name?.[0] || ""
    });

    if (rightsClearedFallback) {
        candidates.push(rightsClearedFallback);
    }

    (doc.isbn || [])
        .map((isbn) => normalizeSpaces(isbn).replace(/[^0-9Xx]/g, ""))
        .filter(Boolean)
        .slice(0, 1)
        .forEach((isbn) => {
            candidates.push(buildOpenLibraryCoverUrl("isbn", isbn));
        });

    return unique(candidates);
};

export class OpenLibraryCatalogApi {
    constructor() {
        this.cache = new Map();
        this.placeholderCover = buildFallbackCover();
    }

    buildUrl({ query, page = 1, limit = 9 }) {
        const url = new URL(OPEN_LIBRARY_SEARCH_URL);
        url.searchParams.set("q", query);
        url.searchParams.set("fields", OPEN_LIBRARY_FIELDS);
        url.searchParams.set("page", String(page));
        url.searchParams.set("limit", String(limit));
        return url;
    }

    async searchBooks({ query, page = 1, limit = 9, signal } = {}) {
        const normalizedQuery = (query || "subject:fantasy").trim();
        const url = this.buildUrl({ query: normalizedQuery, page, limit }).toString();

        if (this.cache.has(url)) {
            return this.cache.get(url);
        }

        const response = await fetch(url, {
            method: "GET",
            headers: {
                Accept: "application/json"
            },
            signal
        });

        if (!response.ok) {
            throw new Error("O acervo não respondeu agora. Tente novamente em alguns instantes.");
        }

        const payload = await response.json();
        const result = {
            total: payload.numFound || 0,
            page,
            books: (payload.docs || [])
                .filter((doc) => doc.title && doc.key)
                .map((doc) => ({
                    id: doc.key.replace("/works/", "") || `${doc.title}-${doc.first_publish_year || "sem-ano"}`,
                    title: doc.title,
                    author: doc.author_name?.[0] || "Autor não informado",
                    year: doc.first_publish_year || "Ano não informado",
                    editionCount: doc.edition_count || 0,
                    cover: this.placeholderCover,
                    coverCandidates: buildCoverCandidates(doc),
                    description: buildPortugueseDescription({
                        author: doc.author_name?.[0] || "Autor não informado",
                        year: doc.first_publish_year || "Ano não informado",
                        editionCount: doc.edition_count || 0,
                        subjects: doc.subject || []
                    }),
                    purchaseUrl: "#compra"
                }))
        };

        this.cache.set(url, result);
        return result;
    }
}
