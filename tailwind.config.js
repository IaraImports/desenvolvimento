/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Esquema de cores principal: Cores exatas das logos IARA
        primary: {
          50: '#fef1f4',
          100: '#fee2e9',
          200: '#fdc6d4',
          300: '#fb9fb2',
          400: '#f76d8a',
          500: '#FF2C68', // Rosa principal da logo
          600: '#e51e5f',
          700: '#c21653',
          800: '#a0144c',
          900: '#851447',
        },
        dark: {
          50: '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#454545',
          900: '#0D0C0C', // Preto principal da logo
        },
        accent: {
          pink: '#FF2C68',
          black: '#0D0C0C',
          white: '#ffffff',
        }
      },
      backgroundImage: {
        'gradient-luxury': 'linear-gradient(135deg, #0D0C0C 0%, #1a1a1a 50%, #FF2C68 100%)',
        'gradient-pink': 'linear-gradient(135deg, #FF2C68 0%, #e51e5f 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0D0C0C 0%, #1a1a1a 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255, 44, 104, 0.1) 0%, rgba(13, 12, 12, 0.1) 100%)',
      },
      backdropBlur: {
        'glass': '20px',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'slide-down': 'slideDown 0.6s ease-out',
        'slide-left': 'slideLeft 0.6s ease-out',
        'slide-right': 'slideRight 0.6s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(255, 44, 104, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(255, 44, 104, 0.6)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      boxShadow: {
        'luxury': '0 25px 50px -12px rgba(255, 44, 104, 0.25)',
        'dark': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        'glass': '0 8px 32px 0 rgba(255, 44, 104, 0.1)',
        'glow': '0 0 20px rgba(255, 44, 104, 0.4)',
        'inner-glow': 'inset 0 2px 4px 0 rgba(255, 44, 104, 0.1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
} 