import LoadingSpinner from '@/components/LoadingSpinner';

export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-10 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-6 rounded-lg shadow-md h-96 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-8 animate-pulse"></div>
          <LoadingSpinner />
        </div>
      </div>
    </div>
  );
} 