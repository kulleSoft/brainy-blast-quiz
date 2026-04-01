export type CategoryId = "general" | "history" | "geography" | "science" | "technology" | "entertainment";

export interface QuizQuestion {
  prompt: string;
  options: [string, string, string, string];
  answer: number;
  explanation: string;
}

export interface QuizCategory {
  id: CategoryId;
  title: string;
  description: string;
  unlockLevel: number;
  questions: QuizQuestion[];
}

export const quizCategories: QuizCategory[] = [
  {
    id: "general",
    title: "Conhecimentos gerais",
    description: "Perguntas variadas para aquecer sua mente.",
    unlockLevel: 1,
    questions: [
      {
        prompt: "Qual planeta é conhecido como planeta vermelho?",
        options: ["Vênus", "Marte", "Júpiter", "Mercúrio"],
        answer: 1,
        explanation: "Marte recebe esse apelido por causa da poeira rica em óxido de ferro em sua superfície.",
      },
      {
        prompt: "Quantos continentes existem tradicionalmente no modelo mais usado no Brasil?",
        options: ["5", "6", "7", "8"],
        answer: 1,
        explanation: "No ensino brasileiro, geralmente se considera a divisão em seis continentes.",
      },
      {
        prompt: "Qual destes animais é um mamífero?",
        options: ["Tubarão", "Pinguim", "Golfinho", "Tartaruga"],
        answer: 2,
        explanation: "O golfinho é mamífero e precisa subir à superfície para respirar.",
      },
    ],
  },
  {
    id: "history",
    title: "História",
    description: "Grandes eventos e personagens do passado.",
    unlockLevel: 1,
    questions: [
      {
        prompt: "Em que ano o Brasil declarou sua independência?",
        options: ["1492", "1822", "1889", "1922"],
        answer: 1,
        explanation: "A Independência do Brasil foi proclamada em 1822 por Dom Pedro I.",
      },
      {
        prompt: "Qual civilização construiu as pirâmides de Gizé?",
        options: ["Romanos", "Maias", "Egípcios", "Persas"],
        answer: 2,
        explanation: "As pirâmides de Gizé são monumentos emblemáticos do Egito Antigo.",
      },
      {
        prompt: "A queda do Muro de Berlim ocorreu em qual ano?",
        options: ["1961", "1989", "1991", "2001"],
        answer: 1,
        explanation: "O Muro de Berlim caiu em 1989, simbolizando o fim da Guerra Fria na Europa.",
      },
    ],
  },
  {
    id: "geography",
    title: "Geografia",
    description: "Mapas, capitais e curiosidades do planeta.",
    unlockLevel: 1,
    questions: [
      {
        prompt: "Qual é o maior oceano da Terra?",
        options: ["Atlântico", "Índico", "Pacífico", "Ártico"],
        answer: 2,
        explanation: "O Oceano Pacífico é o maior e mais profundo do planeta.",
      },
      {
        prompt: "Brasília está localizada em qual região do Brasil?",
        options: ["Norte", "Nordeste", "Centro-Oeste", "Sudeste"],
        answer: 2,
        explanation: "Brasília fica no Distrito Federal, na região Centro-Oeste.",
      },
      {
        prompt: "Qual país possui o maior território do mundo?",
        options: ["Canadá", "China", "Rússia", "Estados Unidos"],
        answer: 2,
        explanation: "A Rússia é o maior país do mundo em extensão territorial.",
      },
    ],
  },
  {
    id: "science",
    title: "Ciência",
    description: "Corpo humano, natureza e experimentos.",
    unlockLevel: 2,
    questions: [
      {
        prompt: "Qual gás as plantas absorvem durante a fotossíntese?",
        options: ["Oxigênio", "Nitrogênio", "Gás carbônico", "Hélio"],
        answer: 2,
        explanation: "As plantas absorvem dióxido de carbono e liberam oxigênio na fotossíntese.",
      },
      {
        prompt: "Qual parte do corpo humano bombeia sangue?",
        options: ["Pulmão", "Cérebro", "Fígado", "Coração"],
        answer: 3,
        explanation: "O coração é o órgão responsável por bombear sangue pelo corpo.",
      },
      {
        prompt: "A água pura entra em ebulição ao nível do mar em qual temperatura?",
        options: ["90 °C", "95 °C", "100 °C", "110 °C"],
        answer: 2,
        explanation: "Ao nível do mar, a água ferve a 100 °C sob pressão atmosférica padrão.",
      },
    ],
  },
  {
    id: "technology",
    title: "Tecnologia",
    description: "Internet, dispositivos e inovação digital.",
    unlockLevel: 3,
    questions: [
      {
        prompt: "O que significa a sigla CPU?",
        options: ["Central Process Unit", "Central Processing Unit", "Computer Personal Unit", "Control Program Utility"],
        answer: 1,
        explanation: "CPU significa Central Processing Unit, a unidade central de processamento.",
      },
      {
        prompt: "Qual linguagem é usada para estilizar páginas web?",
        options: ["HTML", "Python", "CSS", "SQL"],
        answer: 2,
        explanation: "CSS é a linguagem responsável pela apresentação visual das páginas web.",
      },
      {
        prompt: "Qual dessas opções é um sistema operacional móvel?",
        options: ["Android", "Chrome", "Bluetooth", "Wi‑Fi"],
        answer: 0,
        explanation: "Android é um sistema operacional móvel usado em smartphones e tablets.",
      },
    ],
  },
  {
    id: "entertainment",
    title: "Entretenimento",
    description: "Cinema, música, games e cultura pop.",
    unlockLevel: 4,
    questions: [
      {
        prompt: "Qual personagem vive em uma galáxia muito, muito distante em Star Wars?",
        options: ["Harry Potter", "Luke Skywalker", "Sherlock Holmes", "Frodo Bolseiro"],
        answer: 1,
        explanation: "Luke Skywalker é um dos protagonistas centrais da saga Star Wars.",
      },
      {
        prompt: "Qual empresa é famosa pelo console PlayStation?",
        options: ["Nintendo", "Microsoft", "Sony", "Sega"],
        answer: 2,
        explanation: "O PlayStation é uma linha de consoles desenvolvida pela Sony.",
      },
      {
        prompt: "Qual destes gêneros está ligado a filmes de super-heróis?",
        options: ["Documentário", "Ação/Aventura", "FarOeste", "Biografia"],
        answer: 1,
        explanation: "Filmes de super-heróis normalmente pertencem ao gênero ação e aventura.",
      },
    ],
  },
];

export const termsSections = [
  {
    title: "Uso do aplicativo",
    body: "Este app foi criado para fins educativos e de entretenimento. As perguntas podem ser atualizadas com o tempo para melhorar a experiência.",
  },
  {
    title: "Anúncios",
    body: "O aplicativo informa que exibe anúncios (Ads) para apoiar sua manutenção. Ao continuar, você reconhece essa informação.",
  },
  {
    title: "Aceitação obrigatória",
    body: "No primeiro acesso, o uso do app fica bloqueado até a aceitação dos Termos de Uso. Essa aceitação é salva localmente apenas uma vez neste dispositivo.",
  },
];