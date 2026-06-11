interface HeaderProps {
  userName: string;
}

export function Header({ userName }: HeaderProps) {
  return (
    <header className="bg-[var(--nt)] text-brand-foreground rounded-b-3xl px-5 pt-6 pb-22  sm:px-8 sm:pt-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="space-y-1">
          <p className="text-sm opacity-70">ยินดีต้อนรับกลับมา,</p>
          <h1 className="text-2xl font-bold sm:text-3xl">{userName}</h1>
        </div>
      </div>
    </header>
  );
}