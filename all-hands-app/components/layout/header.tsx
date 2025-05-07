import Image from 'next/image';

interface HeaderProps {
  centered?: boolean;
}

export default function Header({ centered = false }: HeaderProps) {
  return (
    <header className="py-6">
      <div className={`flex items-center ${centered ? 'justify-center' : ''} gap-4`}>
        <div className="pl-1 pr-1">
          <Image
            src="/innovera-logo.png"
            alt="Innovera"
            width={165}
            height={38}
            priority
          />
        </div>
        <div className="w-px h-8 bg-neutral-200" />
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
          All Hands Q&A
        </h1>
      </div>
    </header>
  );
} 