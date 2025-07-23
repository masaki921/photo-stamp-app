
import React, { useCallback, useState } from 'react';
import { UploadIcon } from './Icons';

interface PhotoUploaderProps {
  onFilesSelected: (files: FileList) => void;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ onFilesSelected }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  }, [onFilesSelected]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`w-full max-w-2xl p-10 border-2 border-dashed rounded-xl transition-colors duration-300 ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400'}`}
      >
        <input
          type="file"
          id="file-upload"
          multiple
          accept="image/jpeg, image/png"
          className="hidden"
          onChange={handleChange}
        />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
          <UploadIcon />
          <p className="mt-4 text-2xl font-semibold text-slate-800">
            写真をここにドラッグ＆ドロップ
          </p>
          <p className="mt-2 text-slate-500">またはクリックして選択</p>
          <p className="mt-4 text-xs text-slate-400">JPEGおよびPNG形式に対応</p>
        </label>
      </div>
      <div className="mt-8 max-w-2xl text-left text-slate-600 space-y-4">
        <h3 className="text-lg font-semibold text-slate-800">使い方:</h3>
        <p>1. <span className="font-medium text-indigo-600">写真をアップロード。</span>GPSと日付情報が自動で読み込まれます。</p>
        <p>2. <span className="font-medium text-indigo-600">撮影場所を特定。</span>写真が撮影された場所の名前を自動で取得します。</p>
        <p>3. <span className="font-medium text-indigo-600">思い出をダウンロード。</span>場所と日付がスタンプされた写真を保存できます。</p>
      </div>
    </div>
  );
};