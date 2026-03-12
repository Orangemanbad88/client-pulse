export const Avatar = ({ name, size = 36 }: { name: string; size?: number }) => {
  const initials = name.split(" ").map(n => n[0]).join("");
  return (
    <div
      className="bg-amber-900/30 dark:bg-amber-900/30 text-gold dark:text-gold-light rounded-full flex items-center justify-center font-semibold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
};
