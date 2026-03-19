export const DEFAULT_QUERY = "subject:fantasy";
export const DEFAULT_LABEL = "Espadas e reinos";
export const RESULTS_PER_PAGE = 9;

export const featuredBooks = [
    {
        id: "elfland",
        title: "A Filha do Rei de Elfland",
        originalTitle: "The King of Elfland's Daughter",
        author: "Lord Dunsany",
        year: "1924",
        cover: "https://commons.wikimedia.org/wiki/Special:FilePath/The%20Hunting%20of%20the%20Unicorn%20by%20Samuel%20Simes%2C%20Frontispiece%20to%20The%20King%20of%20Elfland%27s%20Daughter.png?width=720",
        description: "Quando um reino humano exige um toque de magia, o príncipe Alveric parte para Elfland e traz de lá a filha do rei. O encontro entre os dois abala as fronteiras entre a vida comum e um mundo feérico que não segue o tempo dos homens.",
        aura: "Feérico, régio e melancólico",
        paths: ["elfica", "mitica"]
    },
    {
        id: "phantastes",
        title: "Fantastes",
        originalTitle: "Phantastes",
        author: "George MacDonald",
        year: "1858",
        cover: "https://commons.wikimedia.org/wiki/Special:FilePath/Phantastes%20Title%20Page%201894.jpg?width=720",
        description: "Depois de herdar uma chave misteriosa, Anodos desperta em uma terra encantada e atravessa florestas, palácios e provações interiores. A trama funciona como viagem espiritual e conto de maravilhamento ao mesmo tempo.",
        aura: "Onírico, simbólico e iniciático",
        paths: ["elfica", "iniciatica", "mitica"]
    },
    {
        id: "princesa-goblin",
        title: "A Princesa e o Goblin",
        originalTitle: "The Princess and the Goblin",
        author: "George MacDonald",
        year: "1872",
        cover: "https://commons.wikimedia.org/wiki/Special:FilePath/Princess%20and%20the%20Goblin.jpg?width=720",
        description: "A pequena princesa Irene vive em um castelo ameaçado por goblins escondidos no subterrâneo. Com a ajuda de Curdie, ela precisa enfrentar perigos, descobrir passagens ocultas e confiar em uma proteção misteriosa que paira sobre o reino.",
        aura: "Acolhedor, medieval e aventureiro",
        paths: ["medieval", "elfica"]
    },
    {
        id: "well-world-end",
        title: "O Poço no Fim do Mundo",
        originalTitle: "The Well at the World's End",
        author: "William Morris",
        year: "1896",
        cover: "https://commons.wikimedia.org/wiki/Special:FilePath/The%20Well%20at%20the%20World%27s%20End%2C%20design%20by%20William%20Morris%2C%20Hammersmith%2C%20Kelmscott%20Press%2C%201896%20-%20National%20Gallery%20of%20Art%2C%20Washington%20-%20DSC09794.JPG?width=720",
        description: "Ralph deixa o conforto do lar para procurar um poço lendário ligado à fortuna e ao destino. A jornada o leva por estradas, cortes, combates e encontros que transformam a busca em um romance de formação cavaleiresca.",
        aura: "Cavaleiresco, antigo e cerimonial",
        paths: ["medieval", "mitica"]
    }
];

export const topicThemes = [
    { label: "Elfos e feéria", query: "elves fantasy", description: "Cortes feéricas, bosques e reinos encantados." },
    { label: "Mitologia celta", query: "\"celtic mythology\" fantasy", description: "Sidhe, druidas, símbolos e velhas lendas." },
    { label: "Lendas arturianas", query: "\"arthurian romance\"", description: "Camelot, Avalon e relíquias do reino." },
    { label: "Espadas e reinos", query: "subject:fantasy", description: "Jornadas, heróis e paisagens de saga." },
    { label: "Magia e feitiçaria", query: "\"magic fantasy\"", description: "Feitiços, grimórios e aprendizes do arcano." },
    { label: "Dragões e criaturas", query: "\"dragons fantasy\"", description: "Bestiários, monstros e fôlego antigo." },
    { label: "Bosques encantados", query: "\"fairy tales\" forest", description: "Trilhas verdes e maravilhas do mato." },
    { label: "Castelos medievais", query: "\"medieval fantasy\"", description: "Pedra, brasões e ecos de corte." }
];

