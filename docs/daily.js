// Desafio do dia: 3 rounds (Fácil → Médio → Difícil), o mesmo para todo mundo.
// Sem servidor: o desafio sai do número do dia (seed) e o progresso fica no localStorage.
// Usa o estado e as funções de docs/main.js (carregado antes).

const DIA_ZERO = Date.UTC(2026, 9, 6);           // desafio #1
const NIVEIS_ROUND = ["facil", "medio", "dificil"];
// letras de abertura que começam muitas palavras no idioma
const ABERTURAS = LANG === "pt" ? "cmpsadtrbefglnov" : "sctpbmdafrhwlgei";
const CHAVE_DAILY = `ghost-daily-${LANG}`;
const CHAVE_STATS = `ghost-stats-${LANG}`;
const URL_JOGO = LANG === "pt"
    ? "https://lucaskiyosh.github.io/ghost-game/"
    : "https://lucaskiyosh.github.io/ghost-game/en/";

function numeroDoDia(agora = new Date()) {
    const hoje = Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate());
    return Math.floor((hoje - DIA_ZERO) / 86400000) + 1;
}

// PRNG pequeno e determinístico: mesma seed, mesma sequência em qualquer navegador
function mulberry32(a) {
    return () => {
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function letraInicial(dia, round) {
    return ABERTURAS[Math.floor(mulberry32(dia * 7919 + round)() * ABERTURAS.length)];
}

function ler(chave, padrao) {
    try { return JSON.parse(localStorage.getItem(chave)) ?? padrao; } catch (e) { return padrao; }
}

function gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) {}
}

// {dia, rounds: ["voce" | "ia", ...], tabuleiro: {prefix, autor, defendendo} | null}
let daily = null;
let roundEncerrado = false;
const textoNovoOriginal = el("novo").textContent;

function carregarDaily() {
    const hoje = numeroDoDia();
    const salvo = ler(CHAVE_DAILY, null);
    daily = salvo && salvo.dia === hoje ? salvo : { dia: hoje, rounds: [], tabuleiro: null };
}

const dailyTerminou = () => daily.rounds.length >= 3;
const roundAtual = () => Math.min(daily.rounds.length + 1, 3);
const vitorias = () => daily.rounds.filter((r) => r === "voce").length;

function prepararMotor(round, extraSeed = 0) {
    nivelDaily = NIVEIS_ROUND[round - 1];
    aplicarNivel(nivelDaily, false);
    engine.set_seed(daily.dia * 10 + round + extraSeed);
}

function iniciarRound() {
    const r = roundAtual();
    const l = letraInicial(daily.dia, r);
    prepararMotor(r);
    roundEncerrado = false;
    if (r === 1) evento("daily/inicio");
    novoJogo(l, T.roundSuaVez(r, T.nomesNivel[nivelDaily], l));
}

// a página foi recarregada no meio de um round: volta exatamente onde estava
function retomarRound() {
    const r = roundAtual();
    const t = daily.tabuleiro;
    prepararMotor(r, 1000 * Array.from(t.prefix).length);
    roundEncerrado = false;
    novoJogo();
    prefix = t.prefix;
    autor = t.autor.slice();
    defendendo = t.defendendo;
    desenhados = autor.length;
    status = defendendo
        ? T.iaDesafiou(prefix)
        : T.roundSuaVez(r, T.nomesNivel[nivelDaily], letraInicial(daily.dia, r));
    render();
}

function registrarEstatisticas() {
    const s = ler(CHAVE_STATS, { jogados: 0, vencidos: 0, streak: 0, maxStreak: 0, ultimoDia: 0 });
    if (s.ultimoDia === daily.dia) return s;          // já contado hoje
    s.streak = s.ultimoDia === daily.dia - 1 ? s.streak + 1 : 1;
    s.maxStreak = Math.max(s.maxStreak, s.streak);
    s.jogados += 1;
    if (vitorias() >= 2) s.vencidos += 1;
    s.ultimoDia = daily.dia;
    gravar(CHAVE_STATS, s);
    return s;
}

aoEncerrar = (resultado) => {
    if (modo !== "daily" || roundEncerrado) return;
    roundEncerrado = true;
    const r = roundAtual();
    const quem = resultado === "vitoria" ? "voce" : "ia";
    daily.rounds.push(quem);
    daily.tabuleiro = null;
    gravar(CHAVE_DAILY, daily);
    evento(`daily/round/${r}/${quem}`);

    status = `${status} ${quem === "voce" ? T.roundVoceVenceu(r) : T.roundIaVenceu(r)}`;
    if (dailyTerminou()) {
        registrarEstatisticas();
        evento(`daily/fim/${vitorias()}x${3 - vitorias()}`);
        setTimeout(abrirResultado, 1200);
    }
    render();
};

