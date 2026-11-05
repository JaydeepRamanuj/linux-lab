import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import rehypeUnderTheHood from './src/lib/rehypeUnderTheHood';

export default defineConfig({
  site: 'https://linux-lab-jd.vercel.app',
  integrations: [
    react(),
    // Guides are MDX. Since Astro 6.4, `markdown.gfm` is left undefined (the new `processor` supplies the default),
    // so MDX 5 has to be told explicitly to keep GFM tables and smart punctuation like .md files get.
    // rehypeUnderTheHood collapses "## Under the hood"; only guides need it.
    mdx({ gfm: true, smartypants: true, rehypePlugins: [rehypeUnderTheHood] })
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});
