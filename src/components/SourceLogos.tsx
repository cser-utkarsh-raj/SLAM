import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

type Provider = 'linkedin' | 'indeed' | 'glassdoor' | 'wellfound' | 'workindia' | 'instahyre' | 'adzuna' | 'jobicy' | 'remoteok';

const logos: Record<Exclude<Provider, 'remoteok'>, { site: string; label: string }> = {
  linkedin: { site: 'https://www.linkedin.com/favicon.ico', label: 'LinkedIn' },
  indeed: { site: 'https://www.indeed.com/favicon.ico', label: 'Indeed' },
  glassdoor: { site: 'https://www.glassdoor.com/favicon.ico', label: 'Glassdoor' },
  wellfound: { site: 'https://wellfound.com/favicon.ico', label: 'Wellfound' },
  workindia: { site: 'https://www.workindia.in/favicon.ico', label: 'WorkIndia' },
  instahyre: { site: 'https://www.instahyre.com/favicon.ico', label: 'Instahyre' },
  adzuna: { site: 'https://www.adzuna.com/favicon.ico', label: 'Adzuna' },
  jobicy: { site: 'https://jobicy.com/favicon.ico', label: 'Jobicy' },
};

const BrandMark: React.FC<LogoProps & { provider: Exclude<Provider, 'remoteok'> }> = ({ provider, className = 'w-10 h-10', size }) => {
  const meta = logos[provider];
  const [failed, setFailed] = React.useState(false);
  const px = size ?? 48;
  if (failed) return <span className="inline-flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-700 text-[11px] font-black text-white" style={{ width: px, height: px }}>{meta.label.slice(0, 1).toUpperCase()}</span>;
  return <span className="inline-flex items-center justify-center rounded-xl bg-white border border-white/10 shadow-sm shrink-0 overflow-hidden" style={{ width: px, height: px }}><img src={meta.site} width={px} height={px} className={`${className} object-contain p-1`} alt={`${meta.label} logo`} loading="eager" decoding="async" onError={() => setFailed(true)} /></span>;
};

export const LinkedInLogo: React.FC<LogoProps> = (props) => <BrandMark provider="linkedin" {...props} />;
export const IndeedLogo: React.FC<LogoProps> = (props) => <BrandMark provider="indeed" {...props} />;
export const GlassdoorLogo: React.FC<LogoProps> = (props) => <BrandMark provider="glassdoor" {...props} />;
export const WellfoundLogo: React.FC<LogoProps> = (props) => <BrandMark provider="wellfound" {...props} />;
export const WorkIndiaLogo: React.FC<LogoProps> = (props) => <BrandMark provider="workindia" {...props} />;
export const InstahyreLogo: React.FC<LogoProps> = (props) => <BrandMark provider="instahyre" {...props} />;
export const AdzunaLogo: React.FC<LogoProps> = (props) => <BrandMark provider="adzuna" {...props} />;
export const JobicyLogo: React.FC<LogoProps> = (props) => <BrandMark provider="jobicy" {...props} />;
export const RemoteOKLogo: React.FC<LogoProps> = ({ size = 48 }) => <span className="inline-flex items-center justify-center rounded-xl bg-zinc-950 border border-zinc-700 text-white font-black text-sm tracking-tight" style={{ width: size, height: size }}>RO</span>;

export const SOURCE_URLS = {
  linkedin: 'https://www.linkedin.com/jobs/',
  indeed: 'https://www.indeed.com/',
  glassdoor: 'https://www.glassdoor.com/Job/',
  wellfound: 'https://wellfound.com/jobs',
  workindia: 'https://www.workindia.in/',
  instahyre: 'https://www.instahyre.com/',
  adzuna: 'https://www.adzuna.com/',
  jobicy: 'https://jobicy.com/',
  remoteok: 'https://remoteok.com/',
} as const;