aoNovo = () => {
    if (modo !== "daily") return novoJogo();
    if (dailyTerminou()) return abrirResultado();
    if (fim) iniciarRound();
};

aoRender = () => {
    const noDaily = modo === "daily";
    el("rounds").hidden = !noDaily;
    el("nivel").hidden = noDaily;
    if (!noDaily) {
        el("novo").textContent = textoNovoOriginal;
        el("novo").hidden = false;
        return;
    }

    // no meio de um round não dá para recomeçar
    el("novo").hidden = !fim;
    el("novo").textContent = dailyTerminou() ? T.verResultado : T.proximoRound;

    el("rounds").querySelectorAll("span").forEach((s, i) => {
        s.className = daily.rounds[i] || (i === daily.rounds.length && !dailyTerminou() ? "atual" : "");
    });

    if (!fim) {
        daily.tabuleiro = { prefix, autor: autor.slice(), defendendo };
        gravar(CHAVE_DAILY, daily);
    }
};

// ---------- abas ----------

function marcarAba() {
    el("aba-daily").classList.toggle("ativa", modo === "daily");
    el("aba-pratica").classList.toggle("ativa", modo === "pratica");
    el("aba-daily").textContent = T.abaDaily(numeroDoDia());
}

function entrarDaily() {
    modo = "daily";
    carregarDaily();                 // pode ter virado o dia com a página aberta
    marcarAba();
    if (dailyTerminou()) {
        nivelDaily = "dificil";
        novoJogo();
        fim = true;
        status = T.placar(vitorias(), 3 - vitorias());
        render();
        abrirResultado();
    } else if (daily.tabuleiro) {
        retomarRound();
    } else {
        iniciarRound();
    }
}

function entrarPratica() {
    modo = "pratica";
    marcarAba();
    aplicarNivel(el("nivel").value);
    evento("modo/pratica");
    novoJogo("", T.praticaStatus);
}

el("aba-daily").addEventListener("click", entrarDaily);
el("aba-pratica").addEventListener("click", entrarPratica);

// motor pronto: começa no desafio do dia
aoIniciar = () => entrarDaily();

// ---------- resultado ----------

function provocacao() {
    const lista = T.provocacoes[vitorias()];
    return lista[Math.floor(mulberry32(daily.dia * 31)() * lista.length)];
}

function textoCompartilhar(streak) {
    return [
        `👻 GHOST #${daily.dia}`,
        ...daily.rounds.map((r, i) => `${r === "voce" ? "🟢" : "🔴"} Round ${i + 1}`),
        T.placar(vitorias(), 3 - vitorias()),
        `"${provocacao()}"`,
        T.shareStreak(streak),
        URL_JOGO,
    ].join("\n");
}

function atualizarContagem() {
    const agora = new Date();
    const amanha = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);
    const min = Math.max(0, Math.ceil((amanha - agora) / 60000));
    el("res-proximo").textContent = T.proximoDesafio(Math.floor(min / 60), min % 60);
}

let relogio = null;

function abrirResultado() {
    if (el("resultado").open || !dailyTerminou()) return;
    const s = ler(CHAVE_STATS, { streak: 1 });
    el("res-titulo").textContent = `👻 GHOST #${daily.dia}`;
    el("res-rounds").replaceChildren(...daily.rounds.map((r, i) => {
        const d = document.createElement("div");
        d.className = "res-round " + r;
        d.textContent = `Round ${i + 1}`;
        return d;
    }));
    el("res-placar").textContent = T.placar(vitorias(), 3 - vitorias());
    el("res-provocacao").textContent = `“${provocacao()}”`;
    el("res-streak").textContent = T.streak(s.streak);
    el("res-copiado").hidden = true;
    el("res-compartilhar").textContent = T.compartilhar;
    el("res-pratica").textContent = T.modoPratica;
    atualizarContagem();
    clearInterval(relogio);
    relogio = setInterval(atualizarContagem, 30000);
    el("resultado").showModal();
}

el("resultado").addEventListener("close", () => clearInterval(relogio));
el("resultado").addEventListener("click", (e) => {
    if (e.target === el("resultado")) el("resultado").close();
});

el("res-compartilhar").addEventListener("click", async () => {
    const texto = textoCompartilhar(ler(CHAVE_STATS, { streak: 1 }).streak);
    evento("daily/compartilhar");
    if (navigator.share) {
        try { await navigator.share({ text: texto }); return; } catch (e) {
            if (e && e.name === "AbortError") return;    // a pessoa cancelou
        }
    }
    try {
        await navigator.clipboard.writeText(texto);
        el("res-copiado").textContent = T.copiado;
        el("res-copiado").hidden = false;
    } catch (e) {}
});

el("res-pratica").addEventListener("click", () => {
    el("resultado").close();
    entrarPratica();
});
