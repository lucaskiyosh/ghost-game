// a página em inglês (docs/en/) tem <html lang="en"> e carrega este mesmo arquivo
const LANG = document.documentElement.lang === "en" ? "en" : "pt";

const TEXTOS = {
    pt: {
        carregando: "Carregando dicionário…",
        erroDicionario: "Erro: não foi possível carregar o dicionário.",
        suaVez: "Sua vez: escolha uma letra (sem completar palavra) e aperte ENTER.",
        voceCompletou: (p) => `Você completou a palavra "${p}". Você perdeu!`,
        iaDesafiou: (p) => `⚠ A IA te desafiou! Ela acha que "${p}" é blefe. Digite o resto da palavra que você tinha em mente (a palavra inteira) e aperte ENTER.`,
        continueDigitando: (w) => `"${w}" ainda não é uma palavra completa. Continue digitando até o fim da palavra e aperte ENTER.`,
        iaDesistiu: (p) => `A IA desistiu em "${p}". Você venceu!`,
        iaCompletou: (p) => `A IA completou a palavra "${p}". Você venceu!`,
        iaJogou: (l) => `A IA jogou "${l}". Sua vez.`,
        defesaValeu: (w) => `"${w}" vale! A IA desafiou errado. Você venceu!`,
        defesaFalhouComExemplo: (w, ex) => `"${w}" não está no dicionário. Uma palavra válida seria "${ex}". Você perdeu!`,
        defesaFalhouBlefe: (w) => `"${w}" não está no dicionário. Era blefe mesmo. Você perdeu!`,
        iaMostrou: (w) => `A IA mostrou "${w}". Não era blefe, você perdeu!`,
        eraBlefe: (p) => `Nenhuma palavra começa com "${p}": era blefe! Você venceu!`,
        digitePalavra: "Digite uma palavra.",
        servidorFora: "Servidor de sugestões indisponível (rode: make serve).",
        agoraVale: (w) => `Agora "${w}" vale! A IA desafiou errado. Você venceu!`,
        continuaPerdeu: (motivo) => `${motivo} O resultado continua: você perdeu.`,
        conferindo: "Conferindo…",
        entrou: (w) => `"${w}" entrou no dicionário. Obrigado!`,
        apagar: "apagar",
        // desafio do dia
        abaDaily: (n) => `Desafio do dia #${n}`,
        abaPratica: "Prática",
        nomesNivel: { facil: "Fácil", medio: "Médio", dificil: "Difícil" },
        roundSuaVez: (r, nivel, l) => `Round ${r} de 3 · ${nivel}. A IA começou com "${l}". Sua vez.`,
        roundVoceVenceu: (r) => `Você ganhou o round ${r}!`,
        roundIaVenceu: (r) => `A IA ganhou o round ${r}.`,
        proximoRound: "Próximo round",
        verResultado: "Ver resultado",
        placar: (v, ia) => `Você ${v} × ${ia} IA`,
        streak: (n) => `🔥 Sequência: ${n} ${n === 1 ? "dia" : "dias"}`,
        proximoDesafio: (h, m) => `Próximo desafio em ${h}h ${String(m).padStart(2, "0")}min`,
        compartilhar: "Compartilhar",
        copiado: "Copiado! Cole onde quiser.",
        modoPratica: "Modo prática",
        praticaStatus: "Modo prática: não conta para o desafio do dia. Sua vez.",
        shareStreak: (n) => `🔥 ${n} ${n === 1 ? "dia" : "dias"}`,
        provocacoes: {
            0: ["Vamos fingir que isso nunca aconteceu.", "Eu esperava mais de você.",
                "Foi você que escolheu jogar contra mim.", "3 rodadas e você ainda não conseguiu? 😭"],
            1: ["Quase. Mas quase não conta.", "Um round. Que fofo."],
            2: ["Você teve sorte.", "Aproveita. Amanhã eu não erro."],
            3: ["…Isso não aconteceu.", "Tá. Hoje foi seu dia. Amanhã eu volto."],
        },
    },
    en: {
        carregando: "Loading dictionary…",
        erroDicionario: "Error: the dictionary could not be loaded.",
        suaVez: "Your turn: pick a letter (without finishing a word) and press ENTER.",
        voceCompletou: (p) => `You completed the word "${p}". You lose!`,
        iaDesafiou: (p) => `⚠ The AI challenged you! It thinks "${p}" is a bluff. Type the rest of the word you had in mind (the whole word) and press ENTER.`,
        continueDigitando: (w) => `"${w}" isn't a complete word yet. Keep typing to the end of the word and press ENTER.`,
        iaDesistiu: (p) => `The AI gave up at "${p}". You win!`,
        iaCompletou: (p) => `The AI completed the word "${p}". You win!`,
        iaJogou: (l) => `The AI played "${l}". Your turn.`,
        defesaValeu: (w) => `"${w}" counts! The AI's challenge was wrong. You win!`,
        defesaFalhouComExemplo: (w, ex) => `"${w}" isn't in the dictionary. A valid word would be "${ex}". You lose!`,
        defesaFalhouBlefe: (w) => `"${w}" isn't in the dictionary. It really was a bluff. You lose!`,
        iaMostrou: (w) => `The AI showed "${w}". It wasn't a bluff, you lose!`,
        eraBlefe: (p) => `No word starts with "${p}": it was a bluff! You win!`,
        digitePalavra: "Type a word.",
        servidorFora: "Suggestion server unavailable.",
        agoraVale: (w) => `"${w}" counts now! The AI's challenge was wrong. You win!`,
        continuaPerdeu: (motivo) => `${motivo} The result stands: you lose.`,
        conferindo: "Checking…",
        entrou: (w) => `"${w}" was added to the dictionary. Thanks!`,
        apagar: "delete",
        abaDaily: (n) => `Daily #${n}`,
        abaPratica: "Practice",
        nomesNivel: { facil: "Easy", medio: "Medium", dificil: "Hard" },
        roundSuaVez: (r, nivel, l) => `Round ${r} of 3 · ${nivel}. The AI opened with "${l}". Your turn.`,
        roundVoceVenceu: (r) => `You won round ${r}!`,
        roundIaVenceu: (r) => `The AI won round ${r}.`,
        proximoRound: "Next round",
        verResultado: "See result",
        placar: (v, ia) => `You ${v} × ${ia} AI`,
        streak: (n) => `🔥 ${n}-day streak`,
        proximoDesafio: (h, m) => `Next challenge in ${h}h ${String(m).padStart(2, "0")}m`,
        compartilhar: "Share",
        copiado: "Copied! Paste it anywhere.",
        modoPratica: "Practice mode",
        praticaStatus: "Practice mode: doesn't count for the daily. Your turn.",
        shareStreak: (n) => `🔥 ${n} ${n === 1 ? "day" : "days"}`,
        provocacoes: {
            0: ["Let's pretend that never happened.", "I expected more from you.",
                "You chose to play against me.", "3 rounds and still nothing? 😭"],
            1: ["Close. But close doesn't count.", "One round. How cute."],
            2: ["You got lucky.", "Enjoy it. I won't miss tomorrow."],
            3: ["…That didn't happen.", "Fine. Today was your day. I'll be back tomorrow."],
        },
    },
};
const T = TEXTOS[LANG];

