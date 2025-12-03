# 7. 기능: Gemini Pro 워크스페이스 (Standalone Chat)

범용적인 AI 상호작용을 위한 독립된 채팅 페이지입니다. 멀티턴 대화, 이미지 분석, 음성 인식을 지원합니다.

## 🎤 주요 기능

1.  **스트리밍 텍스트:** 타자기 효과처럼 글자가 하나씩 나타나는 스트리밍 응답을 처리합니다.
2.  **멀티모달 입력:** 텍스트 + 이미지(Base64)를 동시에 전송합니다.
3.  **음성 인식:** 브라우저의 `webkitSpeechRecognition` API를 사용합니다.
4.  **모델 전환:** 작업 성격에 따라 Flash(속도)와 Pro(지능) 모델을 전환합니다.

## 🏗 구현 상세

### 스트리밍 로직 처리
단순 `generateContent`와 달리, 채팅 히스토리와 스트림 청크(Chunk)를 관리해야 합니다.

```typescript
// 1. UI 상태에 빈 메시지(Placeholder) 추가
setMessages(prev => [...prev, { id: 'bot-new', text: '', isStreaming: true }]);

// 2. 스트림 시작
const stream = await chat.sendMessageStream({ message: prompt });

// 3. 청크 누적 및 UI 업데이트
let fullText = '';
for await (const chunk of stream) {
    fullText += chunk.text;
    // 해당 ID의 메시지 내용을 실시간 업데이트
    updateMessageText('bot-new', fullText);
}
```

### 이미지 처리 (Multimodal)
사용자가 업로드한 이미지를 Base64 문자열로 변환하되, API 전송 시에는 헤더(`data:image/...`)를 제거해야 합니다.

```typescript
const reader = new FileReader();
reader.onloadend = () => {
    const base64Raw = reader.result as string;
    // API는 순수 Base64 데이터만 필요로 함
    const base64Clean = base64Raw.split(',')[1]; 
    // base64Clean을 API 호출 시 전달
};
```

### 음성 인식 (Web Speech API)
별도의 라이브러리 없이 브라우저 내장 API를 활용하여 저지연 입력을 구현합니다.

```typescript
const recognition = new (window as any).webkitSpeechRecognition();
recognition.lang = 'ko-KR'; // 한국어 설정
recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    setInput(transcript); // 입력창 상태 업데이트
};
recognition.start();
```
