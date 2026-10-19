# React + TypeScript + Vite

## Video uploads

Files larger than 100 MiB (displayed as 100 MB) are compressed in a browser worker
before requesting an S3 upload URL. Smaller files keep their original bytes.
Compression produces H.264/AAC MP4 at up to 1080p, preserving orientation, aspect
ratio, frame rate, and duration. It targets 95 MiB and checks the actual result,
retrying at lower bitrates up to three times. Oversized or failed results are
never uploaded. The server's final-object size validation remains in place;
keep `MAX_CLIP_SIZE_MB` at its default of 100 for this frontend.

The single-threaded FFmpeg core and worker are lazy-loaded from the app's own
origin. `npm run build` includes the assets automatically; no CDN, extra server,
or cross-origin isolation headers are needed. The core WASM download is about
32 MB on first use. Browser memory and processing capacity still limit very
large originals. Cancellation stops the worker and keeps the form available.

Run `npm test` for compression and upload-flow tests, and `npm run build` for the
production bundle. Backend size-guard tests run with
`node --test controllers/clipsController.test.js` from `server/`.
For browser smoke checks, use oversized MP4, MOV, MKV, and WebM files, including
portrait and silent videos. Confirm output size, complete playback, audio sync,
cancellation before upload, and loading under both `npm run dev` and
`npm run preview`. Compression retry progress is intentionally indeterminate
because the core's timing counters can carry over between encoding attempts.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list
