import { type JSX } from "react";

export function Card({
  className,
  title,
  children,
  href,
}: {
  className?: string;
  title: string;
  children: React.ReactNode;
  href?: string;
}): JSX.Element {
  return (
    <a
      className={className}
      href={`${href}?utm_source=create-turbo&utm_medium=basic&utm_campaign=create-turbo"`}
      rel="noopener noreferrer"
      target="_blank"
    >
      <div className="flex flex-col justify-between p-6 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 transition-colors">
        <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
        <div className="text-gray-400">{children}</div>
      </div>
    </a>
  );
}
