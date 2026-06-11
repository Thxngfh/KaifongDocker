import React from 'react';

const StaticMap: React.FC<{ className?: string; center?: string; zoom?: string; size?: string }> = ({
  className,
  center = '13.736717,100.523186',
  zoom = '14',
  size = '600x400',
}) => {
  const imageUrl = `/api/static-map?center=${encodeURIComponent(center)}&zoom=${encodeURIComponent(
    zoom,
  )}&size=${encodeURIComponent(size)}`;

  return (
    <div className={className}>
      <img src={imageUrl} alt="Google Maps Static View" style={{ width: '100%', maxWidth: '600px' }} />
    </div>
  );
};

export default StaticMap;