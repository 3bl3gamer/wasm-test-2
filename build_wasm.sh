#!/bin/bash
# https://habr.com/ru/post/454868/
clang \
    --target=wasm32 \
    -O3 \
    -flto \
    -nostdlib \
    -Wl,--no-entry \
    -Wl,--export-all \
    -Wl,--lto-O3 \
    -Wl,-z,stack-size=1024 \
    -o render.wasm \
    render.c
