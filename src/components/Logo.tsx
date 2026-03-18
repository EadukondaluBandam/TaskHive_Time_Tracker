import { Clock } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const sizes = {
    sm: { icon: 20, text: 'text-lg' },
    md: { icon: 28, text: 'text-xl' },
    lg: { icon: 40, text: 'text-3xl' },
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
        <div className="relative bg-gradient-to-br from-primary to-cyan-400 p-2 rounded-xl">
          <Clock size={sizes[size].icon} className="text-primary-foreground" strokeWidth={2.5} />
        </div>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold ${sizes[size].text} text-gradient`}>
            TaskHive
          </span>
          <span className="text-[10px] text-muted-foreground tracking-widest uppercase -mt-1">
            by Blackroth
          </span>
        </div>
      )}
    </div>
  );
}
