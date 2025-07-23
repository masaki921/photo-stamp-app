
import React, { useState, useCallback } from 'react';
import { PhotoUploader } from './components/PhotoUploader';
import { PhotoGrid } from './components/PhotoGrid';
import { LogoIcon } from './components/Icons';

const App: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);

  const handleFilesSelected = useCallback((selectedFiles: FileList | null) => {
    if (selectedFiles) {
      // Create a new array with unique files
      setFiles(prevFiles => {
        const newFiles = Array.from(selectedFiles);
        const combined = [...prevFiles];
        const fileNames = new Set(prevFiles.map(f => f.name));
        for (const newFile of newFiles) {
          if (!fileNames.has(newFile.name)) {
            combined.push(newFile);
            fileNames.add(newFile.name);
          }
        }
        return combined;
      });
    }
  }, []);

  const handleClear = () => {
    setFiles([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="py-4 px-4 sm:px-8 border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <LogoIcon />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">フォトスタンプ AI</h1>
          </div>
          {files.length > 0 && (
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-50"
            >
              すべてクリア
            </button>
          )}
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-8">
        {files.length === 0 ? (
          <PhotoUploader onFilesSelected={handleFilesSelected} />
        ) : (
          <div>
            <div className="mb-6 text-center">
              <label htmlFor="add-more-files" className="cursor-pointer inline-block px-6 py-3 text-base font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-50">
                写真を追加
              </label>
              <input
                type="file"
                id="add-more-files"
                multiple
                accept="image/jpeg, image/png"
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
            </div>
            <PhotoGrid files={files} />
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-sm text-slate-500 border-t border-slate-200 mt-8">
        <p>&copy; {new Date().getFullYear()} フォトスタンプ AI. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;