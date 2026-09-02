import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const logos: Record<string, { site: string; label: string }> = {
  linkedin: { site: 'https://www.linkedin.com/favicon.ico', label: 'LinkedIn' },
  indeed: { site: 'https://www.indeed.com/favicon.ico', label: 'Indeed' },
  glassdoor: { site: 'https://www.glassdoor.com/favicon.ico', label: 'Glassdoor' },
  wellfound: { site: 'https://wellfound.com/favicon.ico', label: 'Wellfound' },
  workindia: { site: 'https://www.workindia.in/favicon.ico', label: 'WorkIndia' },
  instahyre: { site: 'https://www.instahyre.com/favicon.ico', label: 'Instahyre' },
  arbeitnow: { site: 'https://arbeitnow.com/favicon.ico', label: 'Arbeitnow' },
};

const OfficialFavicon: React.FC<LogoProps & { provider: keyof typeof logos }> = ({ provider, className = 'w-5 h-5', size }) => {
  const meta = logos[provider];
  const [failed, setFailed] = React.useState(false);
  const px = size || undefined;
  if (failed) {
    return <span className={`${className} inline-flex items-center justify-center rounded-md bg-zinc-800 text-[9px] font-black text-zinc-200`} style={px ? { width: px, height: px } : undefined} aria-label={meta.label}>{meta.label.slice(0, 1)}</span>;
  }
  return <img src={meta.site} width={px} height={px} className={`${className} object-contain rounded-md`} alt={`${meta.label} official icon`} loading="lazy" onError={() => setFailed(true)} />;
};

export const LinkedInLogo: React.FC<LogoProps> = (props) => <OfficialFavicon provider="linkedin" {...props} />;
export const IndeedLogo: React.FC<LogoProps> = (props) => <OfficialFavicon provider="indeed" {...props} />;
export const GlassdoorLogo: React.FC<LogoProps> = (props) => <OfficialFavicon provider="glassdoor" {...props} />;
export const WellfoundLogo: React.FC<LogoProps> = (props) => <OfficialFavicon provider="wellfound" {...props} />;
export const WorkIndiaLogo: React.FC<LogoProps> = (props) => <OfficialFavicon provider="workindia" {...props} />;
export const InstahyreLogo: React.FC<LogoProps> = (props) => <OfficialFavicon provider="instahyre" {...props} />;
export const ArbeitnowLogo: React.FC<LogoProps> = (props) => <OfficialFavicon provider="arbeitnow" {...props} />;

export const SOURCE_URLS = {
  linkedin: 'https://www.linkedin.com/jobs/',
  indeed: 'https://www.indeed.com/',
  glassdoor: 'https://www.glassdoor.com/Job/',
  wellfound: 'https://wellfound.com/jobs',
  workindia: 'https://www.workindia.in/',
  instahyre: 'https://www.instahyre.com/',
  arbeitnow: 'https://arbeitnow.com/',
} as const;
