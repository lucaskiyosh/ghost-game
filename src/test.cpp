#include "ghost_engine.h"
#include <algorithm>
#include <chrono>
#include <fstream>
#include <iostream>
#include <set>

namespace {
    int falhas = 0;

    void esperar(bool ok, const std::string& descricao)
    {
        std::cout << (ok ? "[ok]    " : "[FALHA] ") << descricao << "\n";
        if (!ok) ++falhas;
    }

    int nota(ghost_engine& engine, const std::string& prefix, const std::string& move)
    {
        for (const auto& m : engine.scored_moves(prefix)) {
            if (m.first == move) return m.second;
        }
        return -1000; // lance inexistente
    }
}

int main() {
    ghost_engine engine;
    engine.set_seed(42);
    esperar(engine.ready(), "dicionario carregado");
    if (!engine.ready()) return 1;

    // check
    esperar(engine.check("abelh") == word_state::incompleto, "check(abelh) == incompleto");
    esperar(engine.check("abelha") == word_state::completo, "check(abelha) == completo");
    esperar(engine.check("xqz") == word_state::invalido, "check(xqz) == invalido");
    esperar(engine.check("mar") == word_state::incompleto, "check(mar) == incompleto (< 4 letras)");
    esperar(engine.check("ação") == word_state::completo, "check(ação) == completo (acentos)");

    // lances acentuados aparecem como letra inteira
    bool tem_cedilha = false;
    for (const auto& m : engine.scored_moves("a")) {
        if (m.first == "ç") tem_cedilha = true;
    }
    esperar(tem_cedilha, "scored_moves(a) contém 'ç'");

    // negamax
    esperar(nota(engine, "abelh", "a") < 0, "completar 'abelha' tem nota negativa");

    // sem criatividade: só escolhe lances de nota máxima
    engine.set_creativity(0);
    std::string m = engine.best_move("abelh");
    esperar(m != "a", "best_move(abelh) != \"a\" (devolveu \"" + m + "\")");

    int max_nota = -1000;
    for (const auto& s : engine.scored_moves("cas")) max_nota = std::max(max_nota, s.second);
    bool todos_maximos = true;
    for (int i = 0; i < 50; ++i) {
        if (nota(engine, "cas", engine.best_move("cas")) != max_nota) todos_maximos = false;
    }
    esperar(todos_maximos, "criatividade 0 sempre joga um lance de nota máxima");

    // prefixo inválido não quebra
    std::string segue = engine.best_move("xqz");
    esperar(!segue.empty(), "best_move(xqz) segue o blefe (\"" + segue + "\")");

    // prefixo vazio: termina rápido e devolve uma letra válida
    auto t0 = std::chrono::steady_clock::now();
    std::string primeira = engine.best_move("");
    auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::steady_clock::now() - t0).count();
    esperar(!primeira.empty() && engine.check(primeira) != word_state::invalido,
            "best_move(\"\") == \"" + primeira + "\" em " + std::to_string(ms) + " ms");

    // aleatoriedade: com criatividade alta aparecem lances diferentes
    engine.set_creativity(1.0);
    std::set<std::string> vistos;
    for (int i = 0; i < 200; ++i) vistos.insert(engine.best_move(""));
    esperar(vistos.size() > 1, "criatividade 1.0 varia os lances (" + std::to_string(vistos.size()) + " distintos)");

    // profundidade limitada: com 1 jogada de horizonte a IA não sabe nada da raiz,
    // mas ainda evita completar palavra ela mesma
    engine.set_creativity(0);
    engine.set_depth(1);
    bool tudo_zero = true;
    for (const auto& s : engine.scored_moves("")) {
        if (s.second != 0) tudo_zero = false;
    }
    esperar(tudo_zero, "depth 1: notas da raiz são todas 0");
    esperar(engine.best_move("abelh") != "a", "depth 1: ainda evita completar 'abelha'");
    engine.set_depth(-1);

    // vocabulário limitado
    std::vector<std::string> comuns;
    {
        std::ifstream in("data/palavras_validas.txt");
        std::string w;
        while (comuns.size() < 100 && std::getline(in, w)) comuns.push_back(w);
    }
    engine.set_vocabulary(100);
    engine.set_creativity(1.0);
    bool so_conhecidas = true;
    for (int i = 0; i < 100; ++i) {
        std::string lance = engine.best_move("");
        bool achou = false;
        for (const auto& w : comuns) {
            if (w.compare(0, lance.size(), lance) == 0) achou = true;
        }
        if (!achou) so_conhecidas = false;
    }
    esperar(so_conhecidas, "vocab 100: lances da raiz levam a palavras do top 100");

    std::string chute = engine.best_move("abelh");
    esperar(!chute.empty() && engine.check("abelh" + chute) != word_state::invalido,
            "vocab 100: prefixo desconhecido ainda recebe letra válida (\"" + chute + "\")");
    engine.set_vocabulary(0);

    // palavras curtas saíram do dicionário
    esperar(engine.check("yin") == word_state::invalido, "check(yin) == invalido (palavra curta removida)");

    // revelar palavra: só palavras alcançáveis (sem outra palavra no caminho)
    std::string revelada = engine.reveal_word("abelh");
    esperar(revelada == "abelha", "reveal_word(abelh) == \"" + revelada + "\" (abelhas passa por abelha)");
    esperar(engine.reveal_word("prov") == "prova",
            "reveal_word(prov) == \"" + engine.reveal_word("prov") + "\" (provavelmente passa por prova)");
    bool alcancaveis = true;
    for (const std::string p : {"prov", "abelh", "cas", "ment", "esper", "fal"}) {
        std::string w = engine.reveal_word(p);
        if (w.empty() || engine.check(w) != word_state::completo) alcancaveis = false;
        for (size_t n = p.size() + 1; n < w.size(); ++n) {
            // só corta em fronteira de caractere UTF-8
            if ((static_cast<unsigned char>(w[n]) & 0xC0) == 0x80) continue;
            if (engine.check(w.substr(0, n)) == word_state::completo) alcancaveis = false;
        }
    }
    esperar(alcancaveis, "palavras reveladas não passam por outra palavra");
    esperar(engine.reveal_word("xqz") == "", "reveal_word(xqz) == \"\"");

    // desafio
    engine.set_attention(1.0);
    esperar(engine.challenge("xqz"), "IA desafia o prefixo inválido xqz");
    esperar(!engine.challenge("cas"), "IA não desafia o prefixo válido cas");

    // blefe: acha um prefixo em que a IA está perdendo
    const std::vector<std::string> letras = {"a","b","c","d","e","f","g","i","l","m","n","o","p","r","s","t","u","v"};
    std::string perdedor;
    for (const auto& x : letras) {
        for (const auto& y : letras) {
            auto ms = engine.scored_moves(x + y);
            if (ms.empty()) continue;
            bool todos_negativos = true;
            for (const auto& m : ms) if (m.second >= 0) todos_negativos = false;
            if (todos_negativos && perdedor.empty()) perdedor = x + y;
        }
    }
    esperar(!perdedor.empty(), "achou prefixo perdedor (\"" + perdedor + "\")");
    if (!perdedor.empty()) {
        engine.set_bluff(1.0);
        bool sempre_blefa = true;
        for (int i = 0; i < 20; ++i) {
            if (engine.check(perdedor + engine.best_move(perdedor)) != word_state::invalido) sempre_blefa = false;
        }
        esperar(sempre_blefa, "bluff 1: perdendo, a IA sempre blefa");

        engine.set_bluff(0.0);
        bool nunca_blefa = true;
        for (int i = 0; i < 20; ++i) {
            if (engine.check(perdedor + engine.best_move(perdedor)) == word_state::invalido) nunca_blefa = false;
        }
        esperar(nunca_blefa, "bluff 0: a IA nunca blefa");
    }

    // inserir palavra nova
    esperar(engine.check("gêiser") != word_state::completo, "gêiser ainda não está no dicionário");
    esperar(engine.add_word("gêiser"), "add_word(gêiser) == true");
    esperar(engine.check("gêiser") == word_state::completo, "check(gêiser) == completo depois de inserir");
    esperar(engine.reveal_word("gêis") == "gêiser", "reveal_word(gêis) == \"" + engine.reveal_word("gêis") + "\"");
    esperar(!engine.add_word("gêiser"), "add_word(gêiser) de novo == false");
    esperar(!engine.add_word("abc"), "add_word(abc) == false (curta)");
    esperar(!engine.best_move("gêi").empty(), "best_move(gêi) devolve letra");
    esperar(engine.reveal_word("abelh") == "abelha", "reveal_word(abelh) continua certo depois de inserir");

    // o alfabeto vem do dicionário
    const auto& alfabeto_pt = engine.alphabet();
    esperar(std::find(alfabeto_pt.begin(), alfabeto_pt.end(), "ç") != alfabeto_pt.end(),
            "alfabeto PT contém 'ç' (" + std::to_string(alfabeto_pt.size()) + " letras)");

    // dicionário em inglês
    ghost_engine en("data/dictionary_en.trie");
    en.set_seed(7);
    esperar(en.ready(), "dicionário EN carregado");
    if (en.ready()) {
        esperar(en.check("house") == word_state::completo, "EN: check(house) == completo");
        esperar(en.check("hous") == word_state::incompleto, "EN: check(hous) == incompleto");
        esperar(en.check("xqz") == word_state::invalido, "EN: check(xqz) == invalido");
        esperar(en.reveal_word("hous") == "house", "EN: reveal_word(hous) == \"" + en.reveal_word("hous") + "\"");
        en.set_creativity(0);
        std::string lance = en.best_move("hous");
        esperar(lance != "e", "EN: best_move(hous) != \"e\" (devolveu \"" + lance + "\")");

        bool so_ascii = true;
        for (const auto& l : en.alphabet()) {
            if (l.size() != 1 || l[0] < 'a' || l[0] > 'z') so_ascii = false;
        }
        esperar(so_ascii && en.alphabet().size() == 26,
                "EN: alfabeto é a-z (" + std::to_string(en.alphabet().size()) + " letras)");

        en.set_bluff(1.0);
        bool blefe_ascii = true;
        for (const auto& p : {"zz", "qx", "abcd"}) {
            std::string b = en.best_move(p);
            if (b.size() != 1 || b[0] < 'a' || b[0] > 'z') blefe_ascii = false;
        }
        esperar(blefe_ascii, "EN: blefes só usam a-z");
    }

    std::cout << (falhas ? "\nFALHOU: " + std::to_string(falhas) + " teste(s)\n" : "\nTodos os testes passaram\n");
    return falhas ? 1 : 0;
}
