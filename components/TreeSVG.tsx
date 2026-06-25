"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * TreeSVG — Root System Timeline
 *
 * Stroke colors: rich Forest Green (#4F6F52) for the main system,
 * Leaf Gold (#C9A05C) for accent/secondary roots — both kept light/medium
 * to sit comfortably on the warm soil background.
 *
 * Roots are drawn purely with <path> + cubic Bezier (C) curves.
 * Each of the five primary roots ends in a timeline marker; the
 * associated text fades in once that root finishes drawing.
 */

type RootBranch = {
  id: string;
  d: string;
  color: string;
  width: number;
  tipX: number;
  tipY: number;
  date: string;
  subtext: string;
  textAnchor: "start" | "middle" | "end";
  labelOffsetX: number;
  labelOffsetY: number;
};

const PRIMARY_ROOTS: RootBranch[] = [
  {
    id: "far-left",
    // Far Left Root: sweeps wide left then down
    d: "M 500 20 C 430 60, 260 70, 170 170 C 95 255, 70 380, 65 520 C 62 630, 70 760, 90 880",
    color: "#4F6F52",
    width: 3.5,
    tipX: 90,
    tipY: 880,
    date: "Dec 2024",
    subtext: "The spark of a non-judgmental support system.",
    textAnchor: "start",
    labelOffsetX: -55,
    labelOffsetY: 28,
  },
  {
    id: "bottom-left",
    // Bottom Left Root: moderate left sweep
    d: "M 500 20 C 455 90, 370 130, 320 250 C 278 352, 270 470, 295 600 C 312 685, 325 770, 335 870",
    color: "#4F6F52",
    width: 3,
    tipX: 335,
    tipY: 870,
    date: "Jan – Jul 2025",
    subtext: "Project SARTHI is born.",
    textAnchor: "middle",
    labelOffsetX: -10,
    labelOffsetY: 28,
  },
  {
    id: "center",
    // Center Root: nearly straight down with gentle organic wobble
    d: "M 500 20 C 505 160, 480 300, 500 440 C 518 560, 495 720, 500 900",
    color: "#C9A05C",
    width: 4,
    tipX: 500,
    tipY: 900,
    date: "Aug 2025",
    subtext: "Evolution into Psychology Embassy.",
    textAnchor: "middle",
    labelOffsetX: 0,
    labelOffsetY: 28,
  },
  {
    id: "bottom-right",
    // Bottom Right Root: mirror of bottom-left
    d: "M 500 20 C 545 90, 630 130, 680 250 C 722 352, 730 470, 705 600 C 688 685, 675 770, 665 870",
    color: "#4F6F52",
    width: 3,
    tipX: 665,
    tipY: 870,
    date: "Sep 2025",
    subtext: "First official event on World Suicide Prevention Day.",
    textAnchor: "middle",
    labelOffsetX: 10,
    labelOffsetY: 28,
  },
  {
    id: "far-right",
    // Far Right Root: mirror of far-left
    d: "M 500 20 C 570 60, 740 70, 830 170 C 905 255, 930 380, 935 520 C 938 630, 930 760, 910 880",
    color: "#4F6F52",
    width: 3.5,
    tipX: 910,
    tipY: 880,
    date: "Jan – Jun 2026",
    subtext: "Officially registered as a Start-up.",
    textAnchor: "end",
    labelOffsetX: 55,
    labelOffsetY: 28,
  },
];

// Thin fibrous detail roots, purely decorative — no labels.
const FIBER_ROOTS: { d: string; color: string; width: number; opacity: number }[] = [
  { d: "M 170 170 C 145 195, 120 215, 100 245", color: "#4F6F52", width: 1.4, opacity: 0.35 },
  { d: "M 320 250 C 300 280, 285 310, 280 345", color: "#C9A05C", width: 1.4, opacity: 0.3 },
  { d: "M 500 440 C 470 470, 455 500, 448 535", color: "#4F6F52", width: 1.4, opacity: 0.3 },
  { d: "M 500 440 C 530 470, 548 500, 555 535", color: "#4F6F52", width: 1.4, opacity: 0.3 },
  { d: "M 680 250 C 700 280, 715 310, 722 345", color: "#C9A05C", width: 1.4, opacity: 0.3 },
  { d: "M 830 170 C 858 195, 882 215, 902 245", color: "#4F6F52", width: 1.4, opacity: 0.35 },
  { d: "M 295 600 C 270 625, 250 645, 235 670", color: "#4F6F52", width: 1.2, opacity: 0.25 },
  { d: "M 705 600 C 730 625, 752 645, 768 670", color: "#4F6F52", width: 1.2, opacity: 0.25 },
];

export default function TreeSVG() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trunkRef = useRef<SVGPathElement | null>(null);
  const rootRefs = useRef<Record<string, SVGPathElement | null>>({});
  const fiberRefs = useRef<(SVGPathElement | null)[]>([]);
  const labelRefs = useRef<Record<string, SVGGElement | null>>({});

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const setupDraw = (el: SVGPathElement | null) => {
        if (!el) return;
        const length = el.getTotalLength();
        gsap.set(el, { strokeDasharray: length, strokeDashoffset: length });
        return length;
      };

      // Trunk: short connector from the journey line above
      if (trunkRef.current) {
        setupDraw(trunkRef.current);
        gsap.to(trunkRef.current, {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
            end: "top 40%",
            scrub: true,
          },
        });
      }

      // Fibrous detail roots — draw alongside primary roots, slightly staggered
      fiberRefs.current.forEach((el) => {
        if (!el) return;
        setupDraw(el);
        gsap.to(el, {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 60%",
            end: "bottom 60%",
            scrub: true,
          },
        });
      });

      // Primary roots: draw on scroll, then fade in their label
      PRIMARY_ROOTS.forEach((root) => {
        const pathEl = rootRefs.current[root.id];
        const labelEl = labelRefs.current[root.id];
        if (!pathEl) return;

        setupDraw(pathEl);

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 70%",
            end: "bottom 30%",
            scrub: true,
          },
        });

        tl.to(pathEl, { strokeDashoffset: 0, ease: "none" });

        if (labelEl) {
          gsap.set(labelEl, { opacity: 0, y: 14 });
          tl.to(
            labelEl,
            { opacity: 1, y: 0, ease: "power2.out", duration: 0.001 },
            ">-0.05"
          );
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <svg
        className="h-full w-full"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMin meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Trunk connector from Node 3's wavy line above */}
        <path
          ref={trunkRef}
          d="M 500 0 C 500 8, 500 14, 500 20"
          stroke="#4F6F52"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Fibrous detail roots */}
        {FIBER_ROOTS.map((fiber, i) => (
          <path
            key={`fiber-${i}`}
            ref={(el) => {
              fiberRefs.current[i] = el;
            }}
            d={fiber.d}
            stroke={fiber.color}
            strokeWidth={fiber.width}
            strokeLinecap="round"
            opacity={fiber.opacity}
          />
        ))}

        {/* Primary roots */}
        {PRIMARY_ROOTS.map((root) => (
          <path
            key={root.id}
            ref={(el) => {
              rootRefs.current[root.id] = el;
            }}
            d={root.d}
            stroke={root.color}
            strokeWidth={root.width}
            strokeLinecap="round"
            opacity="0.9"
          />
        ))}

        {/* Timeline labels at root tips */}
        {PRIMARY_ROOTS.map((root) => (
          <g
            key={`label-${root.id}`}
            ref={(el) => {
              labelRefs.current[root.id] = el;
            }}
            transform={`translate(${root.tipX + root.labelOffsetX}, ${
              root.tipY + root.labelOffsetY
            })`}
          >
            {/* Small marker dot at the root tip */}
            <circle
              cx={-root.labelOffsetX}
              cy={-root.labelOffsetY}
              r="5"
              fill={root.color}
              opacity="0.85"
            />

            <text
              x="0"
              y="0"
              textAnchor={root.textAnchor}
              fontFamily="'Cormorant Garamond', 'Playfair Display', serif"
              fontSize="22"
              fontWeight="600"
              fill="#3A3A38"
            >
              {root.date}
            </text>

            <foreignObject
              x={
                root.textAnchor === "start"
                  ? 0
                  : root.textAnchor === "end"
                  ? -200
                  : -100
              }
              y="10"
              width="200"
              height="80"
            >
              <p
                style={{
                  margin: 0,
                  fontFamily:
                    "'Inter', 'Helvetica Neue', Arial, sans-serif",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  color: "rgba(58,58,56,0.72)",
                  textAlign:
                    root.textAnchor === "start"
                      ? "left"
                      : root.textAnchor === "end"
                      ? "right"
                      : "center",
                }}
              >
                {root.subtext}
              </p>
            </foreignObject>
          </g>
        ))}
      </svg>
    </div>
  );
}