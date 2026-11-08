import { previewProducts } from '../../src/lib/preview-data'
export type Draft = { collection: string; slug: string; data: Record<string, any> }
export const drafts: Draft[] = []
export const position =
  'Keliran brings industrial sealing components and strip brushes into one clear purchasing process. We connect your drawing and application requirements with material selection, production coordination and agreed quality checks, from the first enquiry through repeat supply.'
export const rating = 'An IP or NEMA enclosure rating must be validated on your assembled enclosure.'
export const scope =
  'Product families are available for sourcing review. Material grade, tooling, minimum batch, inspection scope and production timing are confirmed for the selected partner and order after technical review and sample approval.'
export const sec = (key: string, heading: string, text: string) => ({ key, heading, text })
export function add(
  collection: string,
  slug: string,
  title: string,
  summary: string,
  extra: Record<string, any> = {},
) {
  drafts.push({
    collection,
    slug,
    data: {
      title,
      summary,
      description: summary,
      seoTitle: title,
      seoDescription: summary,
      line: 'both',
      ...extra,
    },
  })
}
const families = [
  [
    'SE01',
    'solid-rubber-profiles',
    'Solid rubber profiles',
    'sealing',
    'Defined cross-sections for equipment grooves, edges and static interfaces.',
    'EPDM,NBR,CR',
    'Dimensioned cross-section; compound and hardness; groove geometry; cut length; dimensional tolerances.',
  ],
  [
    'SE02',
    'sponge-rubber-seals',
    'Sponge rubber seals',
    'sealing',
    'Compressible profiles for enclosure doors and uneven mating surfaces.',
    'EPDM sponge,Silicone foam',
    'Free height; minimum and maximum closed gap; compression load; recovery and ageing test conditions.',
  ],
  [
    'SE03',
    'edge-trim-bulb-seals',
    'Edge trims & bulb seals',
    'sealing',
    'Grip-on profiles combining edge retention with a compressible sealing bulb.',
    'EPDM,PVC/TPE carrier',
    'Panel thickness range; bulb position; corner radius; bending direction; insertion and retention requirements.',
  ],
  [
    'SE04',
    'silicone-profiles',
    'Silicone profiles',
    'sealing',
    'Solid and foam silicone profiles reviewed against your environment and drawing.',
    'Silicone,Silicone foam',
    'Compound; solid or foam structure; section tolerance; temperature exposure; surface and post-cure requirements.',
  ],
  [
    'SE05',
    'moulded-rubber-components',
    'Moulded rubber components',
    'sealing',
    'Drawing-based caps, plugs, sleeves and O-rings for defined equipment interfaces.',
    'EPDM,NBR,FKM,Silicone',
    'Drawing revision; mating dimensions; compound; hardness; flash limits; parting-line position; tooling ownership.',
  ],
  [
    'SE06',
    'die-cut-gaskets',
    'Die-cut gaskets',
    'sealing',
    'Flat sealing parts and washers cut to your outline, thickness and hole pattern.',
    'EPDM,NBR,CR',
    'DXF or dimensioned PDF; material grade; thickness; minimum web width; tolerances; liner and adhesive requirements.',
  ],
  [
    'SE07',
    'fabricated-sealing-frames',
    'Fabricated sealing frames',
    'sealing',
    'Cut profiles and joined corners supplied as a defined frame assembly.',
    'EPDM,Silicone',
    'Inside and outside dimensions; joint method and position; corner radius; flatness; joint-strength acceptance method.',
  ],
  [
    'PR01',
    'cut-to-length',
    'Cut-to-length finishing',
    'sealing',
    'Finished lengths organised around your assembly and packing requirements.',
    'EPDM,NBR,Silicone',
    'Length tolerance; cut angle; permissible joints; end finish; count and batch labelling.',
  ],
  [
    'PR02',
    'adhesive-backing',
    'Adhesive backing',
    'sealing',
    'Tape and rubber combinations reviewed for the actual substrate and process.',
    'EPDM sponge,Silicone foam',
    'Specified tape part number; substrate coating; surface preparation; application conditions; peel and ageing tests.',
  ],
  [
    'PR03',
    'slitting-lamination',
    'Slitting & lamination',
    'sealing',
    'Converted sheet and roll materials for gasket and assembly programmes.',
    'EPDM,NBR,PU foam',
    'Grade; thickness; width tolerance; layer stack; adhesive specification; liner and roll requirements.',
  ],
  [
    'BR01',
    'metal-channel-strip-brushes',
    'Metal-channel strip brushes',
    'brushes',
    'Straight strips for dust exclusion, wiping and guiding at equipment openings.',
    'PA6,PA66,PA612,PBT,PP',
    'Channel cross-section; backing width; overall and trim height; filament grade and diameter; density; cut length.',
  ],
  [
    'BR03',
    'formed-strip-brushes',
    'Formed strip brushes',
    'brushes',
    'Metal-backed strips formed around a specified curve or stationary opening.',
    'PA6,PA66,PBT,SS304',
    'Inner, outer or side-facing form; radius; springback tolerance; trim direction; end treatment and installation.',
  ],
  [
    'BR04',
    'brush-holders',
    'Brush holders & channels',
    'brushes',
    'Mounting profiles matched to the selected brush and equipment interface.',
    'SS304,SS316',
    'H, F, T or custom cross-section; aluminium or steel grade; hole pattern; finish; mating dimensions.',
  ],
  [
    'BR05',
    'custom-equipment-brushes',
    'Custom equipment brushes',
    'brushes',
    'Drawing-led straight brush assemblies for cleaning, guiding and light contact.',
    'PA6,PA612,PBT,PP,PEEK',
    'Backing construction; filament details; surface being contacted; working deflection; speed; wear acceptance method.',
  ],
]
for (const [i, f] of families.entries()) {
  const [code, slug, title, line, summary, materials, inputs] = f
  const imageKey = slug
  add('categories', slug, title, summary, {
    code,
    line,
    imageKey,
    featured: i < 3 || line === 'brushes',
    sortOrder: i,
    sections: [
      sec('scope', 'Supply scope', scope),
      sec('rfq-inputs', 'What to include in your enquiry', inputs),
    ],
  })
  if (!code.startsWith('PR'))
    add('products', slug, title, summary, {
      code: `${code}-CUSTOM`,
      line,
      imageKey,
      categorySlug: slug,
      materials: materials.split(','),
      sortOrder: i,
      description: `${summary} ${scope}`,
      sections: [
        sec('rfq-inputs', 'Define the part before comparing quotes', inputs),
        sec(
          'what-we-check',
          'What we agree with you',
          'Drawing revision and critical dimensions; material identification; sample approval criteria; inspection records; packing and batch identification. The agreed control plan is specific to your order.',
        ),
        sec(
          'standards-note',
          'Application validation',
          line === 'sealing'
            ? rating
            : 'A strip brush can limit dust movement or provide light contact. It is not a pressure-tight barrier or a machine safety device.',
        ),
        sec(
          'materials-note',
          'Material selection',
          'Material families are a starting point. Reference values, not a guaranteed specification. Confirm the actual grade and test conditions for your application.',
        ),
      ],
      guideSlugs: [line === 'brushes' ? 'measure-strip-brush' : 'measure-door-seal', 'rfq-checklist'],
      solutionSlugs: [line === 'brushes' ? 'dust-at-equipment-openings' : 'enclosure-door-leaks'],
    })
}
const materials = [
  [
    'EPDM',
    'epdm',
    'sealing',
    'elastomer',
    'A starting point for outdoor weathering, water and ozone exposure.',
    'Check compatibility before contact with oils or fuels; assess the actual compound, compression and ageing conditions.',
  ],
  [
    'NBR',
    'nbr',
    'sealing',
    'elastomer',
    'A candidate for oil-exposed static components.',
    'Outdoor weathering and the specific oil or additive package need separate review.',
  ],
  [
    'VMQ',
    'silicone',
    'sealing',
    'elastomer',
    'Silicone families for applications with demanding temperature exposure.',
    'Tear, abrasion and media compatibility depend on grade and part geometry.',
  ],
  [
    'FKM',
    'fkm',
    'sealing',
    'elastomer',
    'Consider for selected chemical and temperature conditions.',
    'Not universally compatible with every fluid; low-temperature response varies by compound.',
  ],
  [
    'CR',
    'cr',
    'sealing',
    'elastomer',
    'A general industrial elastomer family for application review.',
    'Confirm environmental resistance, compound grade and test requirements; no automatic flame rating.',
  ],
  [
    'Foam',
    'foam',
    'sealing',
    'foam',
    'Compressible EPDM sponge, silicone foam and PU foam families.',
    'Cell structure, density and compression response are distinct specifications; do not substitute solid-rubber hardness.',
  ],
  [
    'PA6',
    'pa6',
    'brushes',
    'filament',
    'A general-purpose nylon filament family for wiping and guiding.',
    'Moisture, working deflection and abrasion influence performance.',
  ],
  [
    'PA66',
    'pa66',
    'brushes',
    'filament',
    'Nylon filament option for defined mechanical and thermal conditions.',
    'Review actual grade and moisture exposure rather than assuming a service-temperature guarantee.',
  ],
  [
    'PA612',
    'pa612',
    'brushes',
    'filament',
    'A nylon option when dimensional response to moisture matters.',
    'Filament diameter, trim and fill still determine the contact behaviour.',
  ],
  [
    'PBT',
    'pbt',
    'brushes',
    'filament',
    'A polyester filament option for wet-service review.',
    'Confirm chemical exposure, bend fatigue and contact conditions.',
  ],
  [
    'PP',
    'pp',
    'brushes',
    'filament',
    'Polypropylene filament for suitable chemical and moisture environments.',
    'Temperature and mechanical duty can limit selection.',
  ],
  [
    'PEEK',
    'peek',
    'brushes',
    'filament',
    'A specialist polymer option requiring project-specific review.',
    'Grade availability, processing and economics are confirmed during sourcing.',
  ],
  [
    'SS304',
    'ss304',
    'brushes',
    'filament',
    'Stainless wire for specified industrial contact tasks.',
    'Assess scratching, wire loss, corrosion medium and suitability for the contacted surface.',
  ],
  [
    'SS316',
    'ss316',
    'brushes',
    'filament',
    'A stainless wire option for corrosion-specific review.',
    'Does not imply universal corrosion resistance or food-contact approval.',
  ],
  [
    'Galvanized steel',
    'galvanized-steel',
    'brushes',
    'channel',
    'Coated steel backing for a defined indoor or protected environment.',
    'Check cut-edge protection, coating condition and the exposure medium.',
  ],
  [
    'Stainless steel',
    'stainless-steel',
    'brushes',
    'channel',
    'Channel and holder material for corrosion-specific applications.',
    'Grade, surface finish and contact with other metals must be specified.',
  ],
  [
    'Aluminium',
    'aluminium',
    'brushes',
    'channel',
    'Lightweight holder profiles with a specified mounting interface.',
    'Alloy, finish, wall thickness and hole tolerances are drawing-dependent.',
  ],
]
for (const [code, slug, line, family, strength, limit] of materials)
  add('materials', slug, code, strength, {
    code,
    line,
    family,
    sections: [
      sec('strengths', 'When to consider it', strength),
      sec('limits', 'What to check', limit),
      sec(
        'standards',
        'Specification boundary',
        'Material-family reference only: reference values, not a guaranteed specification. Ask for the selected grade data sheet and define acceptance tests before approval.',
      ),
    ],
  })
