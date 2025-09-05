/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors';

export default {
  //  darkMode سيتم تفعيله عبر إضافة class="dark" إلى عنصر <html>
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- لوحة الألوان الجديدة للفخامة ---
        // اللون الأساسي: ذهبي دافئ ومتدرج
        primary: {
          light: '#fde68a', // Amber 300
          DEFAULT: '#f59e0b', // Amber 500
          dark: '#b45309',  // Amber 700
        },
        // اللون الثانوي: رمادي فحمي عميق
        secondary: {
          light: colors.slate[200],
          DEFAULT: colors.slate[800],
          dark: colors.slate[900],
        },
        // لون الخلفية للوضع الفاتح
        background: {
          light: '#FFFBF5', // لون بيج فاتح جداً
          DEFAULT: '#FFFBF5',
        },
        // لون الخلفية للوضع الداكن
        darkBackground: {
          light: colors.slate[800],
          DEFAULT: '#1E293B', // Slate 800
          dark: '#0F172A',   // Slate 900
        },
        // ألوان النصوص
        text: {
          light: '#E2E8F0',   // Slate 200
          DEFAULT: '#334155', // Slate 700
          dark: '#0F172A',    // Slate 900
        },
      },
      // --- تأثيرات الحركة والانسيابية ---
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
        'shadow': 'box-shadow',
        'transform': 'transform',
        'colors': 'background-color, border-color, color, fill, stroke, opacity',
      },
      transitionTimingFunction: {
        'ease-out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-in-out',
        'slide-up-fade': 'slideUpFade 0.5s ease-out forwards',
        'subtle-pulse': 'subtlePulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUpFade: {
          '0%': { transform: 'translateY(15px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        subtlePulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.9' },
        }
      },
      boxShadow: {
        '3d': '0px 1px 0px 0px #ffffff80 inset, 0px -1px 2px 0px #00000033',
        '3d-dark': '0px 1px 0px 0px #ffffff1a inset, 0px -1px 2px 0px #00000033',
        '3d-hover': '0px 1px 0px 0px #ffffff80 inset, 0px -1px 4px 0px #0000004d, 0px 0px 20px -5px var(--tw-shadow-color)',
        '3d-hover-dark': '0px 1px 0px 0px #ffffff1a inset, 0px -1px 4px 0px #0000004d, 0px 0px 20px -5px var(--tw-shadow-color)',
      }
    },
  },
  plugins: [],
};