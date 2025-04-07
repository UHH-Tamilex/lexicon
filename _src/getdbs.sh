#!/bin/bash

allPaths=("Kuruntokai" "Narrinai" "Akananuru" "Purananuru" "Ainkurunuru" "Kalittokai" "TamilneriVilakkam" "Tirukkural" "Cilappatikaram" "Manimekalai" "NalayiratTivviyapPirapantam" "Tolkappiyam")

for p in ${allPaths[@]};
do
    mkdir indices
    mkdir indices/$p
    wget https://uhh-tamilex.github.io/$p/wordindex.db -P indices/$p;
done
