# ghost-game

Jogo **Ghost** contra uma IA, em português e em inglês. Cada jogador acrescenta uma letra; perde quem completar uma palavra de 4+ letras. Vale blefar e desafiar.

- Português: https://lucaskiyosh.github.io/ghost-game/
- English: https://lucaskiyosh.github.io/ghost-game/en/

## Como funciona

- **Dicionário:** double-array trie ([cedar](http://www.tkl.iis.u-tokyo.ac.jp/~ynaga/cedar/)); cada palavra guarda seu ranking de frequência.
- **IA:** negamax com memoização por nó da trie, horizonte e vocabulário limitados por nível, escolha por softmax e blefe quando está perdendo.
- **Front-end:** HTML/JS puro; o motor em C++ roda no navegador via WebAssembly (Emscripten).

## Rodar e compilar

```sh
make test && ./test                      # testes do motor (PT e EN)
make wasm                                # gera docs/ghost.* (PT) e docs/en/ghost.* (EN)
python3 -m http.server -d docs 8000      # abrir http://localhost:8000
```

Dicionários: `make palavras` / `make trie` (PT, precisa de hunspell-pt-br) e `make words-en` / `make trie-en` (EN, precisa de wamerican). Os arquivos de `docs/` são versionados porque o GitHub Pages publica direto dessa pasta: rode `make wasm` antes de commitar mudanças no motor ou nos dicionários.
