"use client";
import React from 'react';

// Base skeleton animation class
const baseClasses = "animate-pulse bg-gray-700";

/**
 * Generic Skeleton component
 */
export const Skeleton = ({ className = "", rounded = "md", ...props }) => {
  const roundedClasses = {
    none: "",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    full: "rounded-full",
  };
  
  return (
    <div 
      className={`${baseClasses} ${roundedClasses[rounded]} ${className}`}
      {...props}
    />
  );
};

/**
 * Story Card Skeleton
 */
export const StoryCardSkeleton = () => (
  <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 h-72 flex flex-col">
    {/* Header */}
    <div className="flex justify-between items-start mb-4">
      <Skeleton className="h-6 w-24" rounded="lg" />
      <Skeleton className="h-6 w-12" rounded="lg" />
    </div>
    
    {/* Title */}
    <Skeleton className="h-6 w-3/4 mb-2" />
    <Skeleton className="h-6 w-1/2 mb-4" />
    
    {/* Content */}
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-5/6" />
    </div>
    
    {/* Footer */}
    <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-16" />
    </div>
  </div>
);

/**
 * Media Grid Item Skeleton
 */
export const MediaItemSkeleton = () => (
  <div className="aspect-square bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
    <Skeleton className="w-full h-full" rounded="none" />
  </div>
);

/**
 * Person Card Skeleton
 */
export const PersonCardSkeleton = () => (
  <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center gap-4">
    <Skeleton className="w-12 h-12" rounded="full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  </div>
);

/**
 * Tree Node Skeleton
 */
export const TreeNodeSkeleton = () => (
  <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 w-32 flex flex-col items-center">
    <Skeleton className="w-14 h-14 mb-2" rounded="full" />
    <Skeleton className="h-4 w-24 mb-1" />
    <Skeleton className="h-3 w-16" />
  </div>
);

/**
 * Form Field Skeleton
 */
export const FormFieldSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-10 w-full" rounded="lg" />
  </div>
);

/**
 * Modal Header Skeleton
 */
export const ModalHeaderSkeleton = () => (
  <div className="p-6 bg-gradient-to-r from-gray-700 to-gray-600">
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10" rounded="lg" />
      <Skeleton className="h-8 w-48" />
    </div>
  </div>
);

/**
 * Profile Edit Skeleton
 */
export const ProfileEditSkeleton = () => (
  <div className="space-y-6 p-6">
    {/* Profile Picture */}
    <div className="flex flex-col items-center">
      <Skeleton className="w-32 h-32" rounded="full" />
    </div>
    
    {/* Name Fields */}
    <div className="grid grid-cols-2 gap-4">
      <FormFieldSkeleton />
      <FormFieldSkeleton />
      <FormFieldSkeleton />
      <FormFieldSkeleton />
    </div>
    
    {/* Birth Info Section */}
    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 space-y-4">
      <Skeleton className="h-5 w-32" />
      <div className="grid grid-cols-2 gap-4">
        <FormFieldSkeleton />
        <FormFieldSkeleton />
      </div>
    </div>
    
    {/* Bio */}
    <FormFieldSkeleton />
    <Skeleton className="h-24 w-full" rounded="lg" />
    
    {/* Buttons */}
    <div className="flex gap-3 pt-4">
      <Skeleton className="h-12 w-12" rounded="lg" />
      <Skeleton className="h-12 flex-1" rounded="lg" />
    </div>
  </div>
);

/**
 * Stories Page Skeleton
 */
export const StoriesPageSkeleton = () => (
  <div className="p-6">
    {/* Header */}
    <div className="flex justify-between items-center mb-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 w-48" rounded="xl" />
        <Skeleton className="h-10 w-32" rounded="xl" />
      </div>
    </div>
    
    {/* Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <StoryCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

/**
 * Media Gallery Skeleton
 */
export const MediaGallerySkeleton = () => (
  <div className="p-6">
    {/* Header */}
    <div className="flex justify-between items-center mb-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 w-56" rounded="xl" />
        <Skeleton className="h-10 w-28" rounded="xl" />
      </div>
    </div>
    
    {/* Grid */}
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {[...Array(10)].map((_, i) => (
        <MediaItemSkeleton key={i} />
      ))}
    </div>
  </div>
);

/**
 * Dashboard Stats Skeleton
 */
export const DashboardStatsSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <Skeleton className="h-4 w-16 mb-2" />
        <Skeleton className="h-8 w-12" />
      </div>
    ))}
  </div>
);

/**
 * Table Row Skeleton
 */
export const TableRowSkeleton = ({ columns = 4 }) => (
  <tr>
    {[...Array(columns)].map((_, i) => (
      <td key={i} className="p-4">
        <Skeleton className="h-4 w-full max-w-[120px]" />
      </td>
    ))}
  </tr>
);

/**
 * Table Skeleton
 */
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
    {/* Header */}
    <div className="bg-gray-900 p-4 border-b border-gray-700">
      <div className="flex gap-4">
        {[...Array(columns)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-24" />
        ))}
      </div>
    </div>
    
    {/* Rows */}
    <table className="w-full">
      <tbody>
        {[...Array(rows)].map((_, i) => (
          <TableRowSkeleton key={i} columns={columns} />
        ))}
      </tbody>
    </table>
  </div>
);

/**
 * Generic Loading Spinner
 */
export const LoadingSpinner = ({ size = "md", className = "" }) => {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
    xl: "w-16 h-16 border-4",
  };
  
  return (
    <div 
      className={`${sizes[size]} border-emerald-500 border-t-transparent rounded-full animate-spin ${className}`}
    />
  );
};

/**
 * Full Page Loading State
 */
export const PageLoadingSkeleton = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
    <LoadingSpinner size="lg" />
    <p className="mt-4 text-gray-400 text-sm">{message}</p>
  </div>
);

export default {
  Skeleton,
  StoryCardSkeleton,
  MediaItemSkeleton,
  PersonCardSkeleton,
  TreeNodeSkeleton,
  FormFieldSkeleton,
  ModalHeaderSkeleton,
  ProfileEditSkeleton,
  StoriesPageSkeleton,
  MediaGallerySkeleton,
  DashboardStatsSkeleton,
  TableRowSkeleton,
  TableSkeleton,
  LoadingSpinner,
  PageLoadingSkeleton,
};
