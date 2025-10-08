import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        "animate-pulse rounded-md bg-gradient-to-r from-muted via-muted/80 to-muted relative overflow-hidden",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        className
      )} 
      {...props} 
    />
  );
}

// Enhanced skeleton variants
function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-4 space-y-3", className)} {...props}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-20 w-full" />
      <div className="flex space-x-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  );
}

function SkeletonAvatar({ size = "md", className, ...props }: {
  size?: "sm" | "md" | "lg";
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16"
  };
  
  return (
    <Skeleton 
      className={cn("rounded-full", sizeClasses[size], className)} 
      {...props} 
    />
  );
}

function SkeletonText({ 
  lines = 3, 
  className, 
  ...props 
}: {
  lines?: number;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonAvatar, SkeletonText };
