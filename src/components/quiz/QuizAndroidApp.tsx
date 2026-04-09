import { useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  BookOpen,
  Brain,
  Globe2,
  History,
  Home,
  Lock,
  Medal,
  Moon,
  Settings2,
  Sparkles,
  Star,
  SunMedium,
  TimerReset,
  Trophy,
  Volume2,
  VolumeX,
  Wifi,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { quizCategories, termsSections, type CategoryId } from "./quiz-data";

type AppTab = "home" | "categories" | "quiz" | "ranking" | "settings";
type ThemeMode = "light" | "dark";
type AnswerState = "correct" | "wrong" | "timeout" | null;

interface AppSettings {
  soundEnabled: boolean;
  timerEnabled: boolean;
  theme: ThemeMode;
}

interface ScoreEntry {
  id: string;
  categoryId: CategoryId;
  categoryTitle: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  playedAt: string;
}

const STORAGE_KEYS = {
  acceptedTerms: "quiz-app-accepted-terms-v1",
  settings: "quiz-app-settings-v1",
  history: "quiz-app-history-v1",
} as const;

const defaultSettings: AppSettings = {
  soundEnabled: true,
  timerEnabled: true,
  theme: "light",
};

const categoryIcons = {
  general: Brain,
  history: History,
  geography: Globe2,
  science: Sparkles,
  technology: Wifi,
  entertainment: Trophy,
} as const;

const navItems: Array<{ id: AppTab; label: string; icon: typeof Home }> = [
  { id: "home", label: "Início", icon: Home },
  { id: "categories", label: "Categorias", icon: BookOpen },
  { id: "quiz", label: "Quiz", icon: Brain },
  { id: "ranking", label: "Ranking", icon: Trophy },
  { id: "settings", label: "Config.", icon: Settings2 },
];

const TIMER_SECONDS = 15;

const formatDate = (dateString: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));

const createFeedbackSound = (isCorrect: boolean) => {
  const AudioContextRef = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextRef) return;

  const context = new AudioContextRef();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = isCorrect ? 880 : 240;
  gain.gain.value = 0.05;

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.12);

  void context.close().catch(() => undefined);
};

