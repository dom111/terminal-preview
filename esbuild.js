const { sassPlugin } = require('esbuild-sass-plugin'),
  esbuild = require('esbuild'),
  buildOptions = {
    entryPoints: ['src/terminal.ts', 'src/terminal.scss'],
    bundle: true,
    minify: true,
    sourcemap: true,
    watch: false,
    outdir: 'dist',
    plugins: [sassPlugin()],
  };

process.argv.forEach((arg) => {
  if (arg === 'watch') {
    buildOptions.watch = {
      onRebuild() {
        console.log('\x1b[32mRebuilt.\x1b[0m');
      },
    };
  }
});

process.stdout.write(`Building... `);

esbuild
  .build(buildOptions)
  .then(() => {
    console.log('\x1b[32mdone.\x1b[0m');
  })
  .catch((e) => {
    console.log(`\x1b[31mfailed.\x1b[0m`);
    console.log('');
    console.error(e);

    process.exit(1);
  });
