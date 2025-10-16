import React from "react";
import Chip from "./Chip";

interface MiniTagProps {
  label: string;
}

/**
 * A small tag component for displaying pet attributes
 * Uses the Chip component with "tag" variant for consistency
 */
export default function MiniTag({ label }: MiniTagProps) {
  return <Chip label={label} variant="tag" />;
}
