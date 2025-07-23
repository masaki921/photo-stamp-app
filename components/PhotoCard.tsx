
import React, { useState, useEffect, useCallback } from 'react';
import { fetchSmartLocationName } from '../services/geoService';
import { ProcessingStatus, ExifData } from '../types';
import { SpinnerIcon, DownloadIcon, ErrorIcon } from './Icons';

declare const EXIF: any;

interface PhotoCardProps {
  file: File;
}

const statusMessages: { [key in ProcessingStatus]: string } = {
  idle: '待機中',
  reading: '情報読込中',
  geocoding: '位置情報取得中',
  drawing: '画像生成中',
  ready: '準備完了',
  error: 'エラー'
};

const dmsToDd = (dms: number[], ref: string): number => {
  if (!dms || dms.length !== 3) return 0;
  let dd = dms[0] + dms[1] / 60 + dms[2] / 3600;
  if (ref === 'S' || ref === 'W') {
    dd = dd * -1;
  }
  return dd;
};

const formatDate = (dateString: string): string => {
  try {
    const cleanString = dateString.replace(':', '-').replace(':', '-');
    const date = new Date(cleanString);
    if (isNaN(date.getTime())) return "日付不明";
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/');
  } catch (e) {
    return "日付不明";
  }
};

const drawTextOnCanvas = (ctx: CanvasRenderingContext2D, text: string, canvasWidth: number, canvasHeight: number) => {
    const isVertical = canvasHeight > canvasWidth;
    
    let baseFontSize = isVertical ? canvasWidth / 28 : canvasHeight / 28;
    let fontSize = Math.max(12, baseFontSize);
    
    const padding = fontSize * 0.8;

    ctx.font = `bold ${fontSize}px 'Helvetica Neue', 'Arial', sans-serif`;
    while (ctx.measureText(text).width > canvasWidth - (padding * 2) && fontSize > 10) {
        fontSize--;
        ctx.font = `bold ${fontSize}px 'Helvetica Neue', 'Arial', sans-serif`;
    }

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#FF8C00'; 
    ctx.strokeStyle = 'black';
    ctx.lineWidth = Math.max(1, fontSize / 12);
    
    const x = canvasWidth - padding;
    const y = canvasHeight - padding;
    
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
};


export const PhotoCard: React.FC<PhotoCardProps> = ({ file }) => {
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>('stamped-photo.jpg');

  const processImage = useCallback(async () => {
    setStatus('reading');
    try {
      const exifData: ExifData = await new Promise((resolve, reject) => {
        EXIF.getData(file, function(this: any) {
          const allTags = EXIF.getAllTags(this);
          if (Object.keys(allTags).length === 0) {
              reject(new Error('EXIFデータが見つかりません。'));
              return;
          }
          resolve({
              GPSLatitude: allTags.GPSLatitude,
              GPSLongitude: allTags.GPSLongitude,
              GPSLatitudeRef: allTags.GPSLatitudeRef,
              GPSLongitudeRef: allTags.GPSLongitudeRef,
              DateTimeOriginal: allTags.DateTimeOriginal,
              Orientation: allTags.Orientation
          });
        });
      });

      const { GPSLatitude, GPSLongitude, GPSLatitudeRef, GPSLongitudeRef, DateTimeOriginal, Orientation } = exifData;
      if (!GPSLatitude || !GPSLongitude || !GPSLatitudeRef || !GPSLongitudeRef) {
        throw new Error("写真にGPSデータが見つかりません。");
      }
      const lat = dmsToDd(GPSLatitude, GPSLatitudeRef);
      const lng = dmsToDd(GPSLongitude, GPSLongitudeRef);
      const date = DateTimeOriginal ? formatDate(DateTimeOriginal) : "日付不明";

      setStatus('geocoding');
      const locationName = await fetchSmartLocationName(lat, lng);
      const stampText = `${locationName} ${date}`;
      setFilename(`${locationName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${date.replace(/\//g, '-')}.jpg`);


      setStatus('drawing');
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get canvas context");
        
        let { width, height } = img;

        if (Orientation && Orientation >= 5 && Orientation <= 8) {
            canvas.width = height;
            canvas.height = width;
        } else {
            canvas.width = width;
            canvas.height = height;
        }

        switch (Orientation) {
            case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
            case 3: ctx.transform(-1, 0, 0, -1, width, height); break;
            case 4: ctx.transform(1, 0, 0, -1, 0, height); break;
            case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
            case 6: ctx.transform(0, 1, -1, 0, height, 0); break;
            case 7: ctx.transform(0, -1, -1, 0, height, width); break;
            case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
        }
        
        ctx.drawImage(img, 0, 0);
        
        drawTextOnCanvas(ctx, stampText, canvas.width, canvas.height);

        setProcessedUrl(canvas.toDataURL('image/jpeg', 0.9));
        setStatus('ready');
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        throw new Error("画像ファイルの読み込みに失敗しました。");
      };

    } catch (e: any) {
      setError(e.message || "不明なエラーが発生しました。");
      setStatus('error');
    }
  }, [file]);

  useEffect(() => {
    processImage();
  }, [processImage]);

  const renderContent = () => {
    switch (status) {
      case 'ready':
        return (
          <>
            {processedUrl && (
              <img src={processedUrl} alt={`Stamped: ${file.name}`} className="absolute inset-0 w-full h-full object-cover"/>
            )}
            <div className="absolute inset-0 bg-slate-900 bg-opacity-0 hover:bg-opacity-50 transition-opacity duration-300 flex items-center justify-center group">
              <a
                href={processedUrl!}
                download={filename}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-4 py-3 bg-indigo-600 rounded-lg text-white font-semibold flex items-center gap-2"
                aria-label={`ダウンロード: ${filename}`}
              >
                <DownloadIcon />
                ダウンロード
              </a>
            </div>
          </>
        );
      case 'error':
        return (
          <div className="p-4 flex flex-col items-center justify-center text-center">
            <ErrorIcon/>
            <p className="mt-2 text-sm font-semibold text-red-600">処理に失敗しました</p>
            <p className="mt-1 text-xs text-slate-500">{error}</p>
          </div>
        );
      default:
        return (
          <div className="p-4 flex flex-col items-center justify-center">
            <SpinnerIcon />
            <p className="mt-2 text-sm text-slate-500 capitalize">{statusMessages[status]}...</p>
          </div>
        );
    }
  };

  return (
    <div className="relative aspect-[3/4] bg-white rounded-lg overflow-hidden shadow-md flex items-center justify-center border border-slate-200">
      {renderContent()}
    </div>
  );
};
