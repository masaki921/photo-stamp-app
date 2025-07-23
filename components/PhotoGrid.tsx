
import React from 'react';
import { PhotoCard } from './PhotoCard';

interface PhotoGridProps {
  files: File[];
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({ files }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {files.map((file, index) => (
        <PhotoCard key={`${file.name}-${index}`} file={file} />
      ))}
    </div>
  );
};
