import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import postcss from 'rollup-plugin-postcss';

const isProduction = process.env.NODE_ENV === 'production';

const baseConfig = {
  input: 'src/index.ts',
  external: ['react', 'react-dom'],
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      preventAssignment: true,
    }),
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false,
      declarationMap: false,
    }),
    postcss({
      extract: true,
      minimize: isProduction,
      config: {
        path: './postcss.config.js',
      },
    }),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      presets: [
        ['@babel/preset-env', { targets: { browsers: ['> 1%', 'last 2 versions'] } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
      ],
    }),
    isProduction && terser({
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      mangle: {
        reserved: ['TekAssistWidget'],
      },
    }),
  ].filter(Boolean),
};

export default [
  // UMD build for script tag usage
  {
    ...baseConfig,
    output: {
      file: 'dist/widget.umd.js',
      format: 'umd',
      name: 'TekAssistWidget',
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
      },
      sourcemap: !isProduction,
    },
  },
  
  // ES module build for modern bundlers
  {
    ...baseConfig,
    output: {
      file: 'dist/widget.esm.js',
      format: 'es',
      sourcemap: !isProduction,
    },
  },
  
  // CommonJS build for Node.js
  {
    ...baseConfig,
    output: {
      file: 'dist/widget.cjs.js',
      format: 'cjs',
      sourcemap: !isProduction,
    },
  },
  
  // Standalone embed script (includes React)
  {
    input: 'src/embed.ts',
    output: {
      file: 'dist/embed.js',
      format: 'iife',
      name: 'TekAssistEmbed',
      sourcemap: !isProduction,
    },
    plugins: [
      replace({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        preventAssignment: true,
      }),
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
      }),
      postcss({
        inject: true,
        minimize: isProduction,
        config: {
          path: './postcss.config.js',
        },
      }),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        presets: [
          ['@babel/preset-env', { targets: { browsers: ['> 1%', 'last 2 versions'] } }],
          ['@babel/preset-react', { runtime: 'automatic' }],
          '@babel/preset-typescript',
        ],
      }),
      isProduction && terser({
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
        mangle: {
          reserved: ['TekAssistEmbed'],
        },
      }),
    ].filter(Boolean),
  },
];