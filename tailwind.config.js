/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                display: ['var(--font-display)', 'sans-serif'],
                body: ['var(--font-body)', 'sans-serif'],
                mono: ['var(--font-mono)', 'monospace'],
            },
            colors: {
                app: 'var(--bg-app)',
                surface: 'var(--bg-surface)',
                card: 'var(--bg-card)',
                hover: 'var(--bg-hover)',
                primary: 'var(--text-primary)',
                secondary: 'var(--text-secondary)',
                muted: 'var(--text-muted)',
                accent: {
                    primary: 'var(--accent-primary)',
                    glow: 'var(--accent-glow)',
                },
                border: {
                    subtle: 'var(--border-subtle)',
                    highlight: 'var(--border-highlight)',
                }
            },
            animation: {
                'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }
        },
    },
    plugins: [],
}