// ---------- métricas (GoatCounter) ----------

// código de xxx.goatcounter.com; vazio = sem métricas (nada é enviado)
const GOATCOUNTER = "lucaskiyoshi";

const filaEventos = [];

function evento(nome) {
    if (!GOATCOUNTER) return;
    const dados = { path: `${LANG}/${nome}`, title: nome, event: true };
    try {
        if (window.goatcounter && window.goatcounter.count) window.goatcounter.count(dados);
        else filaEventos.push(dados);
    } catch (e) {}
}

if (GOATCOUNTER) {
    // conta a visita sozinho; em localhost o count.js não envia nada
    const s = document.createElement("script");
    s.async = true;
    s.src = "//gc.zgo.at/count.js";
    s.dataset.goatcounter = `https://${GOATCOUNTER}.goatcounter.com/count`;
    s.onload = () => {
        try { while (filaEventos.length) window.goatcounter.count(filaEventos.shift()); } catch (e) {}
    };
    document.head.append(s);
    document.addEventListener("DOMContentLoaded", () => {
        const aviso = document.getElementById("aviso-metricas");
        if (aviso) aviso.hidden = false;
    });
}

// "pratica" (jogo livre) ou "daily" (desafio do dia, em docs/daily.js)
let modo = "pratica";
let nivelDaily = "facil";
const nivelAtual = () => modo === "daily" ? nivelDaily : document.getElementById("nivel").value;