const solutions = [
  [
    'enclosure-door-leaks',
    'Door seals that leak at the interface',
    'sealing',
    'Water or dust appears along a closed enclosure door.',
    'Map the closed gap around the perimeter, latch positions and local contact marks. A uniform-looking seal can be under-compressed in one area and over-compressed in another.',
    'Review the section and gap tolerance together; agree a sample fit check and the assembled-enclosure validation plan.',
    'Gap map, section recommendation for review and sample inspection checklist.',
  ],
  [
    'compression-set',
    'Seals that stop recovering',
    'sealing',
    'A flattened seal no longer follows the door after repeated use.',
    'Review compression, time at temperature, cell structure and the actual compound. Appearance alone cannot distinguish material ageing from excessive squeeze.',
    'Agree recovery and compression-set test conditions with the selected production partner.',
    'Grade identification, compression conditions and acceptance criteria.',
  ],
  [
    'adhesive-lifting',
    'Adhesive edges lifting',
    'sealing',
    'The seal lifts at a corner or after cleaning.',
    'Check substrate coating, contamination, application temperature, dwell time and load. Tape compatibility depends on the complete bond.',
    'Review the nominated tape and surface preparation; define peel or ageing checks on the real substrate.',
    'Tape specification, preparation instructions and test sample plan.',
  ],
  [
    'corner-joint-leaks',
    'Leaks at joined corners',
    'sealing',
    'The straight section seals but the frame corner leaks.',
    'Check joint geometry, method, local distortion and seam position.',
    'Compare feasible joining methods against the drawing and acceptance requirements.',
    'Corner drawing, joining specification and joint inspection record.',
  ],
  [
    'replacement-seal-matching',
    'Matching a replacement seal',
    'sealing',
    'The original part number is missing or the old seal is deformed.',
    'Measure an unworn section and the mating interface separately. A compressed old profile is not a reliable design drawing.',
    'Use a dimensioned sketch, photos and a sample to review fit before replacement supply.',
    'Controlled replacement drawing and fit-check sample.',
  ],
  [
    'dust-at-equipment-openings',
    'Dust at equipment openings',
    'brushes',
    'Dust escapes around a moving part or access opening.',
    'Review gap variation, motion, dust characteristics and brush orientation. A brush is a permeable contact barrier.',
    'Review brush trim, fill and holder position, then test the assembly under actual operating conditions.',
    'Brush-and-holder drawing and application test checklist.',
  ],
  [
    'filament-shedding',
    'Brush filaments coming loose',
    'brushes',
    'Loose filaments appear around the equipment.',
    'Check channel retention, end closure, repeated impact and chemical exposure.',
    'Define retention and shedding acceptance checks with sample inspection.',
    'Retention method, inspection scope and agreed acceptance criteria.',
  ],
  [
    'brush-wear',
    'Uneven brush wear',
    'brushes',
    'Bristles wear quickly or develop an uneven contact line.',
    'Check working deflection, alignment, speed, surface roughness and filament diameter.',
    'Review a trial assembly and define the wear observation method.',
    'Installation reference, trial sample and wear evaluation plan.',
  ],
  [
    'surface-marking',
    'Avoiding marks on the contacted surface',
    'brushes',
    'The brush scratches or changes the surface finish.',
    'Assess filament material, tip condition, trapped particles and contact pressure.',
    'Trial the specified brush on representative parts before approval.',
    'Contact-surface trial protocol and approved sample reference.',
  ],
  [
    'holder-fit',
    'Brush holders that do not fit',
    'brushes',
    'The strip moves in its holder or mounting holes do not align.',
    'Measure the backing and holder as mating parts, including coating and cut-length tolerances.',
    'Control a common assembly drawing and verify the first article together.',
    'Matched brush-and-holder dimensions and first-article record.',
  ],
]
for (const [slug, title, line, summary, causes, action, delivery] of solutions)
  add('solutions', slug, title, summary, {
    line,
    sections: [
      sec('symptoms', 'Start with the symptom', summary),
      sec('likely-causes', 'What to investigate', causes),
      sec('what-we-do', 'How we approach the requirement', action),
      sec('deliverables', 'What to agree before supply', delivery),
      sec(
        'what-to-send',
        'Send with your enquiry',
        'Drawing revision, photos of the interface, operating environment, quantities and existing inspection or failure records.',
      ),
    ],
    productSlugs:
      line === 'sealing'
        ? ['sponge-rubber-seals', 'edge-trim-bulb-seals']
        : ['metal-channel-strip-brushes', 'brush-holders'],
    guideSlugs: [line === 'sealing' ? 'measure-door-seal' : 'measure-strip-brush', 'failure-modes'],
  })
