recursos:
     L "cedar trie"-> aplicação rápida de uma trie double array
    //de externo so isso

estratégia/algoritmo:
    L "negamax" com memoização por nó da trie (cada nó = um prefixo)
        L nota = ±(100 - distância): prefere ganhar cedo e perder tarde
        L palavra completa só conta com 4+ letras (MIN_LEN)
    L "recursos probabilísticos" -> fator "criatividade"
        L best_move sorteia com softmax sobre as notas; criatividade = temperatura
        L 0 = sorteia só entre os melhores lances; ~1+ = começa a errar
    L blefe/desafio (regra clássica, nos dois sentidos)
        L perdendo, a IA blefa com chance "bluff": joga letra que não começa palavra
        L "Desafiar": quem foi desafiado mostra uma palavra (reveal_word) ou perde
        L a IA desafia o humano com chance "attention" (no fácil deixa blefes passarem)
    L níveis (docs/main.js): profundidade + vocabulário + criatividade
        L fácil: vê 2 jogadas, conhece 3000 palavras  (casual ganha ~68%)
        L médio: vê 4 jogadas, conhece 10000 palavras (casual ganha ~36%)
        L difícil: vê tudo, conhece tudo               (casual ganha ~10%)

aplicação:
    L Wasm (make wasm) + docs/ ; servir com: python3 -m http.server -d docs
    L publicação: GitHub Pages → Settings → Pages → branch main, pasta /docs
        L os ghost.{js,wasm,data} são versionados: rode make wasm antes de commitar mudanças no motor/dicionário
    L dicionário colaborativo:
    L "+" no jogo (ou "Adicionar ao dicionário" quando sua defesa é recusada)
    L server.py valida com hunspell pt-BR e grava em data/palavras_extras.txt
    L o jogo carrega as extras ao abrir (engine.add_word); make trie as incorpora de vez

versão em inglês (docs/en/):
    L dicionário: en_50k (hermitdave/FrequencyWords) ∩ /usr/share/dict/american-english, 4+ letras, com vogal
        L make words-en (gera data/words_en.txt) → make trie-en (data/dictionary_en.trie)
    L make wasm gera os dois bundles; o en empacota dictionary_en.trie no mesmo caminho virtual
    L docs/main.js é compartilhado: textos em TEXTOS[LANG], LANG vem do <html lang>
    L alfabeto (e os blefes) vêm do dicionário carregado, então não aparece "ç" em inglês

dicionário: make trie (filtra data/palavras.txt e gera data/dicionario.trie)
    L testes: make test && ./test

dicionário:
    L data/palavras_validas.txt = palavras.txt ∩ hunspell pt-BR, com vogal e 4+ letras
    L ordem = frequência; o valor na trie é o ranking (usado pelo vocabulário da IA)
