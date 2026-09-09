import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

type Provider = 'linkedin' | 'indeed' | 'glassdoor' | 'wellfound' | 'workindia' | 'instahyre' | 'naukri' | 'adzuna' | 'jobicy' | 'remoteok';

type LogoMeta = { site: string; label: string; fallback?: string };

const logos: Record<Exclude<Provider, 'remoteok'>, LogoMeta> = {
  linkedin: { site: 'https://cdn.simpleicons.org/linkedin/0A66C2', label: 'LinkedIn' },
  indeed: { site: 'https://cdn.simpleicons.org/indeed/2164F3', label: 'Indeed' },
  glassdoor: { site: 'https://cdn.simpleicons.org/glassdoor/00A264', label: 'Glassdoor' },
  wellfound: { site: 'https://cdn.simpleicons.org/wellfound/FFFFFF', label: 'Wellfound' },
  instahyre: { site: 'https://www.instahyre.com/favicon.ico', label: 'Instahyre' },
  naukri: { site: 'https://www.naukri.com/favicon.ico', label: 'Naukri' },
  workindia: { site: 'https://www.workindia.in/favicon.ico', label: 'WorkIndia' },
  adzuna: { site: 'https://www.adzuna.com/favicon.ico', label: 'Adzuna' },
  jobicy: { site: 'https://jobicy.com/favicon.ico', label: 'Jobicy' },
};

const BrandMark: React.FC<LogoProps & { provider: Exclude<Provider, 'remoteok'> }> = ({ provider, className = '', size }) => {
  const meta = logos[provider];
  const [failed, setFailed] = React.useState(false);
  const px = size ?? 56;
  if (failed) return <span className="inline-flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-700 text-white font-black text-[10px] tracking-tight px-2 text-center leading-tight" style={{ width: px, height: px }}>{meta.label}</span>;
  return <span className="inline-flex items-center justify-center rounded-xl bg-white border border-white/10 shadow-sm shrink-0 overflow-hidden" style={{ width: px, height: px }}><img src={meta.site} width={px} height={px} className={`w-full h-full object-contain p-2 ${className}`} alt={`${meta.label} logo`} loading="eager" decoding="async" onError={() => setFailed(true)} /></span>;
};

export const LinkedInLogo: React.FC<LogoProps> = (props) => <BrandMark provider="linkedin" {...props} />;
export const IndeedLogo: React.FC<LogoProps> = (props) => <BrandMark provider="indeed" {...props} />;
export const GlassdoorLogo: React.FC<LogoProps> = (props) => <BrandMark provider="glassdoor" {...props} />;
export const WellfoundLogo: React.FC<LogoProps> = (props) => <BrandMark provider="wellfound" {...props} />;
export const WorkIndiaLogo: React.FC<LogoProps> = (props) => <BrandMark provider="workindia" {...props} />;
export const InstahyreLogo: React.FC<LogoProps> = (props) => <BrandMark provider="instahyre" {...props} />;
export const NaukriLogo: React.FC<LogoProps> = (props) => <BrandMark provider="naukri" {...props} />;
export const AdzunaLogo: React.FC<LogoProps> = (props) => <BrandMark provider="adzuna" {...props} />;
export const JobicyLogo: React.FC<LogoProps> = (props) => <BrandMark provider="jobicy" {...props} />;
// Remote OK's API requires attribution and its terms restrict use of the Remote OK trademark/logo without permission.
export const RemoteOKLogo: React.FC<LogoProps> = ({ size = 56 }) => <span className="inline-flex items-center justify-center rounded-xl bg-zinc-950 border border-zinc-700 text-white font-black text-sm tracking-tight" style={{ width: size, height: size }}>RO</span>;

export const SOURCE_URLS = {
  linkedin: 'https://www.linkedin.com/jobs/',
  indeed: 'https://in.indeed.com/',
  glassdoor: 'https://www.glassdoor.co.in/Job/index.htm',
  wellfound: 'https://wellfound.com/jobs',
  workindia: 'https://www.workindia.in/',
  instahyre: 'https://www.instahyre.com/',
  naukri: 'https://www.naukri.com/',
  adzuna: 'https://www.adzuna.com/',
  jobicy: 'https://jobicy.com/',
  remoteok: 'https://remoteok.com/',
} as const;
