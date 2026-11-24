/** One of dude's 19 stroke icons, at its drawn size (7–16px), in currentColor. Never scale them up. */
export interface IconProps {
  name: 'clip' | 'mail' | 'cal' | 'menu' | 'pen' | 'search' | 'check' | 'clock' | 'cmd' | 'trash' | 'person' | 'pin' | 'lines' | 'download' | 'back' | 'up' | 'down' | 'left' | 'right';
  /** give a title only when the icon stands alone and means something; otherwise it's hidden from AT */
  title?: string;
}

export declare const ICON_NAMES: string[];
