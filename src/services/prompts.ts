
import { Task } from "../../types";

// A Centralized Hub for All AI Prompt Templates
export const PromptTemplates = {

  /**
   * Generates a detailed, structured JSON output for a given URL or topic.
   * Utilizes Google Search grounding for factual accuracy.
   */
  analyzeResource: (url: string, videoId: string | null) => `
    You are an expert content analyst. Your primary task is to analyze the content accessible at the URL: ${url}.
    ${videoId ? `This is a YouTube video with ID: ${videoId}. Prioritize analyzing its transcript if available.` : ''}

    A CRITICAL REQUIREMENT, especially for video content, is to divide the material into logical, time-stamped chapters. Each chapter must contain a title, a summary, and its start and end times.
    
    IMPORTANT: All generated text content (titles, summaries, tags, keywords, chapters, etc.) MUST be written in Korean.

    Ground your analysis using Google Search to ensure accuracy and gather supplemental information.
    Your ultimate goal is to extract structured, actionable knowledge that can be stored in a database.
    
    **CRITICAL RULE: If you cannot confidently analyze the content from the URL (e.g., due to lack of metadata, captions, or descriptive text), you MUST respond with a specific JSON object indicating failure. DO NOT GUESS or HALLUCINATE content. The failure JSON object is: {"error": "Analysis failed", "reason": "Insufficient content or metadata available at the provided URL."}**

    Respond STRICTLY with a single, valid JSON object that conforms to the following structure. Do NOT include any text, notes, or explanations outside of the JSON object.
    Ensure all string fields are properly escaped.
    
    {
      "basicInfo": {
        "title": "Clear and concise title (max 50 chars, use URL if not found)",
        "summary": "Core content summary in 1-2 sentences",
        "level": "Choose one: BEGINNER, INTERMEDIATE, ADVANCED (default: BEGINNER)",
        "tags": ["5-7 relevant tags for technology, topics, or fields"],
        "author": "Author or speaker (null if not found)",
        "contentType": "Automatically determine 'video' or 'article' based on the URL"
      },
      "metadata": {
        "duration": "Video duration in seconds (integer, 0 if not a video)",
        "language": "ko",
        "category": "Choose one: 'Development', 'Design', 'Marketing', 'Operations', 'Other'",
        "subCategory": "Detailed sub-category (e.g., 'Frontend', 'Backend', 'UI/UX')",
        "uploadedAt": "Current time in ISO 8601 format",
        "department": "Estimate the most relevant internal department (null if none)"
      },
      "searchOptimization": {
        "keywords": ["Extract 10-15 keywords useful for search"],
        "searchableText": "A comprehensive text (200-300 characters) covering the main topics.",
        "chapters": [ // THIS IS A MANDATORY FIELD FOR VIDEOS. If no chapters can be identified, provide at least one chapter covering the entire content.
          {
            "title": "Chapter Title",
            "startTime": "Start time (e.g., 01:23)",
            "endTime": "End time (e.g., 05:45)",
            "summary": "A 1-2 sentence summary of this chapter's key content"
          }
        ]
      },
      "managementInfo": {
        "status": "draft",
        "visibility": "private",
        "originalFileUrl": "${url}",
        "lastUpdated": "Current time in ISO 8601 format"
      }
    }

    FINAL REMINDER: The ENTIRE JSON response, including all text fields, MUST be in Korean. If analysis is not possible, you MUST return the specified error JSON.
  `,

  /**
   * Generates a structured summary (intro, body, conclusion) for a given URL.
   */
  quickSummarize: (url: string) => `
    You are a content summarization specialist.
    Analyze the content at the URL: ${url}.
    Your task is to provide a concise, structured summary in Korean.
    The summary must be divided into three sections: 서론 (Introduction), 본론 (Body), and 결론 (Conclusion).
    
    Use the following markdown format:
    ### 서론
    [Briefly introduce the topic or problem the content addresses]

    ### 본론
    [Summarize the main points, arguments, or steps presented in the content]

    ### 결론
    [Conclude with the key takeaway, solution, or final statement of the content]

    Ensure the entire response is in Korean. Do not add any preamble or text outside of this structure.
  `,

  /**
   * Analyzes a sequence of video frames to produce a summary, scenes, and keywords.
   */
  analyzeVideoFrames: (frameCount: number, duration: number) => `
    You are an AI assistant specialized in video content analysis.
    I have provided a sequence of ${frameCount} frames from a video with a total duration of ${Math.round(duration)} seconds.
    Based on these frames, perform the following tasks and respond in pure, valid JSON format.
    Do not include any additional text or markdown formatting.

    IMPORTANT: All generated text content (summaries, titles, keywords, etc.) MUST be written in Korean.

    **CRITICAL RULE: If the provided frames are not sufficient to understand the video's content, you MUST respond with a specific JSON object indicating failure: {"error": "Analysis failed", "reason": "Insufficient frames to determine video content."} DO NOT GUESS.**

    Your response must be a JSON object with the following structure:
    {
      "overallSummary": "Provide a concise overall summary of the video's content.",
      "scenes": [
        {
          "title": "Scene Title",
          "summary": "Describe the key events or topics in this scene.",
          "startTime": "Start time in seconds (integer).",
          "endTime": "End time in seconds (integer)."
        }
      ],
      "keywords": ["keyword1", "keyword2", "keyword3"]
    }

    Instructions:
    1.  **overallSummary**: Synthesize the information across all frames to create a comprehensive summary of the entire video.
    2.  **scenes**: Identify distinct scenes or topics. A scene is a sequence of related frames. For each scene:
        -   'title': Create a short, descriptive title.
        -   'summary': Write a 1-2 sentence summary of what happens in that scene.
        -   'startTime' and 'endTime': Provide the start and end times in seconds. Estimate these based on the frame sequence and total video duration.
    3.  **keywords**: List the most relevant keywords or tags that describe the video's content.
  `,

  /**
   * Drafts 3 versions of a professional task from a raw user input.
   */
  draftTask: (rawInput: string) => `
    Based on the following user request, generate 3 distinct and professional task drafts.
    Focus on creating clear, actionable titles and descriptions.
    User Request: "${rawInput}"

    IMPORTANT: All generated text content MUST be written in Korean.

    Respond with a valid JSON array of 3 objects.
  `,

  /**
   * Analyzes a task to provide a strategy and learning resources.
   */
  analyzeTask: (task: Task) => `
    Analyze the following task and provide a strategic approach and relevant learning resources.
    Task Title: ${task.title}
    Task Description: ${task.description}
    Format the strategy as markdown for readability.
    Suggest 3-5 high-quality online articles or video links.
    IMPORTANT: All generated text content MUST be written in Korean.
    Respond with a valid JSON object.
  `,

  /**
   * Generates a checklist of subtasks for a given task.
   */
  generateSubtasks: (task: Task) => `
    Based on the task "${task.title}", generate a checklist of actionable subtasks.
    Focus on breaking down the task into smaller, manageable steps.
    IMPORTANT: All generated text content MUST be written in Korean.
    Respond with a valid JSON array of objects, each with a 'title' property.
  `,

  /**
   * System prompt for the AI Guide chatbot.
   */
  chatGuideSystem: (task: Task) => `
    You are an AI assistant providing guidance on the following task:
    Title: ${task.title}
    Description: ${task.description}
    Your goal is to help the user complete this task by providing context, answering questions, and offering suggestions. Be concise and helpful.
    IMPORTANT: All your responses MUST be in Korean.
  `,
};