// ganchos que o docs/daily.js preenche
let aoEncerrar = null;   // (resultado) => void, no fim de cada partida
let aoNovo = null;       // botão "Novo jogo"
let aoRender = null;     // depois de cada render (salvar tabuleiro, indicador de rounds)
let aoIniciar = null;    // motor pronto: decide o modo inicial

let engine;
let prefix = "";
let autor = [];        // quem jogou cada letra do prefixo: "voce" ou "ia"
let pendente = "";     // o que você digitou e ainda não confirmou com ENTER
let revelada = "";     // palavra mostrada num desafio, exibida no fim do jogo
let status = T.carregando;
let fim = true;
let defendendo = false; // a IA desafiou e esperamos sua palavra
let desenhados = 0;    // quantos tiles confirmados já foram animados
let temServidor = false; // a API de sugestões (server.py) está disponível?
let recusada = "";     // palavra da defesa que não estava no dicionário (pode ser sugerida)

const el = (id) => document.getElementById(id);

// depth: jogadas que a IA enxerga (-1 = todas); vocab: palavras que ela conhece (0 = todas)
// bluff: chance de blefar quando está perdendo; attention: chance de perceber o seu blefe
const NIVEIS = {
    facil:   { depth: 2,  vocab: 3000,  creativity: 0.6, bluff: 0.15, attention: 0.6 },
    medio:   { depth: 4,  vocab: 10000, creativity: 0.3, bluff: 0.3,  attention: 0.85 },
    dificil: { depth: -1, vocab: 0,     creativity: 0.1, bluff: 0.4,  attention: 1.0 },
};

const LINHAS = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l", "⌫"],
    ["z", "x", "c", "v", "b", "n", "m", "enter"],
];
if (LANG === "pt") LINHAS.push(["á", "â", "ã", "é", "ê", "í", "ó", "ô", "õ", "ú", "ç"]);
const LETRA = LANG === "pt" ? /^[a-zà-öø-ÿ]$/ : /^[a-z]$/;

function nivelSalvo() {
    try {
        const n = localStorage.getItem("ghost-nivel");
        if (n in NIVEIS) return n;
    } catch (e) {}
    return "facil";
}

function aplicarNivel(nome, salvar = true) {
    const n = NIVEIS[nome];
    engine.set_depth(n.depth);
    engine.set_vocabulary(n.vocab);
    engine.set_creativity(n.creativity);
    engine.set_bluff(n.bluff);
    engine.set_attention(n.attention);
    if (salvar) try { localStorage.setItem("ghost-nivel", nome); } catch (e) {}
}

// precisa existir antes do ghost.js carregar
var Module = {
    onRuntimeInitialized() {
        engine = new Module.GhostEngine();
        if (!engine.ready()) {
            status = T.erroDicionario;
            return render();
        }
        el("nivel").value = nivelSalvo();
        aplicarNivel(el("nivel").value);
        const primeiraVisita = !guiaJaVisto();
        if (aoIniciar) aoIniciar(primeiraVisita);
        else novoJogo();
        if (primeiraVisita) abrirGuia(true);
        carregarExtras();
    }
};

