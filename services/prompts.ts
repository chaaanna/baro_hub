
import { Task } from "../types";

/**
 * Centralized Prompt Engineering
 * Easier to manage, version, and test prompts separately from the API logic.
 */

export const PromptTemplates = {
  draftTask: (rawInput: string) => `
    당신은 IT 선도 기업의 수석 PM(Project Manager)입니다.
    사용자가 입력한 거친(Rough) 업무 아이디어를 분석하여, 개발팀이나 디자인팀이 즉시 착수할 수 있는 "전문적인 업무 명세서" 초안을 3가지 스타일로 제안하세요.

    [입력 메시지]
    "${rawInput}"
    
    [작성 지침]
    다음 3가지 스타일의 옵션을 포함한 리스트를 생성하세요:
    1. "표준(Standard)": 균형 잡힌 전문적인 스타일.
    2. "상세(Detailed)": 배경, 상세 요건, 기대 효과 등을 매우 구체적으로 기술.
    3. "간결(Concise)": 핵심만 빠르게 파악할 수 있는 요약 스타일.

    각 항목은 다음 필드를 포함해야 합니다:
    - title: 명확하고 전문적인 제목 (한국어)
    - description: 스타일(표준/상세/간결)에 맞춘 상세 설명 (한국어, 줄바꿈 포함)
    - priority: 'HIGH', 'MEDIUM', 'LOW' 중 택1
    - product: 제품군 추론
    - type: 업무 유형 (버그, 기능, UX 등)
    - styleTag: "표준", "상세", "간결" 중 하나

    응답은 JSON 배열(Array)이어야 합니다.
  `,

  analyzeTask: (task: Task) => `
    당신은 시니어 프로젝트 매니저이자 기술 튜터입니다.
    다음 업무를 분석하여 실무자가 **가장 먼저 파악해야 할 핵심 지식(Context)**과 **구체적인 실행 전략**을 제시하세요.

    [업무 정보]
    제목: ${task.title}
    제품: ${task.product}
    설명: ${task.description}
    
    [요청 사항]
    1. strategy 필드에는 다음 내용을 마크다운 형식으로 작성하세요:
       - 🧐 **핵심 파악 사항**: 이 업무를 시작하기 전 반드시 알아야 할 개념, 기술 스택, 혹은 비즈니스 맥락. (1차적으로 무엇을 알아야 하는지)
       - 🚀 **단계별 실행 가이드**: 구체적인 Action Item 기반의 전략.
       - 💡 **성공 팁**: 예상되는 어려움이나 효율성을 높이는 팁.
       - ⚠️ **리스크 요인**: 발생 가능한 잠재적 문제와 대응 방안.
    
    2. suggestedResources 필드에는 업무와 관련된 양질의 학습 자료(문서, 블로그 등) 2개를 추천하세요.
    
    모든 응답은 "한국어"로 작성해주세요.
  `,

  generateSubtasks: (task: Task) => `
    다음 업무를 4-6개의 실행 가능한 체크리스트 항목(하위 업무)으로 분해해주세요.
    업무: ${task.title}
    문맥: ${task.description}
    응답은 한국어 JSON 배열입니다.
  `,

  chatGuideSystem: (contextTask: Task) => 
    `System: 당신은 다음 업무를 돕는 친절한 어시스턴트입니다. 제목: ${contextTask.title}, 설명: ${contextTask.description}. 답변은 한국어로 작성하세요.`,

  analyzeResource: (url: string, videoId?: string | null) => {
    const searchTarget = videoId ? `site:youtube.com "${videoId}"` : url;

    return `
    당신은 기업 내부 지식관리(KM) 시스템을 위한 영상/문서 분석 AI입니다.
    제공된 URL의 콘텐츠(영상 또는 문서)를 분석하여 체계적으로 데이터베이스에 저장할 수 있는 구조화된 정보를 추출하세요.

    [TARGET URL]
    ${url}
    
    [CRITICAL HINT - For Search Grounding]
    Search Query: ${searchTarget}
    Video ID: ${videoId || 'N/A'}
    
    [FALLBACK STRATEGY]
    1. **Primary Search**: Attempt to find specific content, transcript, or chapters.
    2. **Secondary Search**: If direct content is restricted, search for "Video Title", "Channel Name", and "Description" using the Video ID or URL.
    3. **Reconstruction**: If transcript is missing, YOU MUST reconstruct the summary and metadata based on title, thumbnail text, and description found in search results.
    DO NOT RETURN "NOT FOUND". Always provide the best possible estimation based on available metadata.

    [OUTPUT FORMAT - JSON ONLY]
    아래 JSON 스키마에 맞춰 응답해주세요. 순수 JSON만 반환하세요.

    {
      "basicInfo": {
        "title": "제목을 명확하고 간결하게 (최대 50자, 찾지 못하면 URL 표기)",
        "summary": "핵심 내용을 1-2문장으로 요약 (정보가 없으면 '분석 실패: 메타데이터 부족' 표기)",
        "level": "BEGINNER, INTERMEDIATE, ADVANCED 중 하나 선택 (기본값: BEGINNER)",
        "tags": ["관련 기술/주제/분야를 나타내는 태그 5-7개"],
        "author": "작성자나 발표자 (없으면 null)",
        "contentType": "video 또는 article (URL에 따라 자동 판단)"
      },
      
      "metadata": {
        "duration": "영상의 길이(초 단위, 정수, 없으면 0)",
        "language": "ko 또는 en 등 언어 코드",
        "category": "개발, 디자인, 마케팅, 운영, 기타 중 하나",
        "subCategory": "세부 카테고리 (예: Frontend, Backend, UI/UX 등)",
        "uploadedAt": "현재 시간을 ISO 8601 형식으로",
        "department": "해당 내용과 가장 관련있는 부서명 추정 (없으면 null)"
      },
      
      "searchOptimization": {
        "keywords": ["검색에 유용한 키워드 10-15개 추출"],
        "searchableText": "주요 내용을 포괄하는 텍스트 (200-300자).",
        "chapters": [
          {
            "title": "챕터 제목",
            "timestamp": "시작시간-종료시간 (예: 00:00-05:30)",
            "summary": "해당 구간의 내용 요약"
          }
        ]
      },
      
      "managementInfo": {
        "status": "active",
        "visibility": "team",
        "originalFileUrl": "${url}",
        "thumbnailUrl": null,
        "fileSize": null,
        "lastUpdated": "현재 시간을 ISO 8601 형식으로"
      }
    }

    중요 지침:
    - 영상이 5분 미만이면 chapters를 빈 배열로 두세요.
    - 영상이 5분 이상이면 3-5개의 의미있는 챕터로 구분하세요.
    - 정보가 부족하면 chapters 대신 keywords를 풍부하게 작성하세요.
    - 한국어로 작성하세요.
    `;
  }
};
