#pragma once

#include <string>
#include <vector>
#include <utility>
#include <random>
#include <unordered_map>
#include <climits>
#include <cstddef>
#include "cedar.h"

enum class word_state {
    incompleto,
    invalido,
    completo
};

class ghost_engine {

public:
    // palavras com menos letras que isso não encerram o jogo
    static constexpr int MIN_LEN = 4;
    // nota de vitória/derrota imediata; diminui 1 a cada lance de distância
    static constexpr int WIN = 100;

    explicit ghost_engine(const std::string& path = "data/dicionario.trie");

    bool ready() const { return loaded_; }

    word_state check(const std::string& word);

    // sorteia a próxima letra; pode ser um blefe (letra que não forma começo de palavra).
    // "" só se não há o que jogar
    std::string best_move(const std::string& prefix);

    // lances que a IA conhece, com a nota negamax de cada um (do ponto de vista de quem joga)
    std::vector<std::pair<std::string, int>> scored_moves(const std::string& prefix);

    // a palavra mais frequente que começa com o prefixo; "" se não existe nenhuma
    std::string reveal_word(const std::string& prefix);

    // a IA desafia o prefixo formado pelo humano?
    bool challenge(const std::string& prefix);

    // letras do dicionário carregado, da mais usada para a menos usada
    const std::vector<std::string>& alphabet() const { return alphabet_; }

    // insere uma palavra nova (já validada por quem chama); false se já existe ou é curta
    bool add_word(const std::string& word);

    // 0 = sempre um dos melhores lances; valores altos = arrisca lances piores
    void set_creativity(double c) { creativity_ = c; }
    void set_seed(unsigned seed) { rng_.seed(seed); }
    // quantas jogadas à frente a IA enxerga; -1 = até o fim
    void set_depth(int d) { depth_ = d; memo_.clear(); }
    // a IA só conhece as n palavras mais frequentes; <= 0 = todas
    void set_vocabulary(int n) { vocab_ = n > 0 ? n : INT_MAX; memo_.clear(); }
    // chance de blefar quando está perdendo
    void set_bluff(double p) { bluff_ = p; }
    // chance de perceber um prefixo suspeito e desafiar
    void set_attention(double p) { attention_ = p; }

private:
    struct state {
        size_t from;
        int chars;
        std::string move;
    };

    cedar::da<int> trie;
    bool loaded_ = false;
    double creativity_ = 0.15;
    int depth_ = -1;
    int vocab_ = INT_MAX;
    double bluff_ = 0.0;
    double attention_ = 1.0;
    int next_rank_ = 0;   // ranking dado à próxima palavra inserida (as novas são as "mais raras")
    bool dirty_ = false;  // trie mudou: min_rank_ e memo_ precisam ser recalculados
    std::mt19937 rng_;
    std::unordered_map<size_t, int> memo_;
    // menor ranking de frequência entre as palavras abaixo de cada nó
    std::unordered_map<size_t, int> min_rank_;
    std::vector<std::string> alphabet_;

    bool find_state(const std::string& prefix, state& out);
    std::vector<state> children(const state& current, bool known_only);
    int compute_min_rank(size_t from);
    void ensure_fresh();
    void compute_alphabet();
    bool known_word(const state& s) const;
    int negamax(const state& current, int depth);
    bool chance(double p);
    std::string bluff_letter(const std::string& prefix);
};
