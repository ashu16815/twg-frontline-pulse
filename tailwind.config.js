module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: '#E6EDF3',
        bg: '#05070A',
        glass: 'rgba(255,255,255,0.06)',
        edge: 'rgba(255,255,255,0.12)'
      },
      boxShadow: {
        glass: '0 1px 0 0 rgba(255,255,255,0.12) inset, 0 10px 30px rgba(0,0,0,0.6)'
      },
      backdropBlur: { xs: '2px' },
      animation: {
        'sheen': 'sheen 2.4s linear infinite',
        'float': 'float 6s ease-in-out infinite'
      },
      keyframes: {
        sheen: {
          '0%':   { transform: 'translateX(-100%) skewX(-15deg)' },
          '100%': { transform: 'translateX(200%) skewX(-15deg)' }
        },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-6px)' }
        }
      }
    }
  },
  plugins: []
};