interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-brand-100 bg-white p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
