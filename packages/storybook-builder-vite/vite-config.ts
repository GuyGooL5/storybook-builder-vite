import { Plugin } from 'vite';
import { mockCoreJs } from './mock-core-js';
import { codeGeneratorPlugin } from './code-generator-plugin';
import { injectExportOrderPlugin } from './inject-export-order-plugin';
import { mdxPlugin } from './mdx-plugin';
import { sourceLoaderPlugin } from './source-loader-plugin';

import type { ExtendedOptions } from './types';

export type PluginConfigType = 'build' | 'development';

export async function pluginConfig(options: ExtendedOptions, _type: PluginConfigType) {
  const { framework } = options;
  const svelteOptions = await options.presets.apply('svelteOptions', {}, options);

  const plugins = [
    codeGeneratorPlugin(options),
    mockCoreJs(),
    sourceLoaderPlugin(),
    mdxPlugin(),
    injectExportOrderPlugin,
  ] as Plugin[];
  if (framework === 'vue' || framework === 'vue3') {
    try {
      const vuePlugin = require('@vitejs/plugin-vue');
      plugins.push(vuePlugin());
      const { vueDocgen } = await import('./plugins/vue-docgen');
      plugins.push(vueDocgen());
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'MODULE_NOT_FOUND') {
        throw new Error(
          'storybook-builder-vite requires @vitejs/plugin-vue to be installed ' +
            'when using @storybook/vue or @storybook/vue3.' +
            '  Please install it and start storybook again.'
        );
      }
      throw err;
    }
  }
  if (framework === 'svelte') {
    try {
      const sveltePlugin = require('@sveltejs/vite-plugin-svelte').svelte;
      plugins.push(sveltePlugin(svelteOptions));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'MODULE_NOT_FOUND') {
        throw new Error(
          'storybook-builder-vite requires @sveltejs/vite-plugin-svelte to be installed when using @storybook/svelte.' +
            '  Please install it and start storybook again.'
        );
      }
      throw err;
    }

    try {
      const csfPlugin = require('./svelte/csf-plugin');
      plugins.push(csfPlugin);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'MODULE_NOT_FOUND') {
        throw new Error(
          'storybook-builder-vite requires @storybook/addon-svelte-csf to be installed when using @storybook/svelte.' +
            '  Please install it and start storybook again.'
        );
      }
      throw err;
    }
  }

  if (framework === 'react') {
    plugins.push(
      require('@vitejs/plugin-react')({
        // Do not treat story files as HMR boundaries, storybook itself needs to handle them.
        exclude: [/\.stories\.([tj])sx?$/, /node_modules/],
      })
    );
  }

  if (framework === 'glimmerx') {
    const plugin = require('vite-plugin-glimmerx/index.cjs');
    plugins.push(plugin.default());
  }

  return plugins;
}
