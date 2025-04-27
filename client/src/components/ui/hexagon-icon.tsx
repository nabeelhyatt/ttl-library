import { FC } from 'react';

interface HexagonIconProps {
  className?: string;
}

export const HexagonIcon: FC<HexagonIconProps> = ({ className = "h-16 w-16" }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M50 0L93.3 25V75L50 100L6.7 75V25L50 0Z" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
      />
    </svg>
  );
};

export default HexagonIcon;