// ---------- desenho ----------

function tile(letra, classes) {
    const d = document.createElement("div");
    d.className = "tile " + classes;
    d.textContent = letra;
    return d;
}

function render(pulo = false) {
    const suaVez = !fim && !defendendo;
    const letras = Array.from(prefix);
    const box = el("tiles");
    box.replaceChildren();

    letras.forEach((l, i) => {
        box.append(tile(l, autor[i] + (i >= desenhados ? " novo" : "")));
    });
    desenhados = letras.length;

    if (defendendo) {
        // sua palavra de defesa, letra por letra, mais um tile vazio para a próxima
        for (const l of pendente) box.append(tile(l, "defesa"));
        box.append(tile("", "defesa editando"));
    } else if (suaVez) {
        box.append(tile(pendente, "editando" + (pulo && pendente ? " pulo" : "")));
    } else if (fim && revelada.startsWith(prefix)) {
        for (const l of Array.from(revelada).slice(letras.length)) box.append(tile(l, "revelado novo"));
    }
    box.style.setProperty("--n", Math.max(box.children.length, 6));

    el("status").textContent = status;
    el("status").classList.toggle("alerta", defendendo);
    el("desafiar").disabled = !suaVez || prefix === "";
    el("teclado").classList.toggle("desligado", fim);
    el("adicionar").hidden = !(temServidor && fim && recusada);
    if (aoRender) aoRender();
}

function montarTeclado() {
    const teclado = el("teclado");
    for (const linha of LINHAS) {
        const div = document.createElement("div");
        div.className = "linha" + (linha[0] === "á" ? " acentos" : "");
        for (const k of linha) {
            const b = document.createElement("button");
            b.className = "tecla" + (k.length > 1 || k === "⌫" ? " larga" : "");
            b.textContent = k;
            b.setAttribute("aria-label", k === "⌫" ? T.apagar : k);
            b.addEventListener("click", () => tecla(k));
            // não deixa a tecla virtual roubar o foco (senão ENTER do teclado físico a aciona)
            b.addEventListener("mousedown", (e) => e.preventDefault());
            div.append(b);
        }
        teclado.append(div);
    }
}

// ---------- entrada ----------

function tecla(k) {
    if (fim) return;
    if (k === "enter") {
        if (defendendo) return defender(prefix + pendente);
        return jogar(pendente);
    }
    if (k === "⌫") {
        pendente = defendendo ? Array.from(pendente).slice(0, -1).join("") : "";
        return render();
    }
    if (!LETRA.test(k)) return;
    pendente = defendendo ? pendente + k : k;
    render(true);
}

document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector("dialog[open]")) return;
    if (e.target.tagName === "SELECT") return;
    if (e.key === "Enter") { e.preventDefault(); return tecla("enter"); }
    if (e.key === "Backspace") return tecla("⌫");
    const k = e.key.toLowerCase();
    if (LETRA.test(k)) tecla(k);
});

// ---------- jogo ----------

// resultado ("vitoria"/"derrota") e motivo vão para as métricas
function encerrar(msg, resultado, motivo) {
    evento(`fim/${resultado}/${motivo}/${nivelAtual()}`);
    fim = true;
    defendendo = false;
    pendente = "";
    status = msg;
    render();
    if (aoEncerrar) aoEncerrar(resultado);
}

// letraInicial: lance de abertura da IA (desafio do dia); sem ela, você começa
function novoJogo(letraInicial = "", msg = T.suaVez) {
    prefix = "";
    autor = [];
    pendente = "";
    revelada = "";
    recusada = "";
    desenhados = 0;
    fim = false;
    defendendo = false;
    if (letraInicial) acrescentar(letraInicial, "ia");
    status = msg;
    render();
}

function acrescentar(letra, quem) {
    prefix += letra;
    autor.push(quem);
}

function completou() {
    return engine.check(prefix) === Module.WordState.completo;
}

