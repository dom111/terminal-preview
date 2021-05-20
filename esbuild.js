const { sassPlugin } = require('esbuild-sass-plugin'),
  esbuild = require('esbuild');

let watch = false,
  env = 'dev';

[
  [
    'watch',
    () =>
      (watch = {
        onRebuild() {
          console.log('\x1b[32mRebuilt.\x1b[0m');
        },
      }),
  ],
  ['prod', () => (env = 'prod')],
].forEach(([flag, handler]) => {
  if (process.argv.some((arg) => arg === flag)) {
    handler();
  }
});

process.stdout.write(`Building for \x1b[33m${env}\x1b[0m... `);

esbuild
  .build({
    entryPoints: ['src/terminal.ts', 'src/terminal.scss'],
    bundle: true,
    minify: env === 'prod',
    sourcemap: env === 'dev',
    watch,
    outdir: 'dist',
    plugins: [sassPlugin()],
  })
  .then(() => {
    console.log('\x1b[32mdone.\x1b[0m');
  })
  .catch((e) => {
    console.log(`\x1b[31mfailed.\x1b[0m`);
    console.log('');
    console.error(e);

    process.exit(1);
  });
