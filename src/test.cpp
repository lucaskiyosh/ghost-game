#include "ghost_engine.h"
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

    // revelar palavra
    std::string revelada = engine.reveal_word("abelh");
    esperar(revelada.compare(0, 5, "abelh") == 0 && engine.check(revelada) == word_state::completo,
            "reveal_word(abelh) == \"" + revelada + "\"");
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
    esperar(engine.reveal_word("abelh") == "abelhas", "reveal_word(abelh) continua certo depois de inserir");

    std::cout << (falhas ? "\nFALHOU: " + std::to_string(falhas) + " teste(s)\n" : "\nTodos os testes passaram\n");
    return falhas ? 1 : 0;
}
