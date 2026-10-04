CXX = g++
EMXX = em++

CXXFLAGS = -O3 -std=c++17 -Iinclude -Wall
EMXXFLAGS = -O3 -std=c++17 -Iinclude -Wall

# só letras minúsculas do português; remove lixo de encoding ("vocãª", "nº", ...)
LETRAS = [a-záàâãéêíìîóòôõúùûç]
VOGAIS = [aeiouáàâãéêíìîóòôõúùû]

.PHONY: all palavras trie words-en trie-en wasm wasm-pt wasm-en serve clean

all: test mkcedar

test: src/test.cpp src/ghost_engine.cpp include/ghost_engine.h include/cedar.h
	$(CXX) $(CXXFLAGS) src/test.cpp src/ghost_engine.cpp -o $@

mkcedar: src/mkcedar.cc
	$(CXX) $(CXXFLAGS) $^ -o $@

# regenera data/palavras_validas.txt a partir da lista de frequência:
# fica só o que o corretor pt-BR aceita (tira siglas, nomes, inglês)
# que tem vogal (tira "rg", "kg", letras soltas)
# e com 4+ letras (palavras curtas sem continuação viram armadilha)
# precisa de: sudo apt install hunspell hunspell-pt-br
palavras:
	LC_ALL=C.UTF-8 grep -x '$(LETRAS)\+' data/palavras.txt \
		| hunspell -i UTF-8 -d pt_BR -G \
		| grep '$(VOGAIS)' \
		| LC_ALL=C.UTF-8 grep -x '.\{4,\}' > data/palavras_validas.txt

# dicionário base + palavras sugeridas pelos jogadores (data/palavras_extras.txt)
trie: mkcedar
	cat data/palavras_validas.txt data/palavras_extras.txt 2>/dev/null \
		| awk '!visto[$$0]++' | ./mkcedar - data/dicionario.trie

# um bundle por idioma; os dois empacotam o dicionário no mesmo caminho virtual
EMXX_WASM = $(EMXX) $(EMXXFLAGS) src/ghost_engine.cpp src/binds.cpp --bind -sALLOW_MEMORY_GROWTH=1

wasm: wasm-pt wasm-en

wasm-pt:
	$(EMXX_WASM) -o docs/ghost.js --preload-file data/dicionario.trie@data/dicionario.trie

wasm-en:
	mkdir -p docs/en
	$(EMXX_WASM) -o docs/en/ghost.js --preload-file data/dictionary_en.trie@data/dicionario.trie

# dicionário em inglês: 50 mil palavras mais frequentes (legendas, hermitdave/FrequencyWords)
# que existem na lista do wamerican (tira nomes próprios, siglas e gírias); 4+ letras, com vogal
EN_FREQ = https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_50k.txt
words-en:
	curl -sfL $(EN_FREQ) | cut -d' ' -f1 \
		| grep -x '[a-z]\{4,\}' | grep '[aeiouy]' \
		| grep -Fxf /usr/share/dict/american-english > data/words_en.txt

trie-en: mkcedar
	./mkcedar data/words_en.txt data/dictionary_en.trie

# serve o jogo e a API de sugestões; precisa de: sudo apt install hunspell hunspell-pt-br
serve:
	python3 server.py

clean:
	rm -f test mkcedar
	rm -f docs/ghost.js docs/ghost.wasm docs/ghost.data
	rm -f docs/en/ghost.js docs/en/ghost.wasm docs/en/ghost.data
