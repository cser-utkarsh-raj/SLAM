import React from 'react';

/**
 * A quiet, full-page motion layer for SLAM.
 * It intentionally avoids grids, dots, particles and cursor-following effects.
 */
export const AmbientMotion: React.FC = () => (
  <div className="slam-ambient" aria-hidden="true">
    <span className="slam-ambient__orb slam-ambient__orb--one" />
    <span className="slam-ambient__orb slam-ambient__orb--two" />
    <span className="slam-ambient__orb slam-ambient__orb--three" />
    <span className="slam-ambient__wash" />
  </div>
);
