#!/bin/bash

allPaths=("Kuruntokai" "Narrinai" "Akananuru" "Purananuru" "Ainkurunuru" "Patirruppattu" "Kalittokai" "Paripatal" "TamilneriVilakkam" "Tirukkural" "Cilappatikaram" "Manimekalai" "PatinoranTirumurai" "NalayiratTivviyapPirapantam" "Tolkappiyam" "Nannul")

mkdir indices

for p in ${allPaths[@]};
do
    mkdir indices/$p
    wget https://uhh-tamilex.github.io/$p/wordindex.db -P indices/$p;
done
