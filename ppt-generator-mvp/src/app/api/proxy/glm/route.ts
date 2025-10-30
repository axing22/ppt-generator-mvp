import { NextRequest, NextResponse } from 'next/server';

interface GLMRequest {
  apiKey: string;
  model?: string;
  content: string;
}

interface GLMMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface GLMResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<GLMResponse>> {
  try {
    const { apiKey, model = 'glm-4.5', content }: GLMRequest = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API Key is required' },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    console.log('🌐 调用 GLM API...');
    console.log('📝 Content length:', content.length, 'characters');
    console.log('🤖 Model:', model);

    const startTime = Date.now();

    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: content
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        stream: false
      })
    });

    const endTime = Date.now();
    console.log('⏱️ GLM API Response time:', endTime - startTime, 'ms');

    if (!response.ok) {
      const errorData = await response.text();
      console.error('GLM API Error:', response.status, errorData);

      let errorMessage = 'GLM API 调用失败';
      if (response.status === 401) {
        errorMessage = 'GLM API Key 无效或已过期';
      } else if (response.status === 429) {
        errorMessage = 'GLM API 调用频率限制，请稍后重试';
      } else if (response.status === 500) {
        errorMessage = 'GLM 服务器错误，请稍后重试';
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: errorData,
          status: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ GLM API 调用成功!');
    console.log('📄 Response length:', JSON.stringify(data).length, 'characters');

    return NextResponse.json({
      success: true,
      data: data,
      metadata: {
        responseTime: endTime - startTime,
        model: model,
        contentLength: content.length
      }
    });

  } catch (error) {
    console.error('GLM Proxy Error:', error);

    let errorMessage = 'GLM 代理服务错误';
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = '网络连接失败，无法访问 GLM API';
      } else if (error.message.includes('timeout')) {
        errorMessage = '请求超时，请稍后重试';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}