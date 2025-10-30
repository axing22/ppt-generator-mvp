'use client';

import { useState } from 'react';

export default function TestGLMPage() {
  const [text, setText] = useState('人工智能正在改变世界。机器学习和深度学习技术的发展推动了AI在各个领域的应用，包括医疗诊断、自动驾驶、智能助手等。未来AI将继续深化与人类社会的融合。');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState<string>('');

  const testGLMAPI = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    setProgress('正在连接GLM AI服务...');

    const startTime = Date.now();

    try {
      setProgress('正在解析文本内容...');

      const response = await fetch('/api/parse-slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      setProgress('正在获取AI分析结果...');

      const data = await response.json();
      const elapsedTime = Math.round((Date.now() - startTime) / 1000);

      if (response.ok) {
        setProgress(`✅ 分析完成！用时 ${elapsedTime} 秒`);
        setResult(data);
      } else {
        setProgress('');
        setError(data.error || 'API调用失败');
      }
    } catch (err) {
      setProgress('');
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">GLM API 测试页面</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">测试文本</h2>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-32 p-3 border border-gray-300 rounded-md"
            placeholder="输入要解析的文本..."
          />
          <button
            onClick={testGLMAPI}
            disabled={loading}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '测试中...' : '测试 GLM API'}
          </button>
        </div>

        {progress && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-600">{progress}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold">错误信息</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">测试结果</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold mb-2">元数据</h3>
                <pre className="text-sm text-gray-600 overflow-x-auto">
                  {JSON.stringify(result.metadata, null, 2)}
                </pre>
              </div>

              <div className="bg-blue-50 p-4 rounded">
                <h3 className="font-semibold mb-2">消息</h3>
                <p className="text-blue-600">{result.message}</p>
              </div>

              <div className="bg-green-50 p-4 rounded">
                <h3 className="font-semibold mb-2">生成的幻灯片 ({result.count}张)</h3>
                {result.slides.map((slide: any, index: number) => (
                  <div key={slide.id} className="mb-4 p-3 bg-white rounded border border-green-200">
                    <h4 className="font-semibold text-gray-800">幻灯片 {index + 1}: {slide.title}</h4>
                    <p className="text-gray-600 my-2"><strong>核心观点:</strong> {slide.coreIdea}</p>
                    <div className="text-gray-600">
                      <strong>论据:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {slide.arguments.map((arg: string, argIndex: number) => (
                          <li key={argIndex}>{arg}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}