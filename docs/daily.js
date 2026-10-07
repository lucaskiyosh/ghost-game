// Desafio do dia: 3 rounds (Fácil → Médio → Difícil), o mesmo para todo mundo.
// Sem servidor: o desafio sai do número do dia (seed) e o progresso fica no localStorage.
// Usa o estado e as funções de docs/main.js (carregado antes).

const DIA_ZERO = Date.UTC(2026, 9, 6);           // desafio #1
const NIVEIS_ROUND = ["facil", "medio", "dificil"];
// quem abre cada round: você escolhe a 1ª letra nos rounds 1 e 3; no 2 a IA abre com a letra do dia
const QUEM_ABRE = ["voce", "ia", "voce"];
// letras de abertura que começam muitas palavras no idioma
const ABERTURAS = LANG === "pt" ? "cmpsadtrbefglnov" : "sctpbmdafrhwlgei";
const CHAVE_DAILY = `ghost-daily-${LANG}`;
const CHAVE_STATS = `ghost-stats-${LANG}`;
// o parâmetro de campanha faz o GoatCounter mostrar em "Campaigns" quem veio por um compartilhamento
const URL_JOGO = (LANG === "pt"
    ? "https://lucaskiyosh.github.io/ghost-game/"
    : "https://lucaskiyosh.github.io/ghost-game/en/") + "?utm_campaign=share";

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
let resultadoPendente = false;   // 3º round acabou e o resultado está prestes a abrir
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

function statusInicial(r) {
    const nivel = T.nomesNivel[NIVEIS_ROUND[r - 1]];
    return QUEM_ABRE[r - 1] === "ia"
        ? T.roundSuaVez(r, nivel, letraInicial(daily.dia, r))
        : T.roundVoceComeca(r, nivel);
}

function iniciarRound() {
    const r = roundAtual();
    prepararMotor(r);
    roundEncerrado = false;
    if (r === 1) evento("daily/inicio");
    novoJogo(QUEM_ABRE[r - 1] === "ia" ? letraInicial(daily.dia, r) : "", statusInicial(r));
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
    status = defendendo ? T.iaDesafiou(prefix) : statusInicial(r);
    render();
}

function registrarEstatisticas() {
    const s = lerStats();
    if (s.ultimoDia === daily.dia) return s;          // já contado hoje
    s.streak = s.ultimoDia === daily.dia - 1 ? s.streak + 1 : 1;
    s.maxStreak = Math.max(s.maxStreak, s.streak);
    s.jogados += 1;
    if (vitorias() >= 2) s.vencidos += 1;
    s.placares[placarHoje()] += 1;
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

    // a IA comenta o round (mesma fala para todo mundo no dia)
    const falas = quem === "voce" ? T.falaRoundGanhou : T.falaRoundPerdeu;
    const fala = falas[Math.floor(mulberry32(daily.dia * 97 + r)() * falas.length)];
    status = `${status} ${quem === "voce" ? T.roundVoceVenceu(r) : T.roundIaVenceu(r)} 👻 "${fala}"`;
    if (dailyTerminou()) {
        registrarEstatisticas();
        evento(`daily/fim/${vitorias()}x${3 - vitorias()}`);
        funil("5-daily-completo");
        // abre sozinho, só depois da animação do último tile
        resultadoPendente = true;
        setTimeout(abrirResultado, 500);
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

    // no meio de um round não dá para recomeçar; com o resultado aberto (ou abrindo) o botão some
    el("novo").hidden = !fim || resultadoPendente || el("resultado").open;
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

// ---------- progresso (resultado do dia + estatísticas, no estilo do term.ooo) ----------

const PLACARES = ["3x0", "2x1", "1x2", "0x3"];
const placarHoje = () => `${vitorias()}x${3 - vitorias()}`;
const falaIa = () => T.provocacoes[vitorias()];      // [frase principal, segunda linha]

function lerStats() {
    const s = ler(CHAVE_STATS, null) || { jogados: 0, vencidos: 0, streak: 0, maxStreak: 0, ultimoDia: 0 };
    if (!s.placares) {
        // estatísticas antigas não tinham a distribuição: começa do zero, contando o dia de hoje
        s.placares = { "3x0": 0, "2x1": 0, "1x2": 0, "0x3": 0 };
        if (daily && s.ultimoDia === daily.dia && dailyTerminou()) s.placares[placarHoje()] += 1;
        gravar(CHAVE_STATS, s);
    }
    return s;
}

// a sequência só vale se o último dia jogado foi hoje ou ontem
const sequenciaAtual = (s) => (s.ultimoDia >= numeroDoDia() - 1 ? s.streak : 0);

function textoCompartilhar() {
    const [fala, fala2] = falaIa();
    return [
        `👻 GHOST #${daily.dia} · ${T.placar(vitorias(), 3 - vitorias())}`,
        daily.rounds.map((r) => (r === "voce" ? "🟢" : "🔴")).join(""),
        T.shareIa(`${fala} ${fala2}`),
        T.shareSequencia(sequenciaAtual(lerStats())),
        URL_JOGO,
    ].join("\n");
}

function atualizarContagem() {
    const agora = new Date();
    const amanha = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);
    const seg = Math.max(0, Math.floor((amanha - agora) / 1000));
    const dois = (n) => String(n).padStart(2, "0");
    el("res-proximo").textContent = `${dois(Math.floor(seg / 3600))}:${dois(Math.floor(seg / 60) % 60)}:${dois(seg % 60)}`;
}

// a fala principal aparece letra por letra, como se a IA estivesse digitando
let digitando = null;
function digitar(alvo, texto) {
    clearTimeout(digitando);
    const letras = Array.from(texto);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        alvo.textContent = texto;
        return;
    }
    let i = 0;
    alvo.textContent = "";
    const passo = () => {
        alvo.textContent = letras.slice(0, ++i).join("");
        if (i < letras.length) digitando = setTimeout(passo, 35);
    };
    passo();
}

