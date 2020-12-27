# WebAssembly benchmark

Comparing JS and WASM [Buddhabrot](https://en.wikipedia.org/wiki/Buddhabrot) generators.

Try here https://3bl3gamer.github.io/wasm-test-2/ (WASM generator) or here https://3bl3gamer.github.io/wasm-test-2/#js (JS generator).

## Results

### Arch Linux, i5-5200U

| Browser | Mode | Time   |
|---------|------|--------|
| Firefox | WASM | 50.4 s |
| Chrome  | JS   | 59.9 s |
| Chrome  | WASM | 61.5 s |
| Firefix | JS   | 65.2 s |

### Android, Snapdragon 845

| Browser                 | Mode | Time    |
|-------------------------|------|---------|
| Chrome 89 Canary mobile | WASM | 93.0 s  |
| Chrome 89 Canary mobile | JS   | 95.3 s  |
| Firefox 85 Beta mobile  | WASM | 102.7 s |
| Firefox 85 Beta mobile  | JS   | 127.1 s |

## Screenshots

![example](https://user-images.githubusercontent.com/1857617/103176610-34951300-4884-11eb-8812-304fc161290b.png)
