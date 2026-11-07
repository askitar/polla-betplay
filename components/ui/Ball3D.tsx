import type { CSSProperties } from "react";

/** Pure-CSS football with shading, patches and a floor shadow. */
export function Ball3D({
  size = 96,
  float = true,
  shadow = true,
  className = "",
}: {
  size?: number;
  float?: boolean;
  shadow?: boolean;
  className?: string;
}) {
  return (
    <div className={`inline-flex flex-col items-center ${className}`} aria-hidden>
      <div className={float ? "float" : ""}>
        <div className="ball3d" style={{ "--s": `${size}px` } as CSSProperties} />
      </div>
      {shadow && <div className="ball-shadow" style={{ width: size * 0.7 }} />}
    </div>
  );
}
