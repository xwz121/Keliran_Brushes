import { add, sec, position, rating, scope } from './catalogue'
const measureSeal = [
  sec(
    'before',
    'Measure the interface first',
    'An old seal may have taken a compression set. Record the mating assembly as well as the removed profile. Keep the door in its normal latched condition when measuring the closed gap.',
  ),
  sec(
    'measure',
    'Five measurements for a useful review',
    '- Dimensioned cross-section with units and drawing revision\n- Minimum and maximum closed gap around the entire perimeter\n- Panel thickness or groove dimensions and tolerances\n- Corner radius, bend direction and joint position\n- Finished length or frame inside and outside dimensions',
  ),
  sec(
    'conditions',
    'Add the operating conditions',
    'State indoor or outdoor use, temperature exposure, media, opening cycles, material grade if known, and required acceptance tests. Identify photographs and measurements by position so that a tight corner is not confused with a straight section.',
  ),
  sec(
    'avoid',
    'Avoid a fit-by-appearance decision',
    'A similar-looking profile can have a different compression force or grip range. Confirm a dimensioned replacement drawing and a fit-check sample before a production order.',
  ),
]
const measureBrush = [
  sec(
    'terms',
    'Separate overall height from trim length',
    'Overall height includes the backing. Effective trim length is the exposed filament from the channel to its tip. State both; do not quote an ambiguous “brush height”.',
  ),
  sec(
    'measure',
    'Dimensions to include',
    '- Channel width and height, material and wall thickness\n- Overall height and effective trim length\n- Filament grade, diameter, straight or crimped form, and fill arrangement\n- Cut length, end closure and straightness tolerance\n- Holder section, hole positions and installation orientation',
  ),
  sec(
    'contact',
    'Describe the working contact',
    'Record the actual gap, working deflection, movement direction, speed, contacted surface and acceptable wear. A longer or thicker filament is not automatically a better seal.',
  ),
  sec(
    'formed',
    'For formed brushes',
    'Specify inner, outer or side-facing bristles, the datum radius, open ends, springback tolerance and assembly drawing. Formed metal channel and flexible polymer backing are different constructions.',
  ),
]
const guideRows: [string, string, string, string, ReturnType<typeof sec>[]][] = [
  ['measure-door-seal', 'How to measure an enclosure door seal', 'sealing', 'how-to-measure', measureSeal],
  ['measure-strip-brush', 'How to specify a strip brush', 'brushes', 'how-to-measure', measureBrush],
  [
    'sealing-material-selection',
    'Choosing a sealing material family',
    'sealing',
    'material-selection',
    [
      sec(
        'start',
        'Begin with the exposure',
        'List every medium, temperature range and exposure duration. Then define motion, closed gap, compression and expected service conditions. Choose a material family only after this information is available.',
      ),
      sec(
        'matrix',
        'Material-family starting points',
        '| Family | Review for | Check before selection |\n| --- | --- | --- |\n| EPDM | Weather, water and ozone exposure | Oil or fuel contact |\n| NBR | Selected oils and static interfaces | Outdoor exposure and additives |\n| Silicone / VMQ | Temperature-dependent applications | Tear, abrasion and media |\n| FKM | Selected chemicals and thermal conditions | Exact media and low-temperature response |\n| Sponge / foam | Compressible interfaces | Cell structure, load and recovery |',
      ),
      sec(
        'grade',
        'Approve the actual compound',
        'These are reference values, not a guaranteed specification. Ask for the nominated grade data sheet. Set hardness or density, tolerances and test conditions separately; specify solid-rubber hardness and foam properties appropriately.',
      ),
      sec('validate', 'Complete the approval', rating),
    ],
  ],
  [
    'brush-material-selection',
    'Choosing filament and channel materials',
    'brushes',
    'material-selection',
    [
      sec(
        'start',
        'Start with contact and contamination',
        'Define whether the brush wipes, guides or limits dust. List the contacted surface, allowable marking, medium, moisture, temperature and working deflection.',
      ),
      sec(
        'matrix',
        'Material-family comparison',
        '| Family | Review focus | Additional check |\n| PA6 / PA66 | Mechanical contact and abrasion | Moisture and grade |\n| PA612 | Moisture-sensitive dimensions | Diameter, trim and fill |\n| PBT / PP | Wet or chemical exposure | Exact medium and fatigue |\n| PEEK | Specialist duty | Grade availability and testing |\n| SS304 / SS316 wire | Specified industrial contact | Surface marking and wire loss |',
      ),
      sec(
        'backing',
        'Specify the backing separately',
        'Channel material and holder material may differ. Confirm galvanised steel, stainless grade or aluminium alloy, cut-edge condition and coating. Aluminium holder supply does not imply in-house extrusion.',
      ),
      sec(
        'test',
        'Trial the assembly',
        'Material names do not define contact force. Confirm filament diameter, effective trim, density and deflection, then test representative surfaces. No ESD, flame or food-contact performance is implied.',
      ),
    ],
  ],
  [
    'standards-and-validation',
    'What a seal specification can—and cannot—prove',
    'both',
    'standards',
    [
      sec('boundary', 'Component information and assembly validation', rating),
      sec(
        'table',
        'Keep the evidence tied to its scope',
        '| Requirement | Evidence to request | Boundary |\n| IP / NEMA enclosure rating | Test report for the assembled enclosure | A gasket alone does not establish a rating |\n| Material properties | Nominated grade data and agreed tests | Family names are not batch acceptance results |\n| Flame performance | Exact standard, grade, thickness and test scope | No blanket flame certification |\n| REACH / RoHS request | Current declaration for the supplied material or part | Review substance scope and applicability |\n| Dimensional conformity | Approved drawing and inspection record | Define revision, method and sampling |',
      ),
      sec(
        'request',
        'Include the actual requirement',
        'Send the standard edition, relevant clause and expected evidence. We review whether the selected production partner and nominated material can support the requested documentation. Do not assume certification from a product image or a material acronym.',
      ),
      sec(
        'special',
        'Special and safety-related applications',
        'Food contact, high-speed rotating brush seals and safety-critical functions require separate specialist review. Do not use these product families as a basis for an unvalidated safety claim.',
      ),
    ],
  ],
  [
    'failure-modes',
    'A practical seal and brush failure checklist',
    'both',
    'failure-modes',
    [
      sec(
        'record',
        'Record the symptom before replacing the material',
        'Capture location, time in service, environment, installation conditions and photographs. Retain the failed sample and identify its batch or purchase reference where possible.',
      ),
      sec(
        'table',
        'Investigation starting points',
        '| Symptom | Investigate first | Useful evidence |\n| Door leakage | Gap variation and latch loading | Gap map and contact marks |\n| Flattened seal | Squeeze, time and temperature | Original section and recovery conditions |\n| Lifting adhesive | Substrate and surface preparation | Tape reference and coating |\n| Corner leakage | Joint geometry and distortion | Joint drawing and close-up |\n| Filament loss | Retention and impact | End closure and loose-filament sample |\n| Rapid brush wear | Deflection, alignment and speed | Installation and contact direction |',
      ),
      sec(
        'change',
        'Control one change at a time',
        'Keep a record of the original specification and proposed change. Test a representative assembly; a new material can alter fit, force and wear as well as environmental resistance.',
      ),
    ],
  ],
  [
    'rfq-checklist',
    'Your drawing-to-quotation checklist',
    'both',
    'rfq-checklist',
    [
      sec(
        'part',
        'Define the part',
        '- Drawing number, revision and units\n- Material grade or request for material advice\n- Critical dimensions and tolerances\n- Application, environment and mating components\n- Actual order quantity, annual estimate if known and destination',
      ),
      sec(
        'approval',
        'Define the approval',
        'Agree the sample quantity, inspection method, evidence required and the person who approves the sample. Identify any qualification or regulatory requirement before requesting a quote.',
      ),
      sec(
        'supply',
        'Define repeat supply',
        'Specify packing format, batch labels, revision control, change notification and handling requirements. Keep a reference sample where appropriate. Minimum batch, timing and costs require supplier confirmation.',
      ),
      sec(
        'unknown',
        'Unknown details are welcome',
        'Use “please advise” where necessary and attach a clear photo or sketch. The first discussion can establish missing inputs; it does not commit you to a material or design.',
      ),
    ],
  ],
  [
    'supplier-qualification',
    'Adding Keliran to your supplier system',
    'both',
    'rfq-checklist',
    [
      sec('role', 'Start with the commercial and technical roles', position),
      sec(
        'evidence',
        'A qualification pack to agree',
        '- Contracting entity and registration details\n- Quotation scope and manufacturing / subcontracting responsibilities\n- Approved drawing revision and nominated material\n- Sample approval record and first-article requirements\n- Order-specific inspection plan and available records\n- Packing, batch identification and change-notification requirements',
      ),
      sec(
        'review',
        'Review documents before approval',
        'Share your supplier questionnaire and required evidence. Document availability is confirmed for the selected partner and order. We do not substitute a generic factory certificate for evidence applicable to the actual part.',
      ),
      sec(
        'repeat',
        'Control the next order too',
        'Reference the approved drawing and sample on repeat orders. Agree how material, tooling, process or production-partner changes are proposed and authorised before they affect supply.',
      ),
    ],
  ],
]
for (const [slug, title, line, topic, sections] of guideRows)
  add('guides', slug, title, sections[0].text, {
    line,
    topic,
    sections,
    productSlugs:
      line === 'brushes'
        ? ['metal-channel-strip-brushes', 'brush-holders']
        : ['sponge-rubber-seals', 'edge-trim-bulb-seals'],
    solutionSlugs: [line === 'brushes' ? 'dust-at-equipment-openings' : 'enclosure-door-leaks'],
  })
