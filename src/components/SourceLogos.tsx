import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

type Provider = 'linkedin' | 'indeed' | 'glassdoor' | 'wellfound' | 'workindia' | 'instahyre' | 'arbeitnow';

const logos: Record<Provider, { site: string; label: string }> = {
  linkedin: { site: 'https://www.linkedin.com/favicon.ico', label: 'LinkedIn' },
  indeed: { site: 'https://www.indeed.com/favicon.ico', label: 'Indeed' },
  glassdoor: { site: 'https://www.glassdoor.com/favicon.ico', label: 'Glassdoor' },
  wellfound: { site: 'https://wellfound.com/favicon.ico', label: 'Wellfound' },
  workindia: { site: 'https://www.workindia.in/favicon.ico', label: 'WorkIndia' },
  instahyre: { site: 'https://www.instahyre.com/favicon.ico', label: 'Instahyre' },
  arbeitnow: { site: 'https://arbeitnow.com/favicon.ico', label: 'Arbeitnow' },
};

const OfficialFavicon: React.FC<LogoProps & { provider: Provider }> = ({ provider, className = 'w-9 h-9', size }) => {
  const meta = logos[provider];
  const [failed, setFailed] = React.useState(false);
  const px = size ?? 36;

  if (failed) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-[11px] font-black text-zinc-100"
        style={{ width: px, height: px }}
        aria-label={`${meta.label} logo fallback`}
      >
        {meta.label.slice(0, 1)}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center justify-center rounded-xl bg-white border border-white/10 shadow-sm shrink-0 overflow-hidden"
      style={{ width: px, height: px }}
    >
      <img
        src={meta.site}
        width={px}
        height={px}
        className={`${className} object-contain p-1.5`}
        alt={`${meta.label} logo`}
        loading="eager"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </span>
  );
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