function jogar(letra) {
    if (fim || defendendo || !letra) return;

    pendente = "";
    if (prefix === "") evento(`partida/inicio/${nivelAtual()}`);
    const antesValido = engine.check(prefix) !== Module.WordState.invalido;
    acrescentar(letra, "voce");
    if (antesValido && engine.check(prefix) === Module.WordState.invalido) evento("blefe/jogador");
    if (completou()) {
        return encerrar(T.voceCompletou(prefix), "derrota", "voce-completou");
    }
    vezDaIA();
}

function vezDaIA() {
    if (engine.challenge(prefix)) {
        evento("desafio/ia");
        defendendo = true;
        pendente = "";
        status = T.iaDesafiou(prefix);
        return render();
    }

    const lance = engine.best_move(prefix);
    if (lance === "") {
        return encerrar(T.iaDesistiu(prefix), "vitoria", "ia-desistiu");
    }

    const antesValido = engine.check(prefix) !== Module.WordState.invalido;
    acrescentar(lance, "ia");
    if (antesValido && engine.check(prefix) === Module.WordState.invalido) evento("blefe/ia");
    if (completou()) {
        return encerrar(T.iaCompletou(prefix), "vitoria", "ia-completou");
    }
    status = T.iaJogou(lance);
    render();
}

// a primeira palavra completa no caminho de "texto", depois do prefixo atual
// (ex: em "provavel" a partida já acabaria em "prova"); "" se não houver
function primeiraPalavra(texto) {
    const letras = Array.from(texto);
    for (let n = Array.from(prefix).length + 1; n <= letras.length; n++) {
        const parcial = letras.slice(0, n).join("");
        if (engine.check(parcial) === Module.WordState.completo) return parcial;
    }
    return "";
}

function defender(palavra) {
    if (!defendendo || palavra === prefix) return;

    // a defesa vale com a primeira palavra do caminho: é ali que o jogo terminaria
    palavra = primeiraPalavra(palavra) || palavra;

    // começo de palavra válido mas incompleto: não encerra, só pede para continuar
    // (antes, um ENTER no meio, como "placen" em vez de "placenta", já dava derrota)
    if (engine.check(palavra) === Module.WordState.incompleto) {
        status = T.continueDigitando(palavra);
        return render();
    }

    if (engine.check(palavra) === Module.WordState.completo) {
        revelada = palavra;
        return encerrar(T.defesaValeu(palavra), "vitoria", "defesa-valeu");
    }
    recusada = palavra;
    revelada = engine.reveal_word(prefix);
    encerrar(revelada
        ? T.defesaFalhouComExemplo(palavra, revelada)
        : T.defesaFalhouBlefe(palavra), "derrota", "defesa-falhou");
}

function desafiar() {
    if (fim || defendendo || prefix === "") return;
    evento("desafio/jogador");
    revelada = engine.reveal_word(prefix);
    if (revelada) {
        encerrar(T.iaMostrou(revelada), "derrota", "desafio-ia-mostrou");
    } else {
        encerrar(T.eraBlefe(prefix), "vitoria", "desafio-era-blefe");
    }
}

// ---------- dicionário colaborativo ----------

// palavras que outros jogadores já adicionaram. Só existe com o server.py (e só em português):
// hospedado como site estático, as sugestões ficam escondidas
async function carregarExtras() {
    if (!el("sugerir")) return;
    try {
        const r = await fetch("api/palavras-extras");
        if (!r.ok) return;
        for (const w of await r.json()) engine.add_word(w);
        temServidor = true;
        el("abrir-sugerir").hidden = false;
        el("dica-sugerir").hidden = false;
    } catch (e) {}
}

async function sugerir(palavra) {
    palavra = palavra.trim().toLowerCase();
    if (!palavra) return { ok: false, motivo: T.digitePalavra };
    try {
        const r = await fetch("api/sugerir", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ palavra }),
        });
        const dados = await r.json();
        if (dados.ok) engine.add_word(dados.palavra);
        return dados;
    } catch (e) {
        return { ok: false, motivo: T.servidorFora };
    }
}

