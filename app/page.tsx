"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Save, Upload, Play, Pizza, Zap, Moon, Trash2 } from 'lucide-react';

// --- 型定義 ---

type GameState = 'MENU' | 'CREATE' | 'PLAYING';

interface Stats {
  hunger: number; // 0-100: 低いとお腹が空いている
  fun: number;    // 0-100: 低いと退屈
  energy: number; // 0-100: 低いと眠い
  age: number;    // 秒単位
}

interface MfbData {
  name: string;
  pixels: string[]; // 10x10 grid colors
  stats: Stats;
  createdAt: number;
}

// --- 定数 ---
const GRID_SIZE = 10;
const INITIAL_STATS: Stats = { hunger: 100, fun: 100, energy: 100, age: 0 };
const COLORS = [
  'transparent', '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', 
  '#FFFF00', '#00FFFF', '#FF00FF', '#FFA500', '#808080', '#8B4513'
];

// --- コンポーネント ---

export default function MyFlexBoxGame() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  
  // キャラクターデータ
  const [mfbName, setMfbName] = useState<string>('Flexy');
  const [pixels, setPixels] = useState<string[]>(Array(GRID_SIZE * GRID_SIZE).fill('transparent'));
  const [stats, setStats] = useState<Stats>(INITIAL_STATS);
  
  // エディタ用状態
  const [selectedColor, setSelectedColor] = useState<string>('#000000');
  
  // ゲームループ用
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const timer = setInterval(() => {
      setStats(prev => {
        // 眠っている（Energyが0）でない限り減る
        const isSleeping = prev.energy <= 0;
        
        return {
          ...prev,
          hunger: Math.max(0, prev.hunger - (isSleeping ? 0.2 : 0.5)),
          fun: Math.max(0, prev.fun - (isSleeping ? 0.1 : 0.8)),
          energy: Math.max(0, prev.energy - 0.3),
          age: prev.age + 1
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // --- アクション ---

  const handlePixelClick = (index: number) => {
    const newPixels = [...pixels];
    newPixels[index] = selectedColor;
    setPixels(newPixels);
  };

  const startGame = () => {
    if (pixels.every(p => p === 'transparent')) {
      alert("何か描いてください！");
      return;
    }
    if (!mfbName) {
      alert("名前を決めてください！");
      return;
    }
    setGameState('PLAYING');
  };

  const feed = () => setStats(p => ({ ...p, hunger: Math.min(100, p.hunger + 30) }));
  const play = () => setStats(p => ({ ...p, fun: Math.min(100, p.fun + 20), energy: Math.max(0, p.energy - 10) }));
  const sleep = () => setStats(p => ({ ...p, energy: 100 })); // 全回復

  // --- ファイル I/O (.mfb) ---

  const exportMfb = () => {
    const data: MfbData = {
      name: mfbName,
      pixels,
      stats,
      createdAt: Date.now()
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mfbName.replace(/\s+/g, '_')}.mfb`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importMfb = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string) as MfbData;
        // バリデーション（簡易）
        if (json.pixels && json.stats && json.name) {
          setMfbName(json.name);
          setPixels(json.pixels);
          setStats(json.stats);
          setGameState('PLAYING');
        } else {
          alert('不正なMFBファイルです');
        }
      } catch (err) {
        alert('読み込みに失敗しました');
      }
    };
    reader.readAsText(file);
  };

  // --- レンダリング用ヘルパー ---

  const PixelGrid = ({ size = "md", editable = false }: { size?: "sm" | "md", editable?: boolean }) => (
    <div 
      className="grid gap-0 border-4 border-gray-800 bg-gray-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]"
      style={{ 
        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
        width: size === "md" ? '300px' : '150px',
        height: size === "md" ? '300px' : '150px'
      }}
    >
      {pixels.map((color, i) => (
        <div
          key={i}
          onClick={() => editable && handlePixelClick(i)}
          className={`${editable ? 'cursor-pointer hover:opacity-80' : ''}`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );

  // --- 画面レンダリング ---

  return (
    <main className="min-h-screen bg-slate-800 text-gray-900 font-mono flex items-center justify-center p-4">
      <div className="bg-slate-200 p-8 rounded-sm max-w-md w-full border-8 border-slate-600 shadow-[10px_10px_0px_0px_rgba(0,0,0,0.3)]">
        
        {/* ヘッダー */}
        <header className="mb-8 text-center border-b-4 border-slate-400 pb-4">
          <h1 className="text-3xl font-bold tracking-tighter text-slate-800 mb-2">MyFlexBox</h1>
          <p className="text-xs text-slate-500">DIGITAL PET SYSTEM v1.0</p>
        </header>

        {/* MENU STATE */}
        {gameState === 'MENU' && (
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => {
                setStats(INITIAL_STATS);
                setPixels(Array(GRID_SIZE * GRID_SIZE).fill('transparent'));
                setMfbName('');
                setGameState('CREATE');
              }}
              className="btn-retro bg-blue-500 text-white"
            >
              <div className="flex items-center justify-center gap-2">
                <Play size={20} /> 新しく作る
              </div>
            </button>
            
            <label className="btn-retro bg-green-600 text-white cursor-pointer text-center block">
              <div className="flex items-center justify-center gap-2">
                <Upload size={20} /> .mfbファイルを読み込む
              </div>
              <input type="file" accept=".mfb" className="hidden" onChange={importMfb} />
            </label>
          </div>
        )}

        {/* CREATE STATE */}
        {gameState === 'CREATE' && (
          <div className="flex flex-col items-center gap-6">
            <div className="w-full">
              <label className="block text-xs font-bold mb-1">NAME:</label>
              <input 
                type="text" 
                value={mfbName}
                onChange={(e) => setMfbName(e.target.value)}
                maxLength={10}
                className="w-full bg-slate-100 border-4 border-slate-400 p-2 font-bold focus:outline-none focus:border-blue-500"
                placeholder="名前を入力"
              />
            </div>

            <PixelGrid editable size="md" />

            {/* パレット */}
            <div className="flex flex-wrap gap-2 justify-center max-w-[300px]">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={`w-8 h-8 border-2 ${selectedColor === c ? 'border-black scale-110' : 'border-gray-400'}`}
                  style={{ 
                    backgroundColor: c,
                    backgroundImage: c === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
                    backgroundSize: '8px 8px'
                  }}
                />
              ))}
            </div>

            <div className="flex gap-4 w-full">
               <button 
                onClick={() => setGameState('MENU')}
                className="flex-1 btn-retro bg-gray-400 text-white text-xs"
              >
                戻る
              </button>
              <button 
                onClick={startGame}
                className="flex-1 btn-retro bg-blue-500 text-white"
              >
                完成！
              </button>
            </div>
          </div>
        )}

        {/* PLAYING STATE */}
        {gameState === 'PLAYING' && (
          <div className="flex flex-col items-center animate-in fade-in duration-500">
            <div className="flex justify-between w-full mb-4 items-end">
              <div>
                <h2 className="text-2xl font-bold">{mfbName}</h2>
                <span className="text-xs bg-slate-300 px-2 py-1 rounded">AGE: {Math.floor(stats.age / 60)}m {stats.age % 60}s</span>
              </div>
              <button onClick={exportMfb} className="text-xs flex flex-col items-center hover:text-blue-600 transition-colors">
                <Save size={24} />
                <span>SAVE .mfb</span>
              </button>
            </div>

            {/* キャラ表示エリア */}
            <div className="relative mb-6">
              {/* ステータス吹き出し (状態によって変化) */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white border-2 border-black p-2 rounded text-xs whitespace-nowrap shadow-md">
                 {stats.hunger < 20 ? "お腹すいた..." : stats.energy < 20 ? "眠い..." : stats.fun < 20 ? "ひまだ..." : "元気！"}
                 <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r-2 border-b-2 border-black rotate-45"></div>
              </div>

              <div className={`${stats.energy > 0 ? 'animate-bounce-pixel' : 'opacity-50 grayscale'}`}>
                <PixelGrid size="md" />
              </div>
            </div>

            {/* ステータスバー */}
            <div className="w-full space-y-2 mb-6 bg-slate-300 p-4 rounded border-2 border-slate-400">
              <StatusBar label="HUNGER" value={stats.hunger} color="bg-orange-500" icon={<Pizza size={14}/>} />
              <StatusBar label="FUN" value={stats.fun} color="bg-pink-500" icon={<Play size={14}/>} />
              <StatusBar label="ENERGY" value={stats.energy} color="bg-yellow-400" icon={<Zap size={14}/>} />
            </div>

            {/* コマンド */}
            <div className="grid grid-cols-3 gap-2 w-full">
              <button onClick={feed} disabled={stats.energy <= 0} className="btn-action bg-orange-100 hover:bg-orange-200 border-orange-400 text-orange-800">
                <Pizza className="mx-auto mb-1" /> ごはん
              </button>
              <button onClick={play} disabled={stats.energy <= 0} className="btn-action bg-pink-100 hover:bg-pink-200 border-pink-400 text-pink-800">
                <Play className="mx-auto mb-1" /> 遊ぶ
              </button>
              <button onClick={sleep} className="btn-action bg-indigo-100 hover:bg-indigo-200 border-indigo-400 text-indigo-800">
                <Moon className="mx-auto mb-1" /> 寝る
              </button>
            </div>
            
             <button 
                onClick={() => setGameState('MENU')}
                className="mt-6 text-xs text-gray-500 hover:text-red-500 flex items-center gap-1"
              >
                <Trash2 size={12}/> メニューに戻る（保存してない場合消えます）
              </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        .btn-retro {
          @apply p-3 font-bold uppercase tracking-wider transition-all active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)];
        }
        .btn-action {
          @apply py-3 border-b-4 active:border-b-0 active:translate-y-1 rounded font-bold text-xs transition-all;
        }
        @keyframes bounce-pixel {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-pixel {
          animation: bounce-pixel 2s infinite steps(2);
        }
      `}</style>
    </main>
  );
}

// サブコンポーネント: ステータスバー
function StatusBar({ label, value, color, icon }: { label: string, value: number, color: string, icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 text-xs font-bold flex items-center gap-1">{icon} {label}</div>
      <div className="flex-1 h-3 bg-gray-700 border border-gray-600 relative">
        <div 
          className={`h-full ${color} transition-all duration-500`} 
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
