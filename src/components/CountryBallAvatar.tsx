import React, { useState } from 'react';
import { CountryId, ExpressionId } from '../types/game';
import { getBallImageUrl } from '../data/countries';
import { getCountryballDataUrl } from '../utils/countryballTexture';

interface CountryBallAvatarProps {
  countryId: CountryId;
  expressionId: ExpressionId;
  size?: number;
  className?: string;
  animate?: boolean;
}

export const CountryBallAvatar: React.FC<CountryBallAvatarProps> = ({
  countryId,
  expressionId,
  size = 64,
  className = '',
  animate = false,
}) => {
  const [loadFailed, setLoadFailed] = useState(false);
  const primaryUrl = getBallImageUrl(countryId, expressionId);

  // Fallback procedural canvas data URL
  const fallbackUrl = React.useMemo(() => {
    return getCountryballDataUrl(countryId, expressionId);
  }, [countryId, expressionId]);

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full select-none ${
        animate ? 'transition-transform duration-200 hover:scale-110 active:scale-95' : ''
      } ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={loadFailed ? fallbackUrl : primaryUrl}
        alt={`${countryId} ball`}
        width={size}
        height={size}
        className="w-full h-full object-contain filter drop-shadow-md rounded-full pointer-events-none"
        onError={() => setLoadFailed(true)}
        loading="lazy"
      />
    </div>
  );
};
