#!/bin/bash

allPaths=("Kuruntokai" "Narrinai" "Akananuru" "Purananuru" "Ainkurunuru" "Patirruppattu" "Kalittokai" "TamilneriVilakkam" "Tirukkural" "Cilappatikaram" "Manimekalai" "PatinoranTirumurai" "NalayiratTivviyapPirapantam" "Tolkappiyam")

mkdir indices

for p in ${allPaths[@]};
do
    mkdir indices/$p
    wget https://uhh-tamilex.github.io/$p/wordindex.db -P indices/$p;
done
