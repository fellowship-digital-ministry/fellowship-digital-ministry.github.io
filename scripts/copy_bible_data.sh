#!/bin/bash

# Create the target directory
mkdir -p assets/data/bible-kjv

# Copy all JSON files from _data/Bible-kjv-master to the new directory
cp _data/Bible-kjv-master/*.json assets/data/bible-kjv/

echo "Bible KJV data copied to assets/data/bible-kjv/"
