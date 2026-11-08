import * as migration_20260915_072726_initial from './20260915_072726_initial';
import * as migration_20260916_072505_r2_media_prefix from './20260916_072505_r2_media_prefix';
import * as migration_20260916_083601_traditional_chinese from './20260916_083601_traditional_chinese';
import * as migration_20260923_220302_redesign_two_lines from './20260923_220302_redesign_two_lines';
import * as migration_20260923_231224_release_contacts from './20260923_231224_release_contacts';
import * as migration_20260924_112728_inquiry_attribution from './20260924_112728_inquiry_attribution';
import * as migration_20261108_103755_brushes_site from './20261108_103755_brushes_site';

export const migrations = [
  {
    up: migration_20260915_072726_initial.up,
    down: migration_20260915_072726_initial.down,
    name: '20260915_072726_initial',
  },
  {
    up: migration_20260916_072505_r2_media_prefix.up,
    down: migration_20260916_072505_r2_media_prefix.down,
    name: '20260916_072505_r2_media_prefix',
  },
  {
    up: migration_20260916_083601_traditional_chinese.up,
    down: migration_20260916_083601_traditional_chinese.down,
    name: '20260916_083601_traditional_chinese',
  },
  {
    up: migration_20260923_220302_redesign_two_lines.up,
    down: migration_20260923_220302_redesign_two_lines.down,
    name: '20260923_220302_redesign_two_lines',
  },
  {
    up: migration_20260923_231224_release_contacts.up,
    down: migration_20260923_231224_release_contacts.down,
    name: '20260923_231224_release_contacts',
  },
  {
    up: migration_20260924_112728_inquiry_attribution.up,
    down: migration_20260924_112728_inquiry_attribution.down,
    name: '20260924_112728_inquiry_attribution',
  },
  {
    up: migration_20261108_103755_brushes_site.up,
    down: migration_20261108_103755_brushes_site.down,
    name: '20261108_103755_brushes_site'
  },
];
