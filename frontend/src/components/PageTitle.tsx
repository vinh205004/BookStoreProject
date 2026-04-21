interface PageTitleProps {
  title: string;
  className?: string;
}

export default function PageTitle({ title, className = '' }: PageTitleProps) {
  return (
    <>
      <style>{`
        @keyframes pageTitleBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.68; }
        }
      `}</style>
      <div
        className={`mb-8 w-full bg-orange-500 px-5 py-3 shadow-sm animate-[pageTitleBlink_1.8s_ease-in-out_infinite] ${className}`.trim()}
      >
        <h1 className="text-2xl font-bold uppercase italic text-white sm:text-3xl lg:text-4xl">
          {title}
        </h1>
      </div>
    </>
  );
}
