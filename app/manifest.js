export default function manifest() {
  return {
    name: 'PHFP App',
    short_name: 'PHFP App',
    description:
      'Pranic Healing Foundation of the Philippines — student portal, courses, and events.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fffbef',
    theme_color: '#f0cc60',
    icons: [
      { src: '/logo.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
