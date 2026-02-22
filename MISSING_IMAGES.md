# Missing Card Images

10 cards from the API have no images in the CDN yet. All are **sites** from the Gothic expansion.

| Card Name | Slug | Type |
|---|---|---|
| Algae Bloom | `algae_bloom` | Site |
| Autumn Bloom | `autumn_bloom` | Site |
| Boulevard of Bones | `boulevard_of_bones` | Site |
| Bureau of Occult Control | `bureau_of_occult_control` | Site |
| City of Plenty | `city_of_plenty` | Site |
| City of Souls | `city_of_souls` | Site |
| Consecrated Ground | `consecrated_ground` | Site |
| Croaking Swamp | `croaking_swamp` | Site |
| Dark Alley | `dark_alley` | Site |
| Darkest Dungeon | `darkest_dungeon` | Site |

## To fix

1. Obtain the source PNGs for these cards
2. Place them in `raw/` with naming `got-{slug_with_hyphens}-b-s.png` (e.g. `got-algae-bloom-b-s.png`)
3. Run `cd scripts && ./compressFromRaw.sh`
4. Run `node scripts/processApiResponse.js` to regenerate the card list