const faqRows = [
  [
    'How is production organised?',
    'Keliran is your supply and quality-coordination partner. Manufacturing is carried out by specialist production partners selected for the component and order. We coordinate the specification, sample approval and agreed inspection; commercial and production responsibilities are stated in the quotation.',
  ],
  [
    'Can you work from our drawing?',
    'Send a dimensioned drawing with its revision, material, quantities and operating conditions. We review sourcing feasibility and clarify the specification before quotation.',
  ],
  [
    'Can you match a sample?',
    'A sample can help identify geometry. Confirm its condition and send mating dimensions; a worn or compressed sample may not represent the original design.',
  ],
  [
    'What is your minimum order quantity?',
    'Minimum batch depends on material, tooling, process and the selected production partner. It is confirmed during quotation.',
  ],
  [
    'What is the production lead time?',
    'Timing is confirmed after technical review, partner scheduling and sample approval requirements are understood.',
  ],
  [
    'Can I request samples?',
    'Yes. Include sample quantity and evaluation requirements in your enquiry. Availability, tooling, costs and timing are confirmed for the project.',
  ],
  [
    'Can you provide a supplier qualification pack?',
    'Send your supplier questionnaire. We agree the legal, technical and quality documents needed for your approval and confirm what is available for the order.',
  ],
  [
    'Are your product images exact dimensions?',
    'Images illustrate product families. Use the approved drawing and sample for dimensions, material and acceptance.',
  ],
  ['Does an EPDM seal give my cabinet an IP rating?', rating],
  ['Can a seal prove NEMA compliance?', rating],
  [
    'Is one EPDM compound equivalent to another?',
    'No. Compound, hardness, cure system and test conditions affect performance. Review the nominated grade and agreed acceptance tests.',
  ],
  [
    'Can foam hardness be stated as solid-rubber Shore A?',
    'Do not substitute one measurement for another. State the correct foam property, method, density and compression response for the selected material.',
  ],
  [
    'Can you add adhesive backing?',
    'Send the nominated tape, substrate, surface preparation and test requirements. The complete bond must be reviewed.',
  ],
  [
    'How do I specify a joined frame?',
    'Include inside and outside dimensions, corner geometry, joint method, joint location and joint-strength requirements.',
  ],
  [
    'Can the material tolerate my cleaning fluid?',
    'Send the fluid identity, concentration, temperature and exposure duration. Compatibility needs review for the actual grade.',
  ],
  [
    'Can you guarantee a flame classification?',
    'No classification is assumed. Supply the exact standard, grade, thickness and required evidence for project-specific review.',
  ],
  [
    'Can you provide a REACH or RoHS declaration?',
    'Request the applicable declaration for the nominated material or part. Availability and scope must be verified for the order.',
  ],
  [
    'Can you supply food-contact certified parts?',
    'Food-contact supply is outside the standard scope shown here. No food-contact or FDA approval is implied.',
  ],
  [
    'Are brush seals waterproof?',
    'Brushes are permeable. They may limit dust or debris in a suitable assembly but do not establish a watertight or pressure-tight seal.',
  ],
  [
    'What is effective brush trim length?',
    'It is the exposed filament length from the backing to the tip. State it separately from the overall height including the channel.',
  ],
  [
    'Does a denser brush always work better?',
    'No. Density changes force and flow; filament diameter, trim, deflection and the contacted surface must be evaluated together.',
  ],
  [
    'Which nylon grade should I choose?',
    'Provide moisture, temperature, contact and wear conditions. PA6, PA66 and PA612 are separate material options, not interchangeable specifications.',
  ],
  [
    'Can you supply the brush holder too?',
    'Include the holder profile, material, hole positions and mating dimensions. Review brush and holder as an assembly.',
  ],
  [
    'Can you form metal-channel brushes?',
    'Send the form, radius, filament direction, tolerance and end details. Feasibility and springback are reviewed against the actual construction.',
  ],
  [
    'Are flexible-backed and formed brushes the same?',
    'No. Flexible polymer backing and formed metal channel require separate construction and application review.',
  ],
  [
    'Can you guarantee anti-static brush resistance?',
    'No ESD resistance value is assumed. Supply your standard, test method and operating conditions for a separate feasibility review.',
  ],
  [
    'Can these brushes act as machine guards?',
    'No. They are not specified as machine safety devices or protective guards.',
  ],
  [
    'Can you provide high-speed rotating brush seals?',
    'High-speed rotating brush seals are outside this website’s standard scope and require specialist review.',
  ],
  [
    'What quality records should I request?',
    'Agree critical dimensions, measurement methods, sample plan, material identification and available inspection records before order placement.',
  ],
  [
    'How are drawing revisions controlled?',
    'Reference the agreed revision on the quotation, sample approval and order. Agree a change-approval process before production.',
  ],
  [
    'Can I request batch identification?',
    'Define the label, packing and record requirements. The selected production partner’s traceability scope must be confirmed for your order.',
  ],
  [
    'Can I send an incomplete specification?',
    'Yes. Mark unknown fields as “please advise”, describe the application and provide a sketch or photo. We can identify the next information needed.',
  ],
  [
    'Are the application scenarios real customer projects?',
    'Scenario pages describe typical procurement problems and proposed workflows. They are not customer testimonials or verified project results.',
  ],
  [
    'Can you complete our supplier questionnaire?',
    'Attach it to an enquiry and identify mandatory evidence. We review the applicable documents and responsibilities with you.',
  ],
]
faqRows.forEach(([title, summary], i) =>
  add('faqs', `question-${String(i + 1).padStart(2, '0')}`, title, summary, {
    sortOrder: i,
    line: i >= 18 && i <= 27 ? 'brushes' : i >= 8 && i <= 17 ? 'sealing' : 'both',
  }),
)
add(
  'pages',
  'home',
  'The right components.\nA clearer path to supply.',
  'Industrial sealing and strip brushes, sourced around your drawings and quality requirements.',
  {
    imageKey: 'components-hero',
    sections: [
      sec(
        'lines',
        'Two product lines. One accountable partner.',
        'Start with a product family. We help define the specification, review production partners and agree the evidence your purchasing team needs.',
      ),
      sec(
        'process',
        'From first drawing to repeat supply.',
        'A clear specification is only the beginning. Agree how the part will be sampled, inspected and controlled.',
      ),
      sec(
        'step1',
        'Define the requirement',
        'Share your drawing, application and quantity. We clarify critical dimensions, material and acceptance criteria.',
      ),
      sec(
        'step2',
        'Review the supply route',
        'We review production partners, tooling, process and documentation against the actual requirement.',
      ),
      sec(
        'step3',
        'Approve the sample',
        'Agree the drawing revision, material and fit-check sample before confirming production.',
      ),
      sec(
        'step4',
        'Control repeat supply',
        'Agree inspection records, batch identification, packing and how changes will be approved.',
      ),
      sec('about', 'Built around your purchasing process.', position),
    ],
  },
)
add('pages', 'about', 'Your specification.\nA considered path to supply.', position, {
  sections: [
    sec(
      'trading-model',
      'One point of coordination',
      'Technical detail should make purchasing clearer. We work with you to define the part, review the production route and bring the drawing, material, sample and inspection requirements into an agreed supply plan. Specialist production partners are selected against the needs of each project.',
    ),
    sec(
      'quality-process',
      'Quality starts with an agreed requirement',
      'Quality management begins with the details that matter in your assembly: fit, material, critical dimensions and operating conditions. We coordinate the requirement review, sample approval and agreed inspection with the selected production partner. The scope and evidence are defined for the actual component and order.',
    ),
    sec(
      'sample-to-production',
      'Keep the reference consistent',
      'An approved drawing revision and sample create a common reference. Agree critical dimensions, material identity, packing and change control for repeat supply.',
    ),
    sec(
      'onboarding',
      'Make supplier approval practical',
      'Send your onboarding questionnaire and evidence requirements. We will review which records are applicable and available. Legal entity details, quotations and order-specific evidence belong in the qualification pack.',
    ),
    sec('scope', 'Supply scope', scope),
  ],
})
add(
  'pages',
  'contact',
  'Let’s define your next component.',
  'Tell us what the part needs to do. Start with a drawing, a sample or an application question.',
)
add('pages', 'privacy', 'Privacy notice', 'How we use the information you provide in an enquiry.', {
  sections: [
    sec(
      'contact',
      'Who to contact',
      'Keliran LTD and 上海柯立然科技有限公司 are the business entities identified on this website. For questions about enquiry information or this notice, contact contact@keliran.com. Our company contact details are listed below. The entity responsible for a quotation or order is identified in its commercial documents.',
    ),
    sec(
      'data',
      'Information collected',
      'We collect the contact information, company details, technical requirements and files you choose to submit. Do not include unrelated personal or confidential information.',
    ),
    sec(
      'purpose',
      'How it is used',
      'We use enquiry information to respond, review technical requirements and follow up on the project. Access is restricted to authorised staff. Necessary technical information may be shared with a proposed production partner after the scope of disclosure is agreed.',
    ),
    sec(
      'files',
      'Drawing and file handling',
      'When secure website uploads are enabled, files are stored separately from public media and staff downloads use temporary signed links. If the enquiry form offers email instead, send drawings to contact@keliran.com. Email attachments are handled through our business mailbox, not the website upload system. Agree any confidentiality requirements before sending sensitive files.',
    ),
    sec(
      'retention',
      'Retention and requests',
      'Enquiry records use a one-year retention target for review. Contact us using the published company contact details to request access, correction or deletion, subject to applicable record-keeping requirements.',
    ),
    sec(
      'services',
      'Service providers',
      'Our website uses Vercel hosting, Alibaba Cloud database services, Cloudflare media storage and security services, and Postmark email delivery. After you submit an enquiry, an automatic confirmation is sent to the email address you provide. Enquiry information may be processed in China and in the regions used by these providers. Enquiry attachments are not sent to website translation or content-generation services.',
    ),
    sec(
      'analytics',
      'Enquiry attribution and security',
      'The website stores the entry page, referring website domain and campaign tags in session storage for up to 24 hours. These details accompany a submitted enquiry so we can understand how it reached us. They do not verify visitor identity. We do not use advertising cookies or third-party advertising analytics. Cloudflare Turnstile and hosting security services may process technical request information to limit abuse.',
    ),
  ],
})
add('pages', 'legal', 'Legal information', 'Company and website information.', {
  sections: [
    sec(
      'uk-registration',
      'United Kingdom registration',
      'Keliran LTD is registered in England and Wales under company number 15698503. Registered office: 483 Green Lanes, London, England, N13 4BS.',
    ),
    sec(
      'scope',
      'Website information',
      'Product-family information supports technical discussion. Quotations, approved drawings, samples and agreed order terms define the supply specification. Illustrations do not establish dimensions, certification or performance.',
    ),
    sec('rating', 'Application validation', rating),
    sec(
      'entity',
      'Contracting information',
      'Confirm the contracting entity and applicable terms on the quotation before supplier approval or ordering. Public registration and contact details are shown below when configured.',
    ),
  ],
})
// Keep all homepage marketing copy in the translatable CMS section fields.
import { drafts } from './catalogue'
const home = drafts.find((d) => d.collection === 'pages' && d.slug === 'home')!
home.data.sections.push(
  sec(
    'hero-kicker',
    'Drawing-led sourcing & quality management',
    'Industrial components. Considered in detail.',
  ),
  sec('assurance1', 'Your drawing', 'Drawing-based review'),
  sec('assurance2', 'Approved sample', 'Sample approval'),
  sec('assurance3', 'Agreed inspection', 'Order-specific quality records'),
  sec('audience', 'For OEMs & procurement teams', ''),
  sec('image-label', 'Keliran / Component studies', ''),
  sec(
    'sealing',
    'Enclosure & equipment sealing',
    'Profiles, sponge seals, edge trims, gaskets and drawing-based rubber parts.',
  ),
  sec(
    'brushes',
    'Industrial strip brushes',
    'Straight and formed brushes, matched holders and custom equipment assemblies.',
  ),
  sec('partner-label', 'Your sourcing & quality partner', 'A clear reference at every step'),
  sec('proof1', 'Drawing & revision', 'Define the part and its critical dimensions.'),
  sec('proof2', 'Material & sample', 'Agree the grade and reference for approval.'),
  sec('proof3', 'Inspection & records', 'Set the checks that matter for your order.'),
  sec('proof4', 'Change & repeat supply', 'Keep approval decisions traceable.'),
  sec(
    'solutions',
    'Start with what\nneeds to work.',
    'Find the questions worth asking before choosing a material or comparing a quotation.',
  ),
  sec('solutions-label', 'From a problem to a requirement', ''),
  sec(
    'qualification',
    'Make the next internal\nreview easier.',
    'Bring your supplier questionnaire. We will work through the commercial details, drawing control, samples and quality records required for your approval.',
  ),
  sec('qualification-label', 'For your approved supplier list', 'Supplier review / checklist'),
  sec('qualification-card', 'A defined part.\nAn agreed supply process.', ''),
  sec('qual1', 'Commercial & production responsibilities', ''),
  sec('qual2', 'Approved drawing and material reference', ''),
  sec('qual3', 'Sample and inspection requirements', ''),
  sec('qual4', 'Batch identification and change control', ''),
  sec('guides', 'Better inputs.\nMore useful answers.', 'Practical procurement resources'),
)
