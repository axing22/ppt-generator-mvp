'use client';

import { useState } from 'react';

export default function DebugPage() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    if (!inputText.trim()) {
      alert('请输入测试文本');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/parse-slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  const testGeminiDirect = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-gemini');
      const data = await response.json();
      alert(`Gemini API 测试结果：\n${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      alert(`测试失败：${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">🔧 API 调试页面</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 输入区域 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">测试输入</h2>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="请输入要测试的文本..."
              className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />

            <div className="flex gap-4 mt-4">
              <button
                onClick={testAPI}
                disabled={loading}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? '测试中...' : '🚀 测试解析API'}
              </button>

              <button
                onClick={testGeminiDirect}
                disabled={loading}
                className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                🔗 直接测试Gemini
              </button>
            </div>
          </div>

          {/* 结果显示区域 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">API 响应结果</h2>

            {result ? (
              <div className="space-y-4">
                {/* 基本信息 */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">基本信息</h3>
                  <div className="text-sm text-blue-700">
                    <p>• 成功状态: {result.success ? '✅ 成功' : '❌ 失败'}</p>
                    {result.count && <p>• 幻灯片数量: {result.count}</p>}
                    {result.metadata && (
                      <>
                        <p>• 解析方式: {result.metadata.parseMethod}</p>
                        <p>• API状态: {result.metadata.apiCallTime}</p>
                        <p>• 解析质量: {result.metadata.quality}</p>
                        <p>• 使用AI: {result.metadata.usedAI ? '✅ 是' : '❌ 否'}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* 消息 */}
                {result.message && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">系统消息</h3>
                    <p className="text-sm text-green-700">{result.message}</p>
                  </div>
                )}

                {/* 错误信息 */}
                {result.error && (
                  <div className="p-4 bg-red-50 rounded-lg">
                    <h3 className="font-semibold text-red-800 mb-2">错误信息</h3>
                    <p className="text-sm text-red-700">{result.error}</p>
                    {result.details && (
                      <p className="text-xs text-red-600 mt-2">详细信息: {result.details}</p>
                    )}
                  </div>
                )}

                {/* 原始响应 */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">完整响应 (JSON)</h3>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-96">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>

                {/* 解析结果预览 */}
                {result.slides && (
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h3 className="font-semibold text-yellow-800 mb-2">解析结果预览</h3>
                    {result.slides.map((slide: any, index: number) => (
                      <div key={index} className="mb-3 p-2 bg-white rounded border border-yellow-200">
                        <p className="font-medium text-sm">📄 {slide.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{slide.coreIdea}</p>
                        <div className="mt-1">
                          {slide.arguments.map((arg: string, argIndex: number) => (
                            <p key={argIndex} className="text-xs text-gray-500">• {arg}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                请输入测试文本并点击测试按钮
              </div>
            )}
          </div>
        </div>

        {/* 使用说明 */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">📖 使用说明</h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p>1. 在左侧输入框中粘贴要测试的文本</p>
            <p>2. 点击"测试解析API"按钮调用完整的解析流程</p>
            <p>3. 点击"直接测试Gemini"按钮测试Gemini API连通性</p>
            <p>4. 右侧会显示详细的API响应信息，包括：</p>
            <ul className="ml-4 list-disc">
              <li>解析方式 (gemini-ai 或 smart-fallback)</li>
              <li>API调用状态</li>
              <li>解析质量评级</li>
              <li>完整的原始响应数据</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}