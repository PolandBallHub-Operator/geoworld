import React, { useState } from 'react';
import { MessageSquare, Send, Copy, Check, Users, X } from 'lucide-react';
import { PeerChatMessage, RemotePeerState } from '../types/game';
import { soundManager } from '../utils/audio';

interface PeerChatDrawerProps {
  peerCode: string;
  isHost: boolean;
  messages: PeerChatMessage[];
  connectedPeers: RemotePeerState[];
  onSendMessage: (text: string) => void;
  onClose: () => void;
}

export const PeerChatDrawer: React.FC<PeerChatDrawerProps> = ({
  peerCode,
  isHost,
  messages,
  connectedPeers,
  onSendMessage,
  onClose,
}) => {
  const [inputText, setInputText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!peerCode) return;
    navigator.clipboard.writeText(peerCode);
    soundManager.playClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    soundManager.playClick();
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="absolute top-16 right-4 z-40 w-80 sm:w-96 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border-4 border-sky-400 flex flex-col max-h-[70vh] overflow-hidden select-none animate-fadeIn">
      {/* Header with Peer Code */}
      <div className="p-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-100">
            <Users className="w-4 h-4" />
            <span>{isHost ? 'ホストサーバー' : '参加中サーバー'} ({connectedPeers.length + 1}人)</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono font-black text-sm tracking-wider text-amber-300">
              {peerCode || '接続準備中...'}
            </span>
            <button
              onClick={handleCopyCode}
              className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-md font-bold transition-colors flex items-center gap-1"
              title="PEERコードをコピー"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'コピー済' : 'コピー'}</span>
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Message history */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[160px] max-h-[300px] text-xs">
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 py-6 font-bold">
            まだチャットメッセージはありません。挨拶してみよう！
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="bg-slate-100 rounded-xl p-2 border border-slate-200">
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold mb-0.5">
                <span className="text-sky-700 font-black">{m.sender}</span>
                <span>{new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-slate-800 font-medium break-words">{m.text}</p>
            </div>
          ))
        )}
      </div>

      {/* Chat input */}
      <form onSubmit={handleSubmit} className="p-2 border-t border-slate-200 bg-slate-50 flex items-center gap-1.5">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="メッセージを入力..."
          maxLength={100}
          className="flex-1 px-3 py-1.5 text-xs font-bold border border-slate-300 focus:border-sky-500 rounded-xl outline-none"
        />
        <button
          type="submit"
          className="p-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow transition-all active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
