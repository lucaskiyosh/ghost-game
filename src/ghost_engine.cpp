#include "ghost_engine.h"
#include <algorithm>
#include <cmath>

namespace {
    // letras usadas para blefar, das mais comuns às mais raras em português
    const std::vector<std::string> letras_blefe = {
        "a", "e", "o", "i", "s", "r", "n", "m", "t", "d", "c", "u", "l",
        "p", "v", "g", "b", "f", "h", "q", "z", "j", "x", "ç"
    };

    // quantos caracteres UTF-8 existem em s (conta só bytes que não são de continuação)
    int utf8_length(const std::string& s)
    {
        int n = 0;
        for (unsigned char c : s) {
            if ((c & 0xC0) != 0x80) ++n;
        }
        return n;
    }
}


ghost_engine::ghost_engine()
    : rng_(std::random_device{}())
{
    if (trie.open("data/dicionario.trie") != 0) {
        return; // loaded_ continua false; quem usa confere ready()
    }
    trie.restore();
    loaded_ = true;
    next_rank_ = static_cast<int>(trie.num_keys());
    compute_min_rank(0);
}

bool ghost_engine::add_word(const std::string& word)
{
    if (!loaded_ || utf8_length(word) < MIN_LEN || check(word) == word_state::completo) {
        return false;
    }
    trie.update(word.c_str(), word.size(), next_rank_++);
    dirty_ = true;
    return true;
}

// o update da cedar pode realocar nós, então tudo que é indexado por nó é refeito
void ghost_engine::ensure_fresh()
{
    if (!dirty_) {
        return;
    }
    min_rank_.clear();
    memo_.clear();
    compute_min_rank(0);
    dirty_ = false;
}

// DFS que guarda, para cada nó, o ranking da palavra mais frequente abaixo dele
int ghost_engine::compute_min_rank(size_t from)
{
    int best = trie.has_value(from) ? trie.value_at(from) : INT_MAX;
    trie.for_each_child(from, [&](unsigned char, size_t to) {
        best = std::min(best, compute_min_rank(to));
    });
    min_rank_[from] = best;
    return best;
}

// palavra completa que encerra o jogo e que a IA conhece
bool ghost_engine::known_word(const state& s) const
{
    return trie.has_value(s.from)
        && s.chars >= MIN_LEN
        && trie.value_at(s.from) < vocab_;
}

word_state ghost_engine::check(const std::string& word)
{
    state s;
    if (!find_state(word, s)) {
        return word_state::invalido;
    }
    if (trie.has_value(s.from) && s.chars >= MIN_LEN) {
        return word_state::completo;
    }
    return word_state::incompleto;
}

std::vector<ghost_engine::state>
ghost_engine::children(const state& current, bool known_only)
{
    std::vector<state> result;
    // com known_only, ignora ramos que só levam a palavras fora do vocabulário da IA
    auto known = [&](size_t to) { return !known_only || min_rank_[to] < vocab_; };

    trie.for_each_child(current.from, [&](unsigned char label, size_t to) {
        if (!known(to)) return;
        if (label < 0x80) {
            // ASCII: um byte = uma letra
            result.push_back({to, current.chars + 1, std::string(1, static_cast<char>(label))});
            return;
        }
        // byte inicial de UTF-8 (ex: 0xC3 de "á"): desce mais um nível
        // para juntar o byte de continuação e formar a letra inteira
        trie.for_each_child(to, [&](unsigned char cont, size_t to2) {
            if (!known(to2)) return;
            std::string move;
            move += static_cast<char>(label);
            move += static_cast<char>(cont);
            result.push_back({to2, current.chars + 1, move});
        });
    });
    return result;
}

// nota do ponto de vista de quem joga agora em 'current';
// depth = quantas jogadas ainda dá para olhar (-1 = sem limite)
int ghost_engine::negamax(const state& current, int depth)
{
    // o oponente acabou de completar uma palavra: ele perdeu
    if (known_word(current)) {
        return WIN;
    }

    const size_t key = current.from * 64 + (depth < 0 ? 63 : std::min(depth, 62));
    auto it = memo_.find(key);
    if (it != memo_.end()) {
        return it->second;
    }

    auto filhos = children(current, true);

    int best;
    if (filhos.empty()) {
        // não há letra válida: quem joga agora é obrigado a sair do dicionário
        best = -WIN;
    } else if (depth == 0) {
        // horizonte da IA: daqui pra frente ela não sabe quem ganha
        best = 0;
    } else {
        best = -WIN;
        for (const auto& child : filhos) {
            best = std::max(best, -negamax(child, depth < 0 ? -1 : depth - 1));
        }
    }

    // afasta a nota de ±WIN a cada nível: ganhar cedo e perder tarde vale mais
    if (best > 0) --best;
    else if (best < 0) ++best;

    memo_[key] = best;
    return best;
}

