interface FlatIconProps {
  name: string;
  className?: string;
  label?: string;
}

export default function FlatIcon({
  name,
  className = "",
  label,
}: FlatIconProps) {
  return (
    <i
      className={`fi fi-rr-${name} inline-flex items-center justify-center leading-none ${className}`}
      aria-hidden={label ? undefined : true}
      aria-label={label}
    />
  );
}