function preencherDistribuicao(s, destacar) {
    const max = Math.max(1, ...PLACARES.map((k) => s.placares[k]));
    el("res-dist").replaceChildren(...PLACARES.map((k) => {
        const linha = document.createElement("div");
        linha.className = "dist-linha";
        const rotulo = document.createElement("span");
        rotulo.className = "dist-rotulo";
        rotulo.textContent = k.replace("x", " × ");
        const barra = document.createElement("span");
        const n = s.placares[k];
        barra.className = "barra" + (n === 0 ? " zero" : "") + (k === destacar ? " hoje" : "");
        barra.style.width = n === 0 ? "" : `max(1.8rem, ${(n / max) * 100}%)`;
        barra.textContent = n;
        linha.append(rotulo, barra);
        return linha;
    }));
}

let relogio = null;

function abrirProgresso() {
    resultadoPendente = false;
    if (el("resultado").open) return;
    const terminou = modo === "daily" ? dailyTerminou() : (carregarDaily(), dailyTerminou());
    const s = lerStats();

    // hoje: a fala da IA em destaque, os rounds e o placar (só depois de terminar o desafio)
    el("res-hoje").hidden = !terminou;
    el("res-compartilhar").hidden = !terminou;
    if (terminou) {
        const [fala, fala2] = falaIa();
        el("res-ia-rotulo").textContent = T.iaAchou;
        el("res-fala2").textContent = fala2;
        el("res-titulo").textContent = `GHOST #${daily.dia}`;
        el("res-rounds").textContent = daily.rounds.map((r) => (r === "voce" ? "🟢" : "🔴")).join("");
        el("res-placar").textContent = T.placar(vitorias(), 3 - vitorias());
        digitar(el("res-fala"), fala);
    }

    el("res-progresso-titulo").textContent = T.progresso;
    el("st-jogos").textContent = s.jogados;
    el("st-pct").textContent = `${s.jogados ? Math.round((s.vencidos / s.jogados) * 100) : 0}%`;
    el("st-seq").textContent = sequenciaAtual(s);
    el("st-max").textContent = s.maxStreak;
    el("st-jogos-rot").textContent = T.jogos;
    el("st-pct-rot").textContent = T.deVitorias;
    el("st-seq-rot").textContent = T.sequencia;
    el("st-max-rot").textContent = T.melhorSequencia;
    el("res-dist-titulo").textContent = T.distribuicao;
    preencherDistribuicao(s, terminou ? placarHoje() : "");

    el("res-proximo-rot").textContent = T.proximoEm;
    el("res-compartilhar-txt").textContent = T.compartilhar;
    el("res-pratica").textContent = T.modoPratica;
    el("res-pratica").hidden = modo === "pratica";
    el("res-copiado").hidden = true;

    atualizarContagem();
    clearInterval(relogio);
    relogio = setInterval(atualizarContagem, 1000);
    el("resultado").showModal();
    render();
}

// usado pelo fim do desafio e pelo botão "Ver resultado"
function abrirResultado() {
    if (dailyTerminou()) abrirProgresso();
    else resultadoPendente = false;
}

el("abrir-progresso").addEventListener("click", abrirProgresso);
el("res-fechar").addEventListener("click", () => el("resultado").close());

// fecha só com Esc ou "modo prática" (clicar fora fechava sem querer no celular);
// depois de fechado, o botão "Ver resultado" reabre
el("resultado").addEventListener("close", () => {
    clearInterval(relogio);
    clearTimeout(digitando);
    render();
});

el("res-compartilhar").addEventListener("click", async () => {
    const texto = textoCompartilhar();
    evento("daily/compartilhar");
    funil("6-compartilhou");
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

// ---------- retorno (retenção sem identificar ninguém) ----------

// uma vez por visita: nova, ou voltou depois de quanto tempo (comum aos dois idiomas)
(function marcarVisita() {
    const hoje = numeroDoDia();
    const ultima = ler("ghost-ultima-visita", null);
    if (ultima === null) {
        evento("visita/nova");
        gravar("ghost-primeira-visita", hoje);
    } else {
        const dias = hoje - ultima;
        evento(`visita/retorno/${dias <= 0 ? "mesmo-dia" : dias === 1 ? "1-dia" : dias <= 7 ? "2-7-dias" : "8+-dias"}`);
    }
    gravar("ghost-ultima-visita", hoje);
})();
