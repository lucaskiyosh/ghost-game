# ghost-game

Jogo **Ghost** contra uma IA, em português e em inglês. Cada jogador acrescenta uma letra; perde quem completar uma palavra de 4+ letras. Vale blefar e desafiar.

- Português: https://lucaskiyosh.github.io/ghost-game/
- English: https://lucaskiyosh.github.io/ghost-game/en/

## Desafio do dia

Todo dia há um desafio novo, igual para todo mundo: 3 rounds contra a IA (Fácil → Médio → Difícil), você abre os rounds 1 e 3 e a IA abre o 2 com a letra do dia. No fim, a IA comenta o placar e dá para compartilhar o resultado (sem revelar as palavras). Tudo roda no navegador, sem servidor:

- o número do dia (#1 = 6/10/2026) é a seed da letra de abertura e do sorteio da IA, então quem joga as mesmas letras recebe as mesmas respostas;
- progresso, sequência (🔥 dias jogados seguidos) e estatísticas ficam no `localStorage`, separados por idioma;
- a aba **Prática** é o jogo livre, com seletor de nível, e não conta para o desafio.

## Como funciona

- **Dicionário:** double-array trie ([cedar](http://www.tkl.iis.u-tokyo.ac.jp/~ynaga/cedar/)); cada palavra guarda seu ranking de frequência.
- **IA:** negamax com memoização por nó da trie, horizonte e vocabulário limitados por nível, escolha por softmax e blefe quando está perdendo.
- **Front-end:** HTML/JS puro; o motor em C++ roda no navegador via WebAssembly (Emscripten).

## Dicionários

Os dois partem das 50 mil palavras mais frequentes em legendas de filmes ([FrequencyWords](https://github.com/hermitdave/FrequencyWords), a partir do OpenSubtitles 2018), mantendo só palavras com 4+ letras e com vogal, e a ordem de frequência (que define o vocabulário da IA em cada nível):

- **Português** (`data/palavras_validas.txt`, ~36 mil): `pt_br_50k` filtrada pelo corretor [Hunspell pt-BR (VERO)](https://github.com/LibreOffice/dictionaries/tree/master/pt_BR).
- **Inglês** (`data/words_en.txt`, ~29 mil): `en_50k` filtrada pela lista [SCOWL](http://wordlist.aspell.net/) American English (pacote `wamerican`, `/usr/share/dict/american-english`).

## Rodar e compilar

```sh
make test && ./test                      # testes do motor (PT e EN)
make wasm                                # gera docs/ghost.* (PT) e docs/en/ghost.* (EN)
python3 -m http.server -d docs 8000      # abrir http://localhost:8000
```

Dicionários: `make palavras` / `make trie` (PT, precisa de hunspell-pt-br) e `make words-en` / `make trie-en` (EN, precisa de wamerican). Os arquivos de `docs/` são versionados porque o GitHub Pages publica direto dessa pasta: rode `make wasm` antes de commitar mudanças no motor ou nos dicionários.

## Métricas

Opcionais, via [GoatCounter](https://www.goatcounter.com) (grátis, sem cookies). Ficam desligadas enquanto `GOATCOUNTER` estiver vazio em `docs/main.js`. Para ativar, crie a conta, coloque o código (o `xxx` de `xxx.goatcounter.com`) nessa constante e publique.

Além das visitas, o jogo envia eventos com prefixo `pt/` ou `en/`:

| Evento | Quando |
|---|---|
| `partida/inicio/<nível>` | primeira letra de uma partida |
| `fim/<vitoria\|derrota>/<motivo>/<nível>` | fim da partida (`voce-completou`, `ia-completou`, `ia-desistiu`, `desafio-ia-mostrou`, `desafio-era-blefe`, `defesa-valeu`, `defesa-falhou`) |
| `blefe/ia`, `blefe/jogador` | uma letra tornou o prefixo inválido |
| `desafio/jogador`, `desafio/ia` | alguém desafiou |
| `guia/abriu-auto`, `guia/abriu-manual`, `guia/concluido`, `guia/fechou-no-passo-<n>` | uso do guia |
| `nivel/<nível>`, `idioma/para-<en\|pt>` | trocas de nível e idioma |
| `daily/inicio`, `daily/round/<n>/<voce\|ia>`, `daily/fim/<v>x<ia>` | desafio do dia |
| `daily/compartilhar`, `modo/pratica` | compartilhou o resultado; entrou na prática |
