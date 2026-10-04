#include <emscripten/bind.h>
#include "ghost_engine.h"

EMSCRIPTEN_BINDINGS(ghost) {
    emscripten::enum_<word_state>("WordState")
        .value("incompleto", word_state::incompleto)
        .value("completo", word_state::completo)
        .value("invalido", word_state::invalido);

    emscripten::class_<ghost_engine>("GhostEngine")
        .constructor()
        .function("ready", &ghost_engine::ready)
        .function("check", &ghost_engine::check)
        .function("best_move", &ghost_engine::best_move)
        .function("set_creativity", &ghost_engine::set_creativity)
        .function("set_seed", &ghost_engine::set_seed)
        .function("set_depth", &ghost_engine::set_depth)
        .function("set_vocabulary", &ghost_engine::set_vocabulary)
        .function("set_bluff", &ghost_engine::set_bluff)
        .function("set_attention", &ghost_engine::set_attention)
        .function("reveal_word", &ghost_engine::reveal_word)
        .function("challenge", &ghost_engine::challenge)
        .function("add_word", &ghost_engine::add_word);
}
