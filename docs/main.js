let engine;
let prefix = "";
let autor = [];        // quem jogou cada letra do prefixo: "voce" ou "ia"
let pendente = "";     // o que você digitou e ainda não confirmou com ENTER
let revelada = "";     // palavra mostrada num desafio, exibida no fim do jogo
let status = "Carregando dicionário…";
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
    ["á", "â", "ã", "é", "ê", "í", "ó", "ô", "õ", "ú", "ç"],
];
const LETRA = /^[a-zà-öø-ÿ]$/;

function nivelSalvo() {
    try {
        const n = localStorage.getItem("ghost-nivel");
        if (n in NIVEIS) return n;
    } catch (e) {}
    return "facil";
}

function aplicarNivel(nome) {
    const n = NIVEIS[nome];
    engine.set_depth(n.depth);
    engine.set_vocabulary(n.vocab);
    engine.set_creativity(n.creativity);
    engine.set_bluff(n.bluff);
    engine.set_attention(n.attention);
    try { localStorage.setItem("ghost-nivel", nome); } catch (e) {}
}

// precisa existir antes do ghost.js carregar
var Module = {
    onRuntimeInitialized() {
        engine = new Module.GhostEngine();
        if (!engine.ready()) {
            status = "Erro: não foi possível carregar o dicionário.";
            return render();
        }
        el("nivel").value = nivelSalvo();
        aplicarNivel(el("nivel").value);
        novoJogo();
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
    el("desafiar").disabled = !suaVez || prefix === "";
    el("teclado").classList.toggle("desligado", fim);
    el("adicionar").hidden = !(temServidor && fim && recusada);
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
            b.setAttribute("aria-label", k === "⌫" ? "apagar" : k);
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

function encerrar(msg) {
    fim = true;
    defendendo = false;
    pendente = "";
    status = msg;
    render();
}

function novoJogo() {
    prefix = "";
    autor = [];
    pendente = "";
    revelada = "";
    recusada = "";
    desenhados = 0;
    fim = false;
    defendendo = false;
    status = "Sua vez: digite uma letra e aperte ENTER.";
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
    acrescentar(letra, "voce");
    if (completou()) {
        return encerrar(`Você completou a palavra "${prefix}". Você perdeu!`);
    }
    vezDaIA();
}

function vezDaIA() {
    if (engine.challenge(prefix)) {
        defendendo = true;
        pendente = "";
        status = `A IA te desafiou! Complete uma palavra que comece com "${prefix}" e aperte ENTER.`;
        return render();
    }

    const lance = engine.best_move(prefix);
    if (lance === "") {
        return encerrar(`A IA desistiu em "${prefix}". Você venceu!`);
    }

    acrescentar(lance, "ia");
    if (completou()) {
        return encerrar(`A IA completou a palavra "${prefix}". Você venceu!`);
    }
    status = `A IA jogou "${lance}". Sua vez.`;
    render();
}

function defender(palavra) {
    if (!defendendo || palavra === prefix) return;

    if (engine.check(palavra) === Module.WordState.completo) {
        revelada = palavra;
        return encerrar(`"${palavra}" vale! A IA desafiou errado. Você venceu!`);
    }
    recusada = palavra;
    revelada = engine.reveal_word(prefix);
    encerrar(revelada
        ? `"${palavra}" não está no dicionário. Uma palavra válida seria "${revelada}". Você perdeu!`
        : `"${palavra}" não está no dicionário. Era blefe mesmo. Você perdeu!`);
}

function desafiar() {
    if (fim || defendendo || prefix === "") return;
    revelada = engine.reveal_word(prefix);
    if (revelada) {
        encerrar(`A IA mostrou "${revelada}". Não era blefe, você perdeu!`);
    } else {
        encerrar(`Nenhuma palavra começa com "${prefix}": era blefe! Você venceu!`);
    }
}

// ---------- dicionário colaborativo ----------

// palavras que outros jogadores já adicionaram. Só existe com o server.py:
// hospedado como site estático, as sugestões ficam escondidas
async function carregarExtras() {
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
    if (!palavra) return { ok: false, motivo: "Digite uma palavra." };
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
        return { ok: false, motivo: "Servidor de sugestões indisponível (rode: make serve)." };
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
        status = `Agora "${palavra}" vale! A IA desafiou errado. Você venceu!`;
    } else {
        status = `${r.motivo} O resultado continua: você perdeu.`;
    }
    render();
}

el("adicionar").addEventListener("click", adicionarRecusada);

el("abrir-sugerir").addEventListener("click", () => {
    el("sugestao").value = "";
    el("sugestao-resultado").textContent = "";
    el("sugerir").showModal();
});

el("fechar-sugerir").addEventListener("click", () => el("sugerir").close());

el("form-sugerir").addEventListener("submit", async (e) => {
    e.preventDefault();
    el("sugestao-resultado").textContent = "Conferindo…";
    const r = await sugerir(el("sugestao").value);
    el("sugestao-resultado").textContent = r.ok
        ? `"${r.palavra}" entrou no dicionário. Obrigado!`
        : r.motivo;
    if (r.ok) el("sugestao").value = "";
});

// ---------- botões ----------

montarTeclado();
render();

el("desafiar").addEventListener("click", desafiar);

el("novo").addEventListener("click", () => {
    if (engine && engine.ready()) novoJogo();
});

el("nivel").addEventListener("change", (e) => {
    if (engine) aplicarNivel(e.target.value);
});

el("abrir-regras").addEventListener("click", () => el("regras").showModal());
