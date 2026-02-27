export const Avatar = ({ name, size = 36 }: { name: string; size?: number }) => {
  const initials = name.split(" ").map(n => n[0]).join("");
  return (
    <div
      className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center font-semibold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
};
