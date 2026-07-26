import Slide01Intro from './Slide01Intro';
import Slide02Problem from './Slide02Problem';
import Slide03Promise from './Slide03Promise';
import Slide04Design from './Slide04Design';
import Slide05Structure from './Slide05Structure';
import Slide06Brand from './Slide06Brand';
import Slide07Interactive from './Slide07Interactive';
import Slide08Chart from './Slide02InteractiveChart';
import Slide09Features from './Slide03FeatureAdoption';
import Slide10ThreeD from './Slide03Interactive3D';
import Slide11Stat from './Slide11Stat';
import Slide12CTA from './Slide12CTA';

export const showcaseSlides = [
  { component: Slide01Intro,       name: 'You have the message',  template: 'title' },
  { component: Slide02Problem,     name: 'The problem',           template: 'statement' },
  { component: Slide03Promise,     name: 'Four promises',         template: 'grid' },
  { component: Slide04Design,      name: 'Instant design',        template: 'before-after' },
  { component: Slide05Structure,   name: 'Expert structure',      template: 'timeline' },
  { component: Slide06Brand,       name: 'On-brand',              template: 'split' },
  { component: Slide07Interactive, name: 'Interactive by nature', template: 'grid' },
  { component: Slide08Chart,       name: 'Live chart',            template: 'interactive' },
  { component: Slide09Features,    name: 'Live features',         template: 'interactive' },
  { component: Slide10ThreeD,      name: '3D stage element',      template: 'interactive' },
  { component: Slide11Stat,        name: 'The math',              template: 'stat' },
  { component: Slide12CTA,         name: 'Your turn',             template: 'cta' },
];