bool ghost_engine::find_state(const std::string& prefix, state& out)
{
    if (!loaded_) {
        return false;
    }
    size_t from = 0;
    size_t pos = 0;

    int res = trie.traverse(prefix.c_str(), from, pos, prefix.size());

    if (res == trie.CEDAR_NO_PATH) {
        return false;
    }
    out = {from, utf8_length(prefix), ""};
    return true;
}

std::vector<std::pair<std::string, int>>
ghost_engine::scored_moves(const std::string& prefix)
{
    std::vector<std::pair<std::string, int>> result;
    ensure_fresh();

    state current;
    if (!find_state(prefix, current)) {
        return result;
    }
    for (const auto& child : children(current, true)) {
        result.push_back({child.move, -negamax(child, depth_ < 0 ? -1 : depth_ - 1)});
    }
    return result;
}

std::string ghost_engine::best_move(const std::string& prefix)
{
    if (!loaded_) {
        return "";
    }
    ensure_fresh();
    state current;
    if (!find_state(prefix, current)) {
        // o prefixo já é um blefe que ninguém desafiou: segue blefando
        return bluff_letter(prefix);
    }

    auto moves = scored_moves(prefix);

    // perdendo (ou sem conhecer nenhuma continuação), a IA pode tentar um blefe
    bool perdendo = std::all_of(moves.begin(), moves.end(),
                                [](const auto& m) { return m.second < 0; });
    if (perdendo && chance(bluff_)) {
        std::string blefe = bluff_letter(prefix);
        if (!blefe.empty()) {
            return blefe;
        }
    }

    if (moves.empty()) {
        // a IA não conhece nenhuma palavra que continue o prefixo: chuta uma letra válida
        auto filhos = children(current, false);
        if (filhos.empty()) {
            return "";
        }
        std::uniform_int_distribution<size_t> dist(0, filhos.size() - 1);
        return filhos[dist(rng_)].move;
    }

    int max_score = moves[0].second;
    for (const auto& m : moves) {
        max_score = std::max(max_score, m.second);
    }

    std::vector<double> weights;
    weights.reserve(moves.size());

    if (creativity_ <= 0) {
        // sem criatividade: sorteia só entre os empatados no melhor
        for (const auto& m : moves) {
            weights.push_back(m.second == max_score ? 1.0 : 0.0);
        }
    } else {
        // softmax: quanto maior a nota, maior a chance; creativity_ é a temperatura
        for (const auto& m : moves) {
            double diff = static_cast<double>(m.second - max_score) / WIN;
            weights.push_back(std::exp(diff / creativity_));
        }
    }

    std::discrete_distribution<size_t> dist(weights.begin(), weights.end());
    return moves[dist(rng_)].first;
}

bool ghost_engine::chance(double p)
{
    return std::uniform_real_distribution<double>(0.0, 1.0)(rng_) < p;
}

std::string ghost_engine::bluff_letter(const std::string& prefix)
{
    // só letras que levam a um prefixo que não começa nenhuma palavra
    std::vector<std::string> candidatas;
    for (const auto& letra : letras_blefe) {
        if (check(prefix + letra) == word_state::invalido) {
            candidatas.push_back(letra);
        }
    }
    if (candidatas.empty()) {
        return "";
    }
    std::uniform_int_distribution<size_t> dist(0, candidatas.size() - 1);
    return candidatas[dist(rng_)];
}

std::string ghost_engine::reveal_word(const std::string& prefix)
{
    ensure_fresh();
    state s;
    if (!find_state(prefix, s)) {
        return "";
    }

    // desce sempre pelo filho que leva à palavra mais frequente
    std::string word = prefix;
    size_t from = s.from;
    while (true) {
        const int alvo = min_rank_[from];
        if (alvo == INT_MAX) {
            return "";
        }
        if (trie.has_value(from) && trie.value_at(from) == alvo) {
            return word;
        }
        unsigned char label = 0;
        size_t next = from;
        trie.for_each_child(from, [&](unsigned char l, size_t to) {
            if (min_rank_[to] == alvo) {
                label = l;
                next = to;
            }
        });
        word += static_cast<char>(label);
        from = next;
    }
}

bool ghost_engine::challenge(const std::string& prefix)
{
    ensure_fresh();
    state s;
    if (!find_state(prefix, s)) {
        // é blefe mesmo; a IA percebe conforme a atenção dela
        return chance(attention_);
    }
    if (min_rank_[s.from] >= vocab_) {
        // existe palavra, mas a IA não conhece: às vezes desafia errado
        return chance(attention_ * 0.5);
    }
    return false;
}
