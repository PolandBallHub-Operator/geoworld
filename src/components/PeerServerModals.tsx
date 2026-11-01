import React, { useState } from 'react';
import { X, Server, Key, LogIn, Sparkles, AlertCircle } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface HostServerModalProps {
  onConfirm: (password: string) => void;
  onClose: () => void;
}

export const HostServerModal: React.FC<HostServerModalProps> = ({ onConfirm, onClose }) => {
  const [password, setPassword] = useState('1234');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    soundManager.playClick();
    onConfirm(password.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-fadeIn">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-4 border-indigo-400 space-y-4"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Server className="w-6 h-6 text-indigo-600" />
            <h3 className="text-xl font-black text-slate-800">Peer Server (ホスト開始)</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 font-bold leading-relaxed">
          あなたのワールドでマルチプレイを開始します。友達が参加する際に必要な「一時的なパスワード」を設定してください。
        </p>

        <div>
          <label className="text-xs font-black text-slate-700 block mb-1">
            一時的なパスワード (参加パスワード)
          </label>
          <div className="relative">
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="例: 1234"
              maxLength={20}
              required
              className="w-full pl-9 pr-3 py-2.5 font-mono font-bold text-sm border-2 border-slate-300 focus:border-indigo-500 rounded-xl outline-none"
            />
            <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            ※ ゲーム開始後にランダムなPEERコードが生成され、友達に共有できます。
          </span>
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-bold text-slate-500 hover:text-slate-700 text-xs"
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow active:scale-95 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>サーバーを開始してゲーム起動</span>
          </button>
        </div>
      </form>
    </div>
  );
};

interface PlayServerModalProps {
  onJoin: (peerCode: string, password: string) => Promise<boolean>;
  onClose: () => void;
  onFailReturnHome: (errorMsg: string) => void;
}

export const PlayServerModal: React.FC<PlayServerModalProps> = ({
  onJoin,
  onClose,
  onFailReturnHome,
}) => {
  const [peerAddress, setPeerAddress] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!peerAddress.trim()) return;
    soundManager.playClick();
    setIsConnecting(true);
    setErrorMsg('');

    try {
      const success = await onJoin(peerAddress.trim(), tempPassword.trim());
      if (!success) {
        setErrorMsg('接続に失敗しました。アドレスまたはパスワードを確認してください。');
        setIsConnecting(false);
        setTimeout(() => {
          onFailReturnHome('サーバーに接続できませんでした。');
        }, 1800);
      }
    } catch {
      setErrorMsg('接続中にエラーが発生しました。');
      setIsConnecting(false);
      setTimeout(() => {
        onFailReturnHome('サーバー接続エラー');
      }, 1800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-fadeIn">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-4 border-sky-400 space-y-4"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <LogIn className="w-6 h-6 text-sky-600" />
            <h3 className="text-xl font-black text-slate-800">Play Server (サーバー参加)</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isConnecting}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 font-bold leading-relaxed">
          ホストの友達から共有された「Peer server アドレス (PEERコード)」と「一時パスワード」を入力してください。
        </p>

        <div>
          <label className="text-xs font-black text-slate-700 block mb-1">
            Peer server アドレス (PEERコード)
          </label>
          <input
            type="text"
            value={peerAddress}
            onChange={(e) => setPeerAddress(e.target.value)}
            placeholder="例: geoclub-1234"
            required
            disabled={isConnecting}
            className="w-full px-3 py-2.5 font-mono font-bold text-sm border-2 border-slate-300 focus:border-sky-500 rounded-xl outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-black text-slate-700 block mb-1">
            ホスト側の一時パスワード
          </label>
          <input
            type="text"
            value={tempPassword}
            onChange={(e) => setTempPassword(e.target.value)}
            placeholder="ホストが設定したパスワード"
            required
            disabled={isConnecting}
            className="w-full px-3 py-2.5 font-mono font-bold text-sm border-2 border-slate-300 focus:border-sky-500 rounded-xl outline-none"
          />
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-bold text-red-600 animate-bounce">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isConnecting}
            className="px-4 py-2 font-bold text-slate-500 hover:text-slate-700 text-xs"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isConnecting}
            className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-black text-sm rounded-xl shadow active:scale-95 transition-all flex items-center gap-2"
          >
            {isConnecting ? (
              <span>接続試行中...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>サーバーに参加</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