export const QuizAndroidApp = () => {
  const mainContentRef = useRef<HTMLElement | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [history, setHistory] = useState<ScoreEntry[]>([]);
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [selectedCategoryId, setSelectedCategoryId] = useState<CategoryId>("general");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>(null);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [resultEntry, setResultEntry] = useState<ScoreEntry | null>(null);

  useEffect(() => {
    const storedAcceptedTerms = window.localStorage.getItem(STORAGE_KEYS.acceptedTerms) === "true";
    const storedSettings = window.localStorage.getItem(STORAGE_KEYS.settings);
    const storedHistory = window.localStorage.getItem(STORAGE_KEYS.history);

    setAcceptedTerms(storedAcceptedTerms);

    if (storedSettings) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(storedSettings) });
      } catch {
        setSettings(defaultSettings);
      }
    }

    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch {
        setHistory([]);
      }
    }

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(STORAGE_KEYS.acceptedTerms, String(acceptedTerms));
  }, [acceptedTerms, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
    document.documentElement.classList.toggle("dark", settings.theme === "dark");
  }, [settings, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
  }, [history, isHydrated]);

  const totalPoints = useMemo(() => history.reduce((sum, entry) => sum + entry.score, 0), [history]);
  const level = Math.max(1, Math.floor(totalPoints / 300) + 1);
  const nextLevelProgress = ((totalPoints % 300) / 300) * 100;

  const currentCategory = useMemo(
    () => quizCategories.find((category) => category.id === selectedCategoryId) ?? quizCategories[0],
    [selectedCategoryId],
  );
  const currentQuestion = currentCategory.questions[questionIndex];

  const ranking = useMemo(
    () => [...history].sort((a, b) => (b.score !== a.score ? b.score - a.score : b.correctAnswers - a.correctAnswers)).slice(0, 5),
    [history],
  );

  const categoryPerformance = useMemo(() => {
    return quizCategories.map((category) => {
      const played = history.filter((entry) => entry.categoryId === category.id);
      const bestScore = played.reduce((best, entry) => Math.max(best, entry.score), 0);
      return {
        id: category.id,
        playedCount: played.length,
        bestScore,
      };
    });
  }, [history]);

  const playFeedback = (isCorrect: boolean) => {
    if (!settings.soundEnabled) return;
    createFeedbackSound(isCorrect);
  };

  const resetQuizState = (categoryId: CategoryId) => {
    setSelectedCategoryId(categoryId);
    setQuestionIndex(0);
    setSelectedOption(null);
    setAnswerState(null);
    setScore(0);
    setCorrectAnswers(0);
    setTimeLeft(TIMER_SECONDS);
    setResultEntry(null);
  };

  const beginQuiz = (categoryId: CategoryId) => {
    const category = quizCategories.find((item) => item.id === categoryId);
    if (!category || level < category.unlockLevel) return;

    resetQuizState(categoryId);
    setActiveTab("quiz");
  };

  const submitAnswer = (optionIndex: number) => {
    if (answerState) return;

    const isCorrect = optionIndex === currentQuestion.answer;
    setSelectedOption(optionIndex);
    setAnswerState(isCorrect ? "correct" : "wrong");

    if (isCorrect) {
      setCorrectAnswers((prev) => prev + 1);
      setScore((prev) => prev + 100 + (settings.timerEnabled ? timeLeft * 3 : 20));
    }

    playFeedback(isCorrect);
  };

  const finishQuiz = () => {
    const entry: ScoreEntry = {
      id: crypto.randomUUID(),
      categoryId: currentCategory.id,
      categoryTitle: currentCategory.title,
      score,
      correctAnswers,
      totalQuestions: currentCategory.questions.length,
      playedAt: new Date().toISOString(),
    };

    setHistory((prev) => [entry, ...prev].slice(0, 20));
    setResultEntry(entry);
  };

  const goToNextQuestion = () => {
    if (questionIndex === currentCategory.questions.length - 1) {
      finishQuiz();
      return;
    }

    setQuestionIndex((prev) => prev + 1);
    setSelectedOption(null);
    setAnswerState(null);
    setTimeLeft(TIMER_SECONDS);
  };

  useEffect(() => {
    if (!isHydrated || activeTab !== "quiz" || resultEntry || answerState || !settings.timerEnabled) return;

    const interval = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [activeTab, answerState, isHydrated, questionIndex, resultEntry, settings.timerEnabled]);

  useEffect(() => {
    if (activeTab !== "quiz" || resultEntry || answerState || !settings.timerEnabled || timeLeft > 0) return;

    setAnswerState("timeout");
    playFeedback(false);
  }, [activeTab, answerState, resultEntry, settings.timerEnabled, timeLeft]);

  useEffect(() => {
    mainContentRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [activeTab, resultEntry]);

  const modalIsBlocking = isHydrated && !acceptedTerms;

  const renderHome = () => {
    const bestRun = ranking[0];
    const unlockedCategories = quizCategories.filter((category) => level >= category.unlockLevel).length;

    return (
      <div className="space-y-4 animate-rise">
        <section className="hero-panel">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary-foreground/20 blur-2xl motion-safe:animate-pulse-soft" />
          <div className="absolute -bottom-8 right-10 h-24 w-24 rounded-full bg-glow/35 blur-2xl" />
          <div className="relative space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-primary-foreground/80">QuizUp B2</p>
                <h1 className="max-w-52 text-3xl leading-tight">Teste seus conhecimentos de forma divertida!</h1>
              </div>
              <div className="rounded-2xl bg-primary-foreground/14 px-3 py-2 text-right backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/70">Nível</p>
                <p className="text-xl font-bold">{level}</p>
              </div>
            </div>

            <p className="max-w-xs text-sm text-primary-foreground/85">
              Responda rápido, acumule pontos e desbloqueie novas categorias conforme evolui.
            </p>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Pontos", value: totalPoints },
                { label: "Liberadas", value: unlockedCategories },
                { label: "Melhor", value: bestRun ? bestRun.score : 0 },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-primary-foreground/12 px-3 py-3 backdrop-blur-sm">
                  <p className="text-xs text-primary-foreground/75">{item.label}</p>
                  <p className="mt-1 text-lg font-bold">{item.value}</p>
                </div>
              ))}
            </div>

            <Button variant="surface" size="pill" className="w-full border-0 bg-primary-foreground/95 text-primary hover:bg-primary-foreground" onClick={() => beginQuiz(selectedCategoryId)}>
              Continuar jogando
            </Button>
          </div>
        </section>

        <section className="surface-card space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Progresso geral</p>
              <p className="text-xs text-muted-foreground">Faltam {300 - (totalPoints % 300 || 300)} pontos para o próximo nível.</p>
            </div>
            <Star className="h-5 w-5 text-warning" />
          </div>
          <div className="h-3 rounded-pill bg-muted">
            <div className="h-full rounded-pill bg-hero transition-all duration-500" style={{ width: `${Math.max(nextLevelProgress, 6)}%` }} />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="surface-card-strong space-y-1">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Categoria atual</p>
            <p className="text-base font-semibold">{currentCategory.title}</p>
            <p className="text-xs text-muted-foreground">{currentCategory.description}</p>
          </div>
          <div className="surface-card-strong space-y-1">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Última sessão</p>
            <p className="text-base font-semibold">{history[0] ? `${history[0].score} pts` : "Sem partidas"}</p>
            <p className="text-xs text-muted-foreground">{history[0] ? history[0].categoryTitle : "Jogue para começar"}</p>
          </div>
        </section>
      </div>
    );
  };

  const renderCategories = () => (
    <div className="space-y-4 animate-rise">
      <div>
        <h2 className="text-2xl">Categorias</h2>
        <p className="text-sm text-muted-foreground">Escolha um tema e comece uma rodada de 3 perguntas.</p>
      </div>

      <div className="grid gap-3">
        {quizCategories.map((category) => {
          const Icon = categoryIcons[category.id];
          const isUnlocked = level >= category.unlockLevel;
          const stats = categoryPerformance.find((item) => item.id === category.id);

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => (isUnlocked ? setSelectedCategoryId(category.id) : undefined)}
              className={cn(
                "surface-card text-left transition-all duration-300",
                isUnlocked ? "hover:-translate-y-0.5 hover:border-primary/30" : "opacity-80",
                selectedCategoryId === category.id && "border-primary/40 bg-primary/5",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base">{category.title}</h3>
                      {!isUnlocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Melhor pontuação: <span className="font-semibold text-foreground">{stats?.bestScore ?? 0}</span>
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground">
                  {isUnlocked ? "Pronto" : `Nível ${category.unlockLevel}`}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Jogadas: {stats?.playedCount ?? 0}</p>
                <Button
                  variant={isUnlocked ? "hero" : "surface"}
                  size="pill"
                  className="h-9"
                  disabled={!isUnlocked}
                  onClick={(event) => {
                    event.stopPropagation();
                    beginQuiz(category.id);
                  }}
                >
                  {isUnlocked ? "Jogar agora" : "Bloqueada"}
                </Button>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderQuiz = () => {
    if (resultEntry) {
      const accuracy = Math.round((resultEntry.correctAnswers / resultEntry.totalQuestions) * 100);

      return (
        <div className="space-y-4 animate-rise">
          <section className="hero-panel">
            <p className="text-sm text-primary-foreground/80">Resultado final</p>
            <h2 className="mt-2 text-3xl">{resultEntry.score} pontos</h2>
            <p className="mt-2 text-sm text-primary-foreground/85">
              Você acertou {resultEntry.correctAnswers} de {resultEntry.totalQuestions} perguntas em {resultEntry.categoryTitle}.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-primary-foreground/12 p-3">
                <p className="text-xs text-primary-foreground/70">Precisão</p>
                <p className="text-lg font-bold">{accuracy}%</p>
              </div>
              <div className="rounded-2xl bg-primary-foreground/12 p-3">
                <p className="text-xs text-primary-foreground/70">Melhor posição</p>
                <p className="text-lg font-bold">#{Math.max(1, ranking.findIndex((item) => item.id === resultEntry.id) + 1)}</p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="hero" size="pill" onClick={() => beginQuiz(resultEntry.categoryId)}>
              Jogar de novo
            </Button>
            <Button variant="surface" size="pill" onClick={() => setActiveTab("categories")}>
              Trocar tema
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 animate-rise">
        <section className="surface-card space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">{currentCategory.title}</p>
              <h2 className="mt-1 text-xl leading-tight">Pergunta {questionIndex + 1} de {currentCategory.questions.length}</h2>
            </div>
            {settings.timerEnabled && (
              <div className={cn("rounded-2xl px-3 py-2 text-center", timeLeft <= 5 ? "bg-destructive/12 text-destructive" : "bg-secondary text-secondary-foreground")}>
                <p className="text-[0.65rem] uppercase tracking-[0.18em]">Tempo</p>
                <p className="text-lg font-bold">{timeLeft}s</p>
              </div>
            )}
          </div>

          <div className="h-2 rounded-pill bg-muted">
            <div className="h-full rounded-pill bg-hero transition-all duration-500" style={{ width: `${((questionIndex + 1) / currentCategory.questions.length) * 100}%` }} />
          </div>

          <div className="rounded-2xl bg-surface-strong/80 p-4">
            <p className="text-lg font-semibold leading-relaxed">{currentQuestion.prompt}</p>
          </div>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const optionLetter = String.fromCharCode(65 + index);
              let state: "correct" | "wrong" | "neutral-selected" | undefined;

              if (answerState) {
                if (index === currentQuestion.answer) state = "correct";
                else if (selectedOption === index) state = "wrong";
              } else if (selectedOption === index) {
                state = "neutral-selected";
              }

              return (
                <button key={option} type="button" className="quiz-option" data-state={state} onClick={() => submitAnswer(index)}>
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {optionLetter}
                  </span>
                  <span>{option}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="surface-card-strong space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Pontuação da rodada</p>
              <p className="text-xs text-muted-foreground">{score} pts · {correctAnswers} acertos</p>
            </div>
            <Award className="h-5 w-5 text-warning" />
          </div>

          {answerState ? (
            <>
              <div className={cn("rounded-2xl p-4 text-sm", answerState === "correct" ? "bg-success/12 text-foreground" : "bg-destructive/10 text-foreground")}>
                <p className="font-semibold">
                  {answerState === "correct" ? "Resposta correta!" : answerState === "timeout" ? "Tempo esgotado." : "Não foi dessa vez."}
                </p>
                <p className="mt-1 text-muted-foreground">{currentQuestion.explanation}</p>
              </div>
              <Button variant="hero" size="pill" className="w-full" onClick={goToNextQuestion}>
                {questionIndex === currentCategory.questions.length - 1 ? "Ver resultado" : "Próxima pergunta"}
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Escolha uma alternativa para receber feedback imediato.</p>
          )}
        </section>
      </div>
    );
  };

  const renderRanking = () => (
    <div className="space-y-4 animate-rise">
      <div>
        <h2 className="text-2xl">Ranking & histórico</h2>
        <p className="text-sm text-muted-foreground">Acompanhe suas melhores rodadas e evolução recente.</p>
      </div>

      <section className="surface-card space-y-3">
        <div className="flex items-center gap-2">
          <Medal className="h-5 w-5 text-warning" />
          <p className="font-semibold">Top pontuações</p>
        </div>
        {ranking.length > 0 ? (
          <div className="space-y-3">
            {ranking.map((entry, index) => (
              <div key={entry.id} className="flex items-center justify-between rounded-2xl bg-surface-strong/90 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">#{index + 1} · {entry.categoryTitle}</p>
                  <p className="text-xs text-muted-foreground">{entry.correctAnswers}/{entry.totalQuestions} acertos</p>
                </div>
                <p className="text-lg font-bold text-primary">{entry.score}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-surface-strong/90 p-4 text-sm text-muted-foreground">Seu ranking aparece aqui assim que a primeira rodada terminar.</p>
        )}
      </section>

      <section className="surface-card space-y-3">
        <p className="font-semibold">Histórico de pontuações</p>
        {history.length > 0 ? (
          <div className="space-y-3">
            {history.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-border bg-card/85 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{entry.categoryTitle}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(entry.playedAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold">{entry.score} pts</p>
                  <p className="text-xs text-muted-foreground">{entry.correctAnswers} acertos</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-surface-strong/90 p-4 text-sm text-muted-foreground">Nenhuma pontuação registrada ainda.</p>
        )}
      </section>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-4 animate-rise">
      <div>
        <h2 className="text-2xl">Configurações</h2>
        <p className="text-sm text-muted-foreground">Personalize a experiência e revise os termos quando quiser.</p>
      </div>

      <div className="space-y-3">
        <div className="settings-row">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-secondary p-3 text-secondary-foreground">
              {settings.soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </div>
            <div>
              <p className="font-semibold">Sons do quiz</p>
              <p className="text-xs text-muted-foreground">Feedback sonoro ao responder.</p>
            </div>
          </div>
          <Button variant={settings.soundEnabled ? "hero" : "surface"} size="pill" className="h-9" onClick={() => setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))}>
            {settings.soundEnabled ? "Ativado" : "Desativado"}
          </Button>
        </div>

        <div className="settings-row">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-accent p-3 text-accent-foreground">
              <TimerReset className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Tempo por pergunta</p>
              <p className="text-xs text-muted-foreground">Ative 15 segundos por questão.</p>
            </div>
          </div>
          <Button variant={settings.timerEnabled ? "hero" : "surface"} size="pill" className="h-9" onClick={() => setSettings((prev) => ({ ...prev, timerEnabled: !prev.timerEnabled }))}>
            {settings.timerEnabled ? "Ativo" : "Pausado"}
          </Button>
        </div>

        <div className="settings-row">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              {settings.theme === "light" ? <SunMedium className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </div>
            <div>
              <p className="font-semibold">Tema visual</p>
              <p className="text-xs text-muted-foreground">Alterna entre claro e escuro.</p>
            </div>
          </div>
          <Button variant="surface" size="pill" className="h-9" onClick={() => setSettings((prev) => ({ ...prev, theme: prev.theme === "light" ? "dark" : "light" }))}>
            {settings.theme === "light" ? "Modo claro" : "Modo escuro"}
          </Button>
        </div>

        <div className="settings-row">
          <div>
            <p className="font-semibold">Termos de Uso</p>
            <p className="text-xs text-muted-foreground">Revise as condições e o aviso sobre anúncios.</p>
          </div>
          <Button variant="soft" size="pill" className="h-9" onClick={() => setShowTermsModal(true)}>
            Visualizar termos
          </Button>
        </div>
      </div>
    </div>
  );

  const renderScreen = () => {
    switch (activeTab) {
      case "home":
        return renderHome();
      case "categories":
        return renderCategories();
      case "quiz":
        return renderQuiz();
      case "ranking":
        return renderRanking();
      case "settings":
        return renderSettings();
      default:
        return null;
    }
  };

  if (!isHydrated) {
    return (
      <div className="app-shell justify-center px-5">
        <div className="surface-card animate-pulse space-y-3">
          <div className="h-6 w-36 rounded-full bg-muted" />
          <div className="h-24 rounded-3xl bg-muted" />
          <div className="h-12 rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-0 md:px-4">
      <div className="app-shell h-screen md:h-[820px]">
        <header className="flex items-center justify-between px-5 pb-3 pt-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Quiz interativo</p>
            <p className="text-lg font-semibold">Protótipo Android-like</p>
          </div>
          <div className="rounded-2xl border border-border bg-card/90 px-3 py-2 shadow-soft">
            <p className="text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">XP total</p>
            <p className="text-sm font-bold">{totalPoints}</p>
          </div>
        </header>

        <main ref={mainContentRef} className="min-h-0 flex-1 overflow-y-auto px-5 pb-28">{renderScreen()}</main>

        <nav className="bottom-nav absolute inset-x-0 bottom-0 z-20">
          <div className="flex items-center gap-2 rounded-[1.65rem] border border-border bg-card/80 p-2 shadow-soft backdrop-blur-xl">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <button key={item.id} type="button" className="nav-pill" data-active={activeTab === item.id} onClick={() => setActiveTab(item.id)}>
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {(modalIsBlocking || showTermsModal) && (
          <div className="absolute inset-0 z-50 flex items-end bg-foreground/50 px-4 pb-4 pt-10 backdrop-blur-sm md:items-center md:justify-center md:p-6">
            <div className="w-full max-w-sm rounded-[1.75rem] border border-border bg-card p-5 shadow-float">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Termos de Uso</p>
              <h2 className="mt-2 text-2xl">Antes de começar</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Você precisa aceitar os termos no primeiro acesso para desbloquear o app. Este protótipo também informa que exibe anúncios.
              </p>

              <div className="mt-4 space-y-3">
                {termsSections.map((section) => (
                  <div key={section.title} className="rounded-2xl bg-surface-strong/90 p-4">
                    <p className="text-sm font-semibold">{section.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{section.body}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {!modalIsBlocking && (
                  <Button variant="surface" size="pill" onClick={() => setShowTermsModal(false)}>
                    Fechar
                  </Button>
                )}
                <Button
                  variant="hero"
                  size="pill"
                  className={cn(modalIsBlocking ? "sm:col-span-2" : "")}
                  onClick={() => {
                    setAcceptedTerms(true);
                    setShowTermsModal(false);
                  }}
                >
                  Aceito os termos
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};