const SIZES = {
  sm: "h-6 w-6 text-[11px]",
  md: "h-8 w-8 text-xs",
  lg: "h-11 w-11 text-sm",
};

export default function Avatar({ user, size = "md", ring = false }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${SIZES[size]} ${
        ring ? "ring-2 ring-white" : ""
      }`}
      style={{ backgroundColor: user.color }}
      title={user.name}
    >
      {user.initial}
    </span>
  );
}
