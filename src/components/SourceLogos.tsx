import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const LinkedInLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="24" height="24" rx="5" fill="#0A66C2" />
    <path
      d="M19 19H16.27V14.73C16.27 13.71 16.25 12.4 14.85 12.4C13.43 12.4 13.21 13.51 13.21 14.65V19H10.48V10.23H13.1V11.43H13.14C13.5 10.74 14.39 10.02 15.71 10.02C18.45 10.02 19 11.83 19 14.17V19ZM7.46 9.02C6.58 9.02 5.87 8.31 5.87 7.44C5.87 6.56 6.58 5.86 7.46 5.86C8.33 5.86 9.04 6.56 9.04 7.44C9.04 8.31 8.33 9.02 7.46 9.02ZM8.83 19H6.09V10.23H8.83V19Z"
      fill="white"
    />
  </svg>
);

export const IndeedLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="24" height="24" rx="5" fill="#2164F3" />
    <path
      d="M13.67 7.1C13.4 6.78 13.06 6.51 12.68 6.32C12.3 6.13 11.88 6.03 11.45 6.03C11.02 6.03 10.6 6.13 10.22 6.32C9.84 6.51 9.5 6.78 9.23 7.1C8.96 7.42 8.76 7.79 8.63 8.19C8.5 8.59 8.44 9.01 8.44 9.44C8.44 9.87 8.5 10.29 8.63 10.69C8.76 11.09 8.96 11.46 9.23 11.78C9.5 12.1 9.84 12.37 10.22 12.56C10.6 12.75 11.02 12.85 11.45 12.85C11.88 12.85 12.3 12.75 12.68 12.56C13.06 12.37 13.4 12.1 13.67 11.78C13.94 11.46 14.14 11.09 14.27 10.69C14.4 10.29 14.46 9.87 14.46 9.44C14.46 9.01 14.4 8.59 14.27 8.19C14.14 7.79 13.94 7.42 13.67 7.1ZM12.7 18H10.2V13.88H12.7V18Z"
      fill="white"
    />
    <circle cx="11.45" cy="4.2" r="1.2" fill="white" />
  </svg>
);

export const GlassdoorLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="24" height="24" rx="5" fill="#0CAA41" />
    <path
      d="M17.2 6.8H6.8V17.2H17.2V6.8ZM15.5 15.5H8.5V8.5H15.5V15.5Z"
      fill="white"
    />
    <path
      d="M10.2 10.2H13.8V13.8H10.2V10.2Z"
      fill="white"
    />
  </svg>
);

export const WellfoundLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="24" height="24" rx="5" fill="#FF4F00" />
    <path
      d="M17.5 7L13.8 17H12.2L10 11.2L7.8 17H6.2L2.5 7H4.6L7 13.9L9.2 8H10.8L13 13.9L15.4 7H17.5Z"
      fill="white"
    />
    <circle cx="18.5" cy="8" r="1.5" fill="#FFC800" />
  </svg>
);

export const WorkIndiaLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="24" height="24" rx="5" fill="#00897B" />
    <path
      d="M6 8L8.5 16H10.5L12 11.5L13.5 16H15.5L18 8H16L14.5 13.5L13 9H11L9.5 13.5L8 8H6Z"
      fill="white"
    />
    <circle cx="12" cy="6" r="1.2" fill="#FFD54F" />
  </svg>
);

export const InstahyreLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="24" height="24" rx="5" fill="#6C5CE7" />
    <path
      d="M8 6H11V18H8V6ZM13 6H16V18H13V6ZM6 11H18V13H6V11Z"
      fill="white"
    />
    <circle cx="16" cy="7" r="1.2" fill="#55EFC4" />
  </svg>
);

export const ArbeitnowLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="24" height="24" rx="5" fill="#18181B" stroke="#3F3F46" strokeWidth="1" />
    <path
      d="M7 17L12 7L17 17H14.5L12 11.5L9.5 17H7Z"
      fill="#FACC15"
    />
    <circle cx="12" cy="6" r="1.2" fill="#FACC15" />
  </svg>
);
