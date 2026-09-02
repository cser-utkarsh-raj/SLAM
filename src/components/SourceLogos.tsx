import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

type Provider = 'linkedin' | 'indeed' | 'glassdoor' | 'wellfound' | 'workindia' | 'instahyre' | 'adzuna';

const logos: Record<Provider, { site: string; label: string }> = {
  linkedin: { site: 'https://cdn.simpleicons.org/linkedin', label: 'LinkedIn' },
  indeed: { site: 'https://cdn.simpleicons.org/indeed', label: 'Indeed' },
  glassdoor: { site: 'https://cdn.simpleicons.org/glassdoor', label: 'Glassdoor' },
  wellfound: { site: 'https://wellfound.com/favicon.ico', label: 'Wellfound' },
  workindia: { site: 'https://www.workindia.in/favicon.ico', label: 'WorkIndia' },
  instahyre: { site: 'https://www.instahyre.com/favicon.ico', label: 'Instahyre' },
  adzuna: { site: 'https://cdn.simpleicons.org/adzuna', label: 'Adzuna' },
};

const BrandMark: React.FC<LogoProps & { provider: Provider }> = ({ provider, className = 'w-10 h-10', size }) => {
  const meta = logos[provider];
  const [failed, setFailed] = React.useState(false);
  const px = size ?? 40;

  if (failed) {
    return <span className="inline-flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-700 text-[11px] font-black text-white" style={{ width: px, height: px }} aria-label={`${meta.label} logo fallback`}>{meta.label.slice(0, 1).toUpperCase()}</span>;
  }

  return (
    <span className="inline-flex items-center justify-center rounded-xl bg-white border border-white/10 shadow-sm shrink-0 overflow-hidden" style={{ width: px, height: px }}>
      <img src={meta.site} width={px} height={px} className={`${className} object-contain p-1.5`} alt={`${meta.label} logo`} loading="eager" decoding="async" onError={() => setFailed(true)} />
    </span>
  );
};

export const LinkedInLogo: React.FC<LogoProps> = (props) => <BrandMark provider="linkedin" {...props} />;
export const IndeedLogo: React.FC<LogoProps> = (props) => <BrandMark provider="indeed" {...props} />;
export const GlassdoorLogo: React.FC<LogoProps> = (props) => <BrandMark provider="glassdoor" {...props} />;
export const WellfoundLogo: React.FC<LogoProps> = (props) => <BrandMark provider="wellfound" {...props} />;
export const WorkIndiaLogo: React.FC<LogoProps> = (props) => <BrandMark provider="workindia" {...props} />;
export const InstahyreLogo: React.FC<LogoProps> = (props) => <BrandMark provider="instahyre" {...props} />;
export const AdzunaLogo: React.FC<LogoProps> = (props) => <BrandMark provider="adzuna" {...props} />;

export const SOURCE_URLS = {
  linkedin: 'https://www.linkedin.com/jobs/',
  indeed: 'https://www.indeed.com/',
  glassdoor: 'https://www.glassdoor.com/Job/',
  wellfound: 'https://wellfound.com/jobs',
  workindia: 'https://www.workindia.in/',
  instahyre: 'https://www.instahyre.com/',
  adzuna: 'https://www.adzuna.com/',
} as const;