const applications = [
  [
    'electrical-enclosures',
    'Electrical enclosures',
    'sealing',
    'Door, cover and panel interfaces where the closed gap and validation plan define the seal.',
  ],
  [
    'control-cabinets',
    'Control cabinets',
    'sealing',
    'Static seals, edge protection and cable-entry interfaces reviewed against the assembly drawing.',
  ],
  [
    'outdoor-telecom-cabinets',
    'Outdoor telecom cabinets',
    'sealing',
    'Outdoor weathering, door geometry and joined corners reviewed together.',
  ],
  [
    'equipment-covers',
    'Equipment covers',
    'sealing',
    'Profiles, gaskets and moulded parts for access covers and service openings.',
  ],
  [
    'conveyors',
    'Conveyor interfaces',
    'brushes',
    'Light-contact guiding, wiping and dust-limiting strips for specified conveyor interfaces.',
  ],
  [
    'machine-tool-openings',
    'Machine tool openings',
    'brushes',
    'Brush-and-holder assemblies for non-safety-critical openings and chip management.',
  ],
  [
    'industrial-doors',
    'Industrial doors',
    'both',
    'Seals and strip brushes considered separately for threshold, side and top interfaces.',
  ],
  [
    'replacement-programmes',
    'Replacement programmes',
    'both',
    'Controlled drawings and samples for recurring replacement parts.',
  ],
]
for (const [slug, title, line, summary] of applications)
  add('applications', slug, title, summary, {
    line,
    sections: [
      sec('scope', 'Define the interface', summary),
      sec(
        'what-to-send',
        'What to send',
        'Assembly drawing, interface dimensions, environment, original part or sample, order quantity and destination.',
      ),
      sec(
        'validation',
        'Validate in the actual application',
        line === 'brushes'
          ? 'Brushes are not machine guards or safety devices. Confirm contact and wear in the assembled equipment.'
          : rating,
      ),
    ],
    productSlugs:
      line === 'brushes'
        ? ['metal-channel-strip-brushes', 'brush-holders']
        : ['sponge-rubber-seals', 'edge-trim-bulb-seals'],
    solutionSlugs: [line === 'brushes' ? 'dust-at-equipment-openings' : 'enclosure-door-leaks'],
  })
