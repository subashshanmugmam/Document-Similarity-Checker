/**
 * Skeleton Loader Component
 * Animated loading placeholders for better perceived performance
 */

const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'document-card':
        return (
          <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur rounded-xl p-4 border-2 border-white/10 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                {/* Icon skeleton */}
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-xl"></div>
                
                <div className="flex-1 space-y-3">
                  {/* Title skeleton */}
                  <div className="h-4 bg-gradient-to-r from-gray-400/20 to-gray-500/20 rounded-lg w-3/4 shimmer"></div>
                  
                  {/* Stats skeleton */}
                  <div className="flex gap-4">
                    <div className="h-3 bg-gradient-to-r from-gray-400/20 to-gray-500/20 rounded w-20 shimmer"></div>
                    <div className="h-3 bg-gradient-to-r from-gray-400/20 to-gray-500/20 rounded w-24 shimmer"></div>
                    <div className="h-3 bg-gradient-to-r from-gray-400/20 to-gray-500/20 rounded w-20 shimmer"></div>
                  </div>
                </div>
              </div>
              
              {/* Button skeleton */}
              <div className="w-10 h-10 bg-gradient-to-br from-red-400/20 to-pink-400/20 rounded-lg"></div>
            </div>
          </div>
        );
      
      case 'similarity-pair':
        return (
          <div className="p-4 rounded-xl border-3 border-white/10 bg-gradient-to-br from-white/5 to-gray-50/5 animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gradient-to-r from-gray-400/20 to-gray-500/20 rounded w-2/3 shimmer"></div>
                <div className="h-3 bg-gradient-to-r from-gray-400/20 to-gray-500/20 rounded w-1/2 shimmer"></div>
              </div>
              <div className="w-16 h-8 bg-gradient-to-r from-purple-400/20 to-blue-400/20 rounded-lg"></div>
            </div>
            {/* Progress bar skeleton */}
            <div className="w-full h-3 bg-gray-200/20 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full w-1/2 shimmer"></div>
            </div>
          </div>
        );
      
      case 'list':
        return (
          <div className="space-y-3 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gradient-to-r from-gray-400/20 to-gray-500/20 rounded shimmer" 
                   style={{ width: `${Math.random() * 40 + 60}%` }}></div>
            ))}
          </div>
        );
      
      default:
        return (
          <div className="glass-card animate-pulse">
            <div className="space-y-4">
              <div className="h-6 bg-gradient-to-r from-gray-400/20 to-gray-500/20 rounded-lg w-1/4 shimmer"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gradient-to-r from-gray-400/20 to-gray-500/20 rounded shimmer"></div>
                <div className="h-4 bg-gradient-to-r from-gray-400/20 to-gray-500/20 rounded w-5/6 shimmer"></div>
                <div className="h-4 bg-gradient-to-r from-gray-400/20 to-gray-500/20 rounded w-4/6 shimmer"></div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      {[...Array(count)].map((_, index) => (
        <div key={index} style={{ animationDelay: `${index * 100}ms` }}>
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
};

export default SkeletonLoader;