export const readingPaths = [
    {
        id: "elfica",
        name: "Trilha Élfica",
        description: "Ideal para quem quer delicadeza feérica, bosques antigos, corte encantada e aquele sentimento de maravilha que parece vir de outra estação do mundo.",
        focusLabel: "Elfos e feéria",
        focusQuery: "elves fantasy",
        bookIds: ["elfland", "phantastes", "princesa-goblin"]
    },
    {
        id: "mitica",
        name: "Trilha Celta e Mítica",
        description: "Feita para leitores atraídos por névoa ritual, símbolos, lendas antigas e fantasia com cheiro de mito oral e paisagem ancestral.",
        focusLabel: "Mitologia celta",
        focusQuery: "\"celtic mythology\" fantasy",
        bookIds: ["phantastes", "well-world-end", "elfland"]
    },
    {
        id: "medieval",
        name: "Trilha Medieval de Estrada",
        description: "Boa para quem quer castelos, jornada, destino, corte, estrada e um senso de aventura de crônica antiga sem perder o encanto literário.",
        focusLabel: "Castelos medievais",
        focusQuery: "\"medieval fantasy\"",
        bookIds: ["well-world-end", "princesa-goblin", "elfland"]
    },
    {
        id: "iniciatica",
        name: "Trilha Onírica e Iniciática",
        description: "Pensada para quem prefere fantasia contemplativa, simbólica e transformadora, em que a paisagem exterior também é uma travessia interior.",
        focusLabel: "Bosques encantados",
        focusQuery: "\"fairy tales\" forest",
        bookIds: ["phantastes", "elfland", "well-world-end"]
    }
];

export const affinityQuestions = [
    {
        id: "entrada",
        title: "Qual portal te chama primeiro?",
        options: [
            { value: "bosque", label: "Bosque élfico", description: "Encanto, folhas, luar e estranheza suave.", scores: { elfica: 3, iniciatica: 1 } },
            { value: "mito", label: "Lenda antiga", description: "Sons rituais, ilha, sidhe e memória oral.", scores: { mitica: 3, elfica: 1 } },
            { value: "castelo", label: "Castelo e corte", description: "Pedra, brasão, jornada e promessa.", scores: { medieval: 3 } },
            { value: "sonho", label: "Sonho simbólico", description: "Paisagem interior, metáfora e travessia íntima.", scores: { iniciatica: 3, mitica: 1 } }
        ]
    },
    {
        id: "ritmo",
        title: "Que ritmo combina com você?",
        options: [
            { value: "contemplativo", label: "Contemplativo", description: "Leitura mais atmosférica e lenta.", scores: { iniciatica: 2, elfica: 1 } },
            { value: "aventureiro", label: "Aventureiro", description: "Andar rápido, perigo e descoberta.", scores: { medieval: 2, elfica: 1 } },
            { value: "ritual", label: "Ritual", description: "Peso mítico, símbolos e solenidade.", scores: { mitica: 2 } },
            { value: "equilibrado", label: "Equilibrado", description: "Mistura de beleza, trama e movimento.", scores: { elfica: 1, medieval: 1, mitica: 1 } }
        ]
    },
    {
        id: "magia",
        title: "Como você prefere a magia?",
        options: [
            { value: "sutil", label: "Encantamento sutil", description: "Mistério delicado e presença quase invisível.", scores: { elfica: 2, iniciatica: 1 } },
            { value: "mitica", label: "Mito e símbolo", description: "Magia como linguagem de lenda.", scores: { mitica: 2, iniciatica: 1 } },
            { value: "feitiçaria", label: "Feitiço e maravilha", description: "Sensação de mundo encantado bem visível.", scores: { elfica: 1, medieval: 1 } },
            { value: "destino", label: "Destino e prova", description: "Jornada, promessa e transformação.", scores: { medieval: 2, mitica: 1 } }
        ]
    },
    {
        id: "paisagem",
        title: "Em que cenário você quer entrar?",
        options: [
            { value: "verde", label: "Floresta viva", description: "Caminhos verdes, névoa e claridade feérica.", scores: { elfica: 2, iniciatica: 1 } },
            { value: "ilha", label: "Névoa ritual", description: "Ilhas, costa, lenda e chamada antiga.", scores: { mitica: 2 } },
            { value: "estrada", label: "Estrada medieval", description: "Ponte, corte, cavaleiro e horizonte.", scores: { medieval: 2 } },
            { value: "espelho", label: "Paisagem interior", description: "Sonho, prova íntima e símbolo.", scores: { iniciatica: 2, mitica: 1 } }
        ]
    }
];
