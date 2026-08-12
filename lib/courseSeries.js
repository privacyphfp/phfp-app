export const SERIES_LABELS = {
  healing: 'Healing Series',
  spirituality: 'Spirituality Series',
  prosperity: 'Prosperity Series',
  arhatic_yoga: 'Arhatic Yoga Series',
};

export const SERIES_ACCENTS = {
  spirituality: 'border-brand-indigo/30 bg-brand-indigo/5 text-brand-indigo',
  healing: 'border-brand-blue/30 bg-brand-blue/5 text-brand-blue',
  prosperity: 'border-brand-flame/30 bg-brand-flame/5 text-brand-flame',
  arhatic_yoga: 'border-brand-gold/50 bg-brand-amber/10 text-brand-flame',
};

export const SERIES_HEX = {
  spirituality: '#0c0ccc',
  healing: '#00549c',
  prosperity: '#c0600c',
  arhatic_yoga: '#fcc03c',
};

export const SERIES_ORDER = ['spirituality', 'healing', 'prosperity', 'arhatic_yoga'];

// Border style + accent used on the course-path diagram, so each series reads
// as a distinct "line style" the way the legend on a roadmap chart would.
export const SERIES_PATH_STYLE = {
  spirituality: 'border-2 border-dashed border-brand-indigo/50 bg-brand-indigo/5 hover:bg-brand-indigo/10',
  healing: 'border-2 border-solid border-brand-blue/50 bg-brand-blue/5 hover:bg-brand-blue/10',
  prosperity: 'border-2 border-dotted border-brand-flame/60 bg-brand-flame/5 hover:bg-brand-flame/10',
  arhatic_yoga: 'border-2 border-dashed border-brand-gold bg-brand-amber/10 hover:bg-brand-amber/20',
};
