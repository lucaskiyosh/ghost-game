// cedar -- C++ implementation of Efficiently-updatable Double ARray trie
//  $Id: mkcedar.cc 1877 2015-01-29 11:48:07Z ynaga $
// Copyright (c) 2013-2015 Naoki Yoshinaga <ynaga@tkl.iis.u-tokyo.ac.jp>
#include <cstdio>
#include <cstdlib>
#ifdef HAVE_CONFIG_H
#include <config.h>
#endif
#ifdef USE_PREFIX_TRIE
#include <cedarpp.h>
#else
#include <cedar.h>
#endif

int main (int argc, char **argv) {
  if (argc < 3)
    { std::fprintf (stderr, "Usage: %s keys trie\n", argv[0]); std::exit (1); }
  //
  cedar::da <int> trie;
  int n = 0;
  FILE* fp = argv[1][0] == '-' ? stdin : std::fopen (argv[1], "r");
  char line[8192];
  while (std::fgets (line, 8192, fp)) {
    size_t len = std::strlen (line);
    while (len && (line[len - 1] == '\n' || line[len - 1] == '\r')) --len;
    if (! len) continue; // ignora linhas vazias
    trie.update (line, len, n++);
  }
  std::fclose (fp);
  //
  if (trie.save (argv[2]) != 0)
    { std::fprintf (stderr, "cannot save trie: %s\n", argv[2]); std::exit (1); }
  //
  std::fprintf (stderr, "keys: %ld\n", trie.num_keys ());
  std::fprintf (stderr, "size: %ld\n", trie.size ());
  std::fprintf (stderr, "nonzero_size: %ld\n", trie.nonzero_size ());
  return 0;
}
