import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        routePurple: '#3C146B',
        routeLime: '#C7F464',
        routeCream: '#FFF7E8',
        routeInk: '#20162B',
      },
    },
  },
  plugins: [],
};
export default config;
