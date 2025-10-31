interface Slide {
  id: string;
  title: string;
  coreIdea: string;
  arguments: string[];
}

// 检测是否为超时错误
function isTimeoutError(error: any): boolean {
  return error.name === 'AbortError' ||
         error.message?.includes('timeout') ||
         error.message?.includes('aborted') ||
         error.message?.includes('The operation was aborted');
}

// 智能回退解析函数
function smartFallbackParsing(text: string): Slide[] {
  const lines = text.split('\n').filter(line => line.trim());
  const slides: Slide[] = [];

  let currentSlide: Partial<Slide> = {};
  let slideCounter = 1;

  // 关键词匹配
  const titleKeywords = ['标题', '主题', 'PPT', '演示', '报告'];
  const coreIdeaKeywords = ['核心观点', '观点', '认为', '核心', '关键', '重要', '本质', '精髓', '总结', '结论'];

  for (const line of lines) {
    const trimmedLine = line.trim();

    // 检测标题（短文本或包含标题关键词）
    if ((trimmedLine.length <= 30 && !trimmedLine.includes('：') && !trimmedLine.includes(':')) ||
        titleKeywords.some(keyword => trimmedLine.includes(keyword))) {

      // 如果已有标题，保存当前幻灯片
      if (currentSlide.title) {
        slides.push(createSlideFromPartial(currentSlide, slideCounter));
        slideCounter++;
        currentSlide = {};
      }
      currentSlide.title = trimmedLine;
    }
    // 检测核心观点
    else if (coreIdeaKeywords.some(keyword => trimmedLine.includes(keyword))) {
      const coreIdea = trimmedLine.replace(/核心观点[：:]\s*/, '')
                                .replace(/观点[：:]\s*/, '')
                                .replace(/认为[：:]\s*/, '')
                                .replace(/核心[：:]\s*/, '')
                                .replace(/关键[：:]\s*/, '')
                                .replace(/重要[：:]\s*/, '');
      if (coreIdea) {
        currentSlide.coreIdea = coreIdea;
      }
    }
    // 检测论据（包含冒号的内容）
    else if (trimmedLine.includes('：') || trimmedLine.includes(':')) {
      if (!currentSlide.arguments) currentSlide.arguments = [];
      if (currentSlide.arguments.length < 5) {
        currentSlide.arguments.push(trimmedLine);
      }
    }
    // 检测简单的短行，可能也是论据
    else if (trimmedLine.length > 10 && trimmedLine.length <= 100 && !currentSlide.title) {
      // 如果没有标题，第一行作为标题
      currentSlide.title = trimmedLine;
    }
  }

  // 添加最后一个幻灯片
  if (currentSlide.title || currentSlide.coreIdea) {
    slides.push(createSlideFromPartial(currentSlide, slideCounter));
  }

  // 如果解析失败，创建默认幻灯片
  if (slides.length === 0) {
    slides.push({
      id: '1',
      title: '文本解析结果',
      coreIdea: '基于智能规则提取的内容',
      arguments: [
        '内容一：从文本中提取的信息',
        '内容二：智能分类整理',
        '内容三：结构化呈现'
      ]
    });
  }

  return slides;
}