// a defesa falhou com uma palavra fora do dicionário: tenta adicioná-la e, se valer, vira o jogo
async function adicionarRecusada() {
    const palavra = recusada;
    el("adicionar").disabled = true;
    const r = await sugerir(palavra);
    el("adicionar").disabled = false;
    recusada = "";
    if (r.ok) {
        revelada = palavra;
        status = T.agoraVale(palavra);
        evento(`fim/vitoria/agora-vale/${nivelAtual()}`);
    } else {
        status = T.continuaPerdeu(r.motivo);
    }
    render();
}

el("adicionar").addEventListener("click", adicionarRecusada);

// a página em inglês não tem o diálogo de sugestão
if (el("sugerir")) {
    el("abrir-sugerir").addEventListener("click", () => {
        el("sugestao").value = "";
        el("sugestao-resultado").textContent = "";
        el("sugerir").showModal();
    });

    el("fechar-sugerir").addEventListener("click", () => el("sugerir").close());

    el("form-sugerir").addEventListener("submit", async (e) => {
        e.preventDefault();
        el("sugestao-resultado").textContent = T.conferindo;
        const r = await sugerir(el("sugestao").value);
        el("sugestao-resultado").textContent = r.ok ? T.entrou(r.palavra) : r.motivo;
        if (r.ok) el("sugestao").value = "";
    });
}

// ---------- botões ----------

montarTeclado();
render();

el("desafiar").addEventListener("click", desafiar);

el("novo").addEventListener("click", () => {
    if (!engine || !engine.ready()) return;
    if (aoNovo) aoNovo();
    else novoJogo();
});

el("nivel").addEventListener("change", (e) => {
    evento(`nivel/${e.target.value}`);
    if (engine) aplicarNivel(e.target.value);
});

document.querySelector("a.idioma").addEventListener("click", () => {
    evento(`idioma/para-${LANG === "pt" ? "en" : "pt"}`);
});

// ---------- guia (como jogar) ----------

const passos = Array.from(document.querySelectorAll("#regras .passo"));
let passo = 0;
let guiaConcluido = false;

function mostrarPasso(i) {
    passo = i;
    passos.forEach((p, j) => { p.hidden = j !== i; });
    el("guia-voltar").disabled = i === 0;
    const proximo = el("guia-proximo");
    proximo.textContent = i === passos.length - 1 ? proximo.dataset.jogar : proximo.dataset.proximo;
    document.querySelectorAll("#regras .pontos span").forEach((s, j) => s.classList.toggle("atual", j === i));
}

function abrirGuia(auto = false) {
    evento(auto ? "guia/abriu-auto" : "guia/abriu-manual");
    guiaConcluido = false;
    mostrarPasso(0);
    el("regras").showModal();
}

// o guia abre sozinho só na primeira visita
function guiaJaVisto() {
    try {
        if (localStorage.getItem("ghost-guia-visto")) return true;
        localStorage.setItem("ghost-guia-visto", "1");
    } catch (e) {}
    return false;
}

for (let i = 0; i < passos.length; i++) el("regras").querySelector(".pontos").append(document.createElement("span"));

el("guia-voltar").addEventListener("click", () => mostrarPasso(Math.max(passo - 1, 0)));
el("guia-proximo").addEventListener("click", () => {
    if (passo === passos.length - 1) {
        guiaConcluido = true;
        el("regras").close();
    } else {
        mostrarPasso(passo + 1);
    }
});
el("regras").addEventListener("close", () => {
    evento(guiaConcluido ? "guia/concluido" : `guia/fechou-no-passo-${passo + 1}`);
});
// clicar fora do cartão fecha
el("regras").addEventListener("click", (e) => { if (e.target === el("regras")) el("regras").close(); });

el("abrir-regras").addEventListener("click", () => abrirGuia(false));
