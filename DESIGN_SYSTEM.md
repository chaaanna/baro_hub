# Nexus AI Design System

## 1. Design Philosophy (디자인 철학)
**"Tech Minimalist & Clarity"**
Nexus AI의 디자인은 Google의 최신 디자인 트렌드와 A-GO 컨셉에서 영감을 받았습니다. 불필요한 장식을 배제하고, **"순백색의 캔버스 위에 놓인 지능적인 도구"**를 지향합니다.

*   **Clean (청결함):** 과도한 그라데이션이나 어두운 배경을 배제하고, White & Light Grey 톤을 사용하여 정보의 가독성을 극대화합니다.
*   **Fluid (유동성):** 둥근 모서리(Rounded Corners)와 부드러운 그림자를 사용하여 딱딱한 업무 도구가 아닌, 유연한 사고를 돕는 도구임을 암시합니다.
*   **Tech-Native:** 배경의 미세한 도트 패턴(Dot Matrix)은 데이터와 네트워크의 연결성을 시각적으로 표현합니다.

---

## 2. Typography (타이포그래피)

### Font Family
*   **Primary Font:** `Noto Sans KR` (Google Fonts)
*   **Fallbacks:** `sans-serif`

### Scale & Usage
| Role | Size | Weight | Letter Spacing | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `text-2xl` (24px) | Bold (700) | `tracking-tight` | 메인 헤더, 브랜드 로고 |
| **Heading 1** | `text-xl` (20px) | Bold (700) | `leading-tight` | 모달/카드 제목 |
| **Heading 2** | `text-lg` (18px) | Bold (700) | Default | 섹션 타이틀 |
| **Body** | `text-base` (16px) | Regular (400) | `leading-relaxed` | 본문, 긴 설명 텍스트 |
| **UI Label** | `text-sm` (14px) | Medium (500) | Default | 버튼, 입력 필드, 리스트 아이템 |
| **Caption** | `text-xs` (12px) | Medium (500) | Default | 메타 데이터, 태그, 날짜 |

---

## 3. Color Palette (색상 팔레트)

### Neutral (Grayscale)
*   **Background:** `#FFFFFF` (Pure White) - 메인 컨텐츠 영역
*   **Canvas:** `#F8F9FA` (Google Grey 50) - 사이드바, 모달 컨텍스트 영역
*   **Primary Text:** `#202124` (Google Grey 900) - 주요 텍스트
*   **Secondary Text:** `#5F6368` (Google Grey 700) - 설명, 보조 텍스트
*   **Border:** `#E8EAED`, `#DADCE0` - 구분선

### Brand & Accent
*   **Brand Blue:** `#1A73E8` (Primary Action, Links)
*   **Brand Black:** `#000000` (Primary CTA Button)
*   **Success:** `text-green-600` / `bg-green-50`
*   **Warning:** `text-orange-600` / `bg-orange-50`
*   **Danger:** `text-red-600` / `bg-red-50`

---

## 4. UI Components (컴포넌트 스타일)

### A. Background Pattern (배경 패턴)
순수한 흰색 배경에 기술적인 느낌을 주기 위해 미세한 도트 패턴을 적용합니다.
```css
body {
  background-color: #ffffff;
  background-image: radial-gradient(#E1E3E6 1.5px, transparent 1.5px);
  background-size: 32px 32px;
}
```

### B. Cards (Clean Card)
유리 같은 질감보다는, 종이 위에 떠 있는 듯한 깨끗한 느낌을 줍니다.
*   **Background:** `rgba(255, 255, 255, 0.8)` + `backdrop-filter: blur(8px)`
*   **Border:** `1px solid #E8EAED`
*   **Shadow (Default):** `box-shadow: 0 1px 2px rgba(60,64,67,0.05), 0 2px 6px 2px rgba(60,64,67,0.05)`
*   **Hover Effect:** `transform: translateY(-1px)`, Shadow 증가.
*   **Radius:** `rounded-2xl`
*   **Action:** 우측 상단 원형 삭제 버튼 (Hover 시 표시)

### C. Buttons (버튼)
*   **Shape:** `rounded-full` (캡슐 형태, Pill Shape)
*   **Primary CTA:** `bg-black text-white` (그림자 포함)
*   **Secondary:** `bg-blue-50 text-blue-700`
*   **Ghost/Nav:** `text-gray-500 hover:bg-gray-50`
*   **Delete (New):** `w-7 h-7 rounded-full bg-white border hover:bg-red-50`

### D. Modal (Split Layout)
정보의 밀도를 조절하기 위해 좌우 분할 레이아웃을 사용합니다.
*   **Container:** `rounded-3xl`, `box-shadow: 0 24px 38px ...` (Deep Shadow)
*   **Left Pane (Context):** `bg-gray-50/80` - 고정된 정보 (업무 상세)
*   **Right Pane (Workspace):** `bg-white` - 인터랙션 영역 (AI 채팅, 전략)

### E. Tags & Badges
파스텔 톤 배경과 진한 텍스트 색상을 조합하여 시각적 피로도를 줄입니다.
*   **Style:** `px-2.5 py-1 rounded-md font-bold uppercase tracking-wide`
*   **Example:** `bg-blue-100 text-blue-700`

---

## 5. Motion & Effects (모션 및 효과)

### Transitions
모든 상호작용은 즉각적이지만 부드러워야 합니다.
*   **Duration:** `0.2s` ~ `0.3s`
*   **Ease:** `ease-out`
*   **Properties:** `transform`, `box-shadow`, `background-color`, `color`

### Animations
*   **Fade In:** 콘텐츠 로드 시 부드럽게 나타나는 효과.
```css
@keyframes fadeIn {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}
```

---

## 6. Iconography (아이콘)
*   **Library:** Lucide React
*   **Style:** Stroke width `2px` (기본), `1.5px` (작은 아이콘)
*   **Usage:** 텍스트와 함께 사용하여 직관성을 높이거나, 버튼의 액션을 명확히 할 때 사용합니다.
