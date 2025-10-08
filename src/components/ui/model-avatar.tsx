import { cn } from "@/lib/utils";
import type { AIModel } from "@/lib/aiApi";

interface ModelAvatarProps {
  model?: AIModel;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ModelAvatar({ model, size = 'md', className }: ModelAvatarProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const containerSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
    lg: 'w-8 h-8'
  };

  if (!model) {
    return (
      <div className={cn(
        "rounded-full bg-muted flex items-center justify-center",
        containerSizeClasses[size],
        className
      )}>
        <span className={cn(
          "text-muted-foreground font-medium",
          size === 'sm' ? 'text-xs' : size === 'md' ? 'text-xs' : 'text-sm'
        )}>
          AI
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-full bg-primary flex items-center justify-center overflow-hidden",
      containerSizeClasses[size],
      className
    )}>
      {model.logo ? (
        <img
          src={model.logo}
          alt={model.name}
          className={cn(
            "object-contain rounded-full",
            sizeClasses[size]
          )}
          style={{
            maxWidth: '80%',
            maxHeight: '80%',
            filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
          }}
          onError={(e) => {
            // Fallback to text if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `<span class="text-primary-foreground text-xs font-medium">${model.name.substring(0, 1)}</span>`;
            }
          }}
        />
      ) : (
        <span className={cn(
          "text-primary-foreground font-medium",
          size === 'sm' ? 'text-xs' : size === 'md' ? 'text-xs' : 'text-sm'
        )}>
          {model.name.substring(0, 1)}
        </span>
      )}
    </div>
  );
}