function seedFromString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) % 1000;
  }
  return hash;
}

/**
 * Abstract, brand-toned placeholder graphic for deal cards, standing in
 * for real company photography/art until real assets are supplied.
 * Callers must include a position class (relative/absolute) in
 * className — the inner svg anchors to it.
 */
export function DealThumbnail({
  seed,
  className = "relative",
}: {
  seed: string;
  className?: string;
}) {
  const n = seedFromString(seed);
  const nodes = Array.from({ length: 7 }, (_, i) => {
    const x = ((n * (i + 3)) % 100) + 0;
    const y = ((n * (i + 7)) % 60) + 20;
    return { x: Math.min(x, 95), y: Math.min(y, 90) };
  });

  return (
    <div
      className={`overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 ${className}`}
    >
      <svg
        className="absolute inset-0 h-full w-full opacity-40"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {nodes.map((node, i) => {
          const next = nodes[(i + 1) % nodes.length];
          return (
            <line
              key={`line-${i}`}
              x1={node.x}
              y1={node.y}
              x2={next.x}
              y2={next.y}
              stroke="#ffffff"
              strokeWidth="0.2"
            />
          );
        })}
        {nodes.map((node, i) => (
          <circle
            key={`node-${i}`}
            cx={node.x}
            cy={node.y}
            r={i % 3 === 0 ? 1.4 : 0.7}
            fill={i % 4 === 0 ? "#c8102e" : "#ffffff"}
          />
        ))}
      </svg>
    </div>
  );
}