// 从部分数据创建完整幻灯片
function createSlideFromPartial(partial: Partial<Slide>, id: string | number): Slide {
  return {
    id: id.toString(),
    title: partial.title || '未命名幻灯片',
    coreIdea: partial.coreIdea || '核心观点',
    arguments: partial.arguments || ['请添加论据内容']
  };
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || !text.trim()) {
      return Response.json(
        { error: '请提供要解析的文本内容' },
        { status: 400 }
      );
    }

    // 检查环境变量
    const apiKey = process.env.GLM_API_KEY;
    if (!apiKey) {
      console.warn('GLM_API_KEY environment variable is not set, using smart fallback parsing');
      // 使用智能回退解析而不是返回错误
      const slides = smartFallbackParsing(text);
      const validatedSlides = slides.map((slide, index) => {
        // 获取并清理论据数组
        let slideArguments = Array.isArray(slide.arguments)
          ? slide.arguments.filter(arg => arg && arg.trim()).slice(0, 5)
          : ['请添加论据内容'];

        // 去重：移除重复的论据内容
        const uniqueArguments = [];
        const seenArguments = new Set();

        for (const arg of slideArguments) {
          const normalizedArg = arg.trim().toLowerCase();
          if (!seenArguments.has(normalizedArg)) {
            seenArguments.add(normalizedArg);
            uniqueArguments.push(arg.trim());
          }
        }

        return {
          id: (index + 1).toString(),
          title: slide.title || `幻灯片 ${index + 1}`,
          coreIdea: slide.coreIdea || '核心观点',
          arguments: uniqueArguments.length > 0 ? uniqueArguments : ['请添加论据内容']
        };
      });

      return Response.json({
        success: true,
        slides: validatedSlides,
        count: validatedSlides.length,
        metadata: {
          usedAI: false,
          parseMethod: 'smart-fallback',
          apiCallTime: '⚠️ 使用智能回退解析（无API密钥）',
          quality: 'medium',
          textLength: text.length,
          slideCount: validatedSlides.length,
          environment: 'development',
          reason: 'GLM_API_KEY not configured'
        },
        message: `⚠️ 使用智能回退解析，生成了 ${validatedSlides.length} 张幻灯片`
      });
    }

    // 构建解析提示词 (根据GLM API优化)
    const prompt = `请将以下文本内容解析为PPT幻灯片，严格按照JSON格式返回。

要求：
1. 返回格式必须是有效的JSON数组
2. 每个幻灯片对象包含：title（标题）、coreIdea（核心观点）、arguments（论据数组）
3. 标题控制在15字以内
4. 核心观点用一句话总结
5. 论据提供3-5个要点，每个不超过20字
6. 不要包含任何解释文字，只返回纯JSON

示例输出格式：
[
  {
    "title": "人工智能应用",
    "coreIdea": "AI正在改变世界",
    "arguments": ["机器学习突破", "深度学习应用", "自然语言处理"]
  }
]

需要解析的文本：
${text}

请严格按照上述要求解析并返回有效的JSON数组。`;

    // 检测运行环境并选择调用方式
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
    let slides: Slide[] = [];
    let usedAI = false;
    let apiCallTime = '';

    if (isProduction) {
      // 生产环境：直接调用 GLM API
      console.log('🚀 生产环境模式：直接调用 GLM API...');

      try {
        const startTime = Date.now();

        // 创建超时控制器
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 55000); // 55秒超时

        const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'glm-4.5',
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.3,
            max_tokens: 2000,
            stream: false
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId); // 清除超时计时器

        const endTime = Date.now();
        console.log('⏱️ 直接GLM API响应时间:', endTime - startTime, 'ms');

        if (response.ok) {
          const data = await response.json();
          console.log('✅ 直接GLM API调用成功!');

          if (data.choices?.[0]?.message?.content) {
            const aiResponse = data.choices[0].message.content.trim();
            console.log('✅ AI响应长度:', aiResponse.length);

            try {
              slides = JSON.parse(aiResponse);
              usedAI = true;
              apiCallTime = `✅ 直接API调用成功 (${endTime - startTime}ms)`;
              console.log('✅ 直接API响应解析成功，生成', slides.length, '张幻灯片');
            } catch (parseError) {
              console.error('直接API响应JSON解析失败:', parseError);
              slides = [];
            }
          }
        } else {
          const errorData = await response.text();
          console.error('直接GLM API调用失败:', response.status, errorData);
          apiCallTime = `❌ 直接API调用失败 (${response.status})`;
        }
      } catch (directError) {
        console.error('❌ 直接GLM API调用异常:', directError);
        if (isTimeoutError(directError)) {
          console.log('⏰ API调用超时，将使用智能回退解析');
          apiCallTime = '⏰ API调用超时，使用智能回退';
        } else {
          apiCallTime = '❌ 直接API调用异常';
        }
      }
    } else {
      // 本地环境：使用代理服务
      console.log('🔧 本地开发模式：使用代理服务调用 GLM API...');

      try {
        const baseUrl = process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:3000';

        // 创建超时控制器
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 55000); // 55秒超时

        const proxyResponse = await fetch(`${baseUrl}/api/proxy/glm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            apiKey: apiKey,
            model: 'glm-4.5',
            content: prompt
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId); // 清除超时计时器

        if (proxyResponse.ok) {
          const proxyData = await proxyResponse.json();
          if (proxyData.success && proxyData.data?.choices?.[0]?.message?.content) {
            const aiResponse = proxyData.data.choices[0].message.content.trim();
            console.log('✅ GLM代理调用成功！AI响应长度:', aiResponse.length);

            try {
              // 尝试清理和解析AI响应
              let cleanResponse = aiResponse.trim();

              // 移除可能的markdown代码块标记
              cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*$/g, '');

              // 移除可能的额外文字解释
              const jsonStartIndex = cleanResponse.indexOf('[');
              const jsonEndIndex = cleanResponse.lastIndexOf(']');

              if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
                cleanResponse = cleanResponse.substring(jsonStartIndex, jsonEndIndex + 1);
              }

              let slides = JSON.parse(cleanResponse);
              console.log('✅ GLM代理响应解析成功，生成', slides.length, '张幻灯片');

              const validatedSlides = slides.map((slide: any, index: number) => {
                // 对论据进行去重处理
                let slideArguments = Array.isArray(slide.arguments) ? slide.arguments.filter((arg: any) => arg && arg.trim()) : [];

                // 去重：移除重复的论据内容
                const uniqueArguments = [];
                const seenArguments = new Set();

                for (const arg of slideArguments) {
                  const normalizedArg = arg.trim().toLowerCase();
                  if (!seenArguments.has(normalizedArg)) {
                    seenArguments.add(normalizedArg);
                    uniqueArguments.push(arg.trim());
                  }
                }

                const validatedSlide: Slide = {
                  id: (index + 1).toString(),
                  title: slide.title || '幻灯片标题',
                  coreIdea: slide.coreIdea || '核心观点',
                  arguments: uniqueArguments
                };
                return validatedSlide;
              }).filter((slide: any) => slide.title && slide.title !== '幻灯片标题');

              return Response.json({
                success: true,
                slides: validatedSlides,
                count: validatedSlides.length,
                metadata: {
                  usedAI: true,
                  parseMethod: 'glm-4.5-proxy',
                  apiCallTime: '✅ GLM代理API调用成功',
                  quality: 'high',
                  textLength: text.length,
                  slideCount: validatedSlides.length,
                  proxied: true
                },
                message: `🌐 通过GLM AI代理解析成功！生成了 ${validatedSlides.length} 张高质量幻灯片`
              });
            } catch (parseError) {
              console.error('GLM代理响应JSON解析失败:', parseError);
            }
          } else {
            console.error('GLM代理响应格式错误:', proxyData);
          }
        } else {
          const errorData = await proxyResponse.text();
          console.error('GLM代理调用失败:', proxyResponse.status, errorData);
        }

        console.log('⚠️ GLM代理调用失败，将使用智能回退解析');
        apiCallTime = '❌ GLM代理调用失败';

      } catch (proxyError) {
        console.error('❌ GLM代理调用异常:', proxyError);
        if (isTimeoutError(proxyError)) {
          console.log('⏰ 代理调用超时，将使用智能回退解析');
          apiCallTime = '⏰ 代理调用超时，使用智能回退';
        } else {
          apiCallTime = '❌ GLM代理调用异常';
        }
      }
    }

    // 如果 AI 解析失败，使用智能规则解析作为回退
    if (slides.length === 0) {
      console.log('🔄 Using smart fallback parsing...');
      slides = smartFallbackParsing(text);
      if (!apiCallTime) apiCallTime = '⚠️ 使用智能回退解析';
    }

    // 检测是否使用了超时回退
    const isTimeoutFallback = apiCallTime?.includes('超时') && !usedAI;

    // 验证和清理数据
    const validatedSlides = slides.map((slide, index) => {
      // 获取并清理论据数组
      let slideArguments = Array.isArray(slide.arguments)
        ? slide.arguments.filter(arg => arg && arg.trim()).slice(0, 5)
        : [];

      // 去重：移除重复的论据内容
      const uniqueArguments = [];
      const seenArguments = new Set();

      for (const arg of slideArguments) {
        const normalizedArg = arg.trim().toLowerCase();
        if (!seenArguments.has(normalizedArg)) {
          seenArguments.add(normalizedArg);
          uniqueArguments.push(arg.trim());
        }
      }

      const validatedSlide: Slide = {
        id: (index + 1).toString(),
        title: slide.title || `幻灯片 ${index + 1}`,
        coreIdea: slide.coreIdea || '核心观点',
        arguments: uniqueArguments
      };

      // 确保至少有一个论据
      if (validatedSlide.arguments.length === 0) {
        validatedSlide.arguments = ['请添加论据内容'];
      }

      return validatedSlide;
    });

    // 如果解析失败，返回默认幻灯片
    if (validatedSlides.length === 0) {
      validatedSlides.push({
        id: '1',
        title: 'AI 解析结果',
        coreIdea: '从文本中提取的内容',
        arguments: ['论据一：内容一', '论据二：内容二', '论据三：内容三']
      });
    }

    console.log(`Successfully parsed ${validatedSlides.length} slides`);

    return Response.json({
      success: true,
      slides: validatedSlides,
      count: validatedSlides.length,
      metadata: {
        usedAI: usedAI,
        parseMethod: usedAI ? (isProduction ? 'glm-4.5-direct' : 'glm-4.5') : 'smart-fallback',
        apiCallTime: apiCallTime,
        quality: usedAI ? 'high' : 'medium',
        textLength: text.length,
        slideCount: validatedSlides.length,
        environment: isProduction ? 'production' : 'development',
        directCall: isProduction && usedAI
      },
      message: usedAI
        ? `✨ AI 解析成功！生成了 ${validatedSlides.length} 张高质量幻灯片`
        : isTimeoutFallback
        ? `⏰ AI服务响应超时，已自动使用智能解析生成了 ${validatedSlides.length} 张幻灯片`
        : `⚠️ 使用智能回退解析生成了 ${validatedSlides.length} 张幻灯片`
    });

  } catch (error) {
    console.error('Error in parse-slides API:', error);

    let errorMessage = '解析失败，请稍后重试';
    if (error instanceof Error) {
      if (error.message.includes('API_KEY')) {
        errorMessage = 'AI服务配置错误，请联系管理员';
      } else if (error.message.includes('quota')) {
        errorMessage = 'AI服务使用次数已达上限，请稍后重试';
      } else if (error.message.includes('network')) {
        errorMessage = '网络连接失败，请检查网络后重试';
      }
    }

    return Response.json(
      {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}