import { cn } from "@/lib/utils";

interface TagProps {
  name: string;
  color?: 'green' | 'yellow' | 'gray' | 'blue' | 'purple' | 'red';
  className?: string;
  onRemove?: () => void;
}

const colorStyles = {
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  gray: 'bg-gray-100 text-gray-800',
  blue: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  red: 'bg-red-100 text-red-800',
};

export function Tag({ name, color = 'gray', className, onRemove }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded text-xs px-2 py-1",
        colorStyles[color],
        className
      )}
    >
      {name}
      {onRemove && (
        <button
          type="button"
          className="ml-1 hover:text-red-500 focus:outline-none"
          onClick={onRemove}
        >
          &times;
        </button>
      )}
    </span>
  );
} 