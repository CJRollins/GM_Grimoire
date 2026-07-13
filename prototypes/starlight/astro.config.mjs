import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  output: 'static',
  integrations: [
    starlight({
      title: 'Eberron Grimoire · Control',
      description: 'Disposable information-architecture and accessibility control.',
      social: [],
      sidebar: [
        {
          label: 'Forge of the Artificer',
          items: [{ label: 'Character Options', slug: 'character-options' }],
        },
      ],
      customCss: ['./src/styles/control.css'],
    }),
  ],
});
