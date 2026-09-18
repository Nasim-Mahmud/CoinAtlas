import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Section reveal wrapper (design.md §5): children stagger 0.07s,
 * y 24→0 + opacity, 0.6s, trigger at 15% viewport, once. Collapses to a
 * simple opacity fade under prefers-reduced-motion.
 *
 * Use <Reveal> around a group and <RevealItem> on each child.
 */
export interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger between children (default 0.07s). */
  stagger?: number;
  /** Initial Y offset in px (default 24). */
  y?: number;
  as?: "div" | "section" | "ul" | "ol";
}

export function Reveal({ children, className, stagger = 0.07, y = 24, as = "div" }: RevealProps) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger } },
      }}
      data-reveal-y={y}
    >
      {children}
    </Tag>
  );
}

export interface RevealItemProps {
  children: ReactNode;
  className?: string;
  y?: number;
}

export function RevealItem({ children, className, y = 24 }: RevealItemProps) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export default Reveal;