for (const [i, sol] of [
  solutions[0],
  solutions[2],
  solutions[3],
  solutions[5],
  solutions[6],
  solutions[9],
].entries())
  add(
    'cases',
    `scenario-${sol[0]}`,
    [
      'An outdoor cabinet door',
      'A bonded access-cover seal',
      'A joined sealing frame',
      'A conveyor access opening',
      'A brush replacement programme',
      'A matched holder assembly',
    ][i],
    sol[3],
    {
      line: sol[2],
      scenarioType: 'typical',
      sections: [
        sec(
          'situation',
          'Typical application scenario',
          'An illustrative procurement workflow, not a reported customer project or performance result.',
        ),
        sec('problem', 'The requirement', sol[4]),
        sec('approach', 'The proposed approach', sol[5]),
        sec('deliverables', 'Documents to agree', sol[6]),
      ],
      solutionSlugs: [sol[0]],
      productSlugs:
        sol[2] === 'sealing'
          ? ['sponge-rubber-seals', 'fabricated-sealing-frames']
          : ['metal-channel-strip-brushes', 'brush-holders'],
    },
  )

for (const p of previewProducts('en'))
  add('products', p.slug, p.title, p.summary, {
    code: p.code,
    line: 'sealing',
    categorySlug: p.slug.includes('gasket') ? 'die-cut-gaskets' : 'moulded-rubber-components',
    materials: p.materials,
    imageKey: p.slug,
    sortOrder: 30,
    description: `${p.summary} ${scope}`,
    sections: [
      sec(
        'rfq-inputs',
        'What to include in your enquiry',
        'Approved drawing revision, material grade, critical dimensions, tolerances, actual quantity and operating conditions.',
      ),
      sec('standards-note', 'Assembly validation', rating),
    ],
    guideSlugs: ['rfq-checklist', 'sealing-material-selection'],
    solutionSlugs: ['replacement-seal-matching'],
  })
