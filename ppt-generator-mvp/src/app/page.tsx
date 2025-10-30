'use client';

import React, { useState, useEffect } from 'react';

interface Slide {
  id: string;
  title: string;
  coreIdea: string;
  arguments: string[];
}

interface AIProvider {
  parseToSlides(text: string): Promise<Slide[]>;
}

export default function PyramidAIPresenter() {
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: '1',
      title: '',
      coreIdea: '',
      arguments: ['', '', '']
    }
  ]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  const [importStartTime, setImportStartTime] = useState<number>(0);

  // 获取当前幻灯片
  const currentSlide = slides[currentSlideIndex] || slides[0];

  // 根据论据数量检测布局类型
  const detectLayout = (argumentsCount: number) => {
    if (argumentsCount === 1) return 'process-flow';
    if (argumentsCount === 2) return 'two-columns';
    if (argumentsCount === 3) return 'three-columns';
    if (argumentsCount === 4) return 'two-by-two-grid';
    if (argumentsCount === 5) return 'three-two-grid';
    if (argumentsCount === 6) return 'three-by-two-grid';
    return 'three-columns'; // 默认使用三列
  };

  // 更新幻灯片内容
  const updateSlide = (field: keyof Slide, value: any) => {
    const updatedSlides = [...slides];
    if (field === 'arguments') {
      updatedSlides[currentSlideIndex][field] = value;
    } else {
      updatedSlides[currentSlideIndex][field] = value;
    }
    setSlides(updatedSlides);
  };

  // 更新单个论据
  const updateArgument = (index: number, value: string) => {
    const updatedSlides = [...slides];
    const args = [...updatedSlides[currentSlideIndex].arguments];
    args[index] = value;
    updatedSlides[currentSlideIndex].arguments = args;
    setSlides(updatedSlides);
  };

  // 添加论据
  const addArgument = () => {
    const updatedSlides = [...slides];
    updatedSlides[currentSlideIndex].arguments.push('');
    setSlides(updatedSlides);
  };

  // 删除论据
  const removeArgument = (index: number) => {
    const updatedSlides = [...slides];
    const args = [...updatedSlides[currentSlideIndex].arguments];
    if (args.length > 1) {
      args.splice(index, 1);
      updatedSlides[currentSlideIndex].arguments = args;
      setSlides(updatedSlides);
    }
  };

  // 添加新幻灯片
  const addSlide = () => {
    const newSlide: Slide = {
      id: Date.now().toString(),
      title: '',
      coreIdea: '',
      arguments: ['', '', '']
    };
    setSlides([...slides, newSlide]);
    setCurrentSlideIndex(slides.length);
  };

  // 删除当前幻灯片
  const deleteSlide = () => {
    if (slides.length > 1) {
      const updatedSlides = slides.filter((_, index) => index !== currentSlideIndex);
      setSlides(updatedSlides);
      setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
    }
  };

  // 调整幻灯片顺序
  const moveSlide = (fromIndex: number, toIndex: number) => {
    const updatedSlides = [...slides];
    const [movedSlide] = updatedSlides.splice(fromIndex, 1);
    updatedSlides.splice(toIndex, 0, movedSlide);
    setSlides(updatedSlides);
    setCurrentSlideIndex(toIndex);
  };

  // AI 批量导入功能
  const handleAIImport = async () => {
    if (!importText.trim()) {
      alert('请输入要导入的内容');
      return;
    }

    setIsImporting(true);
    setImportStartTime(Date.now());
    setImportProgress('🔄 正在初始化AI解析...');

    try {
      setImportProgress('📝 正在分析文本结构...');
      await new Promise(resolve => setTimeout(resolve, 800));

      setImportProgress('🤖 正在连接GLM AI服务...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setImportProgress('💭 AI正在思考如何最佳组织内容...');

      // 调用真实的 AI 解析 API
      const response = await fetch('/api/parse-slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: importText }),
      });

      if (!response.ok) {
        setImportProgress('❌ AI服务响应异常');
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      setImportProgress('📊 正在解析AI返回的数据...');

      const data = await response.json();

      if (data.success) {
        setImportProgress('✅ 解析成功！正在生成幻灯片...');
        await new Promise(resolve => setTimeout(resolve, 500));

        setSlides(data.slides);
        setCurrentSlideIndex(0);
        setShowImportModal(false);
        setImportText('');
        setImportProgress('');

        // 计算总用时
        const totalTime = Math.round((Date.now() - importStartTime) / 1000);

        // 显示详细的解析结果信息
        let message = `🎉 解析完成！\n\n`;
        message += `📊 解析统计：\n`;
        message += `• 生成幻灯片：${data.count} 页\n`;
        message += `• 原始文本：${data.metadata?.textLength || importText.length} 字符\n`;
        message += `• 总用时：${totalTime} 秒\n`;

        if (data.metadata) {
          message += `\n🔍 技术信息：\n`;
          message += `• 解析方式：${data.metadata.parseMethod === 'glm-4.5' ? '✅ GLM-4.5' : data.metadata.parseMethod === 'smart-fallback' ? '⚠️ 智能回退' : '🤖 AI解析'}\n`;
          message += `• API状态：${data.metadata.apiCallTime}\n`;
          message += `• 解析质量：${data.metadata.quality === 'high' ? '🌟 高质量' : '📋 中等质量'}\n`;
          if (data.metadata.proxied) {
            message += `• 网络方式：代理调用（更适合生产环境）\n`;
          }
        }

        message += `\n💡 ${data.message}`;

        alert(message);
      } else {
        setImportProgress('❌ 解析失败');
        throw new Error(data.error || 'AI解析失败');
      }
    } catch (error) {
      console.error('AI Import Error:', error);
      setImportProgress('❌ 解析出错');
      const errorMessage = error instanceof Error ? error.message : 'AI解析失败，请稍后重试';

      setTimeout(() => {
        setImportProgress('');
        alert(`解析失败：${errorMessage}`);
      }, 1500);
    } finally {
      setIsImporting(false);
      setTimeout(() => {
        if (importProgress && !importProgress.includes('❌')) {
          setImportProgress('');
        }
      }, 2000);
    }
  };

  
  // 导出 HTML
  const exportHTML = () => {
    const htmlContent = generateFullHTML();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pyramid_export.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  // 生成完整 HTML
  const generateFullHTML = () => {
    const slidesHTML = slides.map((slide, index) => {
      const layout = detectLayout(slide.arguments.length);
      const argumentsHTML = slide.arguments.filter(arg => arg.trim()).map((arg, i) => {
        const parts = arg.split(/[：:]/);
        const title = parts[0] || `论据${i + 1}`;
        const content = parts[1] || arg;
        // 特殊处理5个论据的布局，第三个论据居中
        const isFiveArgCenter = layout === 'three-two-grid' && i === 2;
        const centerClass = isFiveArgCenter ? ' style="grid-column: 2;"' : '';

        // 将换行符转换为<br>标签
        const formattedContent = content.replace(/\n/g, '<br>');

        return `<div class="card"${centerClass}>
          <div class="card-title">${title}</div>
          <div class="card-content">${formattedContent}</div>
        </div>`;
      }).join('');

      const layoutClass = layout === 'process-flow' ? 'process-flow' :
                         layout === 'two-columns' ? 'two-columns' :
                         layout === 'three-columns' ? 'three-columns' :
                         layout === 'two-by-two-grid' ? 'two-columns' :
                         layout === 'three-two-grid' ? 'three-columns' :
                         layout === 'three-by-two-grid' ? 'three-columns' :
                         'three-columns';

      return `<section class="slide ${index === 0 ? 'active' : ''}" id="s${index + 1}">
        <div class="badge">P${index + 1}</div>
        <h1 class="title">${slide.title || '未填写标题'}</h1>
        <div class="core">
          <h3>核心观点</h3>
          <p>${slide.coreIdea || '未填写核心观点'}</p>
        </div>
        <div class="content">
          <div class="${layoutClass}">
            ${argumentsHTML}
          </div>
        </div>
      </section>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pyramid AI Presenter Export</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root{
      --teal:#00BCD4;
      --teal-strong:#00AC9E;
      --navy:#0B1A3A;
      --deep-teal:#00405C;
      --apple-blue:#007AFF;
      --line:#E5E5E7;
      --shadow:0 15px 35px rgba(0,188,212,.15);
      --card-shadow:0 8px 25px rgba(0,0,0,.08);
      --radius-lg:20px;
      --radius:15px;
      --transition:.25s ease-in-out;
      --page-w:1600px;
      --page-h:900px;
    }
    *{box-sizing:border-box;margin:0;padding:0}
    body{
      font-family:"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif;
      background: linear-gradient(135deg, var(--teal) 0%, rgba(255,255,255,.3) 50%, rgba(255,255,255,.1) 100%);
      min-height:100vh;
      padding:20px;
      color:var(--deep-teal);
    }
    .wrap{
      max-width:var(--page-w);
      margin:0 auto;
      backdrop-filter: blur(18px);
      border-radius: var(--radius-lg);
      padding: 24px 24px 32px;
    }
    .nav{
      text-align:center;
      margin-bottom: 18px;
    }
    .nav .btn{
      background:#fff;
      color:var(--apple-blue);
      border:1px solid var(--apple-blue);
      padding: 10px 18px;
      margin: 0 5px 8px;
      border-radius: 8px;
      cursor:pointer;
      font-size:16px;
      font-weight:500;
      transition: var(--transition);
    }
    .nav .btn:hover{ transform: translateY(-1px); box-shadow: 0 5px 15px rgba(0,122,255,.25); }
    .nav .btn.active{ background: var(--apple-blue); color:#fff; }
    .slide{
      width: var(--page-w);
      height: var(--page-h);
      margin: 0 auto 32px;
      background: linear-gradient(135deg, rgba(0,188,212,.05) 0%, rgba(255,255,255,.95) 50%, rgba(255,255,255,.90) 100%);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow);
      padding: 60px;
      display: none;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(0,188,212,.20);
    }
    .slide.active{ display:flex; }
    .slide::before{
      content:""; position:absolute; top:-50%; right:-50%; width:200%; height:200%;
      background: radial-gradient(circle, rgba(0,188,212,.03) 0%, transparent 70%);
      animation: orb 20s linear infinite;
    }
    @keyframes orb{ from{transform:rotate(0)} to{transform:rotate(360deg)} }
    .badge{
      position:absolute; top:20px; right:20px;
      font-size:18px; font-weight:500; color: var(--teal);
      background: rgba(0,188,212,.10); padding:8px 16px; border-radius:20px;
    }
    .title{
      font-size:48px; font-weight:700; color:var(--navy);
      text-align:center; margin-bottom:20px; line-height:1.2; position:relative; z-index:1;
    }
    .core{
      background: linear-gradient(135deg, rgba(0,188,212,.15), rgba(0,172,158,.15));
      border-radius: 20px; padding: 26px 30px; margin-bottom: 32px;
      text-align: center; border: 2px solid rgba(0,188,212,.3); position:relative; z-index:1;
    }
    .core h3{ font-size:28px; font-weight:700; color:var(--navy); margin-bottom:12px; }
    .core p{ font-size:36px; font-weight:700; color: var(--teal-strong); line-height:1.3; }
    .content{ flex:1; display:flex; flex-direction:column; justify-content:center; position:relative; z-index:1; }
    .three-columns{ display:grid; grid-template-columns: repeat(3,1fr); gap:30px; margin: 10px 0; }
    .two-columns{ display:grid; grid-template-columns: 1fr 1fr; gap:40px; margin:10px 0; }
    .process-flow{ display:flex; justify-content:space-between; align-items:center; gap:20px; margin:20px 0; }
    .card{
      background: rgba(255,255,255,.88); border-radius: 15px; padding: 24px;
      box-shadow: var(--card-shadow); transition: var(--transition);
      border-left:4px solid var(--teal);
    }
    .card:hover{ transform: translateY(-4px); box-shadow: 0 12px 28px rgba(0,188,212,.2); }
    .card-title{ font-size:20px; font-weight:600; color:var(--navy); margin-bottom:10px; }
    .card-content{ font-size:18px; color:var(--deep-teal); line-height:1.65; }
    .highlight{ color: var(--teal-strong); font-weight:600; }
    .emphasis{ background: linear-gradient(135deg, var(--teal), var(--teal-strong)); color:#fff; padding:4px 12px; border-radius:8px; font-weight:600; }
    .controls{ display:flex; justify-content:center; gap:10px; margin-top:8px; }
    .ctrl{ background:#fff; color:var(--apple-blue); border:1px solid var(--apple-blue);
      padding:10px 16px; border-radius:8px; cursor:pointer; font-size:16px; font-weight:500; transition:var(--transition); }
    .ctrl:hover{ transform: translateY(-1px); box-shadow:0 5px 15px rgba(0,122,255,.25); }
    @media (max-width: 1700px){
      .slide{ width: var(--page-w); height: var(--page-h); }
      .wrap{ overflow-x:auto; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="nav" id="nav"></div>
    ${slidesHTML}
    <div class="controls">
      <button class="ctrl" id="prev">上一页（←）</button>
      <button class="ctrl" id="next">下一页（→）</button>
    </div>
  </div>
  <script>
    const slides = Array.from(document.querySelectorAll('.slide'));
    const nav = document.getElementById('nav');
    let current = 0;

    slides.forEach((_, i)=>{
      const b = document.createElement('button');
      b.className = 'btn' + (i===0?' active':'');
      b.textContent = 'P' + (i+1);
      b.addEventListener('click', ()=>go(i));
      nav.appendChild(b);
    });

    function render(){
      slides.forEach((s,i)=> s.classList.toggle('active', i===current));
      [...nav.children].forEach((b,i)=> b.classList.toggle('active', i===current));
      window.scrollTo({top:0, behavior:'smooth'});
    }
    function go(i){
      if(i<0) i=0;
      if(i>slides.length-1) i=slides.length-1;
      current = i; render();
    }
    function next(){ go(current+1); }
    function prev(){ go(current-1); }

    document.getElementById('next').addEventListener('click', next);
    document.getElementById('prev').addEventListener('click', prev);
    window.addEventListener('keydown', (e)=>{
      if(e.key==='ArrowRight') next();
      if(e.key==='ArrowLeft') prev();
    });
  </script>
</body>
</html>`;
  };

  // 键盘导航
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isPreviewMode) {
        if (e.key === 'ArrowLeft') {
          setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
        } else if (e.key === 'ArrowRight') {
          setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1));
        } else if (e.key === 'Escape') {
          setIsPreviewMode(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPreviewMode, currentSlideIndex, slides.length]);

  const currentLayout = detectLayout(currentSlide.arguments.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-400 via-white/30 to-white/10">
      {/* 顶部导航栏 */}
      <div className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-cyan-200/30">
        <div className="max-w-full px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">🔺 Pyramid AI Presenter</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 font-medium"
            >
              ✨ 批量导入
            </button>
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition-all duration-300 font-medium"
            >
              {isPreviewMode ? '编辑模式' : '预览模式'}
            </button>
            <button
              onClick={exportHTML}
              className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-all duration-300 font-medium"
            >
              导出 HTML
            </button>
          </div>
        </div>
      </div>

      {/* 预览模式 */}
      {isPreviewMode ? (
        <div className="container mx-auto p-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white/95 rounded-xl shadow-2xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
              <div className="h-full flex flex-col">
                {/* 幻灯片内容 */}
                <div
                  className="flex-1 bg-gradient-to-br from-cyan-50/10 via-white/95 to-white/90 p-12 relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,188,212,0.05) 0%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.90) 100%)'
                  }}
                >
                  {/* 背景动画 */}
                  <div
                    className="absolute top-0 right-0 w-96 h-96 opacity-30"
                    style={{
                      background: 'radial-gradient(circle, rgba(0,188,212,0.03) 0%, transparent 70%)',
                      animation: 'spin 20s linear infinite'
                    }}
                  />

                  {/* 页码 */}
                  <div className="absolute top-6 right-6 bg-cyan-100/50 px-3 py-1 rounded-full text-cyan-700 font-medium">
                    P{currentSlideIndex + 1} / {slides.length}
                  </div>

                  {/* 标题 */}
                  <h1 className="text-4xl font-bold text-slate-800 text-center mb-8 relative z-10">
                    {currentSlide.title || '未填写标题'}
                  </h1>

                  {/* 核心观点 */}
                  <div className="bg-gradient-to-br from-cyan-100/30 to-emerald-100/30 p-6 rounded-2xl mb-8 border-2 border-cyan-300/30 text-center relative z-10">
                    <h3 className="text-xl font-bold text-slate-700 mb-3">核心观点</h3>
                    <p className="text-2xl font-bold text-emerald-600">
                      {currentSlide.coreIdea || '未填写核心观点'}
                    </p>
                  </div>

                  {/* 论据内容 */}
                  <div className="flex-1 flex items-center justify-center relative z-10">
                    <div className={`w-full ${
                      currentLayout === 'two-columns' ? 'grid grid-cols-2 gap-8' :
                      currentLayout === 'three-columns' ? 'grid grid-cols-3 gap-6' :
                      currentLayout === 'two-by-two-grid' ? 'grid grid-cols-2 gap-6' :
                      currentLayout === 'three-two-grid' ? 'grid grid-cols-3 gap-4' :
                      currentLayout === 'three-by-two-grid' ? 'grid grid-cols-3 gap-4' :
                      'flex flex-col gap-4'
                    }`}>
                      {currentSlide.arguments.filter(arg => arg.trim()).map((arg, index) => {
                        const parts = arg.split(/[：:]/);
                        const title = parts[0] || `论据${index + 1}`;
                        const content = parts[1] || arg;
                        // 特殊处理5个论据的布局，第三个论据居中
                        const isFiveArgCenter = currentLayout === 'three-two-grid' && index === 2;

                        return (
                          <div
                            key={index}
                            className={`bg-white/90 p-6 rounded-xl shadow-lg border-l-4 border-cyan-500 hover:shadow-xl transition-all duration-300 ${
                              isFiveArgCenter ? 'col-start-2' : ''
                            }`}
                          >
                            <h4 className="text-lg font-semibold text-slate-700 mb-3">{title}</h4>
                            <p className="text-slate-600 leading-relaxed whitespace-pre-line">{content}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 导航控制 */}
                <div className="bg-white/90 px-6 py-4 flex items-center justify-between border-t border-cyan-200/30">
                  <button
                    onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                    className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50"
                    disabled={currentSlideIndex === 0}
                  >
                    ← 上一页
                  </button>

                  <div className="flex gap-2">
                    {slides.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlideIndex(index)}
                        className={`w-3 h-3 rounded-full transition-colors ${
                          index === currentSlideIndex ? 'bg-cyan-500' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
                    className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50"
                    disabled={currentSlideIndex === slides.length - 1}
                  >
                    下一页 →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 编辑模式 - 双栏布局 */
        <div className="flex h-screen pt-16">
          {/* 左栏 - 思考区 (40%) */}
          <div className="w-2/5 bg-white/80 border-r border-cyan-200/30 overflow-y-auto">
            <div className="p-6">
              {/* 幻灯片导航 */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-800">📝 思考区</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => moveSlide(currentSlideIndex, Math.max(0, currentSlideIndex - 1))}
                    className="p-2 text-cyan-600 hover:bg-cyan-100 rounded-lg transition-colors"
                    disabled={currentSlideIndex === 0}
                  >
                    ↑
                  </button>
                  <span className="text-sm text-slate-600">
                    {currentSlideIndex + 1} / {slides.length}
                  </span>
                  <button
                    onClick={() => moveSlide(currentSlideIndex, Math.min(slides.length - 1, currentSlideIndex + 1))}
                    className="p-2 text-cyan-600 hover:bg-cyan-100 rounded-lg transition-colors"
                    disabled={currentSlideIndex === slides.length - 1}
                  >
                    ↓
                  </button>
                </div>
              </div>

              {/* 幻灯片选择器 */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    onClick={() => setCurrentSlideIndex(index)}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all ${
                      index === currentSlideIndex
                        ? 'bg-cyan-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    P{index + 1}
                  </button>
                ))}
                <button
                  onClick={addSlide}
                  className="flex-shrink-0 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
                >
                  + 添加
                </button>
              </div>

              {/* 结构化输入表单 */}
              <div className="space-y-6">
                {/* 标题输入 */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-2">标题</label>
                  <input
                    type="text"
                    value={currentSlide.title}
                    onChange={(e) => updateSlide('title', e.target.value)}
                    placeholder="例如：我都用了哪些AI大模型，有什么感受？"
                    className="w-full px-4 py-3 border-2 border-cyan-500 rounded-lg text-base focus:outline-none focus:border-cyan-600 text-slate-700 bg-white/80"
                  />
                </div>

                {/* 核心观点输入 */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-2">核心观点</label>
                  <textarea
                    value={currentSlide.coreIdea}
                    onChange={(e) => updateSlide('coreIdea', e.target.value)}
                    placeholder="例如：AI 的差距，不在'会不会用'，而在'用对没用对模型'"
                    className="w-full px-4 py-3 border-2 border-cyan-500 rounded-lg text-base focus:outline-none focus:border-cyan-600 h-24 resize-vertical text-slate-700 bg-white/80"
                  />
                </div>

                {/* 论据输入 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-slate-700 font-semibold">论据</label>
                    <button
                      onClick={addArgument}
                      className="text-cyan-600 hover:text-cyan-700 font-medium text-sm"
                    >
                      + 添加论据
                    </button>
                  </div>
                  <div className="space-y-3">
                    {currentSlide.arguments.map((arg, index) => (
                      <div key={index} className="flex gap-2">
                        <textarea
                          value={arg}
                          onChange={(e) => updateArgument(index, e.target.value)}
                          placeholder={`论据${index + 1}: 描述内容\n支持多行输入，换行会被保留`}
                          className="flex-1 px-4 py-3 border-2 border-cyan-500 rounded-lg text-base focus:outline-none focus:border-cyan-600 text-slate-700 bg-white/80 resize-vertical"
                          rows={2}
                        />
                        {currentSlide.arguments.length > 1 && (
                          <button
                            onClick={() => removeArgument(index)}
                            className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-auto"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-3 pt-4">
                  {slides.length > 1 && (
                    <button
                      onClick={deleteSlide}
                      className="bg-red-500 text-white px-4 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
                    >
                      删除幻灯片
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 右栏 - 预览区 (60%) */}
          <div className="flex-1 bg-gradient-to-br from-cyan-50/10 via-white/95 to-white/90">
            <div className="p-8 h-full flex flex-col">
              <h2 className="text-xl font-semibold text-slate-800 mb-6 text-center">👀 实时预览</h2>

              {/* 预览内容 */}
              <div className="flex-1 bg-white/90 rounded-xl shadow-lg overflow-hidden relative">
                {/* 背景动画效果 */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: 'radial-gradient(circle at 70% 30%, rgba(0,188,212,0.1) 0%, transparent 50%)'
                  }}
                />

                <div className="p-8 relative z-10 h-full flex flex-col">
                  {/* 标题 */}
                  <h3 className="text-3xl font-bold text-slate-800 text-center mb-6">
                    {currentSlide.title || <span className="text-gray-400 italic">未填写标题</span>}
                  </h3>

                  {/* 核心观点 */}
                  <div className="bg-gradient-to-br from-cyan-100/30 to-emerald-100/30 p-6 rounded-xl mb-6 border-2 border-cyan-300/30 text-center">
                    <h4 className="text-lg font-bold text-slate-700 mb-2">核心观点</h4>
                    <p className="text-xl font-bold text-emerald-600">
                      {currentSlide.coreIdea || <span className="text-gray-400 italic">未填写核心观点</span>}
                    </p>
                  </div>

                  {/* 论据预览 */}
                  <div className="flex-1">
                    {currentSlide.arguments.filter(arg => arg.trim()).length > 0 ? (
                      <div className={`h-full ${
                        currentLayout === 'two-columns' ? 'grid grid-cols-2 gap-6' :
                        currentLayout === 'three-columns' ? 'grid grid-cols-3 gap-4' :
                        currentLayout === 'two-by-two-grid' ? 'grid grid-cols-2 gap-4' :
                        currentLayout === 'three-two-grid' ? 'grid grid-cols-3 gap-3' :
                        currentLayout === 'three-by-two-grid' ? 'grid grid-cols-3 gap-3' :
                        'space-y-4'
                      }`}>
                        {currentSlide.arguments.filter(arg => arg.trim()).map((arg, index) => {
                          const parts = arg.split(/[：:]/);
                          const title = parts[0] || `论据${index + 1}`;
                          const content = parts[1] || arg;
                          // 特殊处理5个论据的布局，第三个论据居中
                          const isFiveArgCenter = currentLayout === 'three-two-grid' && index === 2;

                          return (
                            <div
                              key={index}
                              className={`bg-white/80 p-4 rounded-lg shadow border-l-4 border-cyan-500 hover:shadow-md transition-all duration-300 ${
                                isFiveArgCenter ? 'col-start-2' : ''
                              }`}
                            >
                              <h5 className="font-semibold text-slate-700 mb-2">{title}</h5>
                              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{content}</p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-gray-400 italic text-center">
                          请添加论据内容<br />
                          <span className="text-sm">支持使用冒号分隔标题和内容，支持多行输入</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 布局指示器 */}
                  <div className="mt-4 text-center text-sm text-slate-500">
                    布局类型: {currentLayout === 'process-flow' ? '流程布局' :
                             currentLayout === 'two-columns' ? '双栏布局' :
                             currentLayout === 'three-columns' ? '三列布局' :
                             currentLayout === 'two-by-two-grid' ? '2×2网格布局' :
                             currentLayout === 'three-two-grid' ? '3+2网格布局' :
                             currentLayout === 'three-by-two-grid' ? '3×2网格布局' :
                             '默认布局'} |
                    论据数量: {currentSlide.arguments.filter(arg => arg.trim()).length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI 批量导入模态框 */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-slate-800">✨ AI 批量导入</h3>
              <p className="text-slate-600 mt-1">将非结构化文本粘贴到下方，AI 将自动解析为幻灯片</p>
            </div>

            <div className="p-6">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                disabled={isImporting}
                placeholder="请粘贴您的报告、邮件、会议纪要等非结构化文本...

例如：
AI大模型使用体验
核心观点：AI的差距，不在'会不会用'，而在'用对没用对模型'
模型选择：选择适合的AI模型是成功的第一步
使用技巧：掌握提示词工程和参数调优
效果评估：建立评估体系和迭代优化"
                className="w-full h-64 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-cyan-500 focus:outline-none resize-vertical text-slate-700 disabled:bg-gray-50 disabled:cursor-not-allowed"
              />

              {/* 进度条和状态显示 */}
              {isImporting && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                      <span className="text-blue-700 font-medium">{importProgress}</span>
                    </div>
                    <span className="text-sm text-blue-600">
                      {Math.round((Date.now() - importStartTime) / 1000)}秒
                    </span>
                  </div>

                  {/* 进度条动画 */}
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: importProgress.includes('🔄') ? '25%' :
                               importProgress.includes('📝') ? '40%' :
                               importProgress.includes('🤖') ? '60%' :
                               importProgress.includes('💭') ? '80%' :
                               importProgress.includes('📊') ? '90%' :
                               importProgress.includes('✅') ? '100%' : '35%',
                        animation: importProgress.includes('💭') ? 'pulse 2s infinite' : 'none'
                      }}
                    />
                  </div>

                  {/* 提示信息 */}
                  {importProgress.includes('💭') && (
                    <p className="text-xs text-blue-600 mt-2">GLM-4.5 正在深度分析您的文本，请稍候...</p>
                  )}
                  {importProgress.includes('❌') && (
                    <p className="text-xs text-red-600 mt-2">解析出现问题，正在重试...</p>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                disabled={isImporting}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                取消
              </button>
              <button
                onClick={handleAIImport}
                disabled={isImporting}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    AI 解析中...
                  </span>
                ) : '🚀 开始解析'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}