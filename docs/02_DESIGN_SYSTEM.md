# 2. 디자인 시스템 구현 (Design System)

Nexus AI의 디자인 철학은 **"기술적 미니멀리즘(Tech Minimalist)"**과 **"명확성(Clarity)"**입니다.
도트 매트릭스 패턴 배경, 글래스모피즘(Glassmorphism) 카드, 그리고 Google 스타일의 색상 팔레트를 사용합니다.

## 🎨 1. Tailwind 설정

`tailwind.config.js`에 커스텀 폰트와 색상 토큰을 추가합니다.

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Noto Sans KR', 'sans-serif'], // 또는 'Inter' 사용
      },
      colors: {
        gray: {
          50: '#F8F9FA',  // Google Light Grey (배경용)
          900: '#202124', // Google Dark Grey (텍스트용)
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
```

## 💅 2. 전역 스타일 (CSS)

전역 CSS 파일에 시그니처 패턴인 **"도트 매트릭스(Dot Matrix)"** 배경과 커스텀 스크롤바를 적용합니다.

```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #ffffff;
  color: #202124;
  /* 핵심: 도트 매트릭스 패턴 배경 */
  background-image: radial-gradient(#E1E3E6 1.5px, transparent 1.5px);
  background-size: 32px 32px;
}

/* 커스텀 스크롤바 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #DADCE0;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #BDC1C6;
}

/* 스크롤바 숨김 유틸리티 */
.no-scrollbar::-webkit-scrollbar {
    display: none;
}
.no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
```

## 🃏 3. "Clean Card" 컴포넌트 패턴

복잡한 CSS 클래스 대신, 일관된 카드 스타일을 위한 유틸리티 클래스 혹은 컴포넌트를 정의하여 사용합니다.

**React 컴포넌트 예시:**

```tsx
<div className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm hover:shadow-md transition-all rounded-2xl p-6">
  {/* 카드 내용 */}
</div>
```

**스타일 특징:**
*   **배경:** 흰색(White) + 80% 투명도 + 배경 흐림(Backdrop Blur 8px).
*   **테두리:** 연한 회색 (`border-gray-200`).
*   **그림자:** 기본적으로 옅은 그림자(`shadow-sm`), 호버 시 깊어짐(`hover:shadow-md`).
*   **모서리:** 둥근 모서리 강조 (`rounded-2xl` 이상).
